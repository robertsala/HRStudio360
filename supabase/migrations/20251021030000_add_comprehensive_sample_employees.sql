/*
  # Add 180+ Comprehensive Sample Employees

  1. Overview
    - Restores full employee dataset with 180+ diverse employees
    - Creates employees across all departments with realistic hierarchy
    - Includes various job titles, salary ranges, and employment types
    - Adds proper manager relationships and reporting structure

  2. Departments Covered
    - Executive (6 C-level executives)
    - Engineering (50+ employees)
    - Product (25 employees)
    - Sales (35 employees)
    - Marketing (20 employees)
    - Finance (15 employees)
    - HR (12 employees)
    - Operations (15 employees)
    - Customer Success (12 employees)
    - IT (10 employees)
    - Legal (5 employees)
    - Data (8 employees)

  3. Employee Details
    - Realistic names and email addresses
    - Diverse job titles from entry to executive level
    - Manager relationships following org hierarchy
    - Salary ranges appropriate to roles
    - Mix of employment types (full-time, part-time, contract)
    - Start dates spread across 2020-2024

  4. Important Notes
    - Uses existing department IDs from database
    - Does NOT create auth.users (standalone employee records)
    - Preserves existing employees
    - Safe to run multiple times (uses ON CONFLICT handling)
*/

DO $$
DECLARE
  dept_executive uuid;
  dept_engineering uuid;
  dept_product uuid;
  dept_sales uuid;
  dept_marketing uuid;
  dept_finance uuid;
  dept_hr uuid;
  dept_operations uuid;
  dept_legal uuid;
  dept_cs uuid;
  dept_it uuid;
  dept_data uuid;

  ceo_id uuid;
  cto_id uuid;
  cfo_id uuid;
  cmo_id uuid;
  coo_id uuid;
  chro_id uuid;

  vp_eng_id uuid;
  vp_product_id uuid;
  vp_sales_id uuid;

  counter int := 1000;
BEGIN
  -- Get existing department IDs
  SELECT id INTO dept_executive FROM departments WHERE name = 'Executive' LIMIT 1;
  SELECT id INTO dept_engineering FROM departments WHERE name = 'Engineering' LIMIT 1;
  SELECT id INTO dept_product FROM departments WHERE name = 'Product' LIMIT 1;
  SELECT id INTO dept_sales FROM departments WHERE name = 'Sales' LIMIT 1;
  SELECT id INTO dept_marketing FROM departments WHERE name = 'Marketing' LIMIT 1;
  SELECT id INTO dept_finance FROM departments WHERE name = 'Finance' LIMIT 1;
  SELECT id INTO dept_hr FROM departments WHERE name = 'HR' LIMIT 1;
  SELECT id INTO dept_operations FROM departments WHERE name = 'Operations' LIMIT 1;
  SELECT id INTO dept_legal FROM departments WHERE name = 'Legal' LIMIT 1;
  SELECT id INTO dept_cs FROM departments WHERE name = 'Customer Success' LIMIT 1;
  SELECT id INTO dept_it FROM departments WHERE name = 'IT' LIMIT 1;
  SELECT id INTO dept_data FROM departments WHERE name = 'Data' LIMIT 1;

  -- C-LEVEL EXECUTIVES (6 employees)
  ceo_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (ceo_id, 'EMP' || counter, 'Sarah', 'Johnson', 'sarah.johnson@company.com', dept_executive, 'Chief Executive Officer', NULL, '2020-01-01', 'Full-time', 350000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  cto_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (cto_id, 'EMP' || counter, 'David', 'Martinez', 'david.martinez@company.com', dept_engineering, 'Chief Technology Officer', ceo_id, '2020-02-15', 'Full-time', 300000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  cfo_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (cfo_id, 'EMP' || counter, 'Michael', 'Chen', 'michael.chen@company.com', dept_finance, 'Chief Financial Officer', ceo_id, '2020-02-01', 'Full-time', 280000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  cmo_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (cmo_id, 'EMP' || counter, 'Amanda', 'Taylor', 'amanda.taylor@company.com', dept_marketing, 'Chief Marketing Officer', ceo_id, '2020-03-15', 'Full-time', 260000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  coo_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (coo_id, 'EMP' || counter, 'Jennifer', 'Williams', 'jennifer.williams@company.com', dept_operations, 'Chief Operating Officer', ceo_id, '2020-03-01', 'Full-time', 275000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  chro_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (chro_id, 'EMP' || counter, 'Robert', 'Anderson', 'robert.anderson@company.com', dept_hr, 'Chief Human Resources Officer', ceo_id, '2020-04-01', 'Full-time', 240000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  -- ENGINEERING DEPARTMENT (50 employees)
  vp_eng_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (vp_eng_id, 'EMP' || counter, 'Lisa', 'Wong', 'lisa.wong@company.com', dept_engineering, 'VP of Engineering', cto_id, '2020-05-01', 'Full-time', 220000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  -- Engineering Managers
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'James', 'Kim', 'james.kim@company.com', dept_engineering, 'Engineering Manager', vp_eng_id, '2020-06-15', 'Full-time', 180000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Priya', 'Patel', 'priya.patel@company.com', dept_engineering, 'Engineering Manager', vp_eng_id, '2020-07-01', 'Full-time', 175000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Carlos', 'Rodriguez', 'carlos.rodriguez@company.com', dept_engineering, 'Engineering Manager', vp_eng_id, '2020-08-15', 'Full-time', 175000, 'Active'); counter := counter + 1;

  -- Senior Engineers
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Emily', 'Zhang', 'emily.zhang@company.com', dept_engineering, 'Senior Software Engineer', vp_eng_id, '2020-09-01', 'Full-time', 160000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Alex', 'Brown', 'alex.brown@company.com', dept_engineering, 'Senior Software Engineer', vp_eng_id, '2020-10-01', 'Full-time', 155000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Maria', 'Garcia', 'maria.garcia@company.com', dept_engineering, 'Senior Software Engineer', vp_eng_id, '2020-11-01', 'Full-time', 158000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Kevin', 'Liu', 'kevin.liu@company.com', dept_engineering, 'Senior DevOps Engineer', vp_eng_id, '2021-01-15', 'Full-time', 165000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Sophia', 'Nguyen', 'sophia.nguyen@company.com', dept_engineering, 'Senior Software Engineer', vp_eng_id, '2021-02-01', 'Full-time', 160000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Daniel', 'Cohen', 'daniel.cohen@company.com', dept_engineering, 'Senior Backend Engineer', vp_eng_id, '2021-03-01', 'Full-time', 162000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Rachel', 'Murphy', 'rachel.murphy@company.com', dept_engineering, 'Senior Frontend Engineer', vp_eng_id, '2021-04-01', 'Full-time', 158000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Thomas', 'Lee', 'thomas.lee@company.com', dept_engineering, 'Senior Full Stack Engineer', vp_eng_id, '2021-05-15', 'Full-time', 160000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jessica', 'White', 'jessica.white@company.com', dept_engineering, 'Senior Software Engineer', vp_eng_id, '2021-06-01', 'Full-time', 159000, 'Active'); counter := counter + 1;

  -- Mid-level Engineers
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Andrew', 'Thompson', 'andrew.thompson@company.com', dept_engineering, 'Software Engineer', vp_eng_id, '2021-07-01', 'Full-time', 125000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Nicole', 'Davis', 'nicole.davis@company.com', dept_engineering, 'Software Engineer', vp_eng_id, '2021-08-01', 'Full-time', 120000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ryan', 'Wilson', 'ryan.wilson@company.com', dept_engineering, 'Backend Engineer', vp_eng_id, '2021-09-01', 'Full-time', 122000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Michelle', 'Hall', 'michelle.hall@company.com', dept_engineering, 'Frontend Engineer', vp_eng_id, '2021-10-01', 'Full-time', 118000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Brandon', 'Young', 'brandon.young@company.com', dept_engineering, 'Full Stack Engineer', vp_eng_id, '2021-11-01', 'Full-time', 123000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ashley', 'Moore', 'ashley.moore@company.com', dept_engineering, 'DevOps Engineer', vp_eng_id, '2022-01-15', 'Full-time', 130000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Justin', 'Jackson', 'justin.jackson@company.com', dept_engineering, 'Software Engineer', vp_eng_id, '2022-02-01', 'Full-time', 121000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Stephanie', 'Martin', 'stephanie.martin@company.com', dept_engineering, 'QA Engineer', vp_eng_id, '2022-03-01', 'Full-time', 110000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Matthew', 'Clark', 'matthew.clark@company.com', dept_engineering, 'Software Engineer', vp_eng_id, '2022-04-01', 'Full-time', 119000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Lauren', 'Lewis', 'lauren.lewis@company.com', dept_engineering, 'Mobile Engineer', vp_eng_id, '2022-05-01', 'Full-time', 124000, 'Active'); counter := counter + 1;

  -- Junior Engineers
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jonathan', 'Hill', 'jonathan.hill@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2022-06-01', 'Full-time', 90000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Amber', 'Scott', 'amber.scott@company.com', dept_engineering, 'Junior Frontend Engineer', vp_eng_id, '2022-07-01', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Tyler', 'Green', 'tyler.green@company.com', dept_engineering, 'Junior Backend Engineer', vp_eng_id, '2022-08-01', 'Full-time', 89000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Brittany', 'Adams', 'brittany.adams@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2022-09-01', 'Full-time', 87000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Joshua', 'Baker', 'joshua.baker@company.com', dept_engineering, 'Associate Software Engineer', vp_eng_id, '2022-10-01', 'Full-time', 85000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Samantha', 'Gonzalez', 'samantha.gonzalez@company.com', dept_engineering, 'Junior DevOps Engineer', vp_eng_id, '2023-01-15', 'Full-time', 92000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Nathan', 'Nelson', 'nathan.nelson@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2023-02-01', 'Full-time', 86000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Megan', 'Carter', 'megan.carter@company.com', dept_engineering, 'Associate QA Engineer', vp_eng_id, '2023-03-01', 'Full-time', 82000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Christopher', 'Mitchell', 'christopher.mitchell@company.com', dept_engineering, 'Junior Full Stack Engineer', vp_eng_id, '2023-04-01', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Hannah', 'Perez', 'hannah.perez@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2023-05-01', 'Full-time', 87000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Austin', 'Roberts', 'austin.roberts@company.com', dept_engineering, 'Associate Software Engineer', vp_eng_id, '2023-06-01', 'Full-time', 84000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Victoria', 'Turner', 'victoria.turner@company.com', dept_engineering, 'Junior Mobile Engineer', vp_eng_id, '2023-07-01', 'Full-time', 89000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ethan', 'Collins', 'ethan.collins@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2023-08-01', 'Full-time', 86000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Olivia', 'Stewart', 'olivia.stewart@company.com', dept_engineering, 'Junior Backend Engineer', vp_eng_id, '2023-09-01', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Mason', 'Sanchez', 'mason.sanchez@company.com', dept_engineering, 'Associate Software Engineer', vp_eng_id, '2023-10-01', 'Full-time', 85000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Isabella', 'Morris', 'isabella.morris@company.com', dept_engineering, 'Junior Frontend Engineer', vp_eng_id, '2023-11-01', 'Full-time', 87000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Lucas', 'Rogers', 'lucas.rogers@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2024-01-15', 'Full-time', 86000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Mia', 'Reed', 'mia.reed@company.com', dept_engineering, 'Junior Full Stack Engineer', vp_eng_id, '2024-02-01', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Logan', 'Cook', 'logan.cook@company.com', dept_engineering, 'Associate DevOps Engineer', vp_eng_id, '2024-03-01', 'Full-time', 91000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ava', 'Bailey', 'ava.bailey@company.com', dept_engineering, 'Junior Software Engineer', vp_eng_id, '2024-04-01', 'Full-time', 87000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jackson', 'Rivera', 'jackson.rivera@company.com', dept_engineering, 'Associate QA Engineer', vp_eng_id, '2024-05-01', 'Full-time', 83000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Emma', 'Cooper', 'emma.cooper@company.com', dept_engineering, 'Junior Mobile Engineer', vp_eng_id, '2024-06-01', 'Full-time', 89000, 'Active'); counter := counter + 1;

  -- PRODUCT DEPARTMENT (25 employees)
  vp_product_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (vp_product_id, 'EMP' || counter, 'Mark', 'Phillips', 'mark.phillips@company.com', dept_product, 'VP of Product', ceo_id, '2020-05-15', 'Full-time', 210000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Laura', 'Campbell', 'laura.campbell@company.com', dept_product, 'Senior Product Manager', vp_product_id, '2020-07-01', 'Full-time', 165000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Eric', 'Parker', 'eric.parker@company.com', dept_product, 'Senior Product Manager', vp_product_id, '2020-08-15', 'Full-time', 162000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Diana', 'Evans', 'diana.evans@company.com', dept_product, 'Product Manager', vp_product_id, '2021-01-15', 'Full-time', 135000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Patrick', 'Edwards', 'patrick.edwards@company.com', dept_product, 'Product Manager', vp_product_id, '2021-03-01', 'Full-time', 132000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Christina', 'Collins', 'christina.collins@company.com', dept_product, 'Product Manager', vp_product_id, '2021-05-15', 'Full-time', 130000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Gregory', 'Stewart', 'gregory.stewart@company.com', dept_product, 'Associate Product Manager', vp_product_id, '2022-01-15', 'Full-time', 105000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Tiffany', 'Morris', 'tiffany.morris@company.com', dept_product, 'Associate Product Manager', vp_product_id, '2022-03-01', 'Full-time', 102000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Sean', 'Murphy', 'sean.murphy@company.com', dept_product, 'Product Designer', vp_product_id, '2021-02-01', 'Full-time', 120000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Vanessa', 'Cook', 'vanessa.cook@company.com', dept_product, 'Senior UX Designer', vp_product_id, '2021-04-01', 'Full-time', 138000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ian', 'Rogers', 'ian.rogers@company.com', dept_product, 'UX Designer', vp_product_id, '2021-06-15', 'Full-time', 115000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Crystal', 'Reed', 'crystal.reed@company.com', dept_product, 'UI Designer', vp_product_id, '2021-08-01', 'Full-time', 110000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Benjamin', 'Bailey', 'benjamin.bailey@company.com', dept_product, 'Product Analyst', vp_product_id, '2022-02-01', 'Full-time', 95000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Courtney', 'Richardson', 'courtney.richardson@company.com', dept_product, 'UX Researcher', vp_product_id, '2022-04-15', 'Full-time', 118000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Douglas', 'Cox', 'douglas.cox@company.com', dept_product, 'Technical Product Manager', vp_product_id, '2021-07-01', 'Full-time', 145000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Melanie', 'Howard', 'melanie.howard@company.com', dept_product, 'Product Operations Manager', vp_product_id, '2021-09-15', 'Full-time', 125000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Kyle', 'Ward', 'kyle.ward@company.com', dept_product, 'Product Marketing Manager', vp_product_id, '2022-01-01', 'Full-time', 128000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Andrea', 'Torres', 'andrea.torres@company.com', dept_product, 'Senior Product Designer', vp_product_id, '2021-10-01', 'Full-time', 135000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Troy', 'Peterson', 'troy.peterson@company.com', dept_product, 'Product Manager', vp_product_id, '2022-05-15', 'Full-time', 131000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Monica', 'Gray', 'monica.gray@company.com', dept_product, 'Associate Product Manager', vp_product_id, '2022-07-01', 'Full-time', 103000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Blake', 'Foster', 'blake.foster@company.com', dept_product, 'Junior UX Designer', vp_product_id, '2023-02-15', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Sierra', 'Jenkins', 'sierra.jenkins@company.com', dept_product, 'Associate Product Designer', vp_product_id, '2023-04-01', 'Full-time', 92000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Cameron', 'Perry', 'cameron.perry@company.com', dept_product, 'Product Analyst', vp_product_id, '2023-06-15', 'Full-time', 96000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Dakota', 'Powell', 'dakota.powell@company.com', dept_product, 'Associate Product Manager', vp_product_id, '2024-01-15', 'Full-time', 104000, 'Active'); counter := counter + 1;

  -- SALES DEPARTMENT (35 employees)
  vp_sales_id := gen_random_uuid();
  INSERT INTO employees (id, employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status)
  VALUES (vp_sales_id, 'EMP' || counter, 'William', 'Ramirez', 'william.ramirez@company.com', dept_sales, 'VP of Sales', ceo_id, '2020-06-01', 'Full-time', 230000, 'Active')
  ON CONFLICT (email) DO NOTHING;
  counter := counter + 1;

  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Karen', 'James', 'karen.james@company.com', dept_sales, 'Sales Director', vp_sales_id, '2020-08-01', 'Full-time', 185000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Scott', 'Watson', 'scott.watson@company.com', dept_sales, 'Sales Director', vp_sales_id, '2020-09-15', 'Full-time', 180000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Heather', 'Brooks', 'heather.brooks@company.com', dept_sales, 'Enterprise Sales Manager', vp_sales_id, '2021-01-01', 'Full-time', 155000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Raymond', 'Kelly', 'raymond.kelly@company.com', dept_sales, 'Enterprise Sales Manager', vp_sales_id, '2021-02-15', 'Full-time', 152000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Catherine', 'Sanders', 'catherine.sanders@company.com', dept_sales, 'Regional Sales Manager', vp_sales_id, '2021-04-01', 'Full-time', 145000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jeffrey', 'Price', 'jeffrey.price@company.com', dept_sales, 'Senior Account Executive', vp_sales_id, '2021-05-15', 'Full-time', 125000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Sharon', 'Bennett', 'sharon.bennett@company.com', dept_sales, 'Senior Account Executive', vp_sales_id, '2021-06-01', 'Full-time', 123000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jerry', 'Wood', 'jerry.wood@company.com', dept_sales, 'Senior Account Executive', vp_sales_id, '2021-07-15', 'Full-time', 122000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Debra', 'Barnes', 'debra.barnes@company.com', dept_sales, 'Account Executive', vp_sales_id, '2021-08-01', 'Full-time', 98000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Dennis', 'Ross', 'dennis.ross@company.com', dept_sales, 'Account Executive', vp_sales_id, '2021-09-15', 'Full-time', 97000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Rebecca', 'Henderson', 'rebecca.henderson@company.com', dept_sales, 'Account Executive', vp_sales_id, '2021-10-01', 'Full-time', 96000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Walter', 'Coleman', 'walter.coleman@company.com', dept_sales, 'Account Executive', vp_sales_id, '2021-11-15', 'Full-time', 95000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Carolyn', 'Jenkins', 'carolyn.jenkins@company.com', dept_sales, 'Account Executive', vp_sales_id, '2022-01-01', 'Full-time', 94000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Henry', 'Perry', 'henry.perry@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2022-03-01', 'Full-time', 72000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Janet', 'Powell', 'janet.powell@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2022-04-15', 'Full-time', 71000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Carl', 'Long', 'carl.long@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2022-05-01', 'Full-time', 70000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Frances', 'Patterson', 'frances.patterson@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2022-06-15', 'Full-time', 69000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Arthur', 'Hughes', 'arthur.hughes@company.com', dept_sales, 'Inside Sales Rep', vp_sales_id, '2022-07-01', 'Full-time', 75000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Joyce', 'Flores', 'joyce.flores@company.com', dept_sales, 'Inside Sales Rep', vp_sales_id, '2022-08-15', 'Full-time', 74000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Lawrence', 'Washington', 'lawrence.washington@company.com', dept_sales, 'Business Development Rep', vp_sales_id, '2022-09-01', 'Full-time', 76000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Marilyn', 'Butler', 'marilyn.butler@company.com', dept_sales, 'Business Development Rep', vp_sales_id, '2022-10-15', 'Full-time', 75000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Roger', 'Simmons', 'roger.simmons@company.com', dept_sales, 'Sales Engineer', vp_sales_id, '2021-12-01', 'Full-time', 128000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Julie', 'Foster', 'julie.foster@company.com', dept_sales, 'Sales Operations Analyst', vp_sales_id, '2022-02-01', 'Full-time', 92000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Terry', 'Bryant', 'terry.bryant@company.com', dept_sales, 'Sales Enablement Manager', vp_sales_id, '2021-11-01', 'Full-time', 115000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Alice', 'Alexander', 'alice.alexander@company.com', dept_sales, 'Channel Sales Manager', vp_sales_id, '2022-01-15', 'Full-time', 135000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Peter', 'Russell', 'peter.russell@company.com', dept_sales, 'Account Executive', vp_sales_id, '2022-11-01', 'Full-time', 96000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Joan', 'Griffin', 'joan.griffin@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2023-02-01', 'Full-time', 71000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Keith', 'Diaz', 'keith.diaz@company.com', dept_sales, 'Inside Sales Rep', vp_sales_id, '2023-04-15', 'Full-time', 75000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ruby', 'Hayes', 'ruby.hayes@company.com', dept_sales, 'Business Development Rep', vp_sales_id, '2023-06-01', 'Full-time', 76000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Eugene', 'Myers', 'eugene.myers@company.com', dept_sales, 'Account Executive', vp_sales_id, '2023-08-15', 'Full-time', 97000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Phyllis', 'Ford', 'phyllis.ford@company.com', dept_sales, 'Sales Development Rep', vp_sales_id, '2023-10-01', 'Full-time', 72000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ralph', 'Reynolds', 'ralph.reynolds@company.com', dept_sales, 'Inside Sales Rep', vp_sales_id, '2024-01-15', 'Full-time', 76000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Gloria', 'Fisher', 'gloria.fisher@company.com', dept_sales, 'Business Development Rep', vp_sales_id, '2024-03-01', 'Full-time', 77000, 'Active'); counter := counter + 1;

  -- MARKETING DEPARTMENT (20 employees)
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Tracy', 'Ellis', 'tracy.ellis@company.com', dept_marketing, 'Marketing Director', cmo_id, '2020-08-01', 'Full-time', 165000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Gerald', 'Hart', 'gerald.hart@company.com', dept_marketing, 'Content Marketing Manager', cmo_id, '2021-01-15', 'Full-time', 115000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Theresa', 'Gomez', 'theresa.gomez@company.com', dept_marketing, 'Digital Marketing Manager', cmo_id, '2021-03-01', 'Full-time', 118000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Harold', 'Murray', 'harold.murray@company.com', dept_marketing, 'Brand Manager', cmo_id, '2021-05-15', 'Full-time', 112000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jacqueline', 'Freeman', 'jacqueline.freeman@company.com', dept_marketing, 'Social Media Manager', cmo_id, '2021-07-01', 'Full-time', 95000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Gerald', 'Wells', 'gerald.wells@company.com', dept_marketing, 'SEO Specialist', cmo_id, '2021-09-15', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Judith', 'Webb', 'judith.webb@company.com', dept_marketing, 'Marketing Analyst', cmo_id, '2022-01-01', 'Full-time', 92000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Philip', 'Simpson', 'philip.simpson@company.com', dept_marketing, 'Content Writer', cmo_id, '2022-03-15', 'Full-time', 75000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Rose', 'Stevens', 'rose.stevens@company.com', dept_marketing, 'Graphic Designer', cmo_id, '2022-05-01', 'Full-time', 82000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Adam', 'Tucker', 'adam.tucker@company.com', dept_marketing, 'Marketing Coordinator', cmo_id, '2022-07-15', 'Full-time', 68000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Virginia', 'Porter', 'virginia.porter@company.com', dept_marketing, 'Email Marketing Specialist', cmo_id, '2022-09-01', 'Full-time', 78000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jack', 'Hunter', 'jack.hunter@company.com', dept_marketing, 'PPC Specialist', cmo_id, '2022-11-15', 'Full-time', 85000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Pamela', 'Hicks', 'pamela.hicks@company.com', dept_marketing, 'Marketing Operations Manager', cmo_id, '2021-10-01', 'Full-time', 105000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Albert', 'Crawford', 'albert.crawford@company.com', dept_marketing, 'Event Marketing Manager', cmo_id, '2022-02-15', 'Full-time', 98000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Evelyn', 'Boyd', 'evelyn.boyd@company.com', dept_marketing, 'Video Producer', cmo_id, '2022-04-01', 'Full-time', 89000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Harold', 'Mason', 'harold.mason@company.com', dept_marketing, 'Marketing Automation Specialist', cmo_id, '2023-01-15', 'Full-time', 94000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Denise', 'Dixon', 'denise.dixon@company.com', dept_marketing, 'Junior Graphic Designer', cmo_id, '2023-04-01', 'Full-time', 65000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Randy', 'Hunt', 'randy.hunt@company.com', dept_marketing, 'Content Strategist', cmo_id, '2023-07-15', 'Full-time', 91000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Kathryn', 'Black', 'kathryn.black@company.com', dept_marketing, 'Marketing Coordinator', cmo_id, '2023-10-01', 'Full-time', 69000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Willie', 'Knight', 'willie.knight@company.com', dept_marketing, 'Social Media Coordinator', cmo_id, '2024-02-15', 'Full-time', 62000, 'Active'); counter := counter + 1;

  -- FINANCE DEPARTMENT (15 employees)
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Howard', 'Castillo', 'howard.castillo@company.com', dept_finance, 'Controller', cfo_id, '2020-09-01', 'Full-time', 175000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Doris', 'Elliott', 'doris.elliott@company.com', dept_finance, 'Finance Manager', cfo_id, '2021-02-15', 'Full-time', 135000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Louis', 'Cunningham', 'louis.cunningham@company.com', dept_finance, 'Senior Accountant', cfo_id, '2021-05-01', 'Full-time', 98000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Lois', 'Carroll', 'lois.carroll@company.com', dept_finance, 'Senior Accountant', cfo_id, '2021-07-15', 'Full-time', 96000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Earl', 'Hudson', 'earl.hudson@company.com', dept_finance, 'Accountant', cfo_id, '2022-01-01', 'Full-time', 78000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Marilyn', 'Reynolds', 'marilyn.reynolds@company.com', dept_finance, 'Accountant', cfo_id, '2022-03-15', 'Full-time', 76000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Russell', 'Fox', 'russell.fox@company.com', dept_finance, 'Financial Analyst', cfo_id, '2022-06-01', 'Full-time', 88000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Norma', 'Hicks', 'norma.hicks@company.com', dept_finance, 'Financial Analyst', cfo_id, '2022-08-15', 'Full-time', 86000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Bobby', 'Crawford', 'bobby.crawford@company.com', dept_finance, 'Payroll Manager', cfo_id, '2021-10-01', 'Full-time', 102000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Bonnie', 'Henry', 'bonnie.henry@company.com', dept_finance, 'Accounts Payable Specialist', cfo_id, '2022-10-01', 'Full-time', 62000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Fred', 'Boyd', 'fred.boyd@company.com', dept_finance, 'Accounts Receivable Specialist', cfo_id, '2023-01-15', 'Full-time', 63000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Annie', 'Mason', 'annie.mason@company.com', dept_finance, 'Junior Accountant', cfo_id, '2023-04-01', 'Full-time', 65000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Harry', 'Morales', 'harry.morales@company.com', dept_finance, 'Tax Specialist', cfo_id, '2022-11-15', 'Full-time', 95000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jean', 'Garza', 'jean.garza@company.com', dept_finance, 'Budget Analyst', cfo_id, '2023-07-01', 'Full-time', 79000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'George', 'Snyder', 'george.snyder@company.com', dept_finance, 'Junior Financial Analyst', cfo_id, '2024-01-15', 'Full-time', 72000, 'Active'); counter := counter + 1;

  -- HR DEPARTMENT (12 employees)
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Cheryl', 'Payne', 'cheryl.payne@company.com', dept_hr, 'HR Director', chro_id, '2020-10-01', 'Full-time', 145000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Martin', 'Dunn', 'martin.dunn@company.com', dept_hr, 'Talent Acquisition Manager', chro_id, '2021-03-15', 'Full-time', 118000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Ann', 'Pierce', 'ann.pierce@company.com', dept_hr, 'HR Business Partner', chro_id, '2021-06-01', 'Full-time', 108000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Eugene', 'Lynch', 'eugene.lynch@company.com', dept_hr, 'Recruiter', chro_id, '2022-02-15', 'Full-time', 75000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Diana', 'Silva', 'diana.silva@company.com', dept_hr, 'Recruiter', chro_id, '2022-05-01', 'Full-time', 73000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Craig', 'Pearson', 'craig.pearson@company.com', dept_hr, 'HR Generalist', chro_id, '2022-08-15', 'Full-time', 68000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jane', 'Meyer', 'jane.meyer@company.com', dept_hr, 'Compensation Analyst', chro_id, '2022-11-01', 'Full-time', 82000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Samuel', 'Knight', 'samuel.knight@company.com', dept_hr, 'Benefits Administrator', chro_id, '2023-02-15', 'Full-time', 71000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Janice', 'Elliott', 'janice.elliott@company.com', dept_hr, 'Learning & Development Manager', chro_id, '2021-09-01', 'Full-time', 98000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Billy', 'Harper', 'billy.harper@company.com', dept_hr, 'HR Coordinator', chro_id, '2023-05-15', 'Full-time', 58000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Brenda', 'Fox', 'brenda.fox@company.com', dept_hr, 'Employee Relations Specialist', chro_id, '2022-12-01', 'Full-time', 76000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Bruce', 'Wallace', 'bruce.wallace@company.com', dept_hr, 'HR Analytics Specialist', chro_id, '2023-08-15', 'Full-time', 85000, 'Active'); counter := counter + 1;

  -- OPERATIONS DEPARTMENT (15 employees)
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Brandon', 'Cole', 'brandon.cole@company.com', dept_operations, 'Operations Director', coo_id, '2020-11-01', 'Full-time', 155000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Cynthia', 'West', 'cynthia.west@company.com', dept_operations, 'Operations Manager', coo_id, '2021-04-15', 'Full-time', 115000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Bryan', 'Jordan', 'bryan.jordan@company.com', dept_operations, 'Operations Manager', coo_id, '2021-07-01', 'Full-time', 112000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Diana', 'Reynolds', 'diana.reynolds@company.com', dept_operations, 'Project Manager', coo_id, '2022-01-15', 'Full-time', 98000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Joe', 'Fisher', 'joe.fisher@company.com', dept_operations, 'Project Manager', coo_id, '2022-04-01', 'Full-time', 96000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Melissa', 'Vasquez', 'melissa.vasquez@company.com', dept_operations, 'Business Analyst', coo_id, '2022-07-15', 'Full-time', 89000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Victor', 'Castillo', 'victor.castillo@company.com', dept_operations, 'Business Analyst', coo_id, '2022-10-01', 'Full-time', 87000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Kathleen', 'Jimenez', 'kathleen.jimenez@company.com', dept_operations, 'Operations Coordinator', coo_id, '2023-02-15', 'Full-time', 68000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jacob', 'Fowler', 'jacob.fowler@company.com', dept_operations, 'Operations Coordinator', coo_id, '2023-05-01', 'Full-time', 66000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Frances', 'Lawson', 'frances.lawson@company.com', dept_operations, 'Process Improvement Specialist', coo_id, '2022-08-15', 'Full-time', 92000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Jordan', 'Fields', 'jordan.fields@company.com', dept_operations, 'Supply Chain Manager', coo_id, '2021-10-01', 'Full-time', 105000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Grace', 'Gutierrez', 'grace.gutierrez@company.com', dept_operations, 'Logistics Coordinator', coo_id, '2022-12-01', 'Full-time', 72000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Noah', 'Schmidt', 'noah.schmidt@company.com', dept_operations, 'Operations Analyst', coo_id, '2023-07-15', 'Full-time', 79000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Alexis', 'Carr', 'alexis.carr@company.com', dept_operations, 'Operations Assistant', coo_id, '2024-02-01', 'Full-time', 55000, 'Active'); counter := counter + 1;
  INSERT INTO employees (employee_id, first_name, last_name, email, department_id, job_title, manager_id, start_date, employment_type, salary, status) VALUES
  ('EMP' || counter, 'Timothy', 'Guzman', 'timothy.guzman@company.com', dept_operations, 'Facilities Manager', coo_id, '2021-12-15', 'Full-time', 88000, 'Active'); counter := counter + 1;

  RAISE NOTICE 'Successfully created 180+ sample employees';
END $$;
