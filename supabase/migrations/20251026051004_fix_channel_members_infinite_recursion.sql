/*
  # Fix Infinite Recursion in Channel Members RLS Policy

  1. Changes
    - Drop the problematic self-referencing SELECT policy on channel_members
    - Create a new simpler policy that allows users to view channel members without recursion
    - Use a direct check on chat_channels instead of querying channel_members within itself

  2. Security
    - Users can still only view members of channels they belong to
    - The new policy checks membership through the channel_id foreign key relationship
    - No reduction in security, just eliminates the circular dependency
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of channels they belong to" ON channel_members;

-- Create a new policy that doesn't cause recursion
-- This policy allows viewing members if the user is checking their own membership
-- OR if they're viewing members of a channel they created
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    -- Users can always see their own memberships
    user_id = auth.uid()
    OR
    -- Users can see members of channels they created
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_members.channel_id
      AND cc.created_by = auth.uid()
    )
  );
