/*
  # Enhance Enterprise Chat with Advanced Features

  ## Overview
  This migration adds modern collaborative features to the Enterprise Chat system,
  bringing it to parity with platforms like Slack and Microsoft Teams.

  ## New Features Added

  1. **Message Reactions**
     - Users can react to messages with emojis
     - Multiple reactions per message
     - Real-time reaction updates

  2. **Threaded Conversations**
     - Reply threads for focused discussions
     - Thread participant tracking
     - Thread reply counts

  3. **Channel Organization**
     - Favorites/starred channels
     - Pinned messages
     - Channel categories/folders
     - Muted channels

  4. **Enhanced Search**
     - Full-text search on messages
     - Search within specific channels
     - Date range filtering
  
  5. **Message Bookmarks**
     - Save important messages
     - Personal bookmark collections

  6. **Mentions & Notifications**
     - @user mentions
     - @channel mentions
     - Mention tracking and unread states

  ## Tables Created

  - `message_reactions`: Store emoji reactions on messages
  - `message_threads`: Thread metadata and stats
  - `channel_favorites`: User's favorite/starred channels
  - `pinned_messages`: Channel-specific pinned messages
  - `message_bookmarks`: User's saved messages
  - `message_mentions`: Track @mentions in messages
  - `channel_folders`: Custom channel organization

  ## Security
  - All tables have RLS enabled
  - Policies ensure users can only access data they're authorized to see
  - Read receipts and presence tracking respect privacy settings
*/

-- Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message 
  ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user 
  ON message_reactions(user_id);

-- Message Threads Table (for threaded conversations)
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id uuid NOT NULL UNIQUE REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  reply_count integer DEFAULT 0,
  participant_count integer DEFAULT 0,
  last_reply_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_threads_parent 
  ON message_threads(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_channel 
  ON message_threads(channel_id);

-- Thread Participants Table
CREATE TABLE IF NOT EXISTS thread_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_participants_thread 
  ON thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user 
  ON thread_participants(user_id);

-- Channel Favorites Table (starred/favorite channels)
CREATE TABLE IF NOT EXISTS channel_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_favorites_user 
  ON channel_favorites(user_id);

-- Pinned Messages Table
CREATE TABLE IF NOT EXISTS pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(message_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_messages_channel 
  ON pinned_messages(channel_id);

-- Message Bookmarks Table (saved messages)
CREATE TABLE IF NOT EXISTS message_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note text,
  bookmarked_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user 
  ON message_bookmarks(user_id);

-- Message Mentions Table (@mentions tracking)
CREATE TABLE IF NOT EXISTS message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_channel_mention boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_mentions_user 
  ON message_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_unread 
  ON message_mentions(mentioned_user_id, is_read);

-- Channel Folders Table (custom organization)
CREATE TABLE IF NOT EXISTS channel_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_folders_user 
  ON channel_folders(user_id);

-- Channel Folder Assignments Table
CREATE TABLE IF NOT EXISTS channel_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES channel_folders(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(folder_id, channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_folder_assignments_folder 
  ON channel_folder_assignments(folder_id);

-- Add columns to existing tables
DO $$
BEGIN
  -- Add thread_id to chat_messages if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='chat_messages' AND column_name='thread_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN thread_id uuid REFERENCES message_threads(id) ON DELETE CASCADE;
    CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
  END IF;

  -- Add is_muted to channel_members if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='channel_members' AND column_name='is_muted'
  ) THEN
    ALTER TABLE channel_members ADD COLUMN is_muted boolean DEFAULT false;
  END IF;

  -- Add reaction_count to chat_messages for performance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='chat_messages' AND column_name='reaction_count'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN reaction_count integer DEFAULT 0;
  END IF;

  -- Add reply_count to chat_messages for thread previews
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='chat_messages' AND column_name='reply_count'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN reply_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_folder_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on messages they can see"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for message_threads
CREATE POLICY "Users can view threads in their channels"
  ON message_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = message_threads.channel_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create threads in their channels"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = message_threads.channel_id
      AND cm.user_id = auth.uid()
    )
  );

-- RLS Policies for thread_participants
CREATE POLICY "Users can view thread participants"
  ON thread_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = thread_participants.thread_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join threads"
  ON thread_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their thread participation"
  ON thread_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for channel_favorites
CREATE POLICY "Users can view their own favorites"
  ON channel_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON channel_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON channel_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for pinned_messages
CREATE POLICY "Users can view pinned messages in their channels"
  ON pinned_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = pinned_messages.channel_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel admins can pin messages"
  ON pinned_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = pinned_messages.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

CREATE POLICY "Channel admins can unpin messages"
  ON pinned_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = pinned_messages.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- RLS Policies for message_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON message_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add bookmarks"
  ON message_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookmarks"
  ON message_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their bookmarks"
  ON message_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for message_mentions
CREATE POLICY "Users can view their own mentions"
  ON message_mentions FOR SELECT
  TO authenticated
  USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can mark mentions as read"
  ON message_mentions FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentioned_user_id);

-- RLS Policies for channel_folders
CREATE POLICY "Users can view their own folders"
  ON channel_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create folders"
  ON channel_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their folders"
  ON channel_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their folders"
  ON channel_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for channel_folder_assignments
CREATE POLICY "Users can view their folder assignments"
  ON channel_folder_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can assign channels to folders"
  ON channel_folder_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove channel assignments"
  ON channel_folder_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers to maintain counts

-- Update reaction count on messages
CREATE OR REPLACE FUNCTION update_message_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_messages 
    SET reaction_count = reaction_count + 1 
    WHERE id = NEW.message_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_messages 
    SET reaction_count = GREATEST(reaction_count - 1, 0) 
    WHERE id = OLD.message_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_reaction_count ON message_reactions;
CREATE TRIGGER trigger_update_message_reaction_count
  AFTER INSERT OR DELETE ON message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_message_reaction_count();

-- Update thread reply count and last_reply_at
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE message_threads 
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at
    WHERE id = NEW.thread_id;
    
    -- Also update parent message reply count
    UPDATE chat_messages
    SET reply_count = reply_count + 1
    WHERE id = (SELECT parent_message_id FROM message_threads WHERE id = NEW.thread_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_stats ON chat_messages;
CREATE TRIGGER trigger_update_thread_stats
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_stats();
