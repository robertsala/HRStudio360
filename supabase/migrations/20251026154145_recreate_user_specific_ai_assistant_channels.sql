/*
  # Recreate User-Specific AI Assistant Channels
  
  1. Overview
    - Creates fresh AI Assistant channels for all existing users
    - Each user gets their own private AI Assistant channel
    - Personalized welcome messages with user's first name
    
  2. Changes Made
    - Calls create_ai_assistant_channel_for_user() for each profile
    - Creates one unique AI Assistant channel per user
    - Adds personalized welcome messages
    - Sets up proper channel memberships
    
  3. Channel Configuration
    - Channel Type: ai_assistant
    - Name: "Studio AI Assistant"
    - Creator: Each user owns their own channel
    - Member: Only the user is a member (admin role)
    - Welcome message personalized with user's first name
    
  4. Important Notes
    - Safe to run multiple times (function checks for existing channels)
    - Each channel is isolated to its creator
    - Cannot be accessed by other users due to RLS policies
*/

DO $$
DECLARE
  user_record RECORD;
  channel_id uuid;
  channels_created integer := 0;
BEGIN
  -- Loop through all profiles and create AI Assistant channels
  FOR user_record IN
    SELECT id, first_name, last_name, email
    FROM profiles
    WHERE id IS NOT NULL
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Call the function to create AI Assistant channel
      SELECT create_ai_assistant_channel_for_user(user_record.id) INTO channel_id;
      
      IF channel_id IS NOT NULL THEN
        channels_created := channels_created + 1;
        RAISE NOTICE 'Created AI Assistant channel for: % % (%)', 
          user_record.first_name, 
          user_record.last_name, 
          user_record.email;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create AI Assistant channel for user %: %', 
        user_record.id, 
        SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Successfully created % AI Assistant channels', channels_created;
END $$;
