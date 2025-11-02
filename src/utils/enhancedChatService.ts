import { supabase } from './supabaseClient';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

export interface MessageThread {
  id: string;
  parent_message_id: string;
  channel_id: string;
  reply_count: number;
  participant_count: number;
  last_reply_at: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
}

export interface ChannelFavorite {
  id: string;
  channel_id: string;
  user_id: string;
  favorited_at: string;
}

export interface PinnedMessage {
  id: string;
  message_id: string;
  channel_id: string;
  pinned_by: string;
  pinned_at: string;
}

export interface MessageBookmark {
  id: string;
  message_id: string;
  user_id: string;
  note: string | null;
  bookmarked_at: string;
}

export interface MessageMention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  is_channel_mention: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ChannelFolder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export class EnhancedChatService {
  private static instance: EnhancedChatService;

  private constructor() {}

  static getInstance(): EnhancedChatService {
    if (!EnhancedChatService.instance) {
      EnhancedChatService.instance = new EnhancedChatService();
    }
    return EnhancedChatService.instance;
  }

  async addReaction(messageId: string, emoji: string): Promise<MessageReaction | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })
        .select(`
          *,
          user:profiles(first_name, last_name, profile_picture)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return null;
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
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
        .select(`
          *,
          user:profiles(first_name, last_name, profile_picture)
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return [];
    }
  }

  async createThread(parentMessageId: string, channelId: string): Promise<MessageThread | null> {
    try {
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
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching thread:', error);
      return null;
    }
  }

  async getThreadMessages(threadId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(id, first_name, last_name, email, profile_picture)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      return [];
    }
  }

  async toggleChannelFavorite(channelId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: existing } = await supabase
        .from('channel_favorites')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('channel_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('channel_favorites')
          .insert({
            channel_id: channelId,
            user_id: user.id
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  async getFavoriteChannels(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('channel_favorites')
        .select('channel_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(f => f.channel_id) || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  async pinMessage(messageId: string, channelId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('pinned_messages')
        .insert({
          message_id: messageId,
          channel_id: channelId,
          pinned_by: user.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      return false;
    }
  }

  async unpinMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('message_id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unpinning message:', error);
      return false;
    }
  }

  async getPinnedMessages(channelId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select(`
          *,
          message:chat_messages(
            *,
            sender:profiles(first_name, last_name, profile_picture)
          )
        `)
        .eq('channel_id', channelId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      return [];
    }
  }

  async bookmarkMessage(messageId: string, note?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('message_bookmarks')
        .insert({
          message_id: messageId,
          user_id: user.id,
          note: note || null
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bookmarking message:', error);
      return false;
    }
  }

  async removeBookmark(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('message_bookmarks')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  }

  async getBookmarkedMessages(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('message_bookmarks')
        .select(`
          *,
          message:chat_messages(
            *,
            sender:profiles(first_name, last_name, profile_picture),
            channel:chat_channels(name, channel_type)
          )
        `)
        .eq('user_id', user.id)
        .order('bookmarked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }

  async toggleChannelMute(channelId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: member } = await supabase
        .from('channel_members')
        .select('is_muted')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .single();

      if (!member) return false;

      const { error } = await supabase
        .from('channel_members')
        .update({ is_muted: !member.is_muted })
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      if (error) throw error;
      return !member.is_muted;
    } catch (error) {
      console.error('Error toggling mute:', error);
      return false;
    }
  }

  async createFolder(name: string, color?: string): Promise<ChannelFolder | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('channel_folders')
        .insert({
          user_id: user.id,
          name,
          color: color || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  async getFolders(): Promise<ChannelFolder[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('channel_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async assignChannelToFolder(channelId: string, folderId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('channel_folder_assignments')
        .insert({
          folder_id: folderId,
          channel_id: channelId,
          user_id: user.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning channel to folder:', error);
      return false;
    }
  }

  async searchMessages(query: string, channelId?: string): Promise<any[]> {
    try {
      let queryBuilder = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(first_name, last_name, profile_picture),
          channel:chat_channels(name, channel_type)
        `)
        .ilike('encrypted_content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (channelId) {
        queryBuilder = queryBuilder.eq('channel_id', channelId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  async getUnreadMentions(): Promise<MessageMention[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('message_mentions')
        .select(`
          *,
          message:chat_messages(
            *,
            sender:profiles(first_name, last_name, profile_picture),
            channel:chat_channels(name, channel_type)
          )
        `)
        .eq('mentioned_user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unread mentions:', error);
      return [];
    }
  }

  async markMentionAsRead(mentionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_mentions')
        .update({ is_read: true })
        .eq('id', mentionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking mention as read:', error);
      return false;
    }
  }
}

export const enhancedChatService = EnhancedChatService.getInstance();
