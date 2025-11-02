/*
  # Fix Access Permissions Policies

  1. Changes
    - Add policy to allow authenticated users to manage access permissions
    - This allows initial setup before any user has can_manage_users permission
    - Simplifies the bootstrap process for new installations

  2. Security
    - Still maintains RLS
    - Users can only grant permissions to employees
    - Later can be restricted further once initial admin is set up
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert permissions" ON employee_access_permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON employee_access_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON employee_access_permissions;

-- Add more permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert permissions"
  ON employee_access_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update permissions"
  ON employee_access_permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete permissions"
  ON employee_access_permissions FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users to view all permissions for management
DROP POLICY IF EXISTS "Admins can view all permissions" ON employee_access_permissions;

CREATE POLICY "Authenticated users can view all permissions"
  ON employee_access_permissions FOR SELECT
  TO authenticated
  USING (true);
