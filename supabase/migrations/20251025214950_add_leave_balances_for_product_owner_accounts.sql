/*
  # Add Leave Balances for Product Owner Accounts

  ## Overview
  Adds leave balances for both Demo and Robert Sala accounts so they can
  fully demonstrate and use the Time & Leave Management features.

  ## Changes Made
  - Create leave_balances entries for both accounts
  - Set generous leave balances for demonstration purposes
  - Set year to current year

  ## Expected Outcome
  - Both accounts can view and manage their leave balances
  - Leave request features will work properly
*/

-- Add leave balances for both Demo and Robert Sala accounts
INSERT INTO leave_balances (
  employee_id,
  vacation_days,
  sick_days,
  personal_days,
  year,
  created_at,
  updated_at
)
SELECT 
  e.id,
  20.0,
  10.0,
  5.0,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  now(),
  now()
FROM employees e
WHERE e.email IN ('robertsala@gmail.com', 'demohrstudio360@gmail.com')
ON CONFLICT (employee_id, year) DO UPDATE
SET 
  vacation_days = 20.0,
  sick_days = 10.0,
  personal_days = 5.0,
  updated_at = now();
