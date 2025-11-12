/**
 * WebSocket Client for Real-time Chat
 * Replaces Supabase Realtime functionality
 */

type MessageHandler = (message: any) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private heartbeatInterval: number | null = null;

  constructor() {
    console.log('[WebSocketClient] Initialized');
  }

  /**
   * Connect to WebSocket server
   * Authentication is handled via session cookie - no userId needed
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('[WebSocketClient] Already connected');
        resolve();
        return;
      }

      this.userId = userId;
      
      // Determine WebSocket URL - authentication via session cookie
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat`;

      console.log('[WebSocketClient] Connecting to:', wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocketClient] Connected successfully');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocketClient] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketClient] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocketClient] Disconnected');
          this.stopHeartbeat();
          this.disconnectionHandlers.forEach(handler => handler());
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[WebSocketClient] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
      this.ws.close();
      this.ws = null;
      this.stopHeartbeat();
      console.log('[WebSocketClient] Disconnected manually');
    }
  }

  /**
   * Send a message to the server
   */
  private send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketClient] Cannot send - not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage) {
    console.log('[WebSocketClient] Received:', message.type);

    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error(`[WebSocketClient] Error in handler for ${message.type}:`, error);
        }
      });
    }

    // Also trigger handlers registered for '*' (all messages)
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocketClient] Error in wildcard handler:', error);
        }
      });
    }
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Subscribe to disconnection events
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  /**
   * Send a chat message
   */
  sendMessage(channelId: string, content: string, messageType: string = 'text') {
    this.send({
      type: 'message',
      payload: {
        channelId,
        content,
        messageType
      }
    });
  }

  /**
   * Start typing indicator
   */
  startTyping(channelId: string) {
    this.send({
      type: 'typing_start',
      payload: { channelId }
    });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(channelId: string) {
    this.send({
      type: 'typing_stop',
      payload: { channelId }
    });
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline') {
    this.send({
      type: 'presence_update',
      payload: { status }
    });
  }

  /**
   * Join a channel
   */
  joinChannel(channelId: string) {
    this.send({
      type: 'join_channel',
      payload: { channelId }
    });
  }

  /**
   * Leave a channel
   */
  leaveChannel(channelId: string) {
    this.send({
      type: 'leave_channel',
      payload: { channelId }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketClient] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[WebSocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId).catch(error => {
          console.error('[WebSocketClient] Reconnect failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send a ping-like message
        this.send({ type: 'ping', payload: {} });
      }
    }, 25000); // Every 25 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
let chatWsClient: ChatWebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getChatWebSocketClient(): ChatWebSocketClient {
  if (!chatWsClient) {
    chatWsClient = new ChatWebSocketClient();
  }
  return chatWsClient;
}

/**
 * Initialize WebSocket connection for a user
 */
export async function initializeChatWebSocket(userId: string): Promise<ChatWebSocketClient> {
  const client = getChatWebSocketClient();
  
  if (!client.isConnected()) {
    await client.connect(userId);
  }
  
  return client;
}
