/*
  # Add Org Chart Access Permissions

  ## Overview
  Adds permission field to control access to the org chart feature.
  By default, HR department and Product Owner role have access.
  Other users can be granted access through User Management.

  ## Changes Made

  1. Schema Updates
    - Add `can_access_org_chart` boolean column to profiles table
    - Default value is false for regular users
    - Add index for faster permission lookups

  2. Data Updates
    - Set can_access_org_chart = true for HR department users
    - Set can_access_org_chart = true for Product Owner role users

  3. Trigger Updates
    - Update default role trigger to auto-grant org chart access for HR and Product Owners

  ## Important Notes
  - HR department members automatically get org chart access
  - Product Owner role automatically gets org chart access
  - Other users need to be explicitly granted access via User Management
  - Permissions can be revoked through User Management interface
*/

-- Add can_access_org_chart column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'can_access_org_chart'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_access_org_chart boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_profiles_org_chart_access ON profiles(can_access_org_chart);

-- Grant org chart access to existing HR department and Product Owner users
UPDATE profiles
SET can_access_org_chart = true
WHERE department = 'HR' OR role = 'Product Owner';

-- Update the default role function to auto-grant org chart access for HR and Product Owners
CREATE OR REPLACE FUNCTION set_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default role if not provided
  IF NEW.role IS NULL THEN
    NEW.role := 'Employee';
  END IF;

  -- Set default department if not provided
  IF NEW.department IS NULL THEN
    NEW.department := 'General';
  END IF;

  -- Auto-grant org chart access for HR and Product Owners
  IF NEW.department = 'HR' OR NEW.role = 'Product Owner' THEN
    NEW.can_access_org_chart := true;
  ELSE
    NEW.can_access_org_chart := COALESCE(NEW.can_access_org_chart, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
