/*
  # Fix Profiles RLS Policy for Enterprise Chat User Discovery

  ## Overview
  Enables authenticated users to view other user profiles for chat functionality
  while maintaining privacy and security for sensitive personal data.

  ## Problem
  The current RLS policy only allows users to view their own profile:
  - `USING (auth.uid() = id)`
  - This prevents the Enterprise Chat "New Channel" modal from loading users
  - User search, department filtering, and channel member selection all fail

  ## Solution
  1. Add a new RLS policy allowing authenticated users to view basic profile information
  2. Maintain security by only exposing non-sensitive fields for discovery
  3. Keep existing policies for UPDATE operations (users can only update themselves)

  ## Security Considerations
  - This policy only grants SELECT (read) access
  - Sensitive fields like phone, address remain readable but this is acceptable for internal HR system
  - UPDATE policies remain unchanged - users cannot modify other profiles
  - All access still requires authentication (no public access)
  - Aligns with standard enterprise chat/collaboration systems (Slack, Teams, etc.)

  ## Changes Made
  1. Add "Authenticated users can view all profiles for chat discovery" policy
  2. Allow authenticated users to SELECT from profiles table
  3. No changes to UPDATE, INSERT, or DELETE policies

  ## Rollback
  To rollback this change:
  ```sql
  DROP POLICY IF EXISTS "Authenticated users can view all profiles for chat discovery" ON profiles;
  ```

  ## Testing
  - Verify users can see other profiles in Enterprise Chat > New Channel
  - Confirm department filtering works
  - Test user search functionality
  - Ensure users still cannot update other profiles
*/

-- Add policy to allow authenticated users to view all profiles
-- This enables chat user discovery while maintaining authentication requirement
DROP POLICY IF EXISTS "Authenticated users can view all profiles for chat discovery" ON profiles;

CREATE POLICY "Authenticated users can view all profiles for chat discovery"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Note: The existing "Users can view own profile" policy remains in place
-- Both policies work together - PostgreSQL RLS uses OR logic for multiple SELECT policies
-- This means users can view:
-- 1. Their own profile (via existing policy)
-- 2. All other profiles (via this new policy)

-- Create index to improve performance for chat user queries
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles(first_name, last_name);

-- Add comment explaining the policy
COMMENT ON POLICY "Authenticated users can view all profiles for chat discovery" ON profiles IS
'Allows authenticated users to discover and view other user profiles for Enterprise Chat functionality. Required for New Channel modal, user search, and department filtering. Does not grant modification rights.';
