/*
  # Fix Channel Members Recursion with Security Definer Function

  1. Changes
    - Create a security definer function to check channel membership
    - This function bypasses RLS and directly checks the database
    - Replace the recursive policy with one using the function

  2. Security
    - Function is SECURITY DEFINER so it runs with elevated privileges
    - Still maintains proper access control - users can only see members of their channels
    - Eliminates recursion by checking membership without triggering RLS policies
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their channels" ON channel_members;

-- Create a security definer function to check if user is member of a channel
CREATE OR REPLACE FUNCTION is_channel_member(p_channel_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = p_channel_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policy using the security definer function
CREATE POLICY "Users can view members of their channels"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    is_channel_member(channel_id, auth.uid())
  );
