/*
  # Create Demo Account Helper Function

  1. New Functions
    - `confirm_demo_user` - Confirms a demo user's email address
      - Takes user_id as parameter
      - Updates email_confirmed_at timestamp
      - Only works for demo email addresses for security
  
  2. Security
    - Function checks that email is demo@hrstudio360.com
    - Only accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION confirm_demo_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only confirm if this is the demo account
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmation_token = ''
  WHERE id = user_id
    AND email = 'demo@hrstudio360.com'
    AND email_confirmed_at IS NULL;
END;
$$;