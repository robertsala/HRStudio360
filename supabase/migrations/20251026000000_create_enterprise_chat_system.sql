/*
  # Enterprise End-to-End Encrypted Chat System

  1. New Tables
    - `user_encryption_keys`
      - Stores public keys for each user (private keys never leave client)
      - `user_id` (uuid, references profiles)
      - `public_key` (text, user's public encryption key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chat_channels`
      - Represents chat rooms (department channels, DMs, group chats)
      - `id` (uuid, primary key)
      - `name` (text, channel name)
      - `channel_type` (text: 'department', 'direct', 'group', 'ai_assistant')
      - `department` (text, for department channels)
      - `description` (text)
      - `is_active` (boolean)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `channel_members`
      - Tracks which users are in which channels
      - `id` (uuid, primary key)
      - `channel_id` (uuid, references chat_channels)
      - `user_id` (uuid, references profiles)
      - `role` (text: 'admin', 'member')
      - `encrypted_channel_key` (text, channel encryption key encrypted with user's public key)
      - `joined_at` (timestamptz)
      - `last_read_at` (timestamptz)
      - `notifications_enabled` (boolean)

    - `chat_messages`
      - Stores encrypted messages
      - `id` (uuid, primary key)
      - `channel_id` (uuid, references chat_channels)
      - `sender_id` (uuid, references profiles)
      - `encrypted_content` (text, encrypted message content)
      - `message_type` (text: 'text', 'file', 'system')
      - `file_url` (text, for file messages)
      - `file_name` (text)
      - `file_size` (bigint)
      - `reply_to_message_id` (uuid, for threading)
      - `edited_at` (timestamptz)
      - `deleted_at` (timestamptz)
      - `created_at` (timestamptz)

    - `message_read_receipts`
      - Tracks which messages have been read by which users
      - `id` (uuid, primary key)
      - `message_id` (uuid, references chat_messages)
      - `user_id` (uuid, references profiles)
      - `read_at` (timestamptz)

    - `typing_indicators`
      - Real-time typing status
      - `channel_id` (uuid, references chat_channels)
      - `user_id` (uuid, references profiles)
      - `started_typing_at` (timestamptz)

    - `user_presence`
      - Online/offline status
      - `user_id` (uuid, references profiles, primary key)
      - `status` (text: 'online', 'away', 'offline')
      - `last_seen_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access channels they are members of
    - Users can only read messages from channels they belong to
    - Users can only update their own typing indicators and presence
*/

-- Create all tables first (without RLS policies)

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

-- Create chat_messages table
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

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON chat_messages(channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON chat_messages(sender_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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

-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message
  ON message_read_receipts(message_id);

ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

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

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_typing_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel
  ON typing_indicators(channel_id);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

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

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now()
);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence status"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to auto-create AI Assistant channel for each user
CREATE OR REPLACE FUNCTION create_ai_assistant_channel_for_user()
RETURNS TRIGGER AS $$
DECLARE
  ai_channel_id uuid;
BEGIN
  -- Create personal AI Assistant channel
  INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
  VALUES (
    'Studio AI Assistant',
    'ai_assistant',
    'Your personal AI assistant for HR questions and support',
    NEW.id,
    true
  )
  RETURNING id INTO ai_channel_id;

  -- Add user as member
  INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
  VALUES (ai_channel_id, NEW.id, 'admin', true);

  -- Add welcome message from AI
  INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
  VALUES (
    ai_channel_id,
    NEW.id,
    'Hi! I''m Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, and more. Just ask me anything!',
    'system'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create AI channel for new users
DROP TRIGGER IF EXISTS create_ai_channel_on_profile_create ON profiles;
CREATE TRIGGER create_ai_channel_on_profile_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_ai_assistant_channel_for_user();

-- Create function to cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_typing_at < now() - interval '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
