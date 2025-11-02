/*
  # Add Default Role Assignment on User Signup

  ## Overview
  Sets up automatic role and department assignment when a new user profile is created.

  ## Changes Made

  1. Function Creation
    - Create function to set default role and department for new profiles
    - Default role: 'Employee'
    - Default department: 'General'

  2. Trigger Setup
    - Create trigger that fires BEFORE INSERT on profiles table
    - Automatically populates role and department if they are NULL

  ## Important Notes
  - New users will be assigned 'Employee' role by default
  - HR and Product Owners can change roles using User Management interface
  - This ensures all users have a role set from the start
*/

-- Create function to set default role and department
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set defaults before insert
DROP TRIGGER IF EXISTS set_default_user_role_trigger ON profiles;

CREATE TRIGGER set_default_user_role_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_user_role();

-- Update existing profiles that have NULL role or department
UPDATE profiles
SET 
  role = COALESCE(role, 'Employee'),
  department = COALESCE(department, 'General')
WHERE role IS NULL OR department IS NULL;
