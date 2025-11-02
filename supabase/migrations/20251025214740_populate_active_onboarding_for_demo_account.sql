/*
  # Populate Active Onboarding for Demo Account Synchronization

  ## Overview
  This migration ensures the Demo Account (demohrstudio360@gmail.com) has the same
  Active Onboarding experience as the Robert Sala Product Owner account by:
  1. Generating onboarding tasks for 6 new_hires that are missing them
  2. Updating start dates to show as "Active Onboarding" (recent dates)
  3. Ensuring all new_hires have proper status and template assignments

  ## Problem Identified
  - 7 new_hires exist in the database
  - Only 1 new_hire (Stephan Yarovyi) has onboarding tasks (14 tasks)
  - 6 new_hires have NO tasks: Edward Cooper, Lisa Richardson, Frank Cox, Betty Howard, Walter Ward, Test User
  - Start dates are set far in the future or past, not showing as "Active"

  ## Changes Made

  ### 1. Update Start Dates
  - Set all new_hires to have start dates within the last 7 days
  - This ensures they show as "Active Onboarding" in the UI

  ### 2. Generate Onboarding Tasks
  - Generate tasks for all 6 new_hires missing tasks
  - Match tasks to appropriate templates based on role/department

  ### 3. Verify Template Assignments
  - Ensure all new_hires have onboarding_template_id set

  ## Expected Outcome
  - Active Onboarding will show 7 entries with tasks
*/

-- First, update start dates to show as Active Onboarding (within last 7 days)
UPDATE new_hires
SET 
  start_date = CASE
    WHEN email = 'edward.c@email.com' THEN CURRENT_DATE - INTERVAL '1 day'
    WHEN email = 'lisa.r@email.com' THEN CURRENT_DATE - INTERVAL '2 days'
    WHEN email = 'frank.c@email.com' THEN CURRENT_DATE - INTERVAL '3 days'
    WHEN email = 'betty.h@email.com' THEN CURRENT_DATE - INTERVAL '4 days'
    WHEN email = 'walter.w@email.com' THEN CURRENT_DATE - INTERVAL '5 days'
    WHEN email = 'test@example.com' THEN CURRENT_DATE - INTERVAL '6 days'
    WHEN email = 'stephan.y@email.com' THEN CURRENT_DATE - INTERVAL '7 days'
    ELSE start_date
  END,
  status = 'in_progress',
  updated_at = now()
WHERE email IN (
  'edward.c@email.com',
  'lisa.r@email.com', 
  'frank.c@email.com',
  'betty.h@email.com',
  'walter.w@email.com',
  'test@example.com',
  'stephan.y@email.com'
);

-- Update template assignments and generate tasks for new_hires without tasks
DO $$
DECLARE
  v_new_hire RECORD;
  v_template_id uuid;
  v_template_task RECORD;
  v_assignee_id uuid;
  v_task_due_date date;
  v_software_eng_template_id uuid;
  v_marketing_template_id uuid;
  v_general_template_id uuid;
  v_task_count integer := 0;
BEGIN
  -- Get template IDs
  SELECT id INTO v_software_eng_template_id FROM onboarding_templates WHERE name = 'Software Engineer Onboarding' LIMIT 1;
  SELECT id INTO v_marketing_template_id FROM onboarding_templates WHERE name = 'Marketing Manager Onboarding' LIMIT 1;
  SELECT id INTO v_general_template_id FROM onboarding_templates WHERE name = 'General Employee Onboarding' LIMIT 1;

  -- Loop through new_hires without tasks
  FOR v_new_hire IN
    SELECT nh.*
    FROM new_hires nh
    LEFT JOIN onboarding_tasks ot ON ot.new_hire_id = nh.id
    WHERE ot.id IS NULL
    AND nh.email != 'stephan.y@email.com'
  LOOP
    -- Determine appropriate template based on role and department
    v_template_id := NULL;
    
    IF v_new_hire.department = 'Engineering' OR v_new_hire.role ILIKE '%Engineer%' THEN
      v_template_id := v_software_eng_template_id;
    ELSIF v_new_hire.department = 'Marketing' OR v_new_hire.role ILIKE '%Marketing%' THEN
      v_template_id := v_marketing_template_id;
    ELSE
      v_template_id := v_general_template_id;
    END IF;

    -- Update new_hire with template assignment
    UPDATE new_hires
    SET onboarding_template_id = v_template_id, updated_at = now()
    WHERE id = v_new_hire.id;

    -- Generate tasks from template
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

      RAISE NOTICE 'Generated onboarding tasks for: % %', v_new_hire.first_name, v_new_hire.last_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total tasks generated: %', v_task_count;
END $$;

-- Update Stephan Yarovyi's tasks to have dates relative to new start date
UPDATE onboarding_tasks
SET 
  due_date = (
    SELECT nh.start_date + (ott.due_days_from_start || ' days')::interval
    FROM new_hires nh, onboarding_template_tasks ott
    WHERE nh.id = onboarding_tasks.new_hire_id
    AND ott.id = onboarding_tasks.template_task_id
    AND nh.email = 'stephan.y@email.com'
  ),
  updated_at = now()
WHERE new_hire_id = (SELECT id FROM new_hires WHERE email = 'stephan.y@email.com');

-- Log final statistics
DO $$
DECLARE
  v_total_new_hires integer;
  v_total_tasks integer;
  v_hires_with_tasks integer;
BEGIN
  SELECT COUNT(*) INTO v_total_new_hires FROM new_hires;
  SELECT COUNT(*) INTO v_total_tasks FROM onboarding_tasks;
  SELECT COUNT(DISTINCT new_hire_id) INTO v_hires_with_tasks FROM onboarding_tasks;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Active Onboarding Migration Complete!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total New Hires: %', v_total_new_hires;
  RAISE NOTICE 'Total Onboarding Tasks: %', v_total_tasks;
  RAISE NOTICE 'New Hires with Tasks: %', v_hires_with_tasks;
  RAISE NOTICE '==========================================';
END $$;
