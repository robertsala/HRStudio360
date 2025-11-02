/*
  # Comprehensive Performance Review Population for All Employees
  
  ## Overview
  Populates complete performance review data for all 180 employees in the database:
  - Annual 2024 Performance Review cycle (all 180 employees)
  - Q1 2025 Performance Review cycle (all 180 employees)
  - Complete questionnaire responses (12 questions × 2 assessment types per review)
  - Goals, comments, and achievements for each review
  - Performance review history for employee profile integration
  
  ## Tables Populated
  1. performance_reviews - Core review records
  2. review_responses - Individual question responses (self + manager)
  3. review_goals_comments - Achievements and development areas
  4. performance_review_history - Historical tracking for employee profiles
  
  ## Integration Points
  - Employee Directory Performance & Development tab
  - Review History section with full questionnaire details
  - Compensation tracking and approval workflows
*/

-- =====================================================
-- STEP 1: Ensure review cycles exist
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
    '11111111-1111-1111-1111-111111111111',
    'Annual 2024 Performance Review',
    'annual',
    '2024-01-01',
    '2024-12-31',
    '2025-01-31',
    'completed',
    10000,
    15,
    'Comprehensive annual review for 2024 with full compensation review and goal setting',
    '2024-01-02 08:00:00',
    '2025-01-20 17:00:00'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Q1 2025 Performance Review',
    'quarterly',
    '2025-01-01',
    '2025-03-31',
    '2025-04-15',
    'active',
    5000,
    10,
    'First quarter 2025 review assessing new year objectives and progress',
    '2025-01-02 08:00:00',
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- STEP 2: Delete existing reviews to start fresh
-- =====================================================

-- Clean up existing data to avoid duplicates
DELETE FROM review_responses WHERE review_id IN (SELECT id FROM performance_reviews);
DELETE FROM review_goals_comments WHERE review_id IN (SELECT id FROM performance_reviews);
DELETE FROM performance_review_history WHERE review_id IN (SELECT id FROM performance_reviews);
DELETE FROM performance_reviews WHERE review_cycle_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- =====================================================
-- STEP 3: Create performance reviews for all employees
-- =====================================================

DO $$
DECLARE
  v_employee record;
  v_review_id uuid;
  v_reviewer_id uuid;
  v_rating numeric;
  v_self_rating numeric;
  v_manager_rating numeric;
  v_review_count integer := 0;
  v_2024_cycle_id uuid := '11111111-1111-1111-1111-111111111111';
  v_2025_cycle_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Get a reviewer (use first admin/hr user or create default)
  SELECT id INTO v_reviewer_id FROM profiles WHERE role IN ('admin', 'hr_admin') LIMIT 1;
  IF v_reviewer_id IS NULL THEN
    SELECT id INTO v_reviewer_id FROM profiles WHERE email = 'robertsala@gmail.com' LIMIT 1;
  END IF;
  
  -- Loop through all employees
  FOR v_employee IN
    SELECT id, first_name, last_name, email, department
    FROM employees
    WHERE status = 'active'
    ORDER BY id
  LOOP
    -- ============================================
    -- Create Annual 2024 Review (Completed)
    -- ============================================
    v_review_id := gen_random_uuid();
    v_review_count := v_review_count + 1;
    
    -- Generate realistic ratings (3.5 to 5.0 scale)
    v_rating := 3.5 + (random() * 1.5);
    v_self_rating := v_rating + ((random() - 0.5) * 0.4); -- Self rating variance
    v_manager_rating := v_rating + ((random() - 0.5) * 0.3); -- Manager rating variance
    
    -- Clamp ratings to 1.0-5.0 range
    v_self_rating := GREATEST(1.0, LEAST(5.0, v_self_rating));
    v_manager_rating := GREATEST(1.0, LEAST(5.0, v_manager_rating));
    v_rating := GREATEST(1.0, LEAST(5.0, v_rating));
    
    -- Insert 2024 performance review
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
      v_2024_cycle_id,
      v_employee.id,
      v_reviewer_id,
      'annual',
      'completed',
      v_self_rating,
      '2025-01-10 17:00:00',
      v_manager_rating,
      '2025-01-15 17:00:00',
      v_rating,
      '2025-01-20 17:00:00',
      '2024-01-02 08:00:00',
      now()
    );
    
    -- ============================================
    -- Create Q1 2025 Review (In Progress)
    -- ============================================
    v_review_id := gen_random_uuid();
    v_review_count := v_review_count + 1;
    
    -- Generate new ratings for 2025
    v_rating := 3.5 + (random() * 1.5);
    v_self_rating := v_rating + ((random() - 0.5) * 0.4);
    v_manager_rating := v_rating + ((random() - 0.5) * 0.3);
    
    v_self_rating := GREATEST(1.0, LEAST(5.0, v_self_rating));
    v_manager_rating := GREATEST(1.0, LEAST(5.0, v_manager_rating));
    v_rating := GREATEST(1.0, LEAST(5.0, v_rating));
    
    -- Insert 2025 performance review (some completed, some in progress)
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
      v_2025_cycle_id,
      v_employee.id,
      v_reviewer_id,
      'quarterly',
      CASE 
        WHEN random() < 0.7 THEN 'completed'  -- 70% completed
        WHEN random() < 0.5 THEN 'pending_manager'
        ELSE 'pending_employee'
      END,
      v_self_rating,
      CASE WHEN random() < 0.7 THEN now() - interval '5 days' ELSE NULL END,
      v_manager_rating,
      CASE WHEN random() < 0.7 THEN now() - interval '2 days' ELSE NULL END,
      CASE WHEN random() < 0.7 THEN v_rating ELSE NULL END,
      CASE WHEN random() < 0.7 THEN now() - interval '1 day' ELSE NULL END,
      '2025-01-02 08:00:00',
      now()
    );
    
  END LOOP;
  
  RAISE NOTICE 'Created % performance reviews for all employees', v_review_count;
END $$;

-- =====================================================
-- STEP 4: Populate review responses (questionnaire)
-- =====================================================

DO $$
DECLARE
  v_review record;
  v_question record;
  v_response_count integer := 0;
  v_question_rating numeric;
BEGIN
  -- For each completed review, generate responses for all questions
  FOR v_review IN
    SELECT 
      pr.id as review_id, 
      pr.employee_id, 
      pr.self_overall_rating, 
      pr.manager_overall_rating
    FROM performance_reviews pr
    WHERE pr.status = 'completed'
    AND pr.review_cycle_id IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )
  LOOP
    -- Generate responses for each question in the library
    FOR v_question IN
      SELECT id, question_text, category, weight, sort_order
      FROM review_questions_library
      WHERE is_active = true
      ORDER BY sort_order
      LIMIT 12
    LOOP
      -- ============================================
      -- Insert SELF-ASSESSMENT response
      -- ============================================
      v_question_rating := v_review.self_overall_rating + ((random() - 0.5) * 0.6);
      v_question_rating := GREATEST(1.0, LEAST(5.0, v_question_rating));
      
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
        v_question_rating,
        CASE
          WHEN v_question_rating >= 4.5 THEN
            'I consistently exceed expectations in this area. I take initiative, deliver exceptional results, and actively contribute to team success. I have demonstrated strong capabilities and look forward to continued growth.'
          WHEN v_question_rating >= 4.0 THEN
            'I perform well in this area and consistently meet all objectives. I deliver quality work on time and collaborate effectively with my team. I am proud of my contributions and accomplishments.'
          WHEN v_question_rating >= 3.5 THEN
            'I meet expectations in this area with solid performance. I complete my assigned tasks satisfactorily and contribute to team goals. I see opportunities for continued improvement and development.'
          ELSE
            'I recognize this as an area where I can improve. I am committed to developing my skills and capabilities further. I appreciate feedback and guidance to help me grow in this competency.'
        END
      );
      
      v_response_count := v_response_count + 1;
      
      -- ============================================
      -- Insert MANAGER ASSESSMENT response
      -- ============================================
      v_question_rating := v_review.manager_overall_rating + ((random() - 0.5) * 0.6);
      v_question_rating := GREATEST(1.0, LEAST(5.0, v_question_rating));
      
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
        v_question_rating,
        CASE
          WHEN v_question_rating >= 4.5 THEN
            'Outstanding performance in this competency. Consistently delivers exceptional results and serves as a role model for others. Demonstrates mastery and goes above and beyond expectations. A valuable team contributor.'
          WHEN v_question_rating >= 4.0 THEN
            'Strong performance demonstrated. Meets and often exceeds expectations with quality work. Shows good judgment and reliability. Contributes positively to team dynamics and project success.'
          WHEN v_question_rating >= 3.5 THEN
            'Good performance that meets core expectations. Completes assigned work satisfactorily with room for continued growth. Shows potential for development with focused effort and support.'
          ELSE
            'Satisfactory performance with identified areas for improvement. Would benefit from additional coaching and development in this area. We will work together to create a focused improvement plan.'
        END
      );
      
      v_response_count := v_response_count + 1;
      
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % review responses (self + manager assessments)', v_response_count;
END $$;

-- =====================================================
-- STEP 5: Populate goals and comments
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
    WHEN pr.final_rating >= 4.7 THEN
      'Exceptional performance throughout the review period. Successfully led multiple high-impact projects resulting in significant business value. Demonstrated outstanding technical expertise and leadership capabilities. Effectively mentored junior team members and contributed to team development. Received positive feedback from stakeholders and colleagues.'
    WHEN pr.final_rating >= 4.3 THEN
      'Strong performance across all key areas. Completed all assigned projects on time and within scope with high quality. Contributed positively to team objectives and organizational goals. Showed excellent problem-solving skills and adaptability. Built strong relationships with colleagues and stakeholders.'
    WHEN pr.final_rating >= 4.0 THEN
      'Good performance meeting expectations consistently. Delivered quality work on assigned projects and tasks. Collaborated effectively with team members. Demonstrated reliability and commitment to role responsibilities. Showed growth in key competency areas.'
    WHEN pr.final_rating >= 3.5 THEN
      'Met core job responsibilities and contributed to team goals. Completed assigned tasks satisfactorily. Showed effort in meeting basic requirements and maintaining performance standards. Participated in team activities and initiatives.'
    ELSE
      'Completed essential job functions. Showed effort in meeting requirements with some areas needing improvement. Worked to address feedback and develop skills. Maintained communication with manager regarding progress and challenges.'
  END,
  CASE
    WHEN pr.final_rating >= 4.7 THEN
      'Focus on strategic thinking and cross-functional collaboration to prepare for senior leadership roles. Continue to refine executive presence and influence skills. Explore opportunities to drive innovation and organizational change.'
    WHEN pr.final_rating >= 4.3 THEN
      'Continue developing leadership and mentorship capabilities. Take on more complex cross-functional projects to expand expertise. Build deeper strategic thinking skills and industry knowledge.'
    WHEN pr.final_rating >= 4.0 THEN
      'Enhance leadership skills and take ownership of larger initiatives. Improve strategic planning and execution capabilities. Develop expertise in emerging technologies and methodologies relevant to role.'
    WHEN pr.final_rating >= 3.5 THEN
      'Improve time management and organizational skills. Seek more proactive communication with stakeholders. Build technical competencies through training and hands-on practice. Focus on consistency in quality delivery.'
    ELSE
      'Focus on core skill development and consistent delivery of quality work. Improve attention to detail and follow-through on commitments. Seek regular feedback and actively work on identified improvement areas. Build stronger relationships with team members.'
  END,
  CASE
    WHEN pr.final_rating >= 4.7 THEN
      'Lead enterprise-level initiatives with significant business impact. Mentor and develop team members to build organizational capability. Drive innovation in key technical and strategic areas. Expand influence across departments and contribute to company-wide initiatives.'
    WHEN pr.final_rating >= 4.3 THEN
      'Take ownership of larger, more complex projects with broader scope. Enhance cross-team collaboration and stakeholder management. Develop deep expertise in specialized areas. Contribute to strategic planning and decision-making processes.'
    WHEN pr.final_rating >= 4.0 THEN
      'Improve project delivery consistency and quality standards. Build stronger relationships with key stakeholders. Enhance technical capabilities through targeted learning. Take on stretch assignments to develop new skills.'
    WHEN pr.final_rating >= 3.5 THEN
      'Meet all core performance expectations consistently. Complete required training programs and certifications. Deliver assigned work on time with improved quality. Build proficiency in core job competencies.'
    ELSE
      'Achieve consistent performance at expected levels. Complete development plan objectives on schedule. Improve communication and collaboration with team. Demonstrate growth in priority skill areas identified for development.'
  END
FROM performance_reviews pr
WHERE pr.status = 'completed'
AND pr.review_cycle_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT (review_id) DO NOTHING;

-- =====================================================
-- STEP 6: Populate performance_review_history
-- =====================================================

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
  gc.achievements,
  gc.development_areas,
  gc.goals_next_period
FROM performance_reviews pr
JOIN review_cycles rc ON rc.id = pr.review_cycle_id
LEFT JOIN review_goals_comments gc ON gc.review_id = pr.id
WHERE pr.status = 'completed'
AND pr.review_cycle_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT (review_id) DO UPDATE SET
  final_rating = EXCLUDED.final_rating,
  self_rating = EXCLUDED.self_rating,
  manager_rating = EXCLUDED.manager_rating,
  review_date = EXCLUDED.review_date,
  completion_status = EXCLUDED.completion_status,
  key_achievements = EXCLUDED.key_achievements,
  development_areas = EXCLUDED.development_areas,
  goals_next_period = EXCLUDED.goals_next_period;

-- =====================================================
-- STEP 7: Summary Report
-- =====================================================

DO $$
DECLARE
  v_employee_count integer;
  v_review_count integer;
  v_completed_review_count integer;
  v_response_count integer;
  v_history_count integer;
BEGIN
  SELECT COUNT(DISTINCT id) INTO v_employee_count FROM employees WHERE status = 'active';
  SELECT COUNT(*) INTO v_review_count FROM performance_reviews 
    WHERE review_cycle_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
  SELECT COUNT(*) INTO v_completed_review_count FROM performance_reviews 
    WHERE status = 'completed' 
    AND review_cycle_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
  SELECT COUNT(*) INTO v_response_count FROM review_responses 
    WHERE review_id IN (SELECT id FROM performance_reviews WHERE review_cycle_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'));
  SELECT COUNT(*) INTO v_history_count FROM performance_review_history 
    WHERE cycle_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Performance Review Population Complete';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Total Active Employees: %', v_employee_count;
  RAISE NOTICE 'Total Reviews Created: %', v_review_count;
  RAISE NOTICE 'Completed Reviews: %', v_completed_review_count;
  RAISE NOTICE 'Total Question Responses: %', v_response_count;
  RAISE NOTICE 'Performance History Records: %', v_history_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Review Cycles:';
  RAISE NOTICE '  - Annual 2024: All % employees with completed reviews', v_employee_count;
  RAISE NOTICE '  - Q1 2025: All % employees with active/completed reviews', v_employee_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Each completed review includes:';
  RAISE NOTICE '  - 12 questions with self-assessment responses';
  RAISE NOTICE '  - 12 questions with manager assessment responses';
  RAISE NOTICE '  - Goals, achievements, and development areas';
  RAISE NOTICE '  - Performance history for employee profiles';
  RAISE NOTICE '========================================================';
END $$;
