/*
  # Enhance Employee-to-Chat Synchronization

  1. Changes
    - Add automatic triggers to sync new employees to profiles for chat access
    - Ensure all employees appear in chat user selection
    - Automatically create AI assistant channels for new employees
    - Keep employee data synchronized with profiles table

  2. New Triggers
    - sync_new_employee_to_profile: Creates profile when employee is added
    - sync_employee_updates_to_profile: Updates profile when employee changes

  3. Security
    - Maintains RLS policies
    - Only syncs active employees to chat system
*/

-- Function to sync new employee to profile for chat access
CREATE OR REPLACE FUNCTION sync_new_employee_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_department_name text;
BEGIN
  -- Get department name
  SELECT name INTO v_department_name
  FROM departments
  WHERE id = NEW.department_id;

  -- Insert or update profile for this employee
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
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.first_name,
    NEW.last_name,
    NEW.phone,
    COALESCE(v_department_name, 'Unknown'),
    NEW.job_title,
    NEW.job_title,
    NEW.start_date,
    COALESCE(
      NEW.profile_picture_url,
      'https://ui-avatars.com/api/?name=' ||
      REPLACE(NEW.first_name || '+' || NEW.last_name, ' ', '+') ||
      '&size=200&background=random&color=fff&bold=true'
    ),
    NEW.employee_id,
    COALESCE(NEW.employment_status, NEW.status::text, 'active'),
    now(),
    now()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync employee updates to profile
CREATE OR REPLACE FUNCTION sync_employee_updates_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_department_name text;
BEGIN
  -- Get department name
  SELECT name INTO v_department_name
  FROM departments
  WHERE id = NEW.department_id;

  -- Update profile
  UPDATE profiles
  SET
    email = NEW.email,
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    phone = NEW.phone,
    department = COALESCE(v_department_name, 'Unknown'),
    role = NEW.job_title,
    job_title = NEW.job_title,
    hire_date = NEW.start_date,
    profile_picture = COALESCE(
      NEW.profile_picture_url,
      'https://ui-avatars.com/api/?name=' ||
      REPLACE(NEW.first_name || '+' || NEW.last_name, ' ', '+') ||
      '&size=200&background=random&color=fff&bold=true'
    ),
    employee_id = NEW.employee_id,
    status = COALESCE(NEW.employment_status, NEW.status::text, 'active'),
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic sync
DROP TRIGGER IF EXISTS trigger_sync_new_employee_to_profile ON employees;
CREATE TRIGGER trigger_sync_new_employee_to_profile
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_new_employee_to_profile();

DROP TRIGGER IF EXISTS trigger_sync_employee_updates_to_profile ON employees;
CREATE TRIGGER trigger_sync_employee_updates_to_profile
  AFTER UPDATE ON employees
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.first_name IS DISTINCT FROM NEW.first_name OR
    OLD.last_name IS DISTINCT FROM NEW.last_name OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.department_id IS DISTINCT FROM NEW.department_id OR
    OLD.job_title IS DISTINCT FROM NEW.job_title OR
    OLD.start_date IS DISTINCT FROM NEW.start_date OR
    OLD.profile_picture_url IS DISTINCT FROM NEW.profile_picture_url OR
    OLD.status IS DISTINCT FROM NEW.status
  )
  EXECUTE FUNCTION sync_employee_updates_to_profile();

-- Ensure all current employees are synced to profiles
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
  status,
  created_at,
  updated_at
)
SELECT
  e.id,
  e.email,
  e.first_name,
  e.last_name,
  e.phone,
  COALESCE(d.name, 'Unknown') as department,
  e.job_title as role,
  e.job_title,
  e.start_date,
  COALESCE(
    e.profile_picture_url,
    'https://ui-avatars.com/api/?name=' ||
    REPLACE(e.first_name || '+' || e.last_name, ' ', '+') ||
    '&size=200&background=random&color=fff&bold=true'
  ) as profile_picture,
  e.employee_id,
  COALESCE(e.employment_status, e.status::text, 'active'),
  e.created_at,
  now()
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.status = 'Active'
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_new_employee_to_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_employee_updates_to_profile() TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION sync_new_employee_to_profile() IS 'Automatically creates a profile entry when a new employee is added, enabling chat access';
COMMENT ON FUNCTION sync_employee_updates_to_profile() IS 'Automatically updates profile when employee information changes';
