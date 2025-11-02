/*
  # Improve Channel Members RLS Policy

  1. Changes
    - Replace the restrictive policy with one that properly allows viewing members
    - Users can view members of any channel where they are also a member
    - Uses a subquery that checks the user's own membership without recursion

  2. Security
    - Users can only view members of channels they belong to
    - The policy uses a subquery on the same table but with a different condition to avoid recursion
    - Maintains proper access control while eliminating infinite recursion
*/

-- Drop the current policy
DROP POLICY IF EXISTS "Users can view channel members" ON channel_members;

-- Create improved policy that allows viewing members without recursion
CREATE POLICY "Users can view members of their channels"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user is a member of the same channel
    -- by looking for their user_id in the same channel_id
    channel_id IN (
      SELECT cm.channel_id
      FROM channel_members cm
      WHERE cm.user_id = auth.uid()
    )
  );
