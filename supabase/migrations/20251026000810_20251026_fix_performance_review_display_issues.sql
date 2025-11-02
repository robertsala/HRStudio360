/*
  # Fix Performance Review Display Issues

  ## Summary
  This migration fixes several issues with the performance review system display:
  
  1. Updates the 2024 review cycle status to 'completed' (currently showing as 'active')
  2. Ensures performance review data is properly displayed in both:
     - ComprehensivePerformanceReviewModal (HR Dashboard)
     - ComprehensiveEmployeeProfileModal (Employee Profile - Performance & Development tab)

  ## Changes
  1. Update Annual 2024 Performance Review cycle status to 'completed'
  2. Verify all required data exists in performance_review_history table
  
  ## Notes
  - The 2024 cycle should show as completed with reviews in various states
  - The 2025 cycle should show as active with 0 reviews
  - Employee profiles should display review history from performance_review_history table
*/

-- =====================================================
-- STEP 1: Update 2024 review cycle to completed status
-- =====================================================

UPDATE review_cycles
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = 'aaaa0004-0004-0004-0004-000000000004'
  AND name = 'Annual 2024 Performance Review';

-- =====================================================
-- STEP 2: Verify performance_review_history data exists
-- =====================================================

-- Check if Demo and Robert have complete review history
DO $$
DECLARE
  v_demo_count INTEGER;
  v_robert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_demo_count
  FROM performance_review_history prh
  JOIN profiles p ON p.id = prh.employee_id
  WHERE p.email = 'demohrstudio360@gmail.com';

  SELECT COUNT(*) INTO v_robert_count
  FROM performance_review_history prh
  JOIN profiles p ON p.id = prh.employee_id
  WHERE p.email = 'robertsala@gmail.com';

  RAISE NOTICE 'Demo Account review history count: %', v_demo_count;
  RAISE NOTICE 'Robert Sala review history count: %', v_robert_count;

  IF v_demo_count = 0 THEN
    RAISE WARNING 'Demo Account has no performance review history!';
  END IF;

  IF v_robert_count = 0 THEN
    RAISE WARNING 'Robert Sala has no performance review history!';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Display summary statistics
-- =====================================================

DO $$
DECLARE
  v_2024_reviews INTEGER;
  v_2025_reviews INTEGER;
  v_completed_2024 INTEGER;
BEGIN
  -- Count 2024 reviews
  SELECT COUNT(*) INTO v_2024_reviews
  FROM performance_reviews
  WHERE review_cycle_id = 'aaaa0004-0004-0004-0004-000000000004';

  SELECT COUNT(*) INTO v_completed_2024
  FROM performance_reviews
  WHERE review_cycle_id = 'aaaa0004-0004-0004-0004-000000000004'
    AND overall_status = 'completed';

  -- Count 2025 reviews
  SELECT COUNT(*) INTO v_2025_reviews
  FROM performance_reviews
  WHERE review_cycle_id = 'aaaa0005-0005-0005-0005-000000000005';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Performance Review Summary:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '2024 Annual Review - Total: %, Completed: %', v_2024_reviews, v_completed_2024;
  RAISE NOTICE '2025 Annual Review - Total: %', v_2025_reviews;
  RAISE NOTICE '========================================';
END $$;
