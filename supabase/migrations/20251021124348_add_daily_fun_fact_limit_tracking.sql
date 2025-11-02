/*
  # Add Daily Fun Fact Limit Tracking

  ## Overview
  Implements a daily limit system for on-demand fun fact generation to preserve the excitement
  and surprise element of paycheck fun facts. Users can generate up to 3 fun facts per day
  through the refresh button, while paycheck-associated fun facts remain unlimited.

  ## Changes Made

  1. New Table: `daily_fun_fact_usage`
    - Tracks on-demand fun fact generations per employee per day
    - Fields: id, employee_id, generated_at, is_manual_generation
    - Indexes on employee_id and generated_at for efficient daily queries
    - Automatic cleanup of records older than 90 days

  2. Enhanced `employee_fun_fact_history` table
    - Add column to distinguish between paycheck and manual generations
    - Manual generations count toward daily limit; paycheck generations do not

  3. Security
    - RLS enabled with policies for employees to view own usage
    - Employees can insert their own usage records
    - System function to check daily usage count

  4. Configuration
    - Daily limit set to 3 manual generations
    - Limit resets at midnight UTC
*/

-- Add column to employee_fun_fact_history to track generation type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_fun_fact_history' 
    AND column_name = 'is_manual_generation'
  ) THEN
    ALTER TABLE employee_fun_fact_history 
    ADD COLUMN is_manual_generation boolean DEFAULT false;
  END IF;
END $$;

-- Create daily_fun_fact_usage table for tracking daily limits
CREATE TABLE IF NOT EXISTS daily_fun_fact_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  fun_fact_id uuid REFERENCES paycheck_fun_facts(id) ON DELETE SET NULL,
  is_manual_generation boolean DEFAULT true NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_fun_fact_usage_employee_date 
  ON daily_fun_fact_usage(employee_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_daily_fun_fact_usage_employee 
  ON daily_fun_fact_usage(employee_id);

-- Enable RLS
ALTER TABLE daily_fun_fact_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_fun_fact_usage
CREATE POLICY "Employees can view own daily usage"
  ON daily_fun_fact_usage FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Employees can insert own daily usage"
  ON daily_fun_fact_usage FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage all daily usage"
  ON daily_fun_fact_usage FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get daily usage count for an employee
CREATE OR REPLACE FUNCTION get_daily_fun_fact_count(emp_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count integer;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM daily_fun_fact_usage
  WHERE employee_id = emp_id
    AND is_manual_generation = true
    AND generated_at >= CURRENT_DATE
    AND generated_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Function to check if employee has reached daily limit
CREATE OR REPLACE FUNCTION has_reached_daily_limit(emp_id uuid, daily_limit integer DEFAULT 3)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count integer;
BEGIN
  usage_count := get_daily_fun_fact_count(emp_id);
  RETURN usage_count >= daily_limit;
END;
$$;

-- Function to clean up old usage records (keeps last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_fun_fact_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM daily_fun_fact_usage
  WHERE generated_at < CURRENT_DATE - INTERVAL '90 days';
END;
$$;

-- Create a scheduled job to run cleanup weekly (if pg_cron extension is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-fun-fact-usage',
      '0 0 * * 0',
      'SELECT cleanup_old_fun_fact_usage();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
END $$;
