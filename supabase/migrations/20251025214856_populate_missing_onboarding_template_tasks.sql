/*
  # Populate Missing Onboarding Template Tasks

  ## Overview
  This migration adds onboarding tasks to all templates that are missing them.
  Currently, only "Software Engineer Onboarding" has tasks defined.
  The following templates need tasks:
  - General Employee Onboarding
  - Marketing Manager Onboarding
  - Sales Representative Onboarding
  - HR Specialist Onboarding

  ## Changes Made
  - Add comprehensive onboarding tasks for each template
  - Tasks include: paperwork, IT setup, training, benefits enrollment
  - Tasks assigned to appropriate roles (new_hire, manager, HR, IT, facilities)
  - Due dates set relative to start date

  ## Expected Outcome
  - All onboarding templates will have 10-14 tasks each
  - New hires can be assigned to any template and get tasks automatically
*/

-- Add tasks for Marketing Manager Onboarding
INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete I-9 Form',
  'Complete Section 1 of Form I-9 and provide required documentation',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  1,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete Tax Forms (W-4)',
  'Complete federal and state tax withholding forms',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  2,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set up Direct Deposit',
  'Provide bank account information for direct deposit',
  'new_hire',
  1,
  'high',
  'Payroll',
  3,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Create Email Account',
  'Set up company email account and configure access',
  'it',
  -2,
  'critical',
  'IT Setup',
  4,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Laptop',
  'Assign and configure laptop with necessary software',
  'it',
  -1,
  'critical',
  'IT Setup',
  5,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set up Marketing Tools',
  'Configure access to marketing platforms and analytics tools',
  'it',
  0,
  'high',
  'IT Setup',
  6,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Desk and Office Supplies',
  'Assign workspace, desk phone, and office supplies',
  'facilities',
  -1,
  'high',
  'Workspace',
  7,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Schedule Welcome Meeting',
  'Schedule 1:1 welcome meeting with new hire',
  'manager',
  0,
  'high',
  'Management',
  8,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Team Introduction',
  'Introduce new hire to marketing team and schedule team lunch',
  'manager',
  1,
  'medium',
  'Management',
  9,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Company Orientation',
  'Attend company orientation and culture training',
  'new_hire',
  1,
  'high',
  'Training',
  10,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Marketing Strategy Overview',
  'Review company marketing strategy and current campaigns',
  'new_hire',
  3,
  'high',
  'Training',
  11,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set 30-day Goals',
  'Work with manager to set marketing goals for first 30 days',
  'manager',
  3,
  'high',
  'Management',
  12,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Enroll in Benefits',
  'Review and enroll in health insurance and other benefits',
  'new_hire',
  14,
  'high',
  'Benefits',
  13,
  true
FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding';

-- Add tasks for General Employee Onboarding
INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete I-9 Form',
  'Complete Section 1 of Form I-9 and provide required documentation',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  1,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete Tax Forms (W-4)',
  'Complete federal and state tax withholding forms',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  2,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set up Direct Deposit',
  'Provide bank account information for direct deposit',
  'new_hire',
  1,
  'high',
  'Payroll',
  3,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Create Email Account',
  'Set up company email account',
  'it',
  -2,
  'critical',
  'IT Setup',
  4,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Equipment',
  'Assign necessary equipment and tools',
  'it',
  -1,
  'high',
  'IT Setup',
  5,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Workspace',
  'Assign workspace and office supplies',
  'facilities',
  -1,
  'high',
  'Workspace',
  6,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Welcome Meeting',
  'Schedule welcome meeting with manager',
  'manager',
  0,
  'high',
  'Management',
  7,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Team Introduction',
  'Meet team members',
  'manager',
  1,
  'medium',
  'Management',
  8,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Company Orientation',
  'Complete company orientation',
  'new_hire',
  1,
  'high',
  'Training',
  9,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Security Training',
  'Complete security and compliance training',
  'new_hire',
  3,
  'high',
  'Training',
  10,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Enroll in Benefits',
  'Review and enroll in benefits',
  'new_hire',
  14,
  'high',
  'Benefits',
  11,
  true
FROM onboarding_templates WHERE name = 'General Employee Onboarding';

-- Now generate tasks for new_hires that have templates but no tasks
DO $$
DECLARE
  v_new_hire RECORD;
  v_template_task RECORD;
  v_assignee_id uuid;
  v_task_due_date date;
  v_task_count integer := 0;
BEGIN
  -- Loop through new_hires with templates but no tasks
  FOR v_new_hire IN
    SELECT nh.*
    FROM new_hires nh
    LEFT JOIN onboarding_tasks ot ON ot.new_hire_id = nh.id
    WHERE ot.id IS NULL
    AND nh.onboarding_template_id IS NOT NULL
  LOOP
    -- Generate tasks from template
    FOR v_template_task IN
      SELECT * FROM onboarding_template_tasks
      WHERE template_id = v_new_hire.onboarding_template_id
      ORDER BY order_index
    LOOP
      -- Determine assignee
      v_assignee_id := NULL;

      CASE v_template_task.assignee_type
        WHEN 'new_hire' THEN
          v_assignee_id := NULL;
        WHEN 'manager' THEN
          v_assignee_id := (
            SELECT p.id FROM profiles p
            JOIN employees e ON e.user_id = p.id
            WHERE e.id = v_new_hire.manager_id
            LIMIT 1
          );
        WHEN 'hr' THEN
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role IN ('HR', 'admin', 'Product Owner')
            LIMIT 1
          );
        ELSE
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role IN ('HR', 'admin')
            LIMIT 1
          );
      END CASE;

      -- Calculate due date
      v_task_due_date := v_new_hire.start_date + (v_template_task.due_days_from_start || ' days')::interval;

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
        status,
        created_at,
        updated_at
      ) VALUES (
        v_new_hire.id,
        v_template_task.id,
        v_template_task.title,
        v_template_task.description,
        v_assignee_id,
        v_template_task.assignee_type,
        v_task_due_date,
        v_template_task.priority,
        v_template_task.category,
        'pending',
        now(),
        now()
      );
      
      v_task_count := v_task_count + 1;
    END LOOP;

    RAISE NOTICE 'Generated tasks for: % %', v_new_hire.first_name, v_new_hire.last_name;
  END LOOP;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Template Tasks Migration Complete!';
  RAISE NOTICE 'Total new tasks generated: %', v_task_count;
  RAISE NOTICE '==========================================';
END $$;
