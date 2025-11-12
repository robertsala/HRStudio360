import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import type { IncomingMessage } from 'http';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionParser: any;

  constructor(server: HttpServer, sessionParser: any) {
    this.sessionParser = sessionParser;
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    
    console.log('✅ WebSocket server initialized at /ws/chat');
  }

  /**
   * Verify client authentication before allowing WebSocket upgrade
   */
  private verifyClient(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (verified: boolean, code?: number, message?: string) => void
  ) {
    const req = info.req as any;

    try {
      // Parse session from request
      this.sessionParser(req, {} as any, (err?: any) => {
        if (err) {
          console.error('[WebSocket] Session parser error:', err);
          callback(false, 500, 'Internal server error');
          return;
        }

        const userId = req.session?.userId;

        if (!userId) {
          console.log('[WebSocket] Connection rejected - no authenticated session');
          callback(false, 401, 'Authentication required');
          return;
        }

        // Store userId on request for use in handleConnection
        req.authenticatedUserId = userId;
        callback(true);
      });
    } catch (error: any) {
      console.error('[WebSocket] Error during authentication:', error);
      callback(false, 500, 'Internal server error');
    }
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: any) {
    // Get authenticated userId from verifyClient
    const userId = req.authenticatedUserId;
    
    if (!userId) {
      console.log('[WebSocket] Connection rejected - authentication failed');
      ws.close(1008, 'Authentication required');
      return;
    }

    console.log(`[WebSocket] User ${userId} authenticated successfully`);

    // Set up authenticated client
    ws.userId = userId;
    ws.isAlive = true;

    // Store client connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    console.log(`[WebSocket] User ${userId} connected. Active connections: ${this.wss.clients.size}`);

    // Send connection confirmation
    this.sendToClient(ws, {
      type: 'connected',
      payload: {
        userId,
        timestamp: new Date().toISOString()
      }
    });

    // Broadcast user online status
    this.broadcast({
      type: 'user_presence',
      payload: {
        userId,
        status: 'online',
        timestamp: new Date().toISOString()
      }
    }, userId);

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error.message);
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const { type, payload } = message;

      console.log(`[WebSocket] Message from ${ws.userId}: ${type}`);

      switch (type) {
        case 'typing_start':
          this.handleTypingIndicator(ws, payload, true);
          break;

        case 'typing_stop':
          this.handleTypingIndicator(ws, payload, false);
          break;

        case 'message':
          this.handleChatMessage(ws, payload);
          break;

        case 'presence_update':
          this.handlePresenceUpdate(ws, payload);
          break;

        case 'join_channel':
          this.handleJoinChannel(ws, payload);
          break;

        case 'leave_channel':
          this.handleLeaveChannel(ws, payload);
          break;

        default:
          console.log(`[WebSocket] Unknown message type: ${type}`);
      }
    } catch (error: any) {
      console.error('[WebSocket] Error parsing message:', error.message);
      this.sendToClient(ws, {
        type: 'error',
        payload: { message: 'Invalid message format' }
      });
    }
  }

  private handleTypingIndicator(ws: AuthenticatedWebSocket, payload: any, isTyping: boolean) {
    const { channelId } = payload;
    
    this.broadcast({
      type: isTyping ? 'user_typing' : 'user_stopped_typing',
      payload: {
        userId: ws.userId,
        channelId,
        timestamp: new Date().toISOString()
      }
    }, ws.userId); // Exclude sender
  }

  private handleChatMessage(ws: AuthenticatedWebSocket, payload: any) {
    // Broadcast new message to all clients
    this.broadcast({
      type: 'new_message',
      payload: {
        ...payload,
        senderId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  private handlePresenceUpdate(ws: AuthenticatedWebSocket, payload: any) {
    const { status } = payload;
    
    this.broadcast({
      type: 'user_presence',
      payload: {
        userId: ws.userId,
        status,
        timestamp: new Date().toISOString()
      }
    }, ws.userId);
  }

  private handleJoinChannel(ws: AuthenticatedWebSocket, payload: any) {
    const { channelId } = payload;
    
    this.broadcast({
      type: 'user_joined_channel',
      payload: {
        userId: ws.userId,
        channelId,
        timestamp: new Date().toISOString()
      }
    });
  }

  private handleLeaveChannel(ws: AuthenticatedWebSocket, payload: any) {
    const { channelId } = payload;
    
    this.broadcast({
      type: 'user_left_channel',
      payload: {
        userId: ws.userId,
        channelId,
        timestamp: new Date().toISOString()
      }
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    const userId = ws.userId;
    
    if (userId) {
      // Remove client from tracking
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(userId);
          
          // Broadcast user offline status
          this.broadcast({
            type: 'user_presence',
            payload: {
              userId,
              status: 'offline',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      console.log(`[WebSocket] User ${userId} disconnected. Active connections: ${this.wss.clients.size}`);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: WebSocketMessage, excludeUserId?: string) {
    this.wss.clients.forEach((client: WebSocket) => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  // Send message to specific user (all their connections)
  public sendToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(ws => {
        this.sendToClient(ws, message);
      });
    }
  }

  // Broadcast to all users in a channel
  public broadcastToChannel(channelId: string, message: WebSocketMessage, excludeUserId?: string) {
    // For now, broadcast to all (in a real app, we'd track channel memberships)
    this.broadcast(message, excludeUserId);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const authWs = ws as AuthenticatedWebSocket;
        
        if (authWs.isAlive === false) {
          console.log(`[WebSocket] Terminating inactive connection for user ${authWs.userId}`);
          return ws.terminate();
        }

        authWs.isAlive = false;
        ws.ping();
      });
    }, 30000); // Check every 30 seconds
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
    console.log('[WebSocket] Server closed');
  }
}
