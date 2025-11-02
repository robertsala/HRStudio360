/*
  # Add Sample Employees for Testing

  1. Overview
    - Creates sample departments, job titles, and employees for testing
    - Includes CEO, managers, and staff across different departments
    - Does not require auth.users - creates standalone employee records

  2. New Data
    - 3 Departments: Executive, Engineering, HR
    - 5 Job Titles: CEO, CTO, HR Director, Software Engineer, HR Manager
    - 10 Sample employees with varying roles

  3. Security
    - Uses existing RLS policies
    - Employee records can be managed by authenticated users
*/

-- Insert sample departments
INSERT INTO departments (id, name, description) VALUES
  (gen_random_uuid(), 'Executive', 'Executive leadership team'),
  (gen_random_uuid(), 'Engineering', 'Software engineering and development'),
  (gen_random_uuid(), 'Human Resources', 'HR and people operations')
ON CONFLICT (name) DO NOTHING;

-- Get department IDs for reference
DO $$
DECLARE
  dept_exec_id uuid;
  dept_eng_id uuid;
  dept_hr_id uuid;
  job_ceo_id uuid;
  job_cto_id uuid;
  job_hr_dir_id uuid;
  job_eng_id uuid;
  job_hr_mgr_id uuid;
  emp1_id uuid;
  emp2_id uuid;
  emp3_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO dept_exec_id FROM departments WHERE name = 'Executive';
  SELECT id INTO dept_eng_id FROM departments WHERE name = 'Engineering';
  SELECT id INTO dept_hr_id FROM departments WHERE name = 'Human Resources';

  -- Insert job titles
  INSERT INTO job_titles (id, title, department_id, description) VALUES
    (gen_random_uuid(), 'Chief Executive Officer', dept_exec_id, 'Company CEO'),
    (gen_random_uuid(), 'Chief Technology Officer', dept_eng_id, 'Head of Engineering'),
    (gen_random_uuid(), 'HR Director', dept_hr_id, 'Head of Human Resources'),
    (gen_random_uuid(), 'Software Engineer', dept_eng_id, 'Software developer'),
    (gen_random_uuid(), 'HR Manager', dept_hr_id, 'HR team manager')
  ON CONFLICT DO NOTHING;

  -- Get job title IDs
  SELECT id INTO job_ceo_id FROM job_titles WHERE title = 'Chief Executive Officer';
  SELECT id INTO job_cto_id FROM job_titles WHERE title = 'Chief Technology Officer';
  SELECT id INTO job_hr_dir_id FROM job_titles WHERE title = 'HR Director';
  SELECT id INTO job_eng_id FROM job_titles WHERE title = 'Software Engineer';
  SELECT id INTO job_hr_mgr_id FROM job_titles WHERE title = 'HR Manager';

  -- Insert sample employees (without user_id for now)
  INSERT INTO employees (id, employee_id, department_id, job_title_id, manager_id, start_date, employment_type, salary, status, first_name, last_name, email) VALUES
    (gen_random_uuid(), 'EMP001', dept_exec_id, job_ceo_id, NULL, '2020-01-01', 'Full-time', 350000, 'Active', 'Sarah', 'Johnson', 'sarah.johnson@company.com'),
    (gen_random_uuid(), 'EMP002', dept_eng_id, job_cto_id, (SELECT id FROM employees WHERE employee_id = 'EMP001'), '2020-02-01', 'Full-time', 280000, 'Active', 'Michael', 'Chen', 'michael.chen@company.com'),
    (gen_random_uuid(), 'EMP003', dept_hr_id, job_hr_dir_id, (SELECT id FROM employees WHERE employee_id = 'EMP001'), '2020-03-01', 'Full-time', 220000, 'Active', 'Emily', 'Rodriguez', 'emily.rodriguez@company.com'),
    (gen_random_uuid(), 'EMP004', dept_eng_id, job_eng_id, (SELECT id FROM employees WHERE employee_id = 'EMP002'), '2021-01-15', 'Full-time', 120000, 'Active', 'James', 'Kim', 'james.kim@company.com'),
    (gen_random_uuid(), 'EMP005', dept_eng_id, job_eng_id, (SELECT id FROM employees WHERE employee_id = 'EMP002'), '2021-02-01', 'Full-time', 115000, 'Active', 'Lisa', 'Wang', 'lisa.wang@company.com'),
    (gen_random_uuid(), 'EMP006', dept_eng_id, job_eng_id, (SELECT id FROM employees WHERE employee_id = 'EMP002'), '2021-03-15', 'Full-time', 110000, 'Active', 'David', 'Martinez', 'david.martinez@company.com'),
    (gen_random_uuid(), 'EMP007', dept_hr_id, job_hr_mgr_id, (SELECT id FROM employees WHERE employee_id = 'EMP003'), '2021-04-01', 'Full-time', 95000, 'Active', 'Jennifer', 'Williams', 'jennifer.williams@company.com'),
    (gen_random_uuid(), 'EMP008', dept_hr_id, job_hr_mgr_id, (SELECT id FROM employees WHERE employee_id = 'EMP003'), '2021-05-01', 'Full-time', 92000, 'Active', 'Robert', 'Taylor', 'robert.taylor@company.com'),
    (gen_random_uuid(), 'EMP009', dept_eng_id, job_eng_id, (SELECT id FROM employees WHERE employee_id = 'EMP002'), '2022-01-10', 'Full-time', 105000, 'Active', 'Amanda', 'Brown', 'amanda.brown@company.com'),
    (gen_random_uuid(), 'EMP010', dept_eng_id, job_eng_id, (SELECT id FROM employees WHERE employee_id = 'EMP002'), '2022-02-15', 'Full-time', 108000, 'Active', 'Daniel', 'Lee', 'daniel.lee@company.com')
  ON CONFLICT (employee_id) DO NOTHING;

END $$;
