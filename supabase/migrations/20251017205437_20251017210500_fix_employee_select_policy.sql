/*
  # Fix Employee Select Policy

  1. Changes
    - Update employee SELECT policy to allow authenticated users to view all employees
    - This enables the User Management modal to display all employees
    - Maintains RLS but broadens read access for management purposes

  2. Security
    - Still maintains RLS for updates (users can only update their own records)
    - Read access broadened to support HR and management features
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;

-- Create a more permissive read policy for authenticated users
CREATE POLICY "Authenticated users can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);
