/*
  # Complete Enterprise Chat System Rebuild

  This migration completely rebuilds the enterprise chat system from the ground up,
  fixing all infinite recursion issues, RLS policy conflicts, and permission problems.

  ## Critical Fixes

  1. **Profiles Table RLS** - Simple policy allowing all authenticated users to view profiles
  2. **Security Definer Functions** - Helper functions that bypass RLS for membership checks
  3. **Non-Recursive Policies** - All policies use security definer functions, never self-reference
  4. **Clean Schema** - Drops and recreates all chat tables with proper constraints
  5. **AI Assistant Setup** - Automatic channel creation for all users

  ## Changes

  ### Profiles Table
  - Ensures profiles table exists with required columns
  - Drops all existing profiles RLS policies
  - Creates single simple SELECT policy for authenticated users

  ### Security Definer Functions
  - `is_channel_member(channel_id, user_id)` - Check if user is member of channel
  - `is_channel_admin(channel_id, user_id)` - Check if user is admin of channel
  - `ensure_user_ai_channel(user_id)` - Create AI assistant channel for user

  ### Chat Tables
  - `chat_channels` - Main channel table
  - `channel_members` - User membership in channels
  - `chat_messages` - Messages in channels
  - `typing_indicators` - Real-time typing status
  - `user_presence` - Online/offline status
  - `message_reactions` - Emoji reactions to messages
  - `message_threads` - Threaded conversations
  - `pinned_messages` - Important pinned messages
  - `message_bookmarks` - User-saved messages
  - `channel_favorites` - User-favorited channels

  ## Security

  All tables have RLS enabled with policies that:
  - Use security definer functions to avoid recursion
  - Check authentication status
  - Verify channel membership or ownership
  - Never reference the same table within its own policy
*/

-- ============================================================================
-- STEP 1: Ensure Profiles Table and Fix RLS
-- ============================================================================

-- Ensure profiles table exists with all required columns
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
    ALTER TABLE profiles ADD COLUMN department TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_picture') THEN
    ALTER TABLE profiles ADD COLUMN profile_picture TEXT;
  END IF;
END $$;

-- Drop ALL existing profiles RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE profiles SELECT policy - authenticated users can read all profiles
CREATE POLICY "authenticated_users_read_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 2: Drop All Existing Chat Tables and Policies
-- ============================================================================

-- Drop storage bucket
DO $$
BEGIN
  DELETE FROM storage.buckets WHERE id = 'chat-attachments';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop all chat tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS channel_favorites CASCADE;
DROP TABLE IF EXISTS message_bookmarks CASCADE;
DROP TABLE IF EXISTS pinned_messages CASCADE;
DROP TABLE IF EXISTS message_threads CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;

-- Drop any existing security definer functions
DROP FUNCTION IF EXISTS is_channel_member CASCADE;
DROP FUNCTION IF EXISTS is_channel_admin CASCADE;
DROP FUNCTION IF EXISTS ensure_user_ai_channel CASCADE;
DROP FUNCTION IF EXISTS ensure_ai_assistant_channel CASCADE;
DROP FUNCTION IF EXISTS check_chat_health CASCADE;

-- ============================================================================
-- STEP 3: Create Security Definer Functions (NO RLS recursion)
-- ============================================================================

-- Function to check if user is member of channel (bypasses RLS)
CREATE OR REPLACE FUNCTION is_channel_member(channel_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM channel_members
    WHERE channel_id = channel_id_param
    AND user_id = user_id_param
  );
END;
$$;

-- Function to check if user is admin of channel (bypasses RLS)
CREATE OR REPLACE FUNCTION is_channel_admin(channel_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM channel_members
    WHERE channel_id = channel_id_param
    AND user_id = user_id_param
    AND role = 'admin'
  );
END;
$$;

-- Function to ensure user has an AI assistant channel
CREATE OR REPLACE FUNCTION ensure_user_ai_channel(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_channel_id UUID;
  new_channel_id UUID;
  user_first_name TEXT;
BEGIN
  -- Check if AI channel already exists for this user
  SELECT cc.id INTO existing_channel_id
  FROM chat_channels cc
  WHERE cc.channel_type = 'ai_assistant'
  AND cc.created_by = target_user_id
  AND cc.is_active = true
  LIMIT 1;

  IF existing_channel_id IS NOT NULL THEN
    RETURN existing_channel_id;
  END IF;

  -- Get user's first name for welcome message
  SELECT first_name INTO user_first_name
  FROM profiles
  WHERE id = target_user_id;

  user_first_name := COALESCE(user_first_name, 'there');

  -- Create new AI assistant channel
  INSERT INTO chat_channels (
    name,
    channel_type,
    description,
    created_by,
    is_active
  ) VALUES (
    'Studio AI Assistant',
    'ai_assistant',
    'Your personal AI assistant for HR questions and support',
    target_user_id,
    true
  ) RETURNING id INTO new_channel_id;

  -- Add user as member
  INSERT INTO channel_members (
    channel_id,
    user_id,
    role,
    notifications_enabled
  ) VALUES (
    new_channel_id,
    target_user_id,
    'admin',
    true
  );

  -- Add welcome message
  INSERT INTO chat_messages (
    channel_id,
    sender_id,
    encrypted_content,
    message_type
  ) VALUES (
    new_channel_id,
    target_user_id,
    'Hi ' || user_first_name || '! I''m Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, performance reviews, and more. Just ask me anything!',
    'system'
  );

  RETURN new_channel_id;
END;
$$;

-- ============================================================================
-- STEP 4: Create Chat Tables with Proper Structure
-- ============================================================================

-- Chat Channels Table
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('department', 'direct', 'group', 'ai_assistant')),
  department TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Members Table
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  notifications_enabled BOOLEAN DEFAULT true,
  UNIQUE(channel_id, user_id)
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  encrypted_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  thread_id UUID,
  reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Typing Indicators Table
CREATE TABLE typing_indicators (
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_typing_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- User Presence Table
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message Reactions Table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Message Threads Table
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_message_id)
);

-- Pinned Messages Table
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, channel_id)
);

-- Message Bookmarks Table
CREATE TABLE message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  bookmarked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Channel Favorites Table
CREATE TABLE channel_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- ============================================================================
-- STEP 5: Create Indexes for Performance
-- ============================================================================

CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_typing_indicators_channel_id ON typing_indicators(channel_id);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_pinned_messages_channel_id ON pinned_messages(channel_id);
CREATE INDEX idx_message_bookmarks_user_id ON message_bookmarks(user_id);
CREATE INDEX idx_channel_favorites_user_id ON channel_favorites(user_id);

-- ============================================================================
-- STEP 6: Enable RLS on All Tables
-- ============================================================================

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS Policies Using Security Definer Functions
-- ============================================================================

-- Chat Channels Policies
CREATE POLICY "users_view_accessible_channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_channel_member(id, auth.uid()) OR
    (channel_type = 'ai_assistant' AND created_by = auth.uid())
  );

CREATE POLICY "users_create_channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "admins_update_channels"
  ON chat_channels FOR UPDATE
  TO authenticated
  USING (is_channel_admin(id, auth.uid()))
  WITH CHECK (is_channel_admin(id, auth.uid()));

CREATE POLICY "admins_delete_channels"
  ON chat_channels FOR DELETE
  TO authenticated
  USING (is_channel_admin(id, auth.uid()));

-- Channel Members Policies
CREATE POLICY "users_view_channel_members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "admins_add_channel_members"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_channel_admin(channel_id, auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "admins_update_channel_members"
  ON channel_members FOR UPDATE
  TO authenticated
  USING (is_channel_admin(channel_id, auth.uid()))
  WITH CHECK (is_channel_admin(channel_id, auth.uid()));

CREATE POLICY "members_leave_channels"
  ON channel_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_channel_admin(channel_id, auth.uid()));

-- Chat Messages Policies
CREATE POLICY "members_view_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "members_send_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    is_channel_member(channel_id, auth.uid()) AND
    auth.uid() = sender_id
  );

CREATE POLICY "senders_edit_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "senders_delete_messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Typing Indicators Policies
CREATE POLICY "members_view_typing"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "users_set_typing"
  ON typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_channel_member(channel_id, auth.uid()));

CREATE POLICY "users_update_typing"
  ON typing_indicators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_clear_typing"
  ON typing_indicators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Presence Policies
CREATE POLICY "users_view_presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_set_own_presence"
  ON user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Message Reactions Policies
CREATE POLICY "members_view_reactions"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages
      WHERE chat_messages.id = message_reactions.message_id
      AND is_channel_member(chat_messages.channel_id, auth.uid())
    )
  );

CREATE POLICY "users_add_reactions"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_remove_reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Message Threads Policies
CREATE POLICY "members_view_threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "members_create_threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (is_channel_member(channel_id, auth.uid()));

-- Pinned Messages Policies
CREATE POLICY "members_view_pinned"
  ON pinned_messages FOR SELECT
  TO authenticated
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "admins_pin_messages"
  ON pinned_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_channel_admin(channel_id, auth.uid()));

CREATE POLICY "admins_unpin_messages"
  ON pinned_messages FOR DELETE
  TO authenticated
  USING (is_channel_admin(channel_id, auth.uid()));

-- Message Bookmarks Policies
CREATE POLICY "users_view_own_bookmarks"
  ON message_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_add_bookmarks"
  ON message_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_remove_bookmarks"
  ON message_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Channel Favorites Policies
CREATE POLICY "users_view_own_favorites"
  ON channel_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_add_favorites"
  ON channel_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_remove_favorites"
  ON channel_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 8: Create Storage Bucket for Chat Attachments
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "authenticated_upload_attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "authenticated_view_attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-attachments');

-- ============================================================================
-- STEP 9: Create AI Assistant Channels for All Existing Users
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM profiles WHERE id IN (SELECT id FROM auth.users)
  LOOP
    BEGIN
      PERFORM ensure_user_ai_channel(user_record.id);
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other users
      RAISE NOTICE 'Failed to create AI channel for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 10: Create Trigger to Auto-Create AI Channel for New Users
-- ============================================================================

CREATE OR REPLACE FUNCTION create_ai_channel_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create AI assistant channel for the new user
  PERFORM ensure_user_ai_channel(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail user creation if AI channel fails
  RAISE NOTICE 'Failed to create AI channel for new user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created_create_ai_channel ON profiles;

-- Create trigger on profile creation
CREATE TRIGGER on_profile_created_create_ai_channel
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_ai_channel_for_new_user();
