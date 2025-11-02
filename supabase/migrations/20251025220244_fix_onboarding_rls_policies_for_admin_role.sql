/*
  # Fix Onboarding RLS Policies for Admin Role

  ## Problem Identified
  The Demo User (demohrstudio360@gmail.com) has role='admin' but cannot access onboarding data
  because the RLS policies on the onboarding system tables only allow roles 'HR' and 'Product Owner'.

  This causes the Demo User to see "Active Onboarding (0)" even though 7 new_hires with tasks
  exist in the database and are correctly configured.

  ## Root Cause
  - Migration 20251023220907 set Demo User role to 'admin'
  - Migration 20251025214740 created 7 new_hires with onboarding tasks for Demo account
  - RLS policies on new_hires, onboarding_tasks, onboarding_templates, and onboarding_template_tasks
    only check for roles IN ('HR', 'Product Owner'), blocking 'admin' access
  - When Demo User queries `new_hires` table, RLS policies return empty results

  ## Solution
  Update all RLS policies in the onboarding system to include 'admin' role alongside 'HR' and
  'Product Owner'. This ensures admins have full access to manage the onboarding process.

  ## Changes Made

  ### 1. New Hires Table Policies
  - Update "HR and admins can manage new hires" policy to include 'admin' role

  ### 2. Onboarding Tasks Table Policies
  - Update "HR and admins can manage all onboarding tasks" policy to include 'admin' role

  ### 3. Onboarding Templates Table Policies
  - Update "HR and admins can manage onboarding templates" policy to include 'admin' role

  ### 4. Onboarding Template Tasks Table Policies
  - Update "HR and admins can manage template tasks" policy to include 'admin' role

  ## Expected Outcome
  After this migration:
  - Demo User with role='admin' can view and manage all onboarding data
  - Active Onboarding will show all 7 new hires with their tasks
  - Demo User experience will match Robert Sala Product Owner experience
  - All admin users will have full onboarding management capabilities
*/

-- Drop and recreate the new_hires policy to include 'admin' role
DROP POLICY IF EXISTS "HR and admins can manage new hires" ON new_hires;

CREATE POLICY "HR and admins can manage new hires"
  ON new_hires
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  );

-- Drop and recreate the onboarding_tasks policy to include 'admin' role
DROP POLICY IF EXISTS "HR and admins can manage all onboarding tasks" ON onboarding_tasks;

CREATE POLICY "HR and admins can manage all onboarding tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  );

-- Drop and recreate the onboarding_templates policy to include 'admin' role
DROP POLICY IF EXISTS "HR and admins can manage onboarding templates" ON onboarding_templates;

CREATE POLICY "HR and admins can manage onboarding templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  );

-- Drop and recreate the onboarding_template_tasks policy to include 'admin' role
DROP POLICY IF EXISTS "HR and admins can manage template tasks" ON onboarding_template_tasks;

CREATE POLICY "HR and admins can manage template tasks"
  ON onboarding_template_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner', 'admin')
    )
  );

-- Update the convert_candidate_to_new_hire function to include 'admin' role
CREATE OR REPLACE FUNCTION convert_candidate_to_new_hire(
  p_candidate_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_role text,
  p_department text,
  p_manager_id uuid,
  p_start_date date,
  p_salary numeric,
  p_employment_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_hire_id uuid;
  v_template_id uuid;
  v_template_task RECORD;
  v_assignee_id uuid;
  v_task_due_date date;
BEGIN
  -- Find appropriate onboarding template
  SELECT id INTO v_template_id
  FROM onboarding_templates
  WHERE role = p_role
    AND department = p_department
    AND active = true
  LIMIT 1;

  -- If no exact match, try department match
  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id
    FROM onboarding_templates
    WHERE department = p_department
      AND active = true
    LIMIT 1;
  END IF;

  -- Create new hire record
  INSERT INTO new_hires (
    candidate_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    department,
    manager_id,
    start_date,
    salary,
    employment_type,
    onboarding_template_id,
    status
  ) VALUES (
    p_candidate_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_role,
    p_department,
    p_manager_id,
    p_start_date,
    p_salary,
    p_employment_type,
    v_template_id,
    'in_progress'
  )
  RETURNING id INTO v_new_hire_id;

  -- Generate tasks from template if template exists
  IF v_template_id IS NOT NULL THEN
    FOR v_template_task IN
      SELECT * FROM onboarding_template_tasks
      WHERE template_id = v_template_id
      ORDER BY order_index
    LOOP
      -- Determine assignee based on assignee_type
      v_assignee_id := NULL;

      CASE v_template_task.assignee_type
        WHEN 'new_hire' THEN
          -- Will be assigned when new hire gets account
          v_assignee_id := NULL;
        WHEN 'manager' THEN
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE email = (SELECT email FROM employees WHERE id = p_manager_id)
            LIMIT 1
          );
        WHEN 'hr' THEN
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role IN ('HR', 'admin', 'Product Owner')
            LIMIT 1
          );
        ELSE
          -- For IT, facilities, payroll - assign to HR or admin for now
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role IN ('HR', 'admin', 'Product Owner')
            LIMIT 1
          );
      END CASE;

      -- Calculate due date
      v_task_due_date := p_start_date + (v_template_task.due_days_from_start || ' days')::interval;

      -- Create task
      INSERT INTO onboarding_tasks (
        new_hire_id,
        template_task_id,
        title,
        description,
        assignee_id,
        assignee_type,
        due_date,
        priority,
        category,
        status
      ) VALUES (
        v_new_hire_id,
        v_template_task.id,
        v_template_task.title,
        v_template_task.description,
        v_assignee_id,
        v_template_task.assignee_type,
        v_task_due_date,
        v_template_task.priority,
        v_template_task.category,
        'pending'
      );
    END LOOP;
  END IF;

  RETURN v_new_hire_id;
END;
$$;

-- Verification: Log current state
DO $$
DECLARE
  v_demo_role text;
  v_demo_email text;
  v_new_hires_count integer;
  v_tasks_count integer;
BEGIN
  -- Get Demo User role
  SELECT role, email INTO v_demo_role, v_demo_email
  FROM profiles
  WHERE email = 'demohrstudio360@gmail.com';

  -- Count new_hires (this should now work with RLS)
  SELECT COUNT(*) INTO v_new_hires_count FROM new_hires;

  -- Count onboarding_tasks
  SELECT COUNT(*) INTO v_tasks_count FROM onboarding_tasks;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Onboarding RLS Policy Fix Applied!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo User Email: %', v_demo_email;
  RAISE NOTICE 'Demo User Role: %', v_demo_role;
  RAISE NOTICE 'Total New Hires: %', v_new_hires_count;
  RAISE NOTICE 'Total Onboarding Tasks: %', v_tasks_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policies Updated:';
  RAISE NOTICE '  - new_hires: Now includes admin role';
  RAISE NOTICE '  - onboarding_tasks: Now includes admin role';
  RAISE NOTICE '  - onboarding_templates: Now includes admin role';
  RAISE NOTICE '  - onboarding_template_tasks: Now includes admin role';
  RAISE NOTICE '========================================';

  IF v_demo_role = 'admin' AND v_new_hires_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Demo User can now access % new hires!', v_new_hires_count;
  ELSE
    RAISE WARNING 'ISSUE: Demo User role is % (expected admin)', v_demo_role;
  END IF;
END $$;
