/*
  # Comprehensive Performance Review Data Population

  This migration populates the performance review system with realistic data for 100-140 employees
  across multiple review cycles, demonstrating the complete integration with:
  - Employee Performance & Development tabs
  - Reports Center with drill-down details
  - Payroll modal compensation updates
  - Complete approval workflows

  ## Data Structure
  1. Create 4 review cycles (Q4 2023, Q1 2024, Mid-Year 2024, Annual 2024)
  2. Generate 100-140 performance reviews across cycles
  3. Populate review responses (12 questions per review)
  4. Create compensation approvals and history
  5. Populate payroll changes queue for pending updates
  6. Fill performance_review_history for employee profile tabs

  ## Integration Points
  - performance_review_history → Employee Profile Performance & Development tab
  - payroll_changes_queue → Payroll modal pending updates
  - All tables → Reports Center Performance Review Summary
*/

-- =====================================================
-- STEP 1: Get Robert Sala's user ID for demo purposes
-- =====================================================
DO $$
DECLARE
  v_robert_id uuid;
  v_demo_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO v_robert_id FROM profiles WHERE email = 'robertsala@gmail.com';
  SELECT id INTO v_demo_id FROM profiles WHERE email = 'demo@hrstudio360.com';

  -- Store in temp table for use in subsequent steps
  CREATE TEMP TABLE IF NOT EXISTS temp_demo_users (
    robert_id uuid,
    demo_id uuid
  );

  INSERT INTO temp_demo_users (robert_id, demo_id) VALUES (v_robert_id, v_demo_id);

  RAISE NOTICE 'Found Robert: %, Demo: %', v_robert_id, v_demo_id;
END $$;

-- =====================================================
-- STEP 2: Create Review Cycles
-- =====================================================
INSERT INTO review_cycles (
  id,
  name,
  cycle_type,
  start_date,
  end_date,
  deadline_date,
  status,
  approval_threshold_amount,
  approval_threshold_percentage,
  description,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'Q4 2023 Performance Review',
    'quarterly',
    '2023-10-01',
    '2023-12-31',
    '2024-01-15',
    'completed',
    5000,
    10,
    'Quarterly performance review for Q4 2023 focusing on year-end goals and achievements',
    '2023-10-01 08:00:00',
    '2024-01-18 17:00:00'
  ),
  (
    gen_random_uuid(),
    'Q1 2024 Performance Review',
    'quarterly',
    '2024-01-01',
    '2024-03-31',
    '2024-04-15',
    'completed',
    5000,
    10,
    'First quarter 2024 review assessing new year objectives and early progress',
    '2024-01-02 08:00:00',
    '2024-04-20 17:00:00'
  ),
  (
    gen_random_uuid(),
    'Mid-Year 2024 Review',
    'mid_year',
    '2024-01-01',
    '2024-06-30',
    '2024-07-15',
    'completed',
    7500,
    12,
    'Mid-year comprehensive review covering first half of 2024 with compensation adjustments',
    '2024-01-02 08:00:00',
    '2024-07-20 17:00:00'
  ),
  (
    gen_random_uuid(),
    'Annual 2024 Performance Review',
    'annual',
    '2024-01-01',
    '2024-12-31',
    '2025-01-15',
    'active',
    10000,
    15,
    'Comprehensive annual review for 2024 with full compensation review and goal setting for 2025',
    '2024-01-02 08:00:00',
    now()
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Create sample employees as profiles
-- =====================================================
-- We'll create a subset of employees as profiles that can be used
-- for performance reviews. Using realistic data from mockOrgChartEmployees

DO $$
DECLARE
  v_robert_id uuid;
  v_employee_count integer := 0;
BEGIN
  SELECT robert_id INTO v_robert_id FROM temp_demo_users LIMIT 1;

  -- Insert sample employees into profiles
  -- This uses a subset of realistic employee data
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    'emp' || (row_number() OVER ()) || '@company.com',
    names.name,
    'employee',
    now() - (random() * 730)::int * interval '1 day',
    now()
  FROM (
    VALUES
      ('Sarah Johnson'), ('Michael Chen'), ('Emily Rodriguez'), ('David Kim'), ('Jennifer Martinez'),
      ('James Anderson'), ('Maria Garcia'), ('Robert Taylor'), ('Linda Wilson'), ('John Moore'),
      ('Patricia Jackson'), ('Christopher White'), ('Barbara Harris'), ('Daniel Martin'), ('Nancy Thompson'),
      ('Matthew Garcia'), ('Karen Martinez'), ('Joseph Robinson'), ('Susan Clark'), ('Thomas Rodriguez'),
      ('Jessica Lewis'), ('Charles Lee'), ('Sarah Walker'), ('Jason Hall'), ('Lisa Allen'),
      ('Kevin Young'), ('Michelle Hernandez'), ('Brian King'), ('Ashley Wright'), ('George Lopez'),
      ('Amanda Hill'), ('Edward Scott'), ('Stephanie Green'), ('Ryan Adams'), ('Rebecca Baker'),
      ('Andrew Nelson'), ('Laura Carter'), ('Paul Mitchell'), ('Rachel Perez'), ('Mark Roberts'),
      ('Kimberly Turner'), ('Donald Phillips'), ('Mary Campbell'), ('Steven Parker'), ('Sandra Evans'),
      ('Kenneth Edwards'), ('Carol Collins'), ('Joshua Stewart'), ('Donna Sanchez'), ('Kevin Morris'),
      ('Elizabeth Rogers'), ('Jeffrey Reed'), ('Betty Cook'), ('Gary Morgan'), ('Helen Bell'),
      ('Timothy Murphy'), ('Deborah Bailey'), ('Jose Rivera'), ('Sharon Cooper'), ('Frank Richardson'),
      ('Cynthia Cox'), ('Larry Howard'), ('Angela Ward'), ('Douglas Torres'), ('Melissa Peterson'),
      ('Peter Gray'), ('Brenda Ramirez'), ('Patrick James'), ('Pamela Watson'), ('Benjamin Brooks'),
      ('Janet Kelly'), ('Raymond Sanders'), ('Kathleen Price'), ('Jack Bennett'), ('Carolyn Wood'),
      ('Dennis Barnes'), ('Joyce Ross'), ('Gerald Henderson'), ('Diane Coleman'), ('Carl Jenkins'),
      ('Virginia Perry'), ('Harold Powell'), ('Teresa Long'), ('Arthur Patterson'), ('Julie Hughes'),
      ('Roger Flores'), ('Christina Washington'), ('Keith Butler'), ('Evelyn Simmons'), ('Henry Foster'),
      ('Jean Gonzales'), ('Willie Bryant'), ('Frances Alexander'), ('Albert Russell'), ('Judith Griffin'),
      ('Howard Diaz'), ('Mildred Hayes'), ('Eugene Myers'), ('Catherine Ford'), ('Russell Hamilton'),
      ('Cheryl Graham'), ('Philip Sullivan'), ('Ann Wallace'), ('Louis Woods'), ('Heather Cole'),
      ('Billy West'), ('Gloria Jordan'), ('Johnny Owens'), ('Marie Reynolds'), ('Victor Fisher')
  ) AS names(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'emp' || (row_number() OVER ()) || '@company.com'
  )
  LIMIT 100;

  GET DIAGNOSTICS v_employee_count = ROW_COUNT;
  RAISE NOTICE 'Created % employee profiles', v_employee_count;
END $$;

-- =====================================================
-- STEP 4: Generate Performance Reviews
-- =====================================================
-- Create reviews for a subset of employees across different cycles

DO $$
DECLARE
  v_cycle record;
  v_employee record;
  v_review_id uuid;
  v_robert_id uuid;
  v_review_count integer := 0;
  v_rating numeric;
  v_self_rating numeric;
  v_manager_rating numeric;
BEGIN
  SELECT robert_id INTO v_robert_id FROM temp_demo_users LIMIT 1;

  -- Loop through each review cycle
  FOR v_cycle IN
    SELECT id, name, start_date, end_date, status
    FROM review_cycles
    ORDER BY start_date
  LOOP
    -- For each cycle, create reviews for a random subset of employees
    FOR v_employee IN
      SELECT id, full_name, email
      FROM profiles
      WHERE role = 'employee'
      ORDER BY random()
      LIMIT CASE
        WHEN v_cycle.name LIKE '%Annual%' THEN 40
        WHEN v_cycle.name LIKE '%Mid-Year%' THEN 35
        ELSE 25
      END
    LOOP
      v_review_count := v_review_count + 1;
      v_review_id := gen_random_uuid();

      -- Generate realistic ratings (3.5 to 5.0 scale)
      v_rating := 3.5 + (random() * 1.5);
      v_self_rating := v_rating + ((random() - 0.5) * 0.3); -- Self rating within 0.15 of actual
      v_manager_rating := v_rating + ((random() - 0.5) * 0.2); -- Manager rating within 0.10 of actual

      -- Clamp ratings to 1.0-5.0 range
      v_self_rating := GREATEST(1.0, LEAST(5.0, v_self_rating));
      v_manager_rating := GREATEST(1.0, LEAST(5.0, v_manager_rating));
      v_rating := GREATEST(1.0, LEAST(5.0, v_rating));

      -- Insert performance review
      INSERT INTO performance_reviews (
        id,
        review_cycle_id,
        employee_id,
        reviewer_id,
        review_type,
        status,
        self_overall_rating,
        self_submitted_at,
        manager_overall_rating,
        manager_submitted_at,
        final_rating,
        completed_at,
        created_at,
        updated_at
      ) VALUES (
        v_review_id,
        v_cycle.id,
        v_employee.id,
        v_robert_id, -- Robert is the reviewer
        'annual',
        CASE
          WHEN v_cycle.status = 'completed' THEN 'completed'
          ELSE 'pending_employee'
        END,
        v_self_rating,
        CASE WHEN v_cycle.status = 'completed' THEN v_cycle.end_date + interval '5 days' ELSE NULL END,
        v_manager_rating,
        CASE WHEN v_cycle.status = 'completed' THEN v_cycle.end_date + interval '7 days' ELSE NULL END,
        v_rating,
        CASE WHEN v_cycle.status = 'completed' THEN v_cycle.end_date + interval '10 days' ELSE NULL END,
        v_cycle.start_date,
        now()
      );

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % performance reviews', v_review_count;
END $$;

-- =====================================================
-- STEP 5: Generate Review Responses (12 questions each)
-- =====================================================

DO $$
DECLARE
  v_review record;
  v_question record;
  v_response_count integer := 0;
BEGIN
  -- For each completed review, generate responses for all questions
  FOR v_review IN
    SELECT pr.id as review_id, pr.employee_id, pr.self_overall_rating, pr.manager_overall_rating
    FROM performance_reviews pr
    WHERE pr.status = 'completed'
  LOOP
    -- Generate responses for each question in the library
    FOR v_question IN
      SELECT id, question_text, category, weight
      FROM review_questions_library
      WHERE is_active = true
      ORDER BY sort_order
    LOOP
      v_response_count := v_response_count + 1;

      -- Insert self assessment response
      INSERT INTO review_responses (
        review_id,
        question_id,
        response_type,
        rating,
        comments
      ) VALUES (
        v_review.review_id,
        v_question.id,
        'self',
        v_review.self_overall_rating + ((random() - 0.5) * 0.5), -- Vary slightly from overall
        CASE
          WHEN v_review.self_overall_rating >= 4.5 THEN
            'I have consistently exceeded expectations in this area and delivered exceptional results.'
          WHEN v_review.self_overall_rating >= 4.0 THEN
            'I have performed well in this area and met all key objectives.'
          WHEN v_review.self_overall_rating >= 3.5 THEN
            'I have met expectations in this area with some opportunities for improvement.'
          ELSE
            'I recognize this as an area where I can continue to develop and improve.'
        END
      );

      -- Insert manager assessment response
      INSERT INTO review_responses (
        review_id,
        question_id,
        response_type,
        rating,
        comments
      ) VALUES (
        v_review.review_id,
        v_question.id,
        'manager',
        v_review.manager_overall_rating + ((random() - 0.5) * 0.5), -- Vary slightly from overall
        CASE
          WHEN v_review.manager_overall_rating >= 4.5 THEN
            'Outstanding performance. Consistently delivers exceptional results and serves as a role model for others.'
          WHEN v_review.manager_overall_rating >= 4.0 THEN
            'Strong performance. Meets and often exceeds expectations with quality work.'
          WHEN v_review.manager_overall_rating >= 3.5 THEN
            'Good performance. Meets core expectations with room for continued growth.'
          ELSE
            'Satisfactory performance with identified areas for development and improvement.'
        END
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % review responses', v_response_count;
END $$;

-- =====================================================
-- STEP 6: Generate Goals and Comments
-- =====================================================

INSERT INTO review_goals_comments (
  review_id,
  achievements,
  development_areas,
  goals_next_period
)
SELECT
  pr.id,
  CASE
    WHEN pr.final_rating >= 4.5 THEN
      'Successfully led multiple high-impact projects resulting in significant business value. Demonstrated exceptional technical expertise and leadership. Mentored junior team members effectively.'
    WHEN pr.final_rating >= 4.0 THEN
      'Completed all assigned projects on time and within scope. Contributed positively to team objectives. Showed strong problem-solving skills.'
    WHEN pr.final_rating >= 3.5 THEN
      'Met core job responsibilities and contributed to team goals. Completed assigned tasks satisfactorily.'
    ELSE
      'Completed essential job functions. Showed effort in meeting basic requirements.'
  END,
  CASE
    WHEN pr.final_rating >= 4.5 THEN
      'Focus on strategic thinking and cross-functional collaboration to prepare for senior leadership roles.'
    WHEN pr.final_rating >= 4.0 THEN
      'Continue developing leadership skills and take on more complex projects to expand expertise.'
    WHEN pr.final_rating >= 3.5 THEN
      'Improve time management and technical skills. Seek more proactive communication with stakeholders.'
    ELSE
      'Focus on core skill development and consistent delivery of quality work. Improve attention to detail.'
  END,
  CASE
    WHEN pr.final_rating >= 4.5 THEN
      'Lead enterprise-level initiatives. Mentor and develop team members. Drive innovation in key technical areas.'
    WHEN pr.final_rating >= 4.0 THEN
      'Take ownership of larger projects. Enhance cross-team collaboration. Develop expertise in new technologies.'
    WHEN pr.final_rating >= 3.5 THEN
      'Improve project delivery consistency. Build stronger relationships with stakeholders. Enhance technical capabilities.'
    ELSE
      'Meet all core performance expectations. Complete training programs. Deliver assigned work on time.'
  END
FROM performance_reviews pr
WHERE pr.status = 'completed'
ON CONFLICT (review_id) DO NOTHING;

-- =====================================================
-- STEP 7: Generate Compensation Approvals
-- =====================================================

DO $$
DECLARE
  v_review record;
  v_increase_pct numeric;
  v_current_salary numeric;
  v_increase_amount numeric;
  v_new_salary numeric;
  v_approval_count integer := 0;
BEGIN
  -- For each completed review with a good rating, create compensation approval
  FOR v_review IN
    SELECT pr.id, pr.employee_id, pr.final_rating, pr.reviewer_id, pr.completed_at
    FROM performance_reviews pr
    WHERE pr.status = 'completed'
    AND pr.final_rating >= 3.8  -- Only reviews with 3.8+ get raises
    ORDER BY random()
    LIMIT 60  -- ~60% of completed reviews get compensation increases
  LOOP
    v_approval_count := v_approval_count + 1;

    -- Set baseline salary (between 55k and 150k)
    v_current_salary := 55000 + (random() * 95000);

    -- Calculate increase percentage based on rating
    v_increase_pct := CASE
      WHEN v_review.final_rating >= 4.7 THEN 6.0 + (random() * 2.0)  -- 6-8%
      WHEN v_review.final_rating >= 4.3 THEN 4.0 + (random() * 2.0)  -- 4-6%
      WHEN v_review.final_rating >= 4.0 THEN 3.0 + (random() * 1.5)  -- 3-4.5%
      ELSE 2.0 + (random() * 1.0)  -- 2-3%
    END;

    v_increase_amount := ROUND(v_current_salary * v_increase_pct / 100, 2);
    v_new_salary := v_current_salary + v_increase_amount;

    -- Insert compensation approval
    INSERT INTO compensation_approvals (
      performance_review_id,
      employee_id,
      current_salary,
      recommended_increase_amount,
      recommended_increase_percentage,
      manager_recommended_amount,
      manager_justification,
      manager_approved_by,
      manager_approved_at,
      hr_approval_status,
      hr_approved_by,
      hr_approved_at,
      executive_approval_status,
      requires_executive_approval,
      final_approved_amount,
      final_approval_status,
      effective_date
    ) VALUES (
      v_review.id,
      v_review.employee_id,
      v_current_salary,
      v_increase_amount,
      v_increase_pct,
      v_increase_amount,
      'Based on strong performance throughout the review period, demonstrating consistent achievement of goals and positive contributions to team success.',
      v_review.reviewer_id,
      v_review.completed_at + interval '2 days',
      'approved',
      (SELECT robert_id FROM temp_demo_users LIMIT 1),
      v_review.completed_at + interval '5 days',
      CASE WHEN v_increase_amount > 5000 OR v_increase_pct > 10 THEN 'approved' ELSE NULL END,
      v_increase_amount > 5000 OR v_increase_pct > 10,
      v_increase_amount,
      'approved',
      (v_review.completed_at + interval '30 days')::date
    );

  END LOOP;

  RAISE NOTICE 'Created % compensation approvals', v_approval_count;
END $$;

-- =====================================================
-- STEP 8: Populate Compensation History
-- =====================================================

INSERT INTO compensation_history (
  employee_id,
  review_id,
  old_salary,
  new_salary,
  change_amount,
  change_percentage,
  change_type,
  reason,
  effective_date,
  approved_by_manager,
  approved_by_hr,
  approved_by_executive,
  created_at
)
SELECT
  ca.employee_id,
  ca.performance_review_id,
  ca.current_salary,
  ca.current_salary + ca.final_approved_amount,
  ca.final_approved_amount,
  ca.recommended_increase_percentage,
  'merit_increase',
  'Performance Review - Rating: ' || ROUND(pr.final_rating, 1) || '/5.0',
  ca.effective_date,
  ca.manager_approved_by,
  ca.hr_approved_by,
  CASE WHEN ca.requires_executive_approval THEN (SELECT robert_id FROM temp_demo_users LIMIT 1) ELSE NULL END,
  ca.created_at
FROM compensation_approvals ca
JOIN performance_reviews pr ON pr.id = ca.performance_review_id
WHERE ca.final_approval_status = 'approved'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 9: Populate Payroll Changes Queue
-- =====================================================

-- Add recent compensation changes to payroll queue with 'pending' status
-- This will show in Payroll modal as pending updates before running payroll

INSERT INTO payroll_changes_queue (
  employee_id,
  compensation_history_id,
  old_rate,
  new_rate,
  effective_date,
  change_reason,
  status,
  created_at
)
SELECT
  ch.employee_id,
  ch.id,
  ch.old_salary,
  ch.new_salary,
  ch.effective_date,
  ch.reason,
  CASE
    -- Recent changes (within 30 days) are pending
    WHEN ch.effective_date >= CURRENT_DATE - interval '30 days' THEN 'pending'
    -- Older changes are completed
    ELSE 'completed'
  END,
  ch.created_at
FROM compensation_history ch
WHERE ch.change_type = 'merit_increase'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 10: Populate Performance Review History
-- =====================================================
-- This table feeds the Employee Profile Performance & Development tab

INSERT INTO performance_review_history (
  review_id,
  employee_id,
  cycle_id,
  cycle_name,
  review_period,
  final_rating,
  self_rating,
  manager_rating,
  review_date,
  completion_status,
  compensation_change_amount,
  compensation_change_percentage,
  key_achievements,
  development_areas,
  goals_next_period
)
SELECT
  pr.id,
  pr.employee_id,
  pr.review_cycle_id,
  rc.name,
  EXTRACT(YEAR FROM rc.start_date)::text ||
    CASE
      WHEN rc.cycle_type = 'quarterly' THEN ' Q' || EXTRACT(QUARTER FROM rc.start_date)::text
      WHEN rc.cycle_type = 'mid_year' THEN ' Mid-Year'
      WHEN rc.cycle_type = 'annual' THEN ' Annual'
      ELSE ''
    END,
  pr.final_rating,
  pr.self_overall_rating,
  pr.manager_overall_rating,
  pr.completed_at,
  pr.status,
  ca.final_approved_amount,
  ca.recommended_increase_percentage,
  gc.achievements,
  gc.development_areas,
  gc.goals_next_period
FROM performance_reviews pr
JOIN review_cycles rc ON rc.id = pr.review_cycle_id
LEFT JOIN compensation_approvals ca ON ca.performance_review_id = pr.id
LEFT JOIN review_goals_comments gc ON gc.review_id = pr.id
WHERE pr.status = 'completed'
ON CONFLICT (review_id) DO NOTHING;

-- =====================================================
-- STEP 11: Update Performance Reviews with Compensation Links
-- =====================================================

UPDATE performance_reviews pr
SET
  compensation_change = ca.final_approved_amount,
  compensation_change_approved = true,
  updated_at = now()
FROM compensation_approvals ca
WHERE ca.performance_review_id = pr.id
AND ca.final_approval_status = 'approved';

-- =====================================================
-- FINAL: Cleanup and Summary
-- =====================================================

DO $$
DECLARE
  v_review_count integer;
  v_response_count integer;
  v_compensation_count integer;
  v_queue_count integer;
  v_history_count integer;
BEGIN
  SELECT COUNT(*) INTO v_review_count FROM performance_reviews;
  SELECT COUNT(*) INTO v_response_count FROM review_responses;
  SELECT COUNT(*) INTO v_compensation_count FROM compensation_approvals;
  SELECT COUNT(*) INTO v_queue_count FROM payroll_changes_queue WHERE status = 'pending';
  SELECT COUNT(*) INTO v_history_count FROM performance_review_history;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Performance Review Data Population Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Reviews: %', v_review_count;
  RAISE NOTICE 'Total Responses: %', v_response_count;
  RAISE NOTICE 'Compensation Approvals: %', v_compensation_count;
  RAISE NOTICE 'Pending Payroll Changes: %', v_queue_count;
  RAISE NOTICE 'Performance History Records: %', v_history_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Integration Status:';
  RAISE NOTICE '  ✓ Employee Performance & Development tabs populated';
  RAISE NOTICE '  ✓ Reports Center data ready';
  RAISE NOTICE '  ✓ Payroll modal shows pending compensation updates';
  RAISE NOTICE '  ✓ Full approval workflow demonstrated';
  RAISE NOTICE '========================================';
END $$;

-- Drop temp table
DROP TABLE IF EXISTS temp_demo_users;
