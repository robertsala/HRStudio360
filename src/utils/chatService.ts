import { supabase } from './supabaseClient';
import { chatEncryption } from './chatEncryptionService';

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
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
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
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
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
  private realtimeChannel: any = null;

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

  async ensureAIAssistantChannel(): Promise<void> {
    if (!this.currentUserId) {
      console.error('Cannot ensure AI Assistant channel: No user ID');
      return;
    }

    try {
      console.log('Ensuring AI Assistant channel exists...');
      window.dispatchEvent(new CustomEvent('chat:ai-channel-progress', { detail: 'Checking your AI Assistant...' }));

      // Use the new security definer function to ensure AI channel exists
      const { data: channelId, error } = await supabase
        .rpc('ensure_user_ai_channel', { target_user_id: this.currentUserId });

      if (error) {
        console.error('Failed to ensure AI Assistant channel:', error);
        window.dispatchEvent(new CustomEvent('chat:channel-check-error', {
          detail: { message: error.message }
        }));
        return;
      }

      console.log('AI Assistant channel confirmed:', channelId);
      window.dispatchEvent(new CustomEvent('chat:channels-ready'));
    } catch (error) {
      console.error('Error ensuring AI Assistant channel:', error);
      window.dispatchEvent(new CustomEvent('chat:channel-check-error', {
        detail: { message: 'Failed to set up AI Assistant' }
      }));
    }
  }

  private async setupRealtimeSubscription(): Promise<void> {
    if (!this.currentUserId) return;

    this.realtimeChannel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          this.handleNewMessage(payload.new as Message);
          this.handleAIResponse(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators'
        },
        (payload) => {
          this.handleTypingIndicator(payload.new as TypingIndicator);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          this.handlePresenceUpdate(payload.new as UserPresence);
        }
      )
      .subscribe();
  }

  private async handleAIResponse(message: Message): Promise<void> {
    if (!this.currentUserId || message.message_type === 'system') return;

    try {
      const channel = await this.getChannel(message.channel_id);
      if (channel?.channel_type === 'ai_assistant' && message.sender_id === this.currentUserId) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('Supabase configuration missing');
          return;
        }

        const functionUrl = `${supabaseUrl}/functions/v1/ai-assistant-chat`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            userId: this.currentUserId
          })
        });

        if (!response.ok) {
          console.error('AI assistant response failed:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error handling AI response:', error);
    }
  }

  private handleNewMessage(message: Message): void {
    window.dispatchEvent(new CustomEvent('chat:new-message', { detail: message }));
  }

  private handleTypingIndicator(indicator: TypingIndicator): void {
    window.dispatchEvent(new CustomEvent('chat:typing', { detail: indicator }));
  }

  private handlePresenceUpdate(presence: UserPresence): void {
    window.dispatchEvent(new CustomEvent('chat:presence', { detail: presence }));
  }

  async getChannels(): Promise<Channel[]> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:channel_members!channel_members_channel_id_fkey(
          id,
          user_id,
          role,
          last_read_at,
          user:profiles!channel_members_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            profile_picture,
            department
          )
        )
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Filter out AI Assistant channels that don't belong to the current user
    const filteredData = (data || []).filter(channel => {
      if (channel.channel_type === 'ai_assistant') {
        return channel.created_by === this.currentUserId;
      }
      return true;
    });

    const channelsWithUnread = await Promise.all(
      filteredData.map(async (channel) => {
        const unreadCount = await this.getUnreadCount(channel.id);
        const lastMessage = await this.getLastMessage(channel.id);

        return {
          ...channel,
          unread_count: unreadCount,
          last_message: lastMessage
        };
      })
    );

    return channelsWithUnread;
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    const { data, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        members:channel_members!channel_members_channel_id_fkey(
          id,
          user_id,
          role,
          last_read_at,
          user:profiles!channel_members_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            profile_picture,
            department
          )
        )
      `)
      .eq('id', channelId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createChannel(
    name: string,
    type: 'department' | 'direct' | 'group',
    memberUserIds: string[],
    department?: string,
    description?: string
  ): Promise<Channel> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .insert({
        name,
        channel_type: type,
        department: department || null,
        description: description || null,
        created_by: this.currentUserId
      })
      .select()
      .single();

    if (channelError) throw channelError;

    const allMemberIds = [this.currentUserId, ...memberUserIds.filter(id => id !== this.currentUserId)];

    const membersToInsert = allMemberIds.map((userId, index) => ({
      channel_id: channel.id,
      user_id: userId,
      role: index === 0 ? 'admin' : 'member'
    }));

    const { error: membersError } = await supabase
      .from('channel_members')
      .insert(membersToInsert);

    if (membersError) throw membersError;

    return channel;
  }

  async uploadFile(
    channelId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${channelId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
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

    const encryptedContent = messageType === 'system'
      ? content
      : await chatEncryption.encryptMessage(content);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: this.currentUserId,
        encrypted_content: encryptedContent,
        message_type: messageType,
        reply_to_message_id: replyToMessageId || null,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null
      })
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .single();

    if (error) throw error;

    await supabase
      .from('chat_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    const decryptedData = {
      ...data,
      decrypted_content: content
    };

    return decryptedData;
  }

  async getMessages(
    channelId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;

    const decryptedMessages = await Promise.all(
      (data || []).map(async (message) => {
        try {
          if (message.message_type === 'system') {
            return {
              ...message,
              decrypted_content: message.encrypted_content
            };
          }

          try {
            const parsed = JSON.parse(message.encrypted_content);
            if (parsed && typeof parsed === 'object' && parsed.algorithm) {
              const decrypted = await chatEncryption.decryptMessage(message.encrypted_content);
              return {
                ...message,
                decrypted_content: decrypted
              };
            }
          } catch {
          }

          const decrypted = await chatEncryption.decryptMessage(message.encrypted_content);
          return {
            ...message,
            decrypted_content: decrypted
          };
        } catch (error) {
          console.error('Failed to decrypt message:', message.id, error);
          return {
            ...message,
            decrypted_content: null
          };
        }
      })
    );

    return decryptedMessages.reverse();
  }

  async getLastMessage(channelId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    try {
      if (data.message_type === 'system') {
        return {
          ...data,
          decrypted_content: data.encrypted_content
        };
      }

      const decrypted = await chatEncryption.decryptMessage(data.encrypted_content);
      return {
        ...data,
        decrypted_content: decrypted
      };
    } catch (error) {
      console.error('Failed to decrypt last message:', data.id, error);
      return {
        ...data,
        decrypted_content: null
      };
    }
  }

  async markAsRead(channelId: string): Promise<void> {
    if (!this.currentUserId) return;

    await supabase
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', this.currentUserId);
  }

  async getUnreadCount(channelId: string): Promise<number> {
    if (!this.currentUserId) return 0;

    const { data: membership } = await supabase
      .from('channel_members')
      .select('last_read_at')
      .eq('channel_id', channelId)
      .eq('user_id', this.currentUserId)
      .maybeSingle();

    if (!membership) return 0;

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId)
      .gt('created_at', membership.last_read_at)
      .neq('sender_id', this.currentUserId);

    return count || 0;
  }

  async setTyping(channelId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUserId) return;

    if (isTyping) {
      await supabase
        .from('typing_indicators')
        .upsert({
          channel_id: channelId,
          user_id: this.currentUserId,
          started_typing_at: new Date().toISOString()
        });
    } else {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', this.currentUserId);
    }
  }

  async getTypingUsers(channelId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('user_id')
      .eq('channel_id', channelId)
      .neq('user_id', this.currentUserId || '')
      .gte('started_typing_at', new Date(Date.now() - 10000).toISOString());

    if (error) return [];
    return (data || []).map(d => d.user_id);
  }

  async updatePresence(status: 'online' | 'away' | 'offline'): Promise<void> {
    if (!this.currentUserId) return;

    await supabase
      .from('user_presence')
      .upsert({
        user_id: this.currentUserId,
        status,
        last_seen_at: new Date().toISOString()
      });
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async searchMessages(query: string, channelId?: string): Promise<Message[]> {
    let searchQuery = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (channelId) {
      searchQuery = searchQuery.eq('channel_id', channelId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;

    const decryptedMessages = await Promise.all(
      (data || []).map(async (message) => {
        try {
          const decrypted = message.message_type === 'system'
            ? message.encrypted_content
            : await chatEncryption.decryptMessage(message.encrypted_content);

          return {
            ...message,
            decrypted_content: decrypted
          };
        } catch (error) {
          return null;
        }
      })
    );

    return decryptedMessages
      .filter((msg): msg is Message => msg !== null && msg.decrypted_content?.toLowerCase().includes(query.toLowerCase()));
  }

  async addChannelMember(channelId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    const { error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
        role
      });

    if (error) throw error;
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async leaveChannel(channelId: string): Promise<void> {
    if (!this.currentUserId) return;

    await this.removeChannelMember(channelId, this.currentUserId);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    const encryptedContent = await chatEncryption.encryptMessage(newContent);

    await supabase
      .from('chat_messages')
      .update({
        encrypted_content: encryptedContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId);
  }

  // Message Reactions
  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: this.currentUserId,
        emoji
      });

    if (error) throw error;
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', this.currentUserId)
      .eq('emoji', emoji);

    if (error) throw error;
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        *,
        user:profiles!message_reactions_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_picture
        )
      `)
      .eq('message_id', messageId);

    if (error) throw error;
    return data || [];
  }

  // Threaded Conversations
  async createThread(parentMessageId: string, channelId: string): Promise<any> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('message_threads')
      .insert({
        parent_message_id: parentMessageId,
        channel_id: channelId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async sendThreadReply(
    threadId: string,
    channelId: string,
    content: string
  ): Promise<Message> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const encryptedContent = await chatEncryption.encryptMessage(content);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        thread_id: threadId,
        sender_id: this.currentUserId,
        encrypted_content: encryptedContent,
        message_type: 'text'
      })
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      decrypted_content: content
    };
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const decryptedMessages = await Promise.all(
      (data || []).map(async (message) => {
        try {
          const decrypted = await chatEncryption.decryptMessage(message.encrypted_content);
          return {
            ...message,
            decrypted_content: decrypted
          };
        } catch (error) {
          console.error('Failed to decrypt thread message:', message.id, error);
          return {
            ...message,
            decrypted_content: null
          };
        }
      })
    );

    return decryptedMessages;
  }

  // Pinned Messages
  async pinMessage(messageId: string, channelId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('pinned_messages')
      .insert({
        message_id: messageId,
        channel_id: channelId,
        pinned_by: this.currentUserId
      });

    if (error) throw error;
  }

  async unpinMessage(messageId: string, channelId: string): Promise<void> {
    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('message_id', messageId)
      .eq('channel_id', channelId);

    if (error) throw error;
  }

  async getPinnedMessages(channelId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('pinned_messages')
      .select(`
        message:chat_messages(
          *,
          sender:profiles!chat_messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            email,
            profile_picture
          )
        )
      `)
      .eq('channel_id', channelId)
      .order('pinned_at', { ascending: false });

    if (error) throw error;

    const messages = (data || []).map(item => item.message).filter(Boolean);

    const decryptedMessages = await Promise.all(
      messages.map(async (message: any) => {
        try {
          const decrypted = message.message_type === 'system'
            ? message.encrypted_content
            : await chatEncryption.decryptMessage(message.encrypted_content);
          return {
            ...message,
            decrypted_content: decrypted
          };
        } catch (error) {
          return {
            ...message,
            decrypted_content: null
          };
        }
      })
    );

    return decryptedMessages;
  }

  // Message Bookmarks
  async bookmarkMessage(messageId: string, note?: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('message_bookmarks')
      .insert({
        message_id: messageId,
        user_id: this.currentUserId,
        note: note || null
      });

    if (error) throw error;
  }

  async removeBookmark(messageId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('message_bookmarks')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', this.currentUserId);

    if (error) throw error;
  }

  async getBookmarkedMessages(): Promise<any[]> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('message_bookmarks')
      .select(`
        *,
        message:chat_messages(
          *,
          sender:profiles!chat_messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            email,
            profile_picture
          )
        )
      `)
      .eq('user_id', this.currentUserId)
      .order('bookmarked_at', { ascending: false });

    if (error) throw error;

    const bookmarks = await Promise.all(
      (data || []).map(async (bookmark: any) => {
        const message = bookmark.message;
        try {
          const decrypted = message.message_type === 'system'
            ? message.encrypted_content
            : await chatEncryption.decryptMessage(message.encrypted_content);
          return {
            ...bookmark,
            message: {
              ...message,
              decrypted_content: decrypted
            }
          };
        } catch (error) {
          return {
            ...bookmark,
            message: {
              ...message,
              decrypted_content: null
            }
          };
        }
      })
    );

    return bookmarks;
  }

  // Channel Favorites
  async favoriteChannel(channelId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('channel_favorites')
      .insert({
        channel_id: channelId,
        user_id: this.currentUserId
      });

    if (error) throw error;
  }

  async unfavoriteChannel(channelId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('channel_favorites')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', this.currentUserId);

    if (error) throw error;
  }

  async getFavoriteChannels(): Promise<string[]> {
    if (!this.currentUserId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('channel_favorites')
      .select('channel_id')
      .eq('user_id', this.currentUserId);

    if (error) throw error;
    return (data || []).map(item => item.channel_id);
  }

  cleanup(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    if (this.currentUserId) {
      this.updatePresence('offline');
    }

    this.currentUserId = null;
    chatEncryption.clearKeys();
  }
}

export const chatService = ChatService.getInstance();
