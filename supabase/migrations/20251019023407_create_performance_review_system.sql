/*
  # Performance Review System

  ## Overview
  Creates a comprehensive performance review system with:
  - Self-assessment tracking
  - Manager assessment tracking
  - Review cycles and periods
  - HR visibility into completion status
  - Rating categories and questions

  ## New Tables

  ### `review_cycles`
  - `id` (uuid, primary key)
  - `name` (text) - e.g., "2025 Annual Review", "Q1 2025 Review"
  - `review_type` (text) - 'annual', 'quarterly', 'probationary'
  - `start_date` (date)
  - `end_date` (date)
  - `self_assessment_deadline` (date)
  - `manager_assessment_deadline` (date)
  - `status` (text) - 'draft', 'active', 'completed', 'archived'
  - `created_at` (timestamptz)
  - `created_by` (uuid) - references profiles
  - `updated_at` (timestamptz)

  ### `performance_reviews`
  - `id` (uuid, primary key)
  - `review_cycle_id` (uuid) - references review_cycles
  - `employee_id` (uuid) - references profiles (employee being reviewed)
  - `manager_id` (uuid) - references profiles (employee's manager)
  - `self_assessment_status` (text) - 'not_started', 'in_progress', 'submitted'
  - `self_assessment_submitted_at` (timestamptz)
  - `manager_assessment_status` (text) - 'not_started', 'in_progress', 'submitted'
  - `manager_assessment_submitted_at` (timestamptz)
  - `hr_review_status` (text) - 'pending', 'reviewed', 'approved'
  - `hr_reviewed_by` (uuid) - references profiles
  - `hr_reviewed_at` (timestamptz)
  - `overall_status` (text) - 'pending_self', 'pending_manager', 'pending_hr', 'completed'
  - `self_overall_rating` (numeric) - calculated from self responses
  - `manager_overall_rating` (numeric) - calculated from manager responses
  - `final_rating` (numeric) - HR approved final rating
  - `compensation_change` (numeric) - recommended salary/wage increase
  - `compensation_change_approved` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `review_questions`
  - `id` (uuid, primary key)
  - `category` (text) - e.g., 'Job Performance', 'Goal Achievement'
  - `question_text` (text)
  - `weight` (numeric) - for calculating overall score
  - `is_active` (boolean)
  - `sort_order` (integer)
  - `created_at` (timestamptz)

  ### `review_responses`
  - `id` (uuid, primary key)
  - `performance_review_id` (uuid) - references performance_reviews
  - `question_id` (uuid) - references review_questions
  - `response_type` (text) - 'self_assessment', 'manager_assessment'
  - `rating` (integer) - 1-5 scale
  - `comments` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `review_goals_comments`
  - `id` (uuid, primary key)
  - `performance_review_id` (uuid) - references performance_reviews
  - `comment_type` (text) - 'self_assessment', 'manager_assessment'
  - `achievements` (text)
  - `development_areas` (text)
  - `goals_next_period` (text)
  - `additional_comments` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Employees can read their own reviews and submit self-assessments
  - Managers can read/write reviews for their direct reports
  - HR can read/write all reviews
  - Admins have full access
*/

-- Create review_cycles table
CREATE TABLE IF NOT EXISTS review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  review_type text NOT NULL CHECK (review_type IN ('annual', 'quarterly', 'probationary', 'mid_year')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  self_assessment_deadline date NOT NULL,
  manager_assessment_deadline date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES profiles(id),
  self_assessment_status text NOT NULL DEFAULT 'not_started' CHECK (self_assessment_status IN ('not_started', 'in_progress', 'submitted')),
  self_assessment_submitted_at timestamptz,
  manager_assessment_status text NOT NULL DEFAULT 'not_started' CHECK (manager_assessment_status IN ('not_started', 'in_progress', 'submitted')),
  manager_assessment_submitted_at timestamptz,
  hr_review_status text NOT NULL DEFAULT 'pending' CHECK (hr_review_status IN ('pending', 'reviewed', 'approved')),
  hr_reviewed_by uuid REFERENCES profiles(id),
  hr_reviewed_at timestamptz,
  overall_status text NOT NULL DEFAULT 'pending_self' CHECK (overall_status IN ('pending_self', 'pending_manager', 'pending_hr', 'completed')),
  self_overall_rating numeric(3,2),
  manager_overall_rating numeric(3,2),
  final_rating numeric(3,2),
  compensation_change numeric(10,2),
  compensation_change_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_cycle_id, employee_id)
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create review_questions table
CREATE TABLE IF NOT EXISTS review_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question_text text NOT NULL,
  weight numeric(3,2) NOT NULL DEFAULT 0.05 CHECK (weight > 0 AND weight <= 1),
  is_active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_questions ENABLE ROW LEVEL SECURITY;

-- Create review_responses table
CREATE TABLE IF NOT EXISTS review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_review_id uuid NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES review_questions(id),
  response_type text NOT NULL CHECK (response_type IN ('self_assessment', 'manager_assessment')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(performance_review_id, question_id, response_type)
);

ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Create review_goals_comments table
CREATE TABLE IF NOT EXISTS review_goals_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_review_id uuid NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  comment_type text NOT NULL CHECK (comment_type IN ('self_assessment', 'manager_assessment')),
  achievements text,
  development_areas text,
  goals_next_period text,
  additional_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(performance_review_id, comment_type)
);

ALTER TABLE review_goals_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_cycles
CREATE POLICY "HR and admins can manage review cycles"
  ON review_cycles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "All authenticated users can view active review cycles"
  ON review_cycles
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR status = 'completed');

-- RLS Policies for performance_reviews
CREATE POLICY "Employees can view their own reviews"
  ON performance_reviews
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view reviews for their direct reports"
  ON performance_reviews
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    employee_id IN (
      SELECT id FROM employees WHERE manager_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR and admins can view all reviews"
  ON performance_reviews
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "HR and admins can manage all reviews"
  ON performance_reviews
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "Employees can update their own review status"
  ON performance_reviews
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can update reviews for their reports"
  ON performance_reviews
  FOR UPDATE
  TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- RLS Policies for review_questions
CREATE POLICY "All authenticated users can view active questions"
  ON review_questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage review questions"
  ON review_questions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

-- RLS Policies for review_responses
CREATE POLICY "Employees can manage their self-assessment responses"
  ON review_responses
  FOR ALL
  TO authenticated
  USING (
    response_type = 'self_assessment' AND
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage manager assessment responses"
  ON review_responses
  FOR ALL
  TO authenticated
  USING (
    response_type = 'manager_assessment' AND
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "HR and admins can view all responses"
  ON review_responses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "Employees can view responses for their own reviews"
  ON review_responses
  FOR SELECT
  TO authenticated
  USING (
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view responses for their reports' reviews"
  ON review_responses
  FOR SELECT
  TO authenticated
  USING (
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE manager_id = auth.uid()
    )
  );

-- RLS Policies for review_goals_comments
CREATE POLICY "Employees can manage their self-assessment comments"
  ON review_goals_comments
  FOR ALL
  TO authenticated
  USING (
    comment_type = 'self_assessment' AND
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage manager assessment comments"
  ON review_goals_comments
  FOR ALL
  TO authenticated
  USING (
    comment_type = 'manager_assessment' AND
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "HR and admins can view all comments"
  ON review_goals_comments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "Employees can view comments for their own reviews"
  ON review_goals_comments
  FOR SELECT
  TO authenticated
  USING (
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view comments for their reports' reviews"
  ON review_goals_comments
  FOR SELECT
  TO authenticated
  USING (
    performance_review_id IN (
      SELECT id FROM performance_reviews WHERE manager_id = auth.uid()
    )
  );

-- Insert default performance review questions
INSERT INTO review_questions (category, question_text, weight, sort_order) VALUES
  ('Job Performance & Quality', 'Consistently delivers high-quality work that meets or exceeds expectations', 0.15, 1),
  ('Job Performance & Quality', 'Completes tasks efficiently and manages time effectively', 0.10, 2),
  ('Goal Achievement', 'Successfully achieved individual goals and objectives set for this review period', 0.15, 3),
  ('Goal Achievement', 'Takes initiative and goes beyond basic job requirements', 0.05, 4),
  ('Communication & Collaboration', 'Communicates clearly and effectively with team members and stakeholders', 0.10, 5),
  ('Communication & Collaboration', 'Works collaboratively and contributes positively to team dynamics', 0.10, 6),
  ('Problem Solving & Innovation', 'Identifies problems and proposes effective solutions', 0.08, 7),
  ('Problem Solving & Innovation', 'Demonstrates creativity and innovative thinking', 0.07, 8),
  ('Leadership & Influence', 'Shows leadership qualities and positively influences others', 0.07, 9),
  ('Professional Development', 'Actively seeks opportunities for learning and professional growth', 0.05, 10),
  ('Adaptability', 'Adapts well to changes and handles challenges effectively', 0.05, 11),
  ('Company Values', 'Demonstrates company values and contributes to positive culture', 0.03, 12)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_manager ON performance_reviews(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_cycle ON performance_reviews(review_cycle_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(overall_status);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(performance_review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_type ON review_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_review_goals_review ON review_goals_comments(performance_review_id);