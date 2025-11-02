/*
  # Add Employee Fields to Profiles Table

  1. Changes
    - Add department, role, job_title, status, employee_id, hire_date columns to profiles
    - These columns are needed for chat user selection
    - Allows profiles to show employee information without complex JOINs

  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- Add employee-related columns to profiles table
DO $$
BEGIN
  -- Add department column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department text;
  END IF;

  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text;
  END IF;

  -- Add job_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active';
  END IF;

  -- Add employee_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN employee_id text;
  END IF;

  -- Update hire_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hire_date'
  ) THEN
    -- Note: hire_date may already exist from celebrations migration
    ALTER TABLE profiles ADD COLUMN hire_date date;
  END IF;
END $$;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Create index on department for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- Comment on new columns
COMMENT ON COLUMN profiles.department IS 'Employee department name, synced from employees table';
COMMENT ON COLUMN profiles.role IS 'Employee role/position, synced from employees table';
COMMENT ON COLUMN profiles.job_title IS 'Employee job title, synced from employees table';
COMMENT ON COLUMN profiles.status IS 'Employee status (active, inactive, etc.)';
COMMENT ON COLUMN profiles.employee_id IS 'Employee ID reference, synced from employees table';
