/*
  # Add AI Assistant Channel Constraints and Security Policies
  
  1. Overview
    - Adds unique constraint to ensure one AI Assistant channel per user
    - Implements strict RLS policies for AI Assistant channel isolation
    - Prevents unauthorized access to other users' AI Assistant channels
    
  2. Changes Made
    - Adds unique partial index on (created_by, channel_type) for ai_assistant type
    - Updates RLS policies to enforce ownership validation
    - Adds constraints to prevent manual creation of AI Assistant channels
    
  3. Security Enhancements
    - Users can only see AI Assistant channels they created
    - Users cannot access messages in other users' AI Assistant channels
    - Users cannot add themselves to other users' AI Assistant channels
    
  4. Important Notes
    - AI Assistant channels are strictly private to their creator
    - The system will auto-create AI Assistant channels via backend logic
    - Manual creation of AI Assistant channels is prevented
*/

-- Add unique constraint: one AI Assistant channel per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ai_assistant_per_user
ON chat_channels (created_by)
WHERE channel_type = 'ai_assistant' AND is_active = true;

-- Drop existing channel policies to recreate them with proper ownership checks
DROP POLICY IF EXISTS "Users can view channels they are members of" ON chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can update their own channels" ON chat_channels;

-- Recreate channel SELECT policy with AI Assistant ownership check
CREATE POLICY "Users can view channels they are members of"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    -- For AI Assistant channels, only show if user is the creator
    (channel_type = 'ai_assistant' AND created_by = auth.uid())
    OR
    -- For other channels, show if user is a member
    (channel_type != 'ai_assistant' AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
    ))
  );

-- Recreate channel INSERT policy - prevent manual AI Assistant creation
CREATE POLICY "Users can create channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow all channel types EXCEPT ai_assistant
    channel_type != 'ai_assistant'
    AND created_by = auth.uid()
  );

-- Recreate channel UPDATE policy with ownership check
CREATE POLICY "Users can update their own channels"
  ON chat_channels FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'admin'
    )
  );

-- Drop and recreate channel_members policies with AI Assistant checks
DROP POLICY IF EXISTS "Users can view channel members for their channels" ON channel_members;
DROP POLICY IF EXISTS "Users can add members to channels" ON channel_members;

-- Users can only see members of channels they have access to
CREATE POLICY "Users can view channel members for their channels"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    -- For AI Assistant channels, only if user owns it
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = channel_members.channel_id
      AND (
        (chat_channels.channel_type = 'ai_assistant' AND chat_channels.created_by = auth.uid())
        OR
        (chat_channels.channel_type != 'ai_assistant' AND EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = chat_channels.id
          AND cm.user_id = auth.uid()
        ))
      )
    )
  );

-- Prevent adding members to AI Assistant channels
CREATE POLICY "Users can add members to channels"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Prevent adding members to AI Assistant channels
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = channel_members.channel_id
      AND chat_channels.channel_type != 'ai_assistant'
      AND (
        chat_channels.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = chat_channels.id
          AND cm.user_id = auth.uid()
          AND cm.role = 'admin'
        )
      )
    )
  );

-- Drop and recreate message policies with AI Assistant ownership check
DROP POLICY IF EXISTS "Users can view messages in their channels" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- Users can only see messages in channels they have access to
CREATE POLICY "Users can view messages in their channels"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        -- For AI Assistant, only if user owns the channel
        (chat_channels.channel_type = 'ai_assistant' AND chat_channels.created_by = auth.uid())
        OR
        -- For other channels, if user is a member
        (chat_channels.channel_type != 'ai_assistant' AND EXISTS (
          SELECT 1 FROM channel_members
          WHERE channel_members.channel_id = chat_channels.id
          AND channel_members.user_id = auth.uid()
        ))
      )
    )
  );

-- Users can send messages to channels they have access to
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_messages.channel_id
      AND (
        -- For AI Assistant, only if user owns the channel
        (chat_channels.channel_type = 'ai_assistant' AND chat_channels.created_by = auth.uid())
        OR
        -- For other channels, if user is a member
        (chat_channels.channel_type != 'ai_assistant' AND EXISTS (
          SELECT 1 FROM channel_members
          WHERE channel_members.channel_id = chat_channels.id
          AND channel_members.user_id = auth.uid()
        ))
      )
    )
    AND sender_id = auth.uid()
  );

-- Create a function to auto-create AI Assistant channel for new users
CREATE OR REPLACE FUNCTION create_ai_assistant_channel_for_user(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  channel_id uuid;
  user_first_name text;
  welcome_message text;
BEGIN
  -- Get user's first name
  SELECT first_name INTO user_first_name
  FROM profiles
  WHERE id = user_id;

  -- Check if AI Assistant channel already exists
  SELECT id INTO channel_id
  FROM chat_channels
  WHERE channel_type = 'ai_assistant'
  AND created_by = user_id
  AND is_active = true;

  -- If channel doesn't exist, create it
  IF channel_id IS NULL THEN
    -- Create the channel
    INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
    VALUES (
      'Studio AI Assistant',
      'ai_assistant',
      'Your personal AI assistant for HR questions and support',
      user_id,
      true
    )
    RETURNING id INTO channel_id;

    -- Add user as admin member
    INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
    VALUES (channel_id, user_id, 'admin', true);

    -- Create welcome message
    welcome_message := 'Hi ' || COALESCE(user_first_name, 'there') || '! I am Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, and more. Just ask me anything!';

    INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
    VALUES (channel_id, user_id, welcome_message, 'system');

    RAISE NOTICE 'Created AI Assistant channel % for user %', channel_id, user_id;
  END IF;

  RETURN channel_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_ai_assistant_channel_for_user(uuid) TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added AI Assistant channel constraints and policies';
END $$;
