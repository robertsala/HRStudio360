/*
  # Fix AI Assistant Channel Isolation - Cleanup Existing Channels
  
  1. Overview
    - Removes all existing AI Assistant channels and related data
    - Prepares for recreation of properly isolated user-specific channels
    - Cleans up messages, memberships, and typing indicators
    
  2. Changes Made
    - Deletes all chat_messages for ai_assistant channels
    - Deletes all channel_members for ai_assistant channels
    - Deletes all typing_indicators for ai_assistant channels
    - Deletes all chat_channels with channel_type = 'ai_assistant'
    
  3. Important Notes
    - This is a destructive operation (deletes existing AI Assistant data)
    - Only affects AI Assistant channels, not other channel types
    - Users will get fresh AI Assistant channels in the next migration
    - All AI Assistant chat history will be lost
*/

-- Delete typing indicators for AI Assistant channels
DELETE FROM typing_indicators
WHERE channel_id IN (
  SELECT id FROM chat_channels WHERE channel_type = 'ai_assistant'
);

-- Delete messages for AI Assistant channels
DELETE FROM chat_messages
WHERE channel_id IN (
  SELECT id FROM chat_channels WHERE channel_type = 'ai_assistant'
);

-- Delete channel memberships for AI Assistant channels
DELETE FROM channel_members
WHERE channel_id IN (
  SELECT id FROM chat_channels WHERE channel_type = 'ai_assistant'
);

-- Delete AI Assistant channels
DELETE FROM chat_channels
WHERE channel_type = 'ai_assistant';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully cleaned up all AI Assistant channels';
END $$;
