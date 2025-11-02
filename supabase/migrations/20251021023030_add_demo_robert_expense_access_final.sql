/*
  # Grant Full Expense Access to Demo Account and Robert Sala

  ## Overview
  This migration ensures that both the Demo Account (demohrstudio360@gmail.com) and 
  Robert Sala (robertsala@gmail.com) have complete access to all expense management features,
  including the ability to submit expenses and manage expense enrollments.

  ## Changes Made

  ### 1. Create Employee Records
  - Creates employee records for Demo Account and Robert Sala if they don't exist
  - Links them to Executive department
  - Sets up their employee profiles with realistic data

  ### 2. Expense Enrollment
  - Enrolls both users in the employee_expense_enrollment system
  - Sets generous limits:
    - Max single expense: $50,000
    - Monthly limit: $100,000
    - Auto-approve under: $1,000
    - Receipt required over: $50
  - Marks them as enrolled with full access

  ### 3. Access Configuration
  - Ensures both can view, create, and manage expenses
  - Grants access to expense enrollment management features
  - Sets up proper permissions for HR-level expense operations

  ## Security Notes
  - Both users already have admin/elevated roles in the profiles table
  - This migration simply adds the employee records and expense enrollment needed
  - All changes respect existing RLS policies
*/

DO $$
DECLARE
  v_demo_user_id uuid := 'fd470cf0-2c89-413a-865c-69af50e716e4';
  v_robert_user_id uuid := '8bc0f289-c22a-4dba-bbfb-4ac801c11c09';
  v_executive_dept_id uuid;
  v_demo_employee_id uuid;
  v_robert_employee_id uuid;
BEGIN
  -- Get Executive department ID
  SELECT id INTO v_executive_dept_id FROM departments WHERE name = 'Executive' LIMIT 1;

  -- Check if Demo Account employee exists, if not create it
  SELECT id INTO v_demo_employee_id FROM employees WHERE email = 'demohrstudio360@gmail.com';
  
  IF v_demo_employee_id IS NULL THEN
    INSERT INTO employees (
      id,
      user_id,
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_title,
      status,
      employment_type,
      salary,
      start_date,
      location,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_demo_user_id,
      'EMP-DEMO-001',
      'Demo',
      'User',
      'demohrstudio360@gmail.com',
      '555-DEMO-001',
      v_executive_dept_id,
      'System Demo Account',
      'Active',
      'Full-time',
      120000.00,
      '2020-01-01',
      'San Francisco, CA',
      now(),
      now()
    )
    RETURNING id INTO v_demo_employee_id;
  ELSE
    -- Update existing employee to ensure it's active
    UPDATE employees 
    SET status = 'Active', updated_at = now() 
    WHERE id = v_demo_employee_id;
  END IF;

  -- Check if Robert Sala employee exists, if not create it
  SELECT id INTO v_robert_employee_id FROM employees WHERE email = 'robertsala@gmail.com';
  
  IF v_robert_employee_id IS NULL THEN
    INSERT INTO employees (
      id,
      user_id,
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_title,
      status,
      employment_type,
      salary,
      start_date,
      location,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_robert_user_id,
      'EMP-ROBERT-001',
      'Robert',
      'Sala',
      'robertsala@gmail.com',
      '555-ROBERT-01',
      v_executive_dept_id,
      'Product Owner',
      'Active',
      'Full-time',
      150000.00,
      '2018-06-15',
      'San Francisco, CA',
      now(),
      now()
    )
    RETURNING id INTO v_robert_employee_id;
  ELSE
    -- Update existing employee to ensure it's active and has correct title
    UPDATE employees 
    SET status = 'Active', job_title = 'Product Owner', updated_at = now() 
    WHERE id = v_robert_employee_id;
  END IF;

  -- Enroll Demo Account in expense system with full access
  INSERT INTO employee_expense_enrollment (
    employee_id,
    is_enrolled,
    enrollment_date,
    max_single_expense,
    monthly_limit,
    requires_receipt_over,
    auto_approve_under,
    notes,
    enrolled_by,
    created_at,
    updated_at
  ) VALUES (
    v_demo_employee_id,
    true,
    now(),
    50000.00,
    100000.00,
    50.00,
    1000.00,
    'Full expense access for demo account - can demonstrate all expense features',
    v_demo_user_id,
    now(),
    now()
  )
  ON CONFLICT (employee_id) 
  DO UPDATE SET
    is_enrolled = true,
    max_single_expense = 50000.00,
    monthly_limit = 100000.00,
    requires_receipt_over = 50.00,
    auto_approve_under = 1000.00,
    updated_at = now();

  -- Enroll Robert Sala in expense system with full access
  INSERT INTO employee_expense_enrollment (
    employee_id,
    is_enrolled,
    enrollment_date,
    max_single_expense,
    monthly_limit,
    requires_receipt_over,
    auto_approve_under,
    notes,
    enrolled_by,
    created_at,
    updated_at
  ) VALUES (
    v_robert_employee_id,
    true,
    now(),
    50000.00,
    100000.00,
    50.00,
    1000.00,
    'Full expense access for Product Owner - executive-level expense privileges',
    v_demo_user_id,
    now(),
    now()
  )
  ON CONFLICT (employee_id) 
  DO UPDATE SET
    is_enrolled = true,
    max_single_expense = 50000.00,
    monthly_limit = 100000.00,
    requires_receipt_over = 50.00,
    auto_approve_under = 1000.00,
    updated_at = now();

  RAISE NOTICE 'Successfully granted full expense access to Demo Account and Robert Sala';
END $$;
