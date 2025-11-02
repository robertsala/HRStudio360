/*
  # Comprehensive Performance Review System with Full Integration

  ## Overview
  Creates a production-ready, SOC-2 compliant performance review system with:
  - Complete review lifecycle management (self-assessment + manager assessment + multi-level approvals)
  - Automatic compensation history integration
  - Employee profile performance tab integration
  - Payroll system integration
  - Question library with standard and custom templates
  - Comprehensive audit trail for compliance
  - Notification and reminder system
  - Multi-level approval workflow (Manager → HR → Executive)

  ## New Tables

  ### Core Review Tables
  
  1. **review_cycles** (enhanced from existing)
  - Manages review periods with deadlines
  - Tracks cycle status and participant selection criteria
  
  2. **review_cycle_participants**
  - Links employees to specific review cycles
  - Tracks individual deadlines and completion status
  
  3. **review_question_templates**
  - Stores question templates (standard, department-specific, role-specific)
  
  4. **review_questions_library**
  - Central repository of all review questions
  
  5. **review_question_assignments**
  - Links questions to templates
  
  ### Compensation Integration Tables
  
  6. **compensation_history**
  - Complete salary change history for each employee
  - Links to performance reviews that triggered changes
  
  7. **compensation_approvals**
  - Multi-stage approval workflow tracking
  - Manager → HR → Executive approval chain
  
  8. **payroll_changes_queue**
  - Queue for payroll system updates
  - Tracks processing status and sync errors
  
  ### Support Tables
  
  9. **review_reminders**
  - Tracks all sent notifications and reminders
  
  10. **review_audit_log**
  - Comprehensive audit trail for SOC-2 compliance
  
  11. **review_notifications_queue**
  - Manages email and in-app notifications
  
  12. **performance_review_history**
  - Links completed reviews to employee profiles
  
  ## Integration Points
  
  - Automatic updates to employees.salary on executive approval
  - Compensation history tracking for employee profiles
  - Performance tab data aggregation
  - Payroll system notifications
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Employees can view only their own data
  - Managers can view their direct reports
  - HR and admins have full access
  - Comprehensive audit logging
*/

-- =====================================================
-- STEP 1: Enhance existing review_cycles table
-- =====================================================

-- Add new columns to existing review_cycles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'review_cycles' AND column_name = 'employee_selection_criteria') THEN
    ALTER TABLE review_cycles ADD COLUMN employee_selection_criteria jsonb DEFAULT '{"type": "all"}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'review_cycles' AND column_name = 'notification_settings') THEN
    ALTER TABLE review_cycles ADD COLUMN notification_settings jsonb DEFAULT '{"reminders": [14, 7, 3, 1]}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'review_cycles' AND column_name = 'approval_threshold_amount') THEN
    ALTER TABLE review_cycles ADD COLUMN approval_threshold_amount numeric(10, 2) DEFAULT 5000.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'review_cycles' AND column_name = 'approval_threshold_percentage') THEN
    ALTER TABLE review_cycles ADD COLUMN approval_threshold_percentage numeric(5, 2) DEFAULT 10.00;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Create review_cycle_participants table
-- =====================================================

CREATE TABLE IF NOT EXISTS review_cycle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  self_assessment_deadline date NOT NULL,
  manager_assessment_deadline date NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  self_started_at timestamptz,
  self_completed_at timestamptz,
  manager_started_at timestamptz,
  manager_completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending_self' CHECK (status IN ('pending_self', 'pending_manager', 'pending_hr', 'pending_executive', 'completed')),
  is_overdue boolean DEFAULT false,
  reminder_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_cycle_id, employee_id)
);

ALTER TABLE review_cycle_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_cycle_participants_cycle ON review_cycle_participants(review_cycle_id);
CREATE INDEX IF NOT EXISTS idx_review_cycle_participants_employee ON review_cycle_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_review_cycle_participants_status ON review_cycle_participants(status);

-- =====================================================
-- STEP 3: Create question library tables
-- =====================================================

-- Question templates (standard, department-specific, role-specific)
CREATE TABLE IF NOT EXISTS review_question_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('standard', 'department', 'role')),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  job_role text,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(template_name)
);

ALTER TABLE review_question_templates ENABLE ROW LEVEL SECURITY;

-- Question library
CREATE TABLE IF NOT EXISTS review_questions_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  category text NOT NULL,
  question_type text NOT NULL DEFAULT 'rating' CHECK (question_type IN ('rating', 'text', 'yes_no', 'multiple_choice')),
  weight numeric(3, 2) NOT NULL DEFAULT 0.05 CHECK (weight > 0 AND weight <= 1),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE review_questions_library ENABLE ROW LEVEL SECURITY;

-- Question assignments (links questions to templates)
CREATE TABLE IF NOT EXISTS review_question_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES review_question_templates(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES review_questions_library(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, question_id)
);

ALTER TABLE review_question_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create compensation integration tables
-- =====================================================

-- Compensation history
CREATE TABLE IF NOT EXISTS compensation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_id uuid REFERENCES performance_reviews(id) ON DELETE SET NULL,
  old_salary numeric(10, 2) NOT NULL,
  new_salary numeric(10, 2) NOT NULL,
  change_amount numeric(10, 2) NOT NULL,
  change_percentage numeric(5, 2) NOT NULL,
  effective_date date NOT NULL,
  reason text NOT NULL DEFAULT 'Performance Review',
  notes text,
  approved_by_manager uuid REFERENCES profiles(id),
  approved_by_hr uuid REFERENCES profiles(id),
  approved_by_executive uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE compensation_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_compensation_history_employee ON compensation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_compensation_history_review ON compensation_history(review_id);
CREATE INDEX IF NOT EXISTS idx_compensation_history_effective_date ON compensation_history(effective_date);

-- Multi-level compensation approvals
CREATE TABLE IF NOT EXISTS compensation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_review_id uuid NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_salary numeric(10, 2) NOT NULL,
  recommended_salary numeric(10, 2) NOT NULL,
  recommended_increase_amount numeric(10, 2) NOT NULL,
  recommended_increase_percentage numeric(5, 2) NOT NULL,
  
  -- Manager approval (automatic - manager creates the recommendation)
  manager_id uuid NOT NULL REFERENCES profiles(id),
  manager_justification text NOT NULL,
  manager_approved_at timestamptz DEFAULT now(),
  
  -- HR approval
  hr_approval_status text NOT NULL DEFAULT 'pending' CHECK (hr_approval_status IN ('pending', 'approved', 'rejected', 'modified')),
  hr_approved_by uuid REFERENCES profiles(id),
  hr_approved_at timestamptz,
  hr_comments text,
  hr_modified_amount numeric(10, 2),
  
  -- Executive approval (required for amounts above threshold)
  requires_executive_approval boolean DEFAULT false,
  executive_approval_status text DEFAULT 'pending' CHECK (executive_approval_status IN ('pending', 'approved', 'rejected', 'modified', 'not_required')),
  executive_approved_by uuid REFERENCES profiles(id),
  executive_approved_at timestamptz,
  executive_comments text,
  executive_modified_amount numeric(10, 2),
  
  -- Final outcome
  final_approved_amount numeric(10, 2),
  final_approval_status text NOT NULL DEFAULT 'pending' CHECK (final_approval_status IN ('pending', 'approved', 'rejected')),
  effective_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(performance_review_id)
);

ALTER TABLE compensation_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_compensation_approvals_review ON compensation_approvals(performance_review_id);
CREATE INDEX IF NOT EXISTS idx_compensation_approvals_employee ON compensation_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_compensation_approvals_hr_status ON compensation_approvals(hr_approval_status);
CREATE INDEX IF NOT EXISTS idx_compensation_approvals_exec_status ON compensation_approvals(executive_approval_status);

-- Payroll changes queue
CREATE TABLE IF NOT EXISTS payroll_changes_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compensation_history_id uuid REFERENCES compensation_history(id) ON DELETE SET NULL,
  old_rate numeric(10, 2) NOT NULL,
  new_rate numeric(10, 2) NOT NULL,
  effective_date date NOT NULL,
  change_reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_changes_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payroll_changes_queue_status ON payroll_changes_queue(status);
CREATE INDEX IF NOT EXISTS idx_payroll_changes_queue_effective_date ON payroll_changes_queue(effective_date);

-- =====================================================
-- STEP 5: Create support tables
-- =====================================================

-- Review reminders tracking
CREATE TABLE IF NOT EXISTS review_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES review_cycle_participants(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('cycle_start', 'self_reminder', 'self_overdue', 'manager_reminder', 'manager_overdue', 'escalation')),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  days_before_deadline integer,
  days_after_deadline integer,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_reminders_participant ON review_reminders(participant_id);
CREATE INDEX IF NOT EXISTS idx_review_reminders_recipient ON review_reminders(recipient_id);
CREATE INDEX IF NOT EXISTS idx_review_reminders_sent_at ON review_reminders(sent_at);

-- Comprehensive audit log
CREATE TABLE IF NOT EXISTS review_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'submit', 'approve', 'reject', 'modify', 'access', 'export')),
  entity_type text NOT NULL CHECK (entity_type IN ('review_cycle', 'performance_review', 'compensation_approval', 'question_template', 'employee_access')),
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_value jsonb,
  new_value jsonb,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_audit_log_entity ON review_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_review_audit_log_user ON review_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_review_audit_log_created_at ON review_audit_log(created_at);

-- Notification queue
CREATE TABLE IF NOT EXISTS review_notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('cycle_start', 'reminder', 'overdue', 'escalation', 'submission_received', 'approval_required', 'approved', 'rejected', 'completed')),
  subject text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  delivery_method text NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'in_app', 'both')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  scheduled_send_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_notifications_queue_recipient ON review_notifications_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_review_notifications_queue_status ON review_notifications_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_notifications_queue_scheduled ON review_notifications_queue(scheduled_send_at);

-- Performance review history (for employee profile integration)
CREATE TABLE IF NOT EXISTS performance_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  cycle_name text NOT NULL,
  review_period text NOT NULL,
  final_rating numeric(3, 2),
  self_rating numeric(3, 2),
  manager_rating numeric(3, 2),
  review_date date NOT NULL,
  completion_status text NOT NULL CHECK (completion_status IN ('completed', 'incomplete', 'archived')),
  compensation_change_amount numeric(10, 2),
  compensation_change_percentage numeric(5, 2),
  key_achievements text,
  development_areas text,
  goals_next_period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_id)
);

ALTER TABLE performance_review_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_performance_review_history_employee ON performance_review_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_review_history_cycle ON performance_review_history(cycle_id);
CREATE INDEX IF NOT EXISTS idx_performance_review_history_date ON performance_review_history(review_date);

-- =====================================================
-- STEP 6: Insert standard question template and questions
-- =====================================================

-- Create standard template
INSERT INTO review_question_templates (template_name, template_type, description, is_active)
VALUES ('Standard Performance Review Template', 'standard', 'Default template used for all employees unless overridden by department or role-specific templates', true)
ON CONFLICT (template_name) DO NOTHING;

-- Insert standard questions into library (these match the existing questions in review_questions table)
INSERT INTO review_questions_library (question_text, category, weight, sort_order) VALUES
  ('Consistently delivers high-quality work that meets or exceeds expectations', 'Job Performance & Quality', 0.15, 1),
  ('Completes tasks efficiently and manages time effectively', 'Job Performance & Quality', 0.10, 2),
  ('Successfully achieved individual goals and objectives set for this review period', 'Goal Achievement', 0.15, 3),
  ('Takes initiative and goes beyond basic job requirements', 'Goal Achievement', 0.05, 4),
  ('Communicates clearly and effectively with team members and stakeholders', 'Communication & Collaboration', 0.10, 5),
  ('Works collaboratively and contributes positively to team dynamics', 'Communication & Collaboration', 0.10, 6),
  ('Identifies problems and proposes effective solutions', 'Problem Solving & Innovation', 0.08, 7),
  ('Demonstrates creativity and innovative thinking', 'Problem Solving & Innovation', 0.07, 8),
  ('Shows leadership qualities and positively influences others', 'Leadership & Influence', 0.07, 9),
  ('Actively seeks opportunities for learning and professional growth', 'Professional Development', 0.05, 10),
  ('Adapts well to changes and handles challenges effectively', 'Adaptability', 0.05, 11),
  ('Demonstrates company values and contributes to positive culture', 'Company Values', 0.03, 12)
ON CONFLICT DO NOTHING;

-- Link questions to standard template
INSERT INTO review_question_assignments (template_id, question_id, sort_order, is_required)
SELECT 
  (SELECT id FROM review_question_templates WHERE template_name = 'Standard Performance Review Template'),
  q.id,
  q.sort_order,
  true
FROM review_questions_library q
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: RLS Policies - review_cycle_participants
-- =====================================================

CREATE POLICY "Employees can view their own participation"
  ON review_cycle_participants FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their reports participation"
  ON review_cycle_participants FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.user_id FROM employees e
      WHERE e.manager_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR and admins can manage all participants"
  ON review_cycle_participants FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

-- =====================================================
-- STEP 8: RLS Policies - question templates and library
-- =====================================================

CREATE POLICY "All authenticated users can view active question templates"
  ON review_question_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage question templates"
  ON review_question_templates FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "All authenticated users can view active questions"
  ON review_questions_library FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage questions library"
  ON review_questions_library FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "All authenticated users can view question assignments"
  ON review_question_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage question assignments"
  ON review_question_assignments FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

-- =====================================================
-- STEP 9: RLS Policies - compensation tables
-- =====================================================

CREATE POLICY "Employees can view their own compensation history"
  ON compensation_history FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their reports compensation history"
  ON compensation_history FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.user_id FROM employees e
      WHERE e.manager_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR and admins can manage all compensation history"
  ON compensation_history FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "Managers can view compensation approvals for their reports"
  ON compensation_approvals FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager', 'executive')
    )
  );

CREATE POLICY "Managers can create compensation approvals"
  ON compensation_approvals FOR INSERT
  TO authenticated
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "HR can update compensation approvals for HR stage"
  ON compensation_approvals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('hr_admin', 'hr_manager', 'admin')
    )
  );

CREATE POLICY "Executives can update compensation approvals for executive stage"
  ON compensation_approvals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('executive', 'admin')
    )
  );

CREATE POLICY "HR and admins can view payroll changes queue"
  ON payroll_changes_queue FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager', 'payroll')
    )
  );

CREATE POLICY "System can manage payroll changes queue"
  ON payroll_changes_queue FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin')
    )
  );

-- =====================================================
-- STEP 10: RLS Policies - support tables
-- =====================================================

CREATE POLICY "Users can view their own reminders"
  ON review_reminders FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can manage reminders"
  ON review_reminders FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

CREATE POLICY "Admins can view all audit logs"
  ON review_audit_log FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON review_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own notifications"
  ON review_notifications_queue FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can manage notifications"
  ON review_notifications_queue FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    ) OR recipient_id = auth.uid()
  );

CREATE POLICY "Employees can view their own performance history"
  ON performance_review_history FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their reports performance history"
  ON performance_review_history FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.user_id FROM employees e
      WHERE e.manager_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR and admins can manage all performance history"
  ON performance_review_history FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'hr_admin', 'hr_manager')
    )
  );

-- =====================================================
-- STEP 11: Create function for automatic compensation updates
-- =====================================================

-- This function is triggered when executive approval is finalized
CREATE OR REPLACE FUNCTION process_compensation_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_record RECORD;
  v_compensation_history_id uuid;
  v_performance_review_record RECORD;
BEGIN
  -- Only process if executive approval just changed to 'approved' 
  -- OR if executive approval not required and HR just approved
  IF (NEW.executive_approval_status = 'approved' AND OLD.executive_approval_status != 'approved')
     OR (NEW.requires_executive_approval = false AND NEW.hr_approval_status = 'approved' AND OLD.hr_approval_status != 'approved') THEN
    
    -- Set final approved amount
    IF NEW.executive_modified_amount IS NOT NULL THEN
      NEW.final_approved_amount := NEW.executive_modified_amount;
    ELSIF NEW.hr_modified_amount IS NOT NULL THEN
      NEW.final_approved_amount := NEW.hr_modified_amount;
    ELSE
      NEW.final_approved_amount := NEW.recommended_salary;
    END IF;
    
    NEW.final_approval_status := 'approved';
    NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE + INTERVAL '14 days');
    
    -- Get employee record
    SELECT * INTO v_employee_record
    FROM employees e
    WHERE e.user_id = NEW.employee_id;
    
    -- Get performance review record
    SELECT * INTO v_performance_review_record
    FROM performance_reviews
    WHERE id = NEW.performance_review_id;
    
    -- Insert into compensation_history
    INSERT INTO compensation_history (
      employee_id,
      review_id,
      old_salary,
      new_salary,
      change_amount,
      change_percentage,
      effective_date,
      reason,
      notes,
      approved_by_manager,
      approved_by_hr,
      approved_by_executive
    ) VALUES (
      NEW.employee_id,
      NEW.performance_review_id,
      NEW.current_salary,
      NEW.final_approved_amount,
      NEW.final_approved_amount - NEW.current_salary,
      ((NEW.final_approved_amount - NEW.current_salary) / NEW.current_salary * 100),
      NEW.effective_date,
      'Performance Review',
      'Approved through ' || (CASE WHEN NEW.requires_executive_approval THEN '3-level' ELSE '2-level' END) || ' approval process',
      NEW.manager_id,
      NEW.hr_approved_by,
      NEW.executive_approved_by
    ) RETURNING id INTO v_compensation_history_id;
    
    -- Update employee salary in employees table
    UPDATE employees
    SET salary = NEW.final_approved_amount,
        updated_at = now()
    WHERE user_id = NEW.employee_id;
    
    -- Update performance review
    UPDATE performance_reviews
    SET compensation_change = NEW.final_approved_amount - NEW.current_salary,
        compensation_change_approved = true,
        updated_at = now()
    WHERE id = NEW.performance_review_id;
    
    -- Insert into payroll_changes_queue
    INSERT INTO payroll_changes_queue (
      employee_id,
      compensation_history_id,
      old_rate,
      new_rate,
      effective_date,
      change_reason,
      status
    ) VALUES (
      NEW.employee_id,
      v_compensation_history_id,
      NEW.current_salary,
      NEW.final_approved_amount,
      NEW.effective_date,
      'Performance Review - Rating: ' || COALESCE(v_performance_review_record.final_rating::text, 'N/A'),
      'pending'
    );
    
    -- Insert into performance_review_history for employee profile
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
      compensation_change_percentage
    )
    SELECT 
      pr.id,
      pr.employee_id,
      pr.review_cycle_id,
      rc.name,
      EXTRACT(YEAR FROM rc.start_date)::text,
      pr.final_rating,
      pr.self_overall_rating,
      pr.manager_overall_rating,
      CURRENT_DATE,
      'completed',
      NEW.final_approved_amount - NEW.current_salary,
      ((NEW.final_approved_amount - NEW.current_salary) / NEW.current_salary * 100)
    FROM performance_reviews pr
    JOIN review_cycles rc ON pr.review_cycle_id = rc.id
    WHERE pr.id = NEW.performance_review_id
    ON CONFLICT (review_id) DO UPDATE
    SET compensation_change_amount = EXCLUDED.compensation_change_amount,
        compensation_change_percentage = EXCLUDED.compensation_change_percentage,
        updated_at = now();
    
    -- Create audit log entry
    INSERT INTO review_audit_log (
      action_type,
      entity_type,
      entity_id,
      user_id,
      description,
      new_value
    ) VALUES (
      'approve',
      'compensation_approval',
      NEW.id,
      COALESCE(NEW.executive_approved_by, NEW.hr_approved_by),
      'Compensation approval finalized. Salary updated from $' || NEW.current_salary || ' to $' || NEW.final_approved_amount,
      jsonb_build_object(
        'old_salary', NEW.current_salary,
        'new_salary', NEW.final_approved_amount,
        'effective_date', NEW.effective_date
      )
    );
    
    -- Queue notifications (to be sent by notification system)
    INSERT INTO review_notifications_queue (recipient_id, notification_type, subject, body, priority)
    VALUES (
      NEW.employee_id,
      'approved',
      'Performance Review - Compensation Approved',
      'Congratulations! Your performance review has been completed and your compensation increase has been approved. Your new salary of $' || NEW.final_approved_amount || ' will be effective ' || NEW.effective_date || '.',
      'high'
    );
    
    INSERT INTO review_notifications_queue (recipient_id, notification_type, subject, body, priority)
    VALUES (
      NEW.manager_id,
      'approved',
      'Compensation Approval - ' || (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.employee_id),
      'The compensation increase you recommended has been approved. New salary: $' || NEW.final_approved_amount || ', effective ' || NEW.effective_date || '.',
      'normal'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic compensation processing
DROP TRIGGER IF EXISTS trigger_process_compensation_approval ON compensation_approvals;
CREATE TRIGGER trigger_process_compensation_approval
  BEFORE UPDATE ON compensation_approvals
  FOR EACH ROW
  EXECUTE FUNCTION process_compensation_approval();

-- =====================================================
-- STEP 12: Create helper views for integration
-- =====================================================

-- View for employee current compensation (for employee profiles)
CREATE OR REPLACE VIEW employee_compensation_current AS
SELECT 
  e.user_id as employee_id,
  e.salary as current_salary,
  ch.new_salary as last_change_salary,
  ch.change_amount as last_change_amount,
  ch.change_percentage as last_change_percentage,
  ch.effective_date as last_change_date,
  ch.reason as last_change_reason
FROM employees e
LEFT JOIN LATERAL (
  SELECT * FROM compensation_history
  WHERE employee_id = e.user_id
  ORDER BY effective_date DESC
  LIMIT 1
) ch ON true;

-- View for performance review summary (for employee profiles)
CREATE OR REPLACE VIEW employee_performance_summary AS
SELECT 
  employee_id,
  COUNT(*) as total_reviews,
  AVG(final_rating) as average_rating,
  MAX(review_date) as last_review_date,
  SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed_reviews
FROM performance_review_history
GROUP BY employee_id;

-- View for approval workflow status
CREATE OR REPLACE VIEW compensation_approval_status AS
SELECT 
  ca.id,
  ca.performance_review_id,
  ca.employee_id,
  p.first_name || ' ' || p.last_name as employee_name,
  ca.recommended_increase_amount,
  ca.recommended_increase_percentage,
  CASE 
    WHEN ca.final_approval_status = 'approved' THEN 'Approved'
    WHEN ca.executive_approval_status = 'rejected' OR ca.hr_approval_status = 'rejected' THEN 'Rejected'
    WHEN ca.requires_executive_approval AND ca.executive_approval_status = 'pending' THEN 'Pending Executive Approval'
    WHEN ca.hr_approval_status = 'pending' THEN 'Pending HR Approval'
    ELSE 'Pending Manager'
  END as current_stage,
  ca.manager_approved_at,
  ca.hr_approved_at,
  ca.executive_approved_at,
  ca.created_at
FROM compensation_approvals ca
JOIN profiles p ON ca.employee_id = p.id;
