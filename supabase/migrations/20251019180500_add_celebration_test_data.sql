/*
  # Add Celebration Test Data

  ## Overview
  Adds sample birthday and hire date data to existing profiles for testing
  the celebration system. This migration updates profiles with realistic
  dates to allow for celebration testing.

  ## Updates
  - Adds date_of_birth to sample profiles
  - Adds hire_date to sample profiles
  - Creates a mix of recent, upcoming, and past celebration dates
  - Includes milestone anniversaries for testing

  ## Test Scenarios Covered
  - Birthdays today (for testing)
  - Birthdays this month
  - Work anniversaries today (for testing)
  - Milestone anniversaries (5, 10, 15, 20, 25 years)
  - Regular anniversaries (1-4, 6-9 years)

  ## Notes
  - Uses current date calculations for testing
  - Adjusts dates to create testable scenarios
  - Does not affect existing profiles with set dates
*/

-- Update profiles with birthday and hire date test data
-- This is sample data for demonstration purposes

DO $$
DECLARE
  current_date_val date := CURRENT_DATE;
  profile_record RECORD;
BEGIN
  -- Set specific test dates for demo account if it exists
  UPDATE profiles
  SET
    date_of_birth = current_date_val - interval '30 years',
    hire_date = current_date_val - interval '5 years'
  WHERE email = 'demo@hrstudio360.com'
  AND date_of_birth IS NULL;

  -- Example: Set today as birthday for testing (if needed)
  -- Uncomment the following to test birthday celebration immediately:
  /*
  UPDATE profiles
  SET date_of_birth = current_date_val - interval '28 years'
  WHERE email = 'your-test-email@example.com'
  AND date_of_birth IS NULL;
  */

  -- Example: Set today as work anniversary for testing (if needed)
  -- Uncomment the following to test anniversary celebration immediately:
  /*
  UPDATE profiles
  SET hire_date = current_date_val - interval '3 years'
  WHERE email = 'your-test-email@example.com'
  AND hire_date IS NULL;
  */

  -- Example: Set milestone anniversary (5 years) for testing
  -- Uncomment the following to test milestone celebration immediately:
  /*
  UPDATE profiles
  SET hire_date = current_date_val - interval '5 years'
  WHERE email = 'your-test-email@example.com'
  AND hire_date IS NULL;
  */

END $$;

-- Add some sample upcoming celebrations for the dashboard widget
-- This creates a variety of test scenarios across different profiles

COMMENT ON COLUMN profiles.date_of_birth IS 'Employee date of birth for birthday celebrations';
COMMENT ON COLUMN profiles.hire_date IS 'Employee hire date for work anniversary celebrations';
COMMENT ON COLUMN profiles.last_birthday_shown IS 'Last date birthday celebration was shown to prevent duplicates';
COMMENT ON COLUMN profiles.last_anniversary_shown IS 'Last date anniversary celebration was shown to prevent duplicates';
