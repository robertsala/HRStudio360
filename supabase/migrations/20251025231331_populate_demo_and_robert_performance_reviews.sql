/*
  # Create Performance Reviews for Demo and Robert Accounts
  
  ## Overview
  Creates comprehensive performance review records for:
  - Demo Account (demohrstudio360@gmail.com) - Rating: 4.2/5.0
  - Robert Sala - Product Owner (robertsala@gmail.com) - Rating: 4.7/5.0
  
  ## What This Migration Does
  
  1. **Review Questions** - Ensures 6 core competency questions exist
  2. **Performance Reviews** - Creates completed review records
  3. **Review Responses** - Generates self_assessment + manager_assessment responses
  4. **Performance Review History** - Creates Employee Profile integration records
  5. **Goals and Comments** - Adds achievement and development areas
  
  ## Data Created
  
  ### Demo Account
  - Final Rating: 4.2/5.0 | Self: 4.3 | Manager: 4.2
  - 12 review responses (6 questions x 2 response types)
  - Self and manager comments with achievements and goals
  - Review History entry for Profile tab display
  
  ### Robert Sala  
  - Final Rating: 4.7/5.0 | Self: 4.8 | Manager: 4.7
  - 12 review responses (6 questions x 2 response types)
  - Self and manager comments with achievements and goals
  - Review History entry for Profile tab display
  
  ## Integration
  - Performance Review System shows both reviews in HR Dashboard
  - Employee Profiles display ratings in Performance & Development tab
  - Review History section shows completed 2024 Annual Review
  - Both users can access all performance review features
*/

-- Ensure review questions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM review_questions LIMIT 1) THEN
    INSERT INTO review_questions (id, question_text, category, is_required, weight, is_active, sort_order, created_at)
    VALUES 
      (gen_random_uuid(), 'How would you rate the quality of work delivered?', 'performance', true, 1.0, true, 1, now()),
      (gen_random_uuid(), 'How effective are communication skills?', 'skills', true, 1.0, true, 2, now()),
      (gen_random_uuid(), 'How well does the employee collaborate with team members?', 'teamwork', true, 1.0, true, 3, now()),
      (gen_random_uuid(), 'How successfully were goals achieved this period?', 'goals', true, 1.0, true, 4, now()),
      (gen_random_uuid(), 'How would you rate technical/job-specific skills?', 'skills', true, 1.0, true, 5, now()),
      (gen_random_uuid(), 'How would you rate leadership and initiative?', 'leadership', true, 1.0, true, 6, now());
  END IF;
END $$;

-- Create performance reviews
DO $$
DECLARE
  v_cycle_id uuid := 'aaaa0004-0004-0004-0004-000000000004';
  v_demo_id uuid := 'fd470cf0-2c89-413a-865c-69af50e716e4';
  v_robert_id uuid := '8bc0f289-c22a-4dba-bbfb-4ac801c11c09';
  v_ceo_id uuid;
  v_review_date date := '2025-10-25'::date;
  v_question_ids uuid[];
  v_demo_review_id uuid;
  v_robert_review_id uuid;
BEGIN
  -- Get CEO as manager
  SELECT user_id INTO v_ceo_id FROM employees WHERE employee_id = 'EMP1000' LIMIT 1;
  IF v_ceo_id IS NULL THEN v_ceo_id := v_demo_id; END IF;
  
  -- Get question IDs
  SELECT ARRAY_AGG(id ORDER BY sort_order) INTO v_question_ids 
  FROM review_questions WHERE is_active = true LIMIT 6;
  
  -- ====================
  -- Demo Account Review
  -- ====================
  v_demo_review_id := gen_random_uuid();
  
  INSERT INTO performance_reviews (
    id, review_cycle_id, employee_id, manager_id,
    self_assessment_status, self_assessment_submitted_at,
    manager_assessment_status, manager_assessment_submitted_at,
    hr_review_status, hr_reviewed_at, overall_status,
    self_overall_rating, manager_overall_rating, final_rating,
    created_at, updated_at
  ) VALUES (
    v_demo_review_id, v_cycle_id, v_demo_id, v_ceo_id,
    'submitted', v_review_date - interval '5 days',
    'submitted', v_review_date - interval '2 days',
    'approved', v_review_date, 'completed',
    4.3, 4.2, 4.2,
    v_review_date - interval '10 days', v_review_date
  );
  
  -- Demo: Review Responses
  FOR i IN 1..LEAST(6, array_length(v_question_ids, 1)) LOOP
    INSERT INTO review_responses (performance_review_id, question_id, response_type, rating, comments, created_at, updated_at)
    VALUES 
    (v_demo_review_id, v_question_ids[i], 'self_assessment', 
     CASE i WHEN 1 THEN 4.5 WHEN 2 THEN 4.0 WHEN 3 THEN 4.5 WHEN 4 THEN 4.0 WHEN 5 THEN 4.5 WHEN 6 THEN 4.0 END,
     CASE i 
       WHEN 1 THEN 'Consistently delivers high-quality work that meets or exceeds standards.'
       WHEN 2 THEN 'Communicates effectively with team members and stakeholders.'
       WHEN 3 THEN 'Strong team player who actively collaborates and supports colleagues.'
       WHEN 4 THEN 'Successfully achieved key objectives for the review period.'
       WHEN 5 THEN 'Demonstrates strong technical abilities and expands skill set.'
       WHEN 6 THEN 'Takes initiative on projects and shows leadership in team activities.'
     END,
     v_review_date - interval '5 days', v_review_date - interval '5 days'),
    (v_demo_review_id, v_question_ids[i], 'manager_assessment',
     CASE i WHEN 1 THEN 4.0 WHEN 2 THEN 4.5 WHEN 3 THEN 4.0 WHEN 4 THEN 4.5 WHEN 5 THEN 4.0 WHEN 6 THEN 4.5 END,
     CASE i
       WHEN 1 THEN 'Produces reliable, high-quality results with good attention to detail.'
       WHEN 2 THEN 'Clear and effective communicator who keeps everyone informed.'
       WHEN 3 THEN 'Excellent collaborator who contributes to team dynamics.'
       WHEN 4 THEN 'Successfully achieved annual objectives and team goals.'
       WHEN 5 THEN 'Solid technical foundation with good problem-solving abilities.'
       WHEN 6 THEN 'Shows good initiative and leadership potential.'
     END,
     v_review_date - interval '2 days', v_review_date - interval '2 days');
  END LOOP;
  
  -- Demo: Goals and Comments (self assessment)
  INSERT INTO review_goals_comments (
    performance_review_id, comment_type, achievements, development_areas, goals_next_period,
    additional_comments, created_at, updated_at
  ) VALUES (
    v_demo_review_id, 'self_assessment',
    'Consistently delivered quality work throughout the year. Successfully completed multiple high-priority projects. Maintained high performance standards.',
    'Continue developing advanced technical skills. Expand leadership capabilities through mentoring opportunities. Enhance strategic thinking.',
    'Lead a major initiative in Q1 2025. Mentor two junior team members. Complete advanced certification in core competency area.',
    'Looking forward to taking on more challenging projects and expanding my impact.',
    v_review_date - interval '5 days', v_review_date - interval '5 days'
  );
  
  -- Demo: Goals and Comments (manager assessment)
  INSERT INTO review_goals_comments (
    performance_review_id, comment_type, achievements, development_areas, goals_next_period,
    additional_comments, created_at, updated_at
  ) VALUES (
    v_demo_review_id, 'manager_assessment',
    'Demonstrated consistent high performance. Completed all major projects on time and within budget. Strong contributor to team success.',
    'Focus on developing leadership skills. Take ownership of larger initiatives. Continue building technical depth.',
    'Recommend leading Q1 initiative. Mentor junior staff members. Pursue professional development opportunities.',
    'Strong performer with excellent potential for growth. Recommend for advancement opportunities.',
    v_review_date - interval '2 days', v_review_date - interval '2 days'
  );
  
  -- Demo: Performance Review History
  INSERT INTO performance_review_history (
    review_id, employee_id, cycle_id, cycle_name, review_period,
    final_rating, self_rating, manager_rating, review_date, completion_status,
    key_achievements, development_areas, goals_next_period, created_at, updated_at
  ) VALUES (
    v_demo_review_id, v_demo_id, v_cycle_id,
    'Annual 2024 Performance Review', '2024-01-01 to 2024-12-31',
    4.2, 4.3, 4.2, v_review_date, 'completed',
    'Consistently delivered quality work throughout the year. Successfully completed multiple high-priority projects.',
    'Continue developing advanced technical skills. Expand leadership capabilities through mentoring opportunities.',
    'Lead a major initiative in Q1 2025. Mentor two junior team members.',
    v_review_date, v_review_date
  );
  
  -- ========================
  -- Robert Sala Review
  -- ========================
  v_robert_review_id := gen_random_uuid();
  
  INSERT INTO performance_reviews (
    id, review_cycle_id, employee_id, manager_id,
    self_assessment_status, self_assessment_submitted_at,
    manager_assessment_status, manager_assessment_submitted_at,
    hr_review_status, hr_reviewed_at, overall_status,
    self_overall_rating, manager_overall_rating, final_rating,
    created_at, updated_at
  ) VALUES (
    v_robert_review_id, v_cycle_id, v_robert_id, v_ceo_id,
    'submitted', v_review_date - interval '5 days',
    'submitted', v_review_date - interval '2 days',
    'approved', v_review_date, 'completed',
    4.8, 4.7, 4.7,
    v_review_date - interval '10 days', v_review_date
  );
  
  -- Robert: Review Responses
  FOR i IN 1..LEAST(6, array_length(v_question_ids, 1)) LOOP
    INSERT INTO review_responses (performance_review_id, question_id, response_type, rating, comments, created_at, updated_at)
    VALUES 
    (v_robert_review_id, v_question_ids[i], 'self_assessment',
     CASE i WHEN 1 THEN 5.0 WHEN 2 THEN 4.5 WHEN 3 THEN 5.0 WHEN 4 THEN 4.5 WHEN 5 THEN 5.0 WHEN 6 THEN 4.5 END,
     CASE i
       WHEN 1 THEN 'Consistently delivers exceptional quality work that exceeds expectations.'
       WHEN 2 THEN 'Effectively communicates complex ideas to diverse audiences.'
       WHEN 3 THEN 'Exemplary team player who actively mentors others.'
       WHEN 4 THEN 'Exceeded all major goals and drove significant product improvements.'
       WHEN 5 THEN 'Deep technical expertise with strong product management skills.'
       WHEN 6 THEN 'Proactively leads initiatives and demonstrates strong leadership.'
     END,
     v_review_date - interval '5 days', v_review_date - interval '5 days'),
    (v_robert_review_id, v_question_ids[i], 'manager_assessment',
     CASE i WHEN 1 THEN 4.5 WHEN 2 THEN 5.0 WHEN 3 THEN 4.5 WHEN 4 THEN 5.0 WHEN 5 THEN 4.5 WHEN 6 THEN 5.0 END,
     CASE i
       WHEN 1 THEN 'Exceptional work quality that consistently exceeds expectations.'
       WHEN 2 THEN 'Outstanding communicator who bridges technical and business perspectives.'
       WHEN 3 THEN 'Excellent collaborator and mentor who elevates team performance.'
       WHEN 4 THEN 'Significantly exceeded goals and delivered major enhancements.'
       WHEN 5 THEN 'Strong technical and product skills with excellent strategic vision.'
       WHEN 6 THEN 'Demonstrates exceptional leadership and owns critical initiatives.'
     END,
     v_review_date - interval '2 days', v_review_date - interval '2 days');
  END LOOP;
  
  -- Robert: Goals and Comments (self assessment)
  INSERT INTO review_goals_comments (
    performance_review_id, comment_type, achievements, development_areas, goals_next_period,
    additional_comments, created_at, updated_at
  ) VALUES (
    v_robert_review_id, 'self_assessment',
    'Led successful launch of major product features with exceptional results. Significantly improved user satisfaction metrics. Exceeded all quarterly OKRs. Mentored multiple team members effectively.',
    'Continue building executive presence and influence across organization. Expand strategic planning capabilities for multi-year roadmap. Develop deeper expertise in emerging technologies.',
    'Drive product vision for 2025-2026. Build and lead expanded product team. Achieve key business metrics targets. Present at major industry conference.',
    'Excited about the opportunities ahead and committed to driving continued product excellence.',
    v_review_date - interval '5 days', v_review_date - interval '5 days'
  );
  
  -- Robert: Goals and Comments (manager assessment)
  INSERT INTO review_goals_comments (
    performance_review_id, comment_type, achievements, development_areas, goals_next_period,
    additional_comments, created_at, updated_at
  ) VALUES (
    v_robert_review_id, 'manager_assessment',
    'Outstanding performance that significantly exceeded expectations. Delivered major product launches ahead of schedule with exceptional quality. Strong leadership and mentorship of team members.',
    'Ready for expanded scope and responsibility. Continue developing strategic leadership capabilities. Build executive presence for C-level interactions.',
    'Lead product vision and strategy. Expand team and organizational impact. Drive key business outcomes. Industry thought leadership.',
    'Exceptional performer who is ready for increased leadership responsibilities. Recommend for advancement and expanded role.',
    v_review_date - interval '2 days', v_review_date - interval '2 days'
  );
  
  -- Robert: Performance Review History
  INSERT INTO performance_review_history (
    review_id, employee_id, cycle_id, cycle_name, review_period,
    final_rating, self_rating, manager_rating, review_date, completion_status,
    key_achievements, development_areas, goals_next_period, created_at, updated_at
  ) VALUES (
    v_robert_review_id, v_robert_id, v_cycle_id,
    'Annual 2024 Performance Review', '2024-01-01 to 2024-12-31',
    4.7, 4.8, 4.7, v_review_date, 'completed',
    'Led successful launch of major product features. Significantly improved user satisfaction metrics. Exceeded all quarterly OKRs.',
    'Continue building executive presence. Expand strategic planning capabilities for multi-year roadmap.',
    'Drive product vision for 2025-2026. Build and lead expanded product team. Present at industry conference.',
    v_review_date, v_review_date
  );
  
  RAISE NOTICE 'Successfully created performance reviews for Demo and Robert accounts';
END $$;
