/*
  # Fix Profiles Foreign Key and Populate All Employees
  
  1. Changes
    - Drop the foreign key constraint linking profiles.id to auth.users
    - This allows employee records to have profiles without auth accounts
    - Insert all employees as profiles for chat participant selection
    - Maintains data integrity through application logic
  
  2. Security
    - RLS policies still protect data access
    - Only authenticated users can view profiles
*/

-- Drop the foreign key constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_auth_users;

-- Now insert all employees as profiles
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
WHERE e.user_id IS NULL
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
