/*
  # Sync Employees to Profiles - Fixed
  
  1. Changes
    - Sync employee data to profiles table with proper column mapping
    - Join with departments table to get department names
    - Add profile pictures from employee records
    - Create function to automatically sync new employees to profiles
  
  2. Security
    - Maintains existing RLS policies
    - Uses security definer function for safe data sync
*/

-- First, sync all existing employees to profiles with department lookup
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  department,
  role,
  job_title,
  hire_date,
  profile_picture,
  employee_id,
  status
)
SELECT 
  e.user_id,
  e.email,
  e.first_name,
  e.last_name,
  e.phone,
  COALESCE(d.name, 'Unknown') as department,
  e.job_title as role,
  e.job_title,
  e.start_date,
  e.profile_picture_url,
  e.employee_id,
  COALESCE(e.employment_status, e.status::text, 'active')
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.user_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  department = EXCLUDED.department,
  role = EXCLUDED.role,
  job_title = EXCLUDED.job_title,
  hire_date = EXCLUDED.hire_date,
  profile_picture = EXCLUDED.profile_picture,
  employee_id = EXCLUDED.employee_id,
  status = EXCLUDED.status,
  updated_at = now();

-- Create or replace function to sync employee data to profiles
CREATE OR REPLACE FUNCTION sync_employee_to_profile()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  dept_name text;
BEGIN
  -- Get department name if department_id exists
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO dept_name FROM departments WHERE id = NEW.department_id;
  END IF;

  -- Insert or update profile when employee record changes
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    department,
    role,
    job_title,
    hire_date,
    profile_picture,
    employee_id,
    status
  )
  VALUES (
    NEW.user_id,
    NEW.email,
    NEW.first_name,
    NEW.last_name,
    NEW.phone,
    COALESCE(dept_name, 'Unknown'),
    NEW.job_title,
    NEW.job_title,
    NEW.start_date,
    NEW.profile_picture_url,
    NEW.employee_id,
    COALESCE(NEW.employment_status, NEW.status::text, 'active')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    job_title = EXCLUDED.job_title,
    hire_date = EXCLUDED.hire_date,
    profile_picture = EXCLUDED.profile_picture,
    employee_id = EXCLUDED.employee_id,
    status = EXCLUDED.status,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger to sync employees to profiles automatically
DROP TRIGGER IF EXISTS sync_employee_to_profile_trigger ON employees;
CREATE TRIGGER sync_employee_to_profile_trigger
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION sync_employee_to_profile();
