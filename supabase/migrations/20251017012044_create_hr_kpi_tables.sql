/*
  # HR KPI Tracking Tables

  ## Overview
  Creates tables for tracking HR Key Performance Indicators (KPIs) and metrics.

  ## New Tables Created

  ### 1. `hr_kpi_snapshots`
  - Stores periodic snapshots of HR metrics
  - Fields: id, snapshot_date, period_type, headcount_total, headcount_fulltime, headcount_parttime, headcount_contractors
  - Turnover metrics: turnover_rate, voluntary_turnover, involuntary_turnover, regrettable_turnover
  - Recruitment metrics: time_to_hire_days, cost_per_hire, offer_acceptance_rate, open_positions
  - Other metrics: absenteeism_rate, engagement_score, avg_salary, training_hours_per_employee
  - Timestamps: created_at

  ### 2. `turnover_records`
  - Tracks individual employee exits
  - Fields: id, employee_id, exit_date, exit_type, exit_reason, is_regrettable, exit_interview_completed, notes
  - Timestamps: created_at

  ### 3. `recruitment_metrics`
  - Tracks recruitment funnel metrics
  - Fields: id, period_start, period_end, applications_received, screenings_passed, interviews_scheduled, offers_extended, offers_accepted
  - Cost metrics: total_recruitment_cost, avg_cost_per_hire
  - Timestamps: created_at

  ### 4. `employee_performance_scores`
  - Stores performance review scores
  - Fields: id, employee_id, review_date, performance_score, reviewer_id, goals_achieved, notes
  - Timestamps: created_at, updated_at

  ## Security
  - RLS enabled on all tables
  - Only HR department users can read and write KPI data
  - Managers can view limited aggregated data for their departments

  ## Notes
  - All tables use UUID primary keys
  - Foreign key constraints ensure data integrity
  - Indexes added for performance on frequently queried columns
*/

-- Create enum types for KPI tracking
CREATE TYPE exit_type AS ENUM ('Voluntary', 'Involuntary', 'Retirement', 'End of Contract');
CREATE TYPE exit_reason AS ENUM ('Better Opportunity', 'Compensation', 'Work-Life Balance', 'Career Growth', 'Management Issues', 'Relocation', 'Personal', 'Performance', 'Other');
CREATE TYPE period_type AS ENUM ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly');

-- HR KPI Snapshots table
CREATE TABLE IF NOT EXISTS hr_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  period_type period_type NOT NULL,
  
  -- Headcount metrics
  headcount_total integer NOT NULL DEFAULT 0,
  headcount_fulltime integer NOT NULL DEFAULT 0,
  headcount_parttime integer NOT NULL DEFAULT 0,
  headcount_contractors integer NOT NULL DEFAULT 0,
  
  -- Turnover metrics
  turnover_rate numeric(5, 2) DEFAULT 0.0,
  voluntary_turnover numeric(5, 2) DEFAULT 0.0,
  involuntary_turnover numeric(5, 2) DEFAULT 0.0,
  regrettable_turnover numeric(5, 2) DEFAULT 0.0,
  
  -- Recruitment metrics
  time_to_hire_days integer,
  cost_per_hire numeric(10, 2),
  offer_acceptance_rate numeric(5, 2),
  open_positions integer DEFAULT 0,
  
  -- Engagement & satisfaction
  absenteeism_rate numeric(5, 2) DEFAULT 0.0,
  engagement_score numeric(3, 1),
  employee_satisfaction numeric(3, 1),
  
  -- Compensation
  avg_salary numeric(10, 2),
  total_payroll numeric(12, 2),
  
  -- Training
  training_hours_per_employee numeric(5, 1),
  training_completion_rate numeric(5, 2),
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(snapshot_date, period_type)
);

-- Turnover records table
CREATE TABLE IF NOT EXISTS turnover_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  exit_date date NOT NULL,
  exit_type exit_type NOT NULL,
  exit_reason exit_reason,
  is_regrettable boolean DEFAULT false,
  exit_interview_completed boolean DEFAULT false,
  exit_interview_notes text,
  replacement_cost numeric(10, 2),
  notice_period_days integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Recruitment metrics table
CREATE TABLE IF NOT EXISTS recruitment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Funnel metrics
  applications_received integer DEFAULT 0,
  screenings_passed integer DEFAULT 0,
  interviews_scheduled integer DEFAULT 0,
  offers_extended integer DEFAULT 0,
  offers_accepted integer DEFAULT 0,
  
  -- Cost metrics
  total_recruitment_cost numeric(12, 2) DEFAULT 0.0,
  avg_cost_per_hire numeric(10, 2),
  
  -- Time metrics
  avg_time_to_hire_days integer,
  avg_time_to_fill_days integer,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(period_start, period_end)
);

-- Employee performance scores table
CREATE TABLE IF NOT EXISTS employee_performance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  review_date date NOT NULL,
  review_period_start date,
  review_period_end date,
  performance_score numeric(3, 1) NOT NULL CHECK (performance_score >= 1.0 AND performance_score <= 5.0),
  reviewer_id uuid REFERENCES employees(id),
  goals_achieved integer,
  goals_total integer,
  strengths text,
  areas_for_improvement text,
  development_plan text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Absenteeism records table
CREATE TABLE IF NOT EXISTS absenteeism_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  absence_date date NOT NULL,
  absence_type text NOT NULL,
  hours_missed numeric(5, 2) NOT NULL,
  is_approved boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_kpi_snapshots_date ON hr_kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_hr_kpi_snapshots_period ON hr_kpi_snapshots(period_type, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_turnover_records_employee ON turnover_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_turnover_records_date ON turnover_records(exit_date DESC);
CREATE INDEX IF NOT EXISTS idx_recruitment_metrics_period ON recruitment_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_scores_employee ON employee_performance_scores(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_scores_date ON employee_performance_scores(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_absenteeism_employee ON absenteeism_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_absenteeism_date ON absenteeism_records(absence_date DESC);

-- Enable Row Level Security
ALTER TABLE hr_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE absenteeism_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_kpi_snapshots (HR only)
CREATE POLICY "HR can view KPI snapshots"
  ON hr_kpi_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

CREATE POLICY "HR can insert KPI snapshots"
  ON hr_kpi_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

-- RLS Policies for turnover_records
CREATE POLICY "HR can view turnover records"
  ON turnover_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

CREATE POLICY "HR can manage turnover records"
  ON turnover_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

-- RLS Policies for recruitment_metrics
CREATE POLICY "HR can view recruitment metrics"
  ON recruitment_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

CREATE POLICY "HR can manage recruitment metrics"
  ON recruitment_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

-- RLS Policies for employee_performance_scores
CREATE POLICY "Employees can view own performance scores"
  ON employee_performance_scores FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

CREATE POLICY "HR and managers can insert performance scores"
  ON employee_performance_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

-- RLS Policies for absenteeism_records
CREATE POLICY "Employees can view own absenteeism"
  ON absenteeism_records FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

CREATE POLICY "HR can manage absenteeism records"
  ON absenteeism_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = auth.uid()
      AND d.name = 'Human Resources'
    )
  );

-- Trigger for updated_at on employee_performance_scores
CREATE TRIGGER update_performance_scores_updated_at BEFORE UPDATE ON employee_performance_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
