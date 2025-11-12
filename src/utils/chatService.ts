import { apiClient } from '../lib/api';
import { chatEncryption } from './chatEncryptionService';
import { getChatWebSocketClient, type ChatWebSocketClient } from './websocketClient';

// Normalization helpers to convert camelCase API responses to snake_case for backward compatibility
function normalizeUser(user: any): any {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: user.fullName,
    avatar_url: user.avatarUrl,
    role: user.role,
    department: user.department,
    job_title: user.jobTitle,
    status: user.status,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

function normalizeChannel(channel: any): any {
  if (!channel) return null;
  
  // Handle both camelCase API response and already-normalized fields
  const unreadCount = channel.unread_count ?? channel.unreadCount ?? 0;
  const lastMessage = channel.last_message ?? channel.lastMessage;
  
  return {
    id: channel.id,
    name: channel.name,
    channel_type: channel.channelType,
    department: channel.department,
    description: channel.description,
    is_active: channel.isActive,
    created_by: channel.createdBy,
    created_at: channel.createdAt,
    updated_at: channel.updatedAt,
    members: channel.members?.map(normalizeChannelMember),
    unread_count: unreadCount,
    last_message: lastMessage ? normalizeMessage(lastMessage) : null
  };
}

function normalizeChannelMember(member: any): any {
  if (!member) return null;
  return {
    id: member.id,
    channel_id: member.channelId,
    user_id: member.userId,
    role: member.role,
    joined_at: member.joinedAt,
    last_read_at: member.lastReadAt,
    notifications_enabled: member.notificationsEnabled,
    user: normalizeUser(member.user)
  };
}

function normalizeMessage(message: any): any {
  if (!message) return null;
  return {
    id: message.id,
    channel_id: message.channelId,
    sender_id: message.senderId,
    encrypted_content: message.encryptedContent,
    decrypted_content: message.decrypted_content,
    message_type: message.messageType,
    file_url: message.fileUrl,
    file_name: message.fileName,
    file_size: message.fileSize,
    reply_to_message_id: message.replyToMessageId,
    edited_at: message.editedAt,
    deleted_at: message.deletedAt,
    created_at: message.createdAt,
    sender: normalizeUser(message.sender),
    read_by: message.readBy?.map((userId: string) => userId)
  };
}

function normalizeUserPresence(presence: any): any {
  if (!presence) return null;
  return {
    user_id: presence.userId,
    status: presence.status,
    last_seen_at: presence.lastSeenAt
  };
}

function normalizeTypingIndicator(indicator: any): any {
  if (!indicator) return null;
  return {
    channel_id: indicator.channelId,
    user_id: indicator.userId,
    started_typing_at: indicator.startedTypingAt
  };
}

export interface Channel {
  id: string;
  name: string;
  channel_type: 'department' | 'direct' | 'group' | 'ai_assistant';
  department: string | null;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: Message;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  notifications_enabled: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    department?: string;
  };
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string | null;
  encrypted_content: string;
  decrypted_content?: string;
  message_type: 'text' | 'file' | 'system';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_message_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  read_by?: string[];
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen_at: string;
}

export interface TypingIndicator {
  channel_id: string;
  user_id: string;
  started_typing_at: string;
}

export class ChatService {
  private static instance: ChatService;
  private currentUserId: string | null = null;
  private wsClient: ChatWebSocketClient | null = null;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;

    try {
      console.log('Initializing chat service for user:', userId);

      // Initialize encryption
      try {
        await chatEncryption.initialize(userId);
        console.log('Chat encryption initialized');
      } catch (encError) {
        console.error('Encryption initialization failed:', encError);
        // Continue anyway - encryption failure shouldn't block chat
      }

      // Update presence
      try {
        await this.updatePresence('online');
        console.log('User presence updated');
      } catch (presenceError) {
        console.error('Presence update failed:', presenceError);
        // Continue anyway
      }

      // Setup realtime subscription
      try {
        await this.setupRealtimeSubscription();
        console.log('Realtime subscription established');
      } catch (realtimeError) {
        console.error('Realtime setup failed:', realtimeError);
        // Continue anyway
      }

      // Give time for subscriptions to establish, then ensure AI channel
      setTimeout(async () => {
        await this.ensureAIAssistantChannel();
      }, 500);

      console.log('Chat service initialization complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('Failed to initialize chat service:', errorMessage, error);
      window.dispatchEvent(new CustomEvent('chat:initialization-error', {
        detail: { message: errorMessage, error }
      }));
      throw new Error(`Chat initialization failed: ${errorMessage}`);
    }
  }


  async getChannels(): Promise<Channel[]> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      const channels = await apiClient.getChatChannels();
      
      // Filter out AI Assistant channels that don't belong to the current user
      const filteredChannels = channels.filter((channel: any) => {
        if (channel.channelType === 'ai_assistant') {
          return channel.createdBy === this.currentUserId;
        }
        return true;
      });

      // Get members for each channel
      const channelsWithMembers = await Promise.all(
        filteredChannels.map(async (channel: any) => {
          const members = await apiClient.getChannelMembers(channel.id);
          const unreadCount = await this.getUnreadCount(channel.id);
          const lastMessage = await this.getLastMessage(channel.id);

          const normalized = normalizeChannel(channel);
          return {
            ...normalized,
            members: members.map(normalizeChannelMember),
            unread_count: unreadCount,
            last_message: lastMessage
          };
        })
      );

      return channelsWithMembers;
    } catch (error) {
      console.error('Failed to get channels:', error);
      throw error;
    }
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    try {
      const channel = await apiClient.getChatChannel(channelId);
      if (!channel) return null;

      // Get members for the channel
      const members = await apiClient.getChannelMembers(channelId);
      
      const normalized = normalizeChannel(channel);
      return {
        ...normalized,
        members: members.map(normalizeChannelMember)
      };
    } catch (error) {
      console.error('Failed to get channel:', error);
      return null;
    }
  }

  async createChannel(
    name: string,
    type: 'department' | 'direct' | 'group',
    memberUserIds: string[],
    department?: string,
    description?: string
  ): Promise<Channel> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      // Create the channel
      const channel = await apiClient.createChatChannel({
        name,
        channelType: type,
        department: department || null,
        description: description || null,
        createdBy: this.currentUserId,
        isActive: true
      });

      // Add all members
      const allMemberIds = [this.currentUserId, ...memberUserIds.filter(id => id !== this.currentUserId)];

      await Promise.all(
        allMemberIds.map((userId, index) =>
          apiClient.addChannelMember(channel.id, {
            userId,
            role: index === 0 ? 'admin' : 'member',
            notificationsEnabled: true
          })
        )
      );

      return normalizeChannel(channel);
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  async uploadFile(
    channelId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    if (!this.currentUserId) throw new Error('Not initialized');

    // TODO: Implement file upload endpoint in backend
    // For now, file uploads are disabled
    throw new Error('File uploads not yet implemented in migrated backend');
    
    /* Future implementation:
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channelId', channelId);
    
    const response = await apiClient.uploadChatFile(channelId, formData);
    return {
      url: response.url,
      path: response.path
    };
    */
  }

  async sendMessage(
    channelId: string,
    content: string,
    messageType: 'text' | 'file' | 'system' = 'text',
    replyToMessageId?: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ): Promise<Message> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      const encryptedContent = messageType === 'system'
        ? content
        : await chatEncryption.encryptMessage(content);

      // For AI Assistant channels, fetch channel info to check type
      let isAIChannel = false;
      try {
        const channel = await apiClient.getChatChannel(channelId);
        isAIChannel = channel?.channelType === 'ai_assistant';
      } catch (error) {
        console.warn('Could not determine channel type:', error);
      }
      
      const message = await apiClient.createChatMessage(channelId, {
        senderId: this.currentUserId,
        encryptedContent,
        messageType,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        replyToMessageId: replyToMessageId || null,
        // Send plain text for AI processing if this is an AI channel
        ...(isAIChannel && { plainContent: content })
      });

      const normalized = normalizeMessage(message);
      return {
        ...normalized,
        decrypted_content: messageType === 'system' ? content : await chatEncryption.decryptMessage(encryptedContent)
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getMessages(
    channelId: string,
    limit: number = 50
  ): Promise<Message[]> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      const messages = await apiClient.getChatMessages(channelId, limit);

      // Decrypt and normalize messages
      const decryptedMessages = await Promise.all(
        messages.map(async (message: any) => {
          try {
            const decryptedContent = message.messageType === 'system'
              ? message.encryptedContent
              : await chatEncryption.decryptMessage(message.encryptedContent);

            const normalized = normalizeMessage(message);
            return {
              ...normalized,
              decrypted_content: decryptedContent
            };
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError);
            const normalized = normalizeMessage(message);
            return {
              ...normalized,
              decrypted_content: '[Decryption failed]'
            };
          }
        })
      );

      return decryptedMessages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  async getLastMessage(channelId: string): Promise<Message | null> {
    try {
      const messages = await this.getMessages(channelId, 1);
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      console.error('Failed to get last message:', error);
      return null;
    }
  }

  async markAsRead(channelId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      await apiClient.markChannelRead(channelId, this.currentUserId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async getUnreadCount(channelId: string): Promise<number> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      // Get all messages
      const messages = await apiClient.getChatMessages(channelId);
      
      // Get member's last read time
      const members = await apiClient.getChannelMembers(channelId);
      const currentMember = members.find((m: any) => m.userId === this.currentUserId);
      
      if (!currentMember || !currentMember.lastReadAt) {
        return messages.length;
      }

      const lastReadTime = new Date(currentMember.lastReadAt);
      const unreadMessages = messages.filter((msg: any) => {
        return new Date(msg.createdAt) > lastReadTime;
      });

      return unreadMessages.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async setTyping(channelId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      await apiClient.setTyping(channelId, this.currentUserId, isTyping);
    } catch (error) {
      console.error('Failed to set typing:', error);
    }
  }

  async getTypingUsers(channelId: string): Promise<string[]> {
    try {
      const indicators = await apiClient.getTypingIndicators(channelId);
      return indicators.map((i: any) => i.userId).filter((id: string) => id !== this.currentUserId);
    } catch (error) {
      console.error('Failed to get typing users:', error);
      return [];
    }
  }

  async updatePresence(status: 'online' | 'away' | 'offline'): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      await apiClient.updateUserPresence(this.currentUserId, status);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const presence = await apiClient.getUserPresence(userId);
      return presence ? normalizeUserPresence(presence) : null;
    } catch (error) {
      console.error('Failed to get user presence:', error);
      return null;
    }
  }

  async searchMessages(query: string, channelId?: string): Promise<Message[]> {
    // TODO: Implement server-side search endpoint for better performance
    // For now, filter client-side
    try {
      let messages: Message[] = [];
      
      if (channelId) {
        messages = await this.getMessages(channelId, 500);
      } else {
        // Search across all channels
        const channels = await this.getChannels();
        const allMessages = await Promise.all(
          channels.map(channel => this.getMessages(channel.id, 100))
        );
        messages = allMessages.flat();
      }

      // Filter by query
      const lowerQuery = query.toLowerCase();
      return messages.filter(msg => 
        msg.decrypted_content?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  async addChannelMember(channelId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    try {
      await apiClient.addChannelMember(channelId, {
        userId,
        role,
        notificationsEnabled: true
      });
    } catch (error) {
      console.error('Failed to add channel member:', error);
      throw error;
    }
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    try {
      await apiClient.removeChannelMember(channelId, userId);
    } catch (error) {
      console.error('Failed to remove channel member:', error);
      throw error;
    }
  }

  async leaveChannel(channelId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');
    await this.removeChannelMember(channelId, this.currentUserId);
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.deleteChatMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      const encryptedContent = await chatEncryption.encryptMessage(newContent);
      await apiClient.updateChatMessage(messageId, {
        encryptedContent,
        editedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      await apiClient.addMessageReaction(messageId, emoji, this.currentUserId);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    try {
      await apiClient.removeMessageReaction(messageId, emoji, this.currentUserId);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    try {
      const reactions = await apiClient.getMessageReactions(messageId);
      
      // Group by emoji
      const grouped = reactions.reduce((acc: any, reaction: any) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.userId);
        return acc;
      }, {});

      return Object.values(grouped);
    } catch (error) {
      console.error('Failed to get message reactions:', error);
      return [];
    }
  }

  // Stub out remaining methods that rely on features not yet implemented
  async createThread(parentMessageId: string, channelId: string): Promise<any> {
    // TODO: Implement threads in backend
    throw new Error('Threads not yet implemented in migrated backend');
  }

  async sendThreadReply(
    threadId: string,
    channelId: string,
    content: string
  ): Promise<Message> {
    // TODO: Implement threads in backend
    throw new Error('Threads not yet implemented in migrated backend');
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    // TODO: Implement threads in backend
    return [];
  }

  async pinMessage(messageId: string, channelId: string): Promise<void> {
    // TODO: Implement pinned messages in backend schema
    console.warn('Pinned messages not yet implemented in migrated backend');
  }

  async unpinMessage(messageId: string, channelId: string): Promise<void> {
    // TODO: Implement pinned messages in backend schema
    console.warn('Pinned messages not yet implemented in migrated backend');
  }

  async getPinnedMessages(channelId: string): Promise<Message[]> {
    // TODO: Implement pinned messages in backend schema
    return [];
  }

  async bookmarkMessage(messageId: string, note?: string): Promise<void> {
    // TODO: Implement bookmarks in backend schema
    console.warn('Bookmarks not yet implemented in migrated backend');
  }

  async removeBookmark(messageId: string): Promise<void> {
    // TODO: Implement bookmarks in backend schema
    console.warn('Bookmarks not yet implemented in migrated backend');
  }

  async getBookmarkedMessages(): Promise<any[]> {
    // TODO: Implement bookmarks in backend schema
    return [];
  }

  async favoriteChannel(channelId: string): Promise<void> {
    // TODO: Implement channel favorites in backend schema
    console.warn('Channel favorites not yet implemented in migrated backend');
  }

  async unfavoriteChannel(channelId: string): Promise<void> {
    // TODO: Implement channel favorites in backend schema
    console.warn('Channel favorites not yet implemented in migrated backend');
  }

  async getFavoriteChannels(): Promise<string[]> {
    // TODO: Implement channel favorites in backend schema
    return [];
  }

  private async setupRealtimeSubscription(): Promise<void> {
    if (!this.currentUserId) {
      console.error('[ChatService] Cannot setup WebSocket - no user ID');
      return;
    }

    try {
      // Get or create WebSocket client
      this.wsClient = getChatWebSocketClient();

      // Connect to WebSocket server
      await this.wsClient.connect(this.currentUserId);
      console.log('[ChatService] WebSocket connected successfully');

      // Subscribe to new messages
      this.wsClient.on('new_message', (payload) => {
        this.handleNewMessage(payload);
      });

      // Subscribe to typing indicators
      this.wsClient.on('user_typing', (payload) => {
        this.handleTypingStart(payload);
      });

      this.wsClient.on('user_stopped_typing', (payload) => {
        this.handleTypingStop(payload);
      });

      // Subscribe to presence updates
      this.wsClient.on('user_presence', (payload) => {
        this.handlePresenceUpdate(payload);
      });

      // Subscribe to channel events
      this.wsClient.on('user_joined_channel', (payload) => {
        console.log('[ChatService] User joined channel:', payload);
        // Trigger channel list refresh
        window.dispatchEvent(new CustomEvent('channel-updated'));
      });

      this.wsClient.on('user_left_channel', (payload) => {
        console.log('[ChatService] User left channel:', payload);
        // Trigger channel list refresh
        window.dispatchEvent(new CustomEvent('channel-updated'));
      });

      // Handle reconnection
      this.wsClient.onConnect(() => {
        console.log('[ChatService] WebSocket reconnected');
        // Update presence to online
        if (this.currentUserId) {
          this.updatePresence('online').catch(console.error);
        }
      });

      this.wsClient.onDisconnect(() => {
        console.log('[ChatService] WebSocket disconnected');
      });

      // Set initial presence to online
      this.wsClient.updatePresence('online');

    } catch (error) {
      console.error('[ChatService] WebSocket setup failed:', error);
      throw error;
    }
  }

  private async handleNewMessage(payload: any): Promise<void> {
    console.log('[ChatService] New message received:', payload);
    
    try {
      // Decrypt message content (skip for system messages)
      const isSystemMessage = payload.messageType === 'system';
      const decryptedContent = isSystemMessage
        ? payload.content
        : await chatEncryption.decryptMessage(payload.content);

      // Create message object with normalized structure
      const message = normalizeMessage({
        id: payload.id || payload.messageId,
        channelId: payload.channelId,
        senderId: payload.senderId,
        encryptedContent: payload.content,
        messageType: payload.messageType || 'text',
        createdAt: payload.timestamp || new Date().toISOString(),
        ...payload
      });

      // Add decrypted content for UI display
      const fullMessage = {
        ...message,
        decrypted_content: decryptedContent
      };

      // Dispatch event with legacy 'chat:' prefix for compatibility
      window.dispatchEvent(new CustomEvent('chat:new-message', { detail: fullMessage }));
    } catch (error) {
      console.error('[ChatService] Failed to decrypt message:', error);
      // Dispatch with error indicator
      const message = normalizeMessage({
        id: payload.id || payload.messageId,
        channelId: payload.channelId,
        senderId: payload.senderId,
        encryptedContent: payload.content,
        messageType: payload.messageType || 'text',
        createdAt: payload.timestamp || new Date().toISOString(),
        ...payload
      });
      
      window.dispatchEvent(new CustomEvent('chat:new-message', { 
        detail: { ...message, decrypted_content: '[Decryption failed]' }
      }));
    }
  }

  private handleTypingStart(payload: any): void {
    const indicator = {
      channel_id: payload.channelId,
      user_id: payload.userId,
      started_typing_at: payload.timestamp || new Date().toISOString()
    };
    
    // Dispatch event with legacy 'chat:' prefix for compatibility
    window.dispatchEvent(new CustomEvent('chat:typing', { detail: indicator }));
  }

  private handleTypingStop(payload: any): void {
    const indicator = {
      channel_id: payload.channelId,
      user_id: payload.userId,
      started_typing_at: null
    };
    
    // Dispatch event with legacy 'chat:' prefix for compatibility
    window.dispatchEvent(new CustomEvent('chat:typing', { detail: indicator }));
  }

  private handlePresenceUpdate(payload: any): void {
    const presence = {
      user_id: payload.userId,
      status: payload.status,
      last_seen_at: payload.timestamp || new Date().toISOString()
    };
    
    // Dispatch event with legacy 'chat:' prefix for compatibility
    window.dispatchEvent(new CustomEvent('chat:presence', { detail: presence }));
  }

  async ensureAIAssistantChannel(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const channels = await this.getChannels();
      const aiChannel = channels.find(c => 
        c.channel_type === 'ai_assistant' && c.created_by === this.currentUserId
      );

      if (!aiChannel) {
        await this.createChannel(
          'AI Assistant',
          'ai_assistant' as any,
          [],
          undefined,
          'Chat with your AI HR assistant'
        );
      }
    } catch (error) {
      console.error('Failed to ensure AI assistant channel:', error);
    }
  }

  private async handleAIResponse(message: Message): Promise<void> {
    // TODO: Update AI assistant endpoint call
    try {
      if (message.channel_id && this.currentUserId) {
        const response = await apiClient.chatWithAssistant(
          message.decrypted_content || message.encrypted_content,
          this.currentUserId
        );
        // AI response will be handled by the backend
      }
    } catch (error) {
      console.error('Error handling AI response:', error);
    }
  }

  cleanup(): void {
    if (this.wsClient) {
      if (this.currentUserId) {
        // Set presence to offline before disconnecting
        this.wsClient.updatePresence('offline');
      }
      // Disconnect WebSocket
      this.wsClient.disconnect();
      this.wsClient = null;
      console.log('[ChatService] WebSocket cleaned up');
    }
  }
}

export const chatService = ChatService.getInstance();
