/*
  # Create AI Assistant Channels for All Users
  
  1. Overview
    - Ensures every user with a profile has a Studio AI Assistant channel
    - Creates channels for users who don't have one yet
    - Adds welcome messages to all AI Assistant channels
    
  2. Changes Made
    - Scans all profiles to identify users without AI Assistant channels
    - Creates personal AI Assistant channel for each user
    - Adds user as admin member of their AI channel
    - Inserts welcoming system message from Studio
    
  3. Channel Configuration
    - Channel Type: ai_assistant
    - Name: "Studio AI Assistant"
    - Description: Personal AI assistant for HR questions and support
    - User Role: admin
    - Notifications: enabled by default
    
  4. Important Notes
    - Safe to run multiple times (skips users who already have AI channels)
    - Does not modify existing AI Assistant channels
    - Creates one AI channel per user (not shared)
*/

DO $$
DECLARE
  user_record RECORD;
  ai_channel_id uuid;
  channel_exists BOOLEAN;
BEGIN
  -- Loop through all profiles
  FOR user_record IN
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    WHERE p.id IS NOT NULL
  LOOP
    -- Check if user already has an AI Assistant channel
    SELECT EXISTS (
      SELECT 1
      FROM chat_channels cc
      JOIN channel_members cm ON cm.channel_id = cc.id
      WHERE cc.channel_type = 'ai_assistant'
      AND cm.user_id = user_record.id
    ) INTO channel_exists;
    
    -- Create AI Assistant channel if it doesn't exist
    IF NOT channel_exists THEN
      INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
      VALUES (
        'Studio AI Assistant',
        'ai_assistant',
        'Your personal AI assistant for HR questions and support',
        user_record.id,
        true
      )
      RETURNING id INTO ai_channel_id;

      -- Add user as admin member
      INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
      VALUES (ai_channel_id, user_record.id, 'admin', true);

      -- Add welcome message
      INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
      VALUES (
        ai_channel_id,
        user_record.id,
        'Hi ' || COALESCE(user_record.first_name, 'there') || '! I''m Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, performance reviews, and more. Just ask me anything!',
        'system'
      );

      RAISE NOTICE 'Created AI Assistant channel for user: % %', user_record.first_name, user_record.last_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'AI Assistant channel creation complete';
END $$;
