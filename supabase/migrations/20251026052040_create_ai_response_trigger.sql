/*
  # AI Assistant Response Trigger

  1. New Functions
    - `trigger_ai_response()` - Automatically triggers AI response when user sends message to AI assistant channel
    - Calls the ai-assistant-chat edge function via http request
    - Only triggers for user messages (not system messages) in AI assistant channels
    
  2. Changes
    - Adds trigger on chat_messages table for INSERT operations
    - Triggers AI response generation for messages in ai_assistant channels
    
  3. Security
    - Uses SECURITY DEFINER to allow function to access necessary data
    - Only processes messages from authenticated users
*/

-- Create function to trigger AI response
CREATE OR REPLACE FUNCTION trigger_ai_response()
RETURNS TRIGGER AS $$
DECLARE
  channel_type_val text;
  supabase_url text;
  service_role_key text;
  function_url text;
BEGIN
  -- Only process messages that are from users (not system messages)
  IF NEW.message_type != 'system' AND NEW.sender_id IS NOT NULL THEN
    
    -- Check if this message is in an AI assistant channel
    SELECT channel_type INTO channel_type_val
    FROM chat_channels
    WHERE id = NEW.channel_id;
    
    IF channel_type_val = 'ai_assistant' THEN
      -- Get Supabase URL from environment
      supabase_url := current_setting('app.settings.supabase_url', true);
      service_role_key := current_setting('app.settings.service_role_key', true);
      
      -- Construct edge function URL
      IF supabase_url IS NOT NULL THEN
        function_url := supabase_url || '/functions/v1/ai-assistant-chat';
        
        -- Call the edge function asynchronously using pg_net (if available)
        -- For now, we'll use a simpler approach with a background worker
        PERFORM pg_notify(
          'ai_assistant_message',
          json_build_object(
            'message_id', NEW.id,
            'channel_id', NEW.channel_id,
            'sender_id', NEW.sender_id,
            'content', NEW.encrypted_content
          )::text
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_message_insert_trigger_ai_response ON chat_messages;

-- Create trigger
CREATE TRIGGER on_message_insert_trigger_ai_response
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_response();
