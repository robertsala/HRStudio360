import { supabase } from './supabaseClient';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageThread {
  id: string;
  parent_message_id: string;
  thread_count: number;
  last_reply_at: string;
  last_reply_by: string;
  participants: string[];
  created_at: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  user_id: string;
  order_index: number;
  is_collapsed: boolean;
  created_at: string;
}

export interface ChannelFavorite {
  id: string;
  user_id: string;
  channel_id: string;
  created_at: string;
}

export interface PinnedMessage {
  id: string;
  message_id: string;
  channel_id: string;
  pinned_by: string;
  pinned_at: string;
}

export interface SavedMessage {
  id: string;
  user_id: string;
  message_id: string;
  saved_at: string;
  note?: string;
}

export interface UserCustomStatus {
  id: string;
  user_id: string;
  status_text?: string;
  status_emoji?: string;
  status_type: 'available' | 'busy' | 'away' | 'offline';
  expires_at?: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  user_id: string;
  channel_id?: string;
  notify_all: boolean;
  notify_mentions: boolean;
  notify_keywords: string[];
  mute_until?: string;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  email_enabled: boolean;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: 'mention' | 'reply' | 'reaction' | 'direct_message' | 'channel_invite';
  message_id?: string;
  channel_id?: string;
  triggered_by?: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageMention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  created_at: string;
}

export interface UserChatPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  show_thread_panel: boolean;
  show_member_panel: boolean;
  sidebar_width: number;
  enable_animations: boolean;
  enable_sounds: boolean;
  updated_at: string;
}

export interface DraftMessage {
  id: string;
  user_id: string;
  channel_id: string;
  thread_id?: string;
  content: string;
  updated_at: string;
}

export class EnhancedChatFeatures {
  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction | null> {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji: emoji
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return null;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting reactions:', error);
      return [];
    }
  }

  async createThread(parentMessageId: string, userId: string): Promise<MessageThread | null> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          parent_message_id: parentMessageId,
          thread_count: 0,
          last_reply_by: userId,
          participants: [userId]
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }

  async getThread(parentMessageId: string): Promise<MessageThread | null> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('parent_message_id', parentMessageId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting thread:', error);
      return null;
    }
  }

  async updateThread(threadId: string, userId: string): Promise<boolean> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) return false;

      const participants = thread.participants.includes(userId)
        ? thread.participants
        : [...thread.participants, userId];

      const { error } = await supabase
        .from('message_threads')
        .update({
          thread_count: thread.thread_count + 1,
          last_reply_at: new Date().toISOString(),
          last_reply_by: userId,
          participants: participants
        })
        .eq('id', threadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating thread:', error);
      return false;
    }
  }

  async getThreadById(threadId: string): Promise<MessageThread | null> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('id', threadId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting thread by ID:', error);
      return null;
    }
  }

  async addFavoriteChannel(userId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channel_favorites')
        .insert({
          user_id: userId,
          channel_id: channelId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavoriteChannel(userId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channel_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('channel_id', channelId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getUserFavorites(userId: string): Promise<ChannelFavorite[]> {
    try {
      const { data, error } = await supabase
        .from('channel_favorites')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async pinMessage(messageId: string, channelId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .insert({
          message_id: messageId,
          channel_id: channelId,
          pinned_by: userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      return false;
    }
  }

  async unpinMessage(messageId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('message_id', messageId)
        .eq('channel_id', channelId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unpinning message:', error);
      return false;
    }
  }

  async getPinnedMessages(channelId: string): Promise<PinnedMessage[]> {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      return [];
    }
  }

  async saveMessage(userId: string, messageId: string, note?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_messages')
        .insert({
          user_id: userId,
          message_id: messageId,
          note: note
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }

  async unsaveMessage(userId: string, messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_messages')
        .delete()
        .eq('user_id', userId)
        .eq('message_id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unsaving message:', error);
      return false;
    }
  }

  async getSavedMessages(userId: string): Promise<SavedMessage[]> {
    try {
      const { data, error } = await supabase
        .from('saved_messages')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting saved messages:', error);
      return [];
    }
  }

  async setUserStatus(
    userId: string,
    statusType: 'available' | 'busy' | 'away' | 'offline',
    statusText?: string,
    statusEmoji?: string,
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_custom_status')
        .upsert({
          user_id: userId,
          status_type: statusType,
          status_text: statusText,
          status_emoji: statusEmoji,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting user status:', error);
      return false;
    }
  }

  async getUserStatus(userId: string): Promise<UserCustomStatus | null> {
    try {
      const { data, error } = await supabase
        .from('user_custom_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user status:', error);
      return null;
    }
  }

  async saveDraft(userId: string, channelId: string, content: string, threadId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('draft_messages')
        .upsert({
          user_id: userId,
          channel_id: channelId,
          thread_id: threadId,
          content: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,channel_id,thread_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }

  async getDraft(userId: string, channelId: string, threadId?: string): Promise<DraftMessage | null> {
    try {
      let query = supabase
        .from('draft_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('channel_id', channelId);

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else {
        query = query.is('thread_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  }

  async deleteDraft(userId: string, channelId: string, threadId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('draft_messages')
        .delete()
        .eq('user_id', userId)
        .eq('channel_id', channelId);

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else {
        query = query.is('thread_id', null);
      }

      const { error } = await query;

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  }

  async getUserChatPreferences(userId: string): Promise<UserChatPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_chat_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const defaultPrefs: Partial<UserChatPreferences> = {
          user_id: userId,
          theme: 'system',
          density: 'comfortable',
          show_thread_panel: true,
          show_member_panel: false,
          sidebar_width: 300,
          enable_animations: true,
          enable_sounds: true
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_chat_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    } catch (error) {
      console.error('Error getting chat preferences:', error);
      return null;
    }
  }

  async updateChatPreferences(userId: string, preferences: Partial<UserChatPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_chat_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating chat preferences:', error);
      return false;
    }
  }

  async createNotification(
    userId: string,
    type: 'mention' | 'reply' | 'reaction' | 'direct_message' | 'channel_invite',
    messageId?: string,
    channelId?: string,
    triggeredBy?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: type,
          message_id: messageId,
          channel_id: channelId,
          triggered_by: triggeredBy,
          is_read: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<UserNotification[]> {
    try {
      let query = supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification read:', error);
      return false;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      return false;
    }
  }

  subscribeToReactions(messageId: string, callback: (reaction: MessageReaction) => void) {
    const subscription = supabase
      .channel(`reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          callback(payload.new as MessageReaction);
        }
      )
      .subscribe();

    return subscription;
  }

  subscribeToThreadUpdates(threadId: string, callback: (thread: MessageThread) => void) {
    const subscription = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
          filter: `id=eq.${threadId}`
        },
        (payload) => {
          callback(payload.new as MessageThread);
        }
      )
      .subscribe();

    return subscription;
  }

  subscribeToNotifications(userId: string, callback: (notification: UserNotification) => void) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as UserNotification);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const enhancedChatFeatures = new EnhancedChatFeatures();
