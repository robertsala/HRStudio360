/*
  # Add Role-Based Announcement Permissions

  ## Overview
  Adds department and role tracking to profiles and updates announcement policies 
  to allow only HR department staff and Product Owners to edit/delete announcements.

  ## Changes Made

  1. Schema Updates
    - Add `department` column to profiles table (text)
    - Add `role` column to profiles table (text)
    - Add index on department and role for faster lookups

  2. Security Updates
    - Drop existing announcement update/delete policies
    - Create new policies that restrict edit/delete to HR department and Product Owner role
    - Maintain existing read and insert policies

  ## Important Notes
  - HR department members can edit/delete any announcement
  - Product Owner role can edit/delete any announcement
  - All other users can only view published announcements
  - Read tracking remains available to all authenticated users
*/

-- Add department and role columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text;
  END IF;
END $$;

-- Create index for faster department and role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Drop existing update and delete policies
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;

-- Create new update policy - only HR department and Product Owner can update
CREATE POLICY "HR and Product Owner can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.department = 'HR'
        OR profiles.role = 'Product Owner'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.department = 'HR'
        OR profiles.role = 'Product Owner'
      )
    )
  );

-- Create new delete policy - only HR department and Product Owner can delete
CREATE POLICY "HR and Product Owner can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.department = 'HR'
        OR profiles.role = 'Product Owner'
      )
    )
  );
