/*
  # Sync Employee Profile Pictures and Data to Chat System

  ## Overview
  Enhances the profile-employee sync to include profile pictures from the employees table
  so that all employee photos from the Employee Directory appear in Enterprise Chat.

  ## Changes Made

  1. **Add profile_picture_url to profiles**
     - Ensures profiles table can store employee profile pictures
     - Maps to profile_picture_url from employees table

  2. **Update Sync Function**
     - Syncs profile_picture_url from employees to profiles
     - Syncs department and role information for better chat experience
     - Updates existing employee records with profile data

  3. **Backfill Existing Employee Pictures**
     - Copies profile pictures from employees to profiles for all existing records
     - Ensures immediate visibility in chat

  4. **Bi-directional Sync**
     - When employee profile picture updates, sync to profiles
     - Ensures chat always shows latest employee photos

  ## Security
  - Uses SECURITY DEFINER for sync operations
  - Maintains existing RLS policies
  - No new security risks introduced
*/

-- Add missing columns to profiles if they don't exist
DO $$
BEGIN
  -- Add department column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department text;
  END IF;

  -- Add role column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text;
  END IF;
END $$;

-- Update the auto_create function to include more employee data
CREATE OR REPLACE FUNCTION auto_create_employee_from_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_id text;
  attempt_count int := 0;
  max_attempts int := 10;
BEGIN
  -- Generate unique employee_id with retry logic
  LOOP
    new_employee_id := 'EMP-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    attempt_count := attempt_count + 1;
    
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = new_employee_id) THEN
      EXIT;
    END IF;
    
    new_employee_id := 'EMP-' || UPPER(SUBSTRING(NEW.id::text, 1, 8)) || '-' || LPAD(attempt_count::text, 2, '0');
    
    IF attempt_count >= max_attempts THEN
      new_employee_id := 'EMP-' || REPLACE(NEW.id::text, '-', '')::text;
      EXIT;
    END IF;
  END LOOP;

  -- Insert employee record with data from the new profile
  INSERT INTO employees (
    user_id,
    employee_id,
    first_name,
    last_name,
    email,
    profile_picture_url,
    start_date,
    status
  ) VALUES (
    NEW.id,
    new_employee_id,
    COALESCE(NEW.first_name, 'Unknown'),
    COALESCE(NEW.last_name, 'User'),
    NEW.email,
    NEW.profile_picture,
    CURRENT_DATE,
    'Active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, employees.first_name),
    last_name = COALESCE(EXCLUDED.last_name, employees.last_name),
    email = EXCLUDED.email,
    profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, employees.profile_picture_url),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync employee data TO profiles (for chat)
CREATE OR REPLACE FUNCTION sync_profile_from_employee_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when employee is updated
  UPDATE profiles
  SET 
    first_name = COALESCE(NEW.first_name, profiles.first_name),
    last_name = COALESCE(NEW.last_name, profiles.last_name),
    profile_picture = COALESCE(NEW.profile_picture_url, profiles.profile_picture),
    department = (SELECT name FROM departments WHERE id = NEW.department_id),
    role = (SELECT title FROM job_titles WHERE id = NEW.job_title_id),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync FROM employees TO profiles
DROP TRIGGER IF EXISTS sync_profile_on_employee_update ON employees;
CREATE TRIGGER sync_profile_on_employee_update
  AFTER UPDATE ON employees
  FOR EACH ROW
  WHEN (OLD.first_name IS DISTINCT FROM NEW.first_name 
    OR OLD.last_name IS DISTINCT FROM NEW.last_name 
    OR OLD.profile_picture_url IS DISTINCT FROM NEW.profile_picture_url
    OR OLD.department_id IS DISTINCT FROM NEW.department_id
    OR OLD.job_title_id IS DISTINCT FROM NEW.job_title_id)
  EXECUTE FUNCTION sync_profile_from_employee_update();

-- Backfill: Copy all employee data to profiles for existing records
DO $$
DECLARE
  employee_record RECORD;
  dept_name text;
  job_title text;
BEGIN
  FOR employee_record IN 
    SELECT 
      e.id,
      e.user_id,
      e.first_name,
      e.last_name,
      e.email,
      e.profile_picture_url,
      e.department_id,
      e.job_title_id,
      d.name as department_name,
      jt.title as job_title_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN job_titles jt ON e.job_title_id = jt.id
    WHERE e.user_id IS NOT NULL
      AND e.status = 'Active'
  LOOP
    -- Update the corresponding profile
    UPDATE profiles
    SET 
      first_name = COALESCE(employee_record.first_name, profiles.first_name),
      last_name = COALESCE(employee_record.last_name, profiles.last_name),
      profile_picture = COALESCE(employee_record.profile_picture_url, profiles.profile_picture),
      department = COALESCE(employee_record.department_name, profiles.department),
      role = COALESCE(employee_record.job_title_name, profiles.role),
      updated_at = now()
    WHERE id = employee_record.user_id
      AND (
        profile_picture IS DISTINCT FROM employee_record.profile_picture_url
        OR department IS DISTINCT FROM employee_record.department_name
        OR role IS DISTINCT FROM employee_record.job_title_name
      );
  END LOOP;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_picture ON profiles(profile_picture) WHERE profile_picture IS NOT NULL;

-- Add comment
COMMENT ON TRIGGER sync_profile_on_employee_update ON employees IS 
'Automatically syncs employee data (names, profile pictures, department, role) to profiles table for Enterprise Chat user discovery';
