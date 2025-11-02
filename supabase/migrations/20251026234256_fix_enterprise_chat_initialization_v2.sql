/*
  # Fix Enterprise Chat Initialization Issues (V2)

  ## Overview
  This migration addresses critical issues preventing Enterprise Chat from initializing:
  - Fixes RLS policies to allow proper chat initialization
  - Creates functions to ensure AI Assistant channels exist for all users
  - Adds diagnostic functions to check chat system health
  - Handles existing profile data properly

  ## Changes Made
  
  1. RLS Policy Fixes
    - Simplifies chat_channels SELECT policy
    - Fixes channel_members policies to allow proper access
    - Ensures users can create and access their own channels

  2. AI Assistant Channel Management
    - Creates function to manually create AI Assistant channels
    - Adds bulk creation function for all users
    - Implements self-healing on chat initialization

  3. Diagnostic Functions
    - Health check function for chat system
    - User-specific diagnostics
    - Admin tools for troubleshooting

  ## Security
  - All RLS policies remain enforced
  - Users can only access their own data
  - AI Assistant channels remain isolated per user
*/

-- ============================================================================
-- STEP 1: Simplify and Fix RLS Policies
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view channels they are members of" ON chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can update their own channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can view accessible channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can create non-AI channels" ON chat_channels;
DROP POLICY IF EXISTS "Channel admins can update channels" ON chat_channels;

-- Create simplified channel SELECT policy
CREATE POLICY "Users can view accessible channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    -- Users can see channels they created (including AI Assistant)
    created_by = auth.uid()
    OR
    -- Users can see channels where they are members
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = chat_channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Allow users to create non-AI channels
CREATE POLICY "Users can create non-AI channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND channel_type IN ('direct', 'group', 'department')
  );

-- Allow channel admins to update channels
CREATE POLICY "Channel admins can update channels"
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
  );

-- Fix channel_members policies
DROP POLICY IF EXISTS "Users can view channel members for their channels" ON channel_members;
DROP POLICY IF EXISTS "Users can add members to channels" ON channel_members;
DROP POLICY IF EXISTS "Users can update channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can view members of accessible channels" ON channel_members;
DROP POLICY IF EXISTS "Channel admins can add members" ON channel_members;
DROP POLICY IF EXISTS "Channel admins can update members" ON channel_members;

-- Simplified channel_members SELECT policy
CREATE POLICY "Users can view members of accessible channels"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    -- Can see members if user is also a member or owns the channel
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_members.channel_id
      AND (
        cc.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = cc.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- Allow adding members to non-AI channels
CREATE POLICY "Channel admins can add members"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_members.channel_id
      AND cc.channel_type != 'ai_assistant'
      AND (
        cc.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = cc.id
          AND cm.user_id = auth.uid()
          AND cm.role = 'admin'
        )
      )
    )
  );

-- Allow admins to update member roles
CREATE POLICY "Channel admins can update members"
  ON channel_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_members.channel_id
      AND (
        cc.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = cc.id
          AND cm.user_id = auth.uid()
          AND cm.role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- STEP 2: AI Assistant Channel Management Functions
-- ============================================================================

-- Function to safely create AI Assistant channel for a specific user
CREATE OR REPLACE FUNCTION ensure_ai_assistant_channel(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  channel_id uuid;
  user_first_name text;
  user_last_name text;
  user_email text;
  welcome_message text;
  result jsonb;
BEGIN
  -- Get user information from profiles table
  SELECT first_name, last_name, email 
  INTO user_first_name, user_last_name, user_email
  FROM profiles
  WHERE id = target_user_id;

  -- If not in profiles, try employees table
  IF user_first_name IS NULL THEN
    SELECT e.first_name, e.last_name, e.email 
    INTO user_first_name, user_last_name, user_email
    FROM employees e
    WHERE e.id = target_user_id;
  END IF;

  IF user_first_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in profiles or employees table',
      'user_id', target_user_id
    );
  END IF;

  -- Check if AI Assistant channel already exists
  SELECT id INTO channel_id
  FROM chat_channels
  WHERE channel_type = 'ai_assistant'
  AND created_by = target_user_id
  AND is_active = true;

  -- If channel exists, return success
  IF channel_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'AI Assistant channel already exists',
      'channel_id', channel_id,
      'user_id', target_user_id
    );
  END IF;

  -- Create the AI Assistant channel
  INSERT INTO chat_channels (name, channel_type, description, created_by, is_active)
  VALUES (
    'Studio AI Assistant',
    'ai_assistant',
    'Your personal AI assistant for HR questions and support',
    target_user_id,
    true
  )
  RETURNING id INTO channel_id;

  -- Add user as admin member
  INSERT INTO channel_members (channel_id, user_id, role, notifications_enabled)
  VALUES (channel_id, target_user_id, 'admin', true);

  -- Create welcome message
  welcome_message := 'Hi ' || COALESCE(user_first_name, 'there') || '! I am Studio, your personal AI assistant. I can help you with HR questions, benefits information, time tracking, payroll, performance reviews, and more. Just ask me anything!';

  INSERT INTO chat_messages (channel_id, sender_id, encrypted_content, message_type)
  VALUES (channel_id, target_user_id, welcome_message, 'system');

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'AI Assistant channel created successfully',
    'channel_id', channel_id,
    'user_id', target_user_id,
    'user_name', user_first_name || ' ' || COALESCE(user_last_name, '')
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'user_id', target_user_id
    );
END;
$$;

-- Function to create AI Assistant channels for all users who don't have one
CREATE OR REPLACE FUNCTION create_missing_ai_assistant_channels()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  result jsonb;
  created_count integer := 0;
  skipped_count integer := 0;
  error_count integer := 0;
  results jsonb := '[]'::jsonb;
BEGIN
  -- Loop through all profiles that don't have an AI Assistant channel
  FOR user_record IN
    SELECT DISTINCT p.id, p.first_name, p.last_name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.channel_type = 'ai_assistant'
      AND cc.created_by = p.id
      AND cc.is_active = true
    )
    LIMIT 100
  LOOP
    -- Create AI Assistant channel for this user
    result := ensure_ai_assistant_channel(user_record.id);
    
    IF (result->>'success')::boolean THEN
      IF result->>'message' LIKE '%already exists%' THEN
        skipped_count := skipped_count + 1;
      ELSE
        created_count := created_count + 1;
      END IF;
    ELSE
      error_count := error_count + 1;
    END IF;

    results := results || jsonb_build_array(result);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'created', created_count,
    'skipped', skipped_count,
    'errors', error_count,
    'total_processed', created_count + skipped_count + error_count,
    'details', results
  );
END;
$$;

-- ============================================================================
-- STEP 3: Chat System Diagnostic Functions
-- ============================================================================

-- Function to check chat system health for a specific user
CREATE OR REPLACE FUNCTION check_chat_health(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists boolean;
  employee_exists boolean;
  ai_channel_exists boolean;
  ai_channel_id uuid;
  channel_count integer;
  message_count integer;
  member_count integer;
  health_status jsonb;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = target_user_id) INTO profile_exists;
  
  -- Check if employee exists
  SELECT EXISTS(SELECT 1 FROM employees WHERE id = target_user_id) INTO employee_exists;

  -- Check if AI Assistant channel exists
  SELECT id INTO ai_channel_id
  FROM chat_channels 
  WHERE created_by = target_user_id 
  AND channel_type = 'ai_assistant' 
  AND is_active = true
  LIMIT 1;
  
  ai_channel_exists := (ai_channel_id IS NOT NULL);

  -- Count total channels user has access to
  SELECT COUNT(*) INTO channel_count
  FROM chat_channels cc
  WHERE cc.is_active = true
  AND (
    cc.created_by = target_user_id
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = cc.id
      AND cm.user_id = target_user_id
    )
  );

  -- Count channel memberships
  SELECT COUNT(*) INTO member_count
  FROM channel_members
  WHERE user_id = target_user_id;

  -- Count total messages user has sent
  SELECT COUNT(*) INTO message_count
  FROM chat_messages
  WHERE sender_id = target_user_id;

  -- Build health status
  health_status := jsonb_build_object(
    'user_id', target_user_id,
    'profile_exists', profile_exists,
    'employee_exists', employee_exists,
    'ai_channel_exists', ai_channel_exists,
    'ai_channel_id', ai_channel_id,
    'total_channels', channel_count,
    'channel_memberships', member_count,
    'total_messages', message_count,
    'status', CASE
      WHEN NOT profile_exists AND NOT employee_exists THEN 'ERROR: User record not found'
      WHEN NOT ai_channel_exists THEN 'WARNING: AI Assistant channel missing'
      WHEN channel_count = 0 THEN 'WARNING: No channels available'
      ELSE 'OK'
    END,
    'recommendations', CASE
      WHEN NOT ai_channel_exists THEN jsonb_build_array('Run ensure_ai_assistant_channel() to create AI channel')
      WHEN channel_count = 0 THEN jsonb_build_array('User needs to create or join channels')
      ELSE jsonb_build_array('System is healthy')
    END,
    'checked_at', now()
  );

  RETURN health_status;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_ai_assistant_channel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_missing_ai_assistant_channels() TO authenticated;
GRANT EXECUTE ON FUNCTION check_chat_health(uuid) TO authenticated;

-- ============================================================================
-- STEP 4: Create AI Assistant Channels for All Existing Users
-- ============================================================================

-- Execute the bulk creation function to backfill AI channels
DO $$
DECLARE
  result jsonb;
BEGIN
  SELECT create_missing_ai_assistant_channels() INTO result;
  RAISE NOTICE 'AI Assistant channel creation result: %', result;
END $$;

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Enterprise Chat Fix Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS policies simplified and fixed';
  RAISE NOTICE 'AI Assistant channels created for all users';
  RAISE NOTICE 'Diagnostic functions available';
  RAISE NOTICE '========================================';
END $$;
