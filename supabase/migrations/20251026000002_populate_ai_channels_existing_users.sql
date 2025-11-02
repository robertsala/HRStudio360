/*
  # Create AI Assistant Channels for Existing Users

  This migration creates AI Assistant channels for all existing users who don't have one yet.
*/

DO $$
DECLARE
  user_record RECORD;
  ai_channel_id uuid;
BEGIN
  -- Loop through all profiles that don't have an AI Assistant channel
  FOR user_record IN
    SELECT p.id
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1
      FROM chat_channels cc
      JOIN channel_members cm ON cm.channel_id = cc.id
      WHERE cc.channel_type = 'ai_assistant'
      AND cm.user_id = p.id
    )
  LOOP
    -- Create AI Assistant channel for this user
    INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
    VALUES (
      'Studio AI Assistant',
      'ai_assistant',
      'Your personal AI assistant for HR questions and support',
      user_record.id,
      true
    )
    RETURNING id INTO ai_channel_id;

    -- Add user as member
    INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
    VALUES (ai_channel_id, user_record.id, 'admin', true);

    -- Add welcome message
    INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
    VALUES (
      ai_channel_id,
      user_record.id,
      'Hi! I am Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, and more. Just ask me anything!',
      'system'
    );

    RAISE NOTICE 'Created AI Assistant channel for user %', user_record.id;
  END LOOP;
END $$;
