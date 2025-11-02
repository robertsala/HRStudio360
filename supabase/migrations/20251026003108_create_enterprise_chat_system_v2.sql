/*
  # Enterprise End-to-End Encrypted Chat System

  1. New Tables
    - `user_encryption_keys` - Stores public keys for each user
    - `chat_channels` - Chat rooms (department, DM, group, AI)
    - `channel_members` - User membership in channels
    - `chat_messages` - Encrypted messages
    - `message_read_receipts` - Message read tracking
    - `typing_indicators` - Real-time typing status
    - `user_presence` - Online/offline status

  2. Security
    - RLS enabled on all tables
    - Users can only access their channels
    - End-to-end encryption supported
*/

-- Step 1: Create all tables

CREATE TABLE IF NOT EXISTS user_encryption_keys (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('department', 'direct', 'group', 'ai_assistant')),
  department text,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  encrypted_channel_key text,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  notifications_enabled boolean DEFAULT true,
  UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  encrypted_content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url text,
  file_name text,
  file_size bigint,
  reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_typing_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now()
);

-- Step 2: Create indexes

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON chat_messages(channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message
  ON message_read_receipts(message_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel
  ON typing_indicators(channel_id);

-- Step 3: Enable RLS on all tables

ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_encryption_keys

CREATE POLICY "Users can view all public keys"
  ON user_encryption_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own encryption keys"
  ON user_encryption_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption keys"
  ON user_encryption_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create RLS policies for chat_channels

CREATE POLICY "Users can view channels they are members of"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators and admins can update channels"
  ON chat_channels FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

-- Step 6: Create RLS policies for channel_members

CREATE POLICY "Users can view members of channels they belong to"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel creators can add initial members"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_members.channel_id
      AND cc.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own membership settings"
  ON channel_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove themselves from channels"
  ON channel_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 7: Create RLS policies for chat_messages

CREATE POLICY "Users can view messages in channels they are members of"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel members can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Message senders can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Message senders can delete their own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Step 8: Create RLS policies for message_read_receipts

CREATE POLICY "Users can view read receipts for messages in their channels"
  ON message_read_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN channel_members chm ON chm.channel_id = cm.channel_id
      WHERE cm.id = message_read_receipts.message_id
      AND chm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own read receipts"
  ON message_read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 9: Create RLS policies for typing_indicators

CREATE POLICY "Users can view typing indicators in their channels"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = typing_indicators.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own typing indicators"
  ON typing_indicators FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 10: Create RLS policies for user_presence

CREATE POLICY "All authenticated users can view presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence status"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 11: Create helper functions

CREATE OR REPLACE FUNCTION create_ai_assistant_channel_for_user()
RETURNS TRIGGER AS $$
DECLARE
  ai_channel_id uuid;
BEGIN
  INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
  VALUES (
    'Studio AI Assistant',
    'ai_assistant',
    'Your personal AI assistant for HR questions and support',
    NEW.id,
    true
  )
  RETURNING id INTO ai_channel_id;

  INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
  VALUES (ai_channel_id, NEW.id, 'admin', true);

  INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
  VALUES (
    ai_channel_id,
    NEW.id,
    'Hi! I am Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, and more. Just ask me anything!',
    'system'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_ai_channel_on_profile_create ON profiles;
CREATE TRIGGER create_ai_channel_on_profile_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_ai_assistant_channel_for_user();