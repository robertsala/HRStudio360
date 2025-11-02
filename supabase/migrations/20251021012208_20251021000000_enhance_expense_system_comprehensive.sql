/*
  # Comprehensive Expense Management System Enhancement

  ## Overview
  This migration significantly enhances the expense management system to support:
  - Employee reporting relationships with historical tracking
  - Expense enrollment and access control
  - Vendor/merchant master data management
  - Custom expense categories
  - Multi-level approval workflows
  - Payroll integration with expense batches
  - Comprehensive audit logging

  ## 1. New Tables

  ### `employee_reporting_relationships`
  Tracks direct report relationships between employees with full history:
  - `id` (uuid, primary key)
  - `employee_id` (uuid) - The employee
  - `manager_id` (uuid) - Their direct manager
  - `effective_from` (date) - When relationship started
  - `effective_to` (date) - When relationship ended (null if current)
  - `reason` (text) - Reason for change
  - `changed_by` (uuid) - Who made the change
  - `created_at` (timestamptz)

  ### `expense_vendors`
  Master list of vendors/merchants for consistency:
  - `id` (uuid, primary key)
  - `name` (text) - Vendor name
  - `category` (text) - Vendor type/category
  - `is_preferred` (boolean) - Preferred vendor flag
  - `is_active` (boolean) - Active status
  - `created_by` (uuid)
  - `created_at` (timestamptz)

  ### `custom_expense_categories`
  Company-specific expense categories:
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `description` (text)
  - `requires_receipt` (boolean)
  - `requires_manager_approval` (boolean)
  - `requires_hr_approval` (boolean)
  - `approval_threshold` (numeric) - Amount requiring extra approval
  - `icon` (text) - Icon identifier
  - `policy_document_url` (text)
  - `is_active` (boolean)
  - `created_by` (uuid)
  - `created_at` (timestamptz)

  ### `employee_expense_enrollment`
  Enhanced enrollment tracking with detailed permissions:
  - `id` (uuid, primary key)
  - `employee_id` (uuid, unique)
  - `is_enrolled` (boolean)
  - `enrollment_date` (timestamptz)
  - `max_single_expense` (numeric)
  - `monthly_limit` (numeric)
  - `allowed_categories` (text[]) - Array of allowed category IDs
  - `requires_receipt_over` (numeric) - Amount requiring receipt
  - `auto_approve_under` (numeric) - Auto-approval threshold
  - `notes` (text)
  - `enrolled_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `expense_approval_workflow`
  Tracks multi-level approval process:
  - `id` (uuid, primary key)
  - `expense_id` (uuid) - Links to expenses table
  - `level` (integer) - Approval level (1=manager, 2=hr, 3=cfo)
  - `approver_id` (uuid) - Who needs to approve
  - `approver_role` (text) - manager, hr, cfo
  - `status` (text) - pending, approved, rejected
  - `action_date` (timestamptz)
  - `comments` (text)
  - `notification_sent_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `expense_reimbursement_batches`
  Groups expenses for payroll processing:
  - `id` (uuid, primary key)
  - `batch_number` (text, unique)
  - `payroll_period_start` (date)
  - `payroll_period_end` (date)
  - `total_amount` (numeric)
  - `expense_count` (integer)
  - `status` (text) - draft, submitted, approved, processed
  - `processed_by` (uuid)
  - `processed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `expense_audit_log`
  Complete audit trail for all expense activities:
  - `id` (uuid, primary key)
  - `expense_id` (uuid)
  - `action` (text) - submitted, approved, rejected, modified, reimbursed
  - `actor_id` (uuid) - Who performed action
  - `actor_name` (text)
  - `old_values` (jsonb) - Previous state
  - `new_values` (jsonb) - New state
  - `notes` (text)
  - `ip_address` (text)
  - `created_at` (timestamptz)

  ### `reporting_relationship_history`
  Audit log for all manager changes:
  - `id` (uuid, primary key)
  - `employee_id` (uuid)
  - `old_manager_id` (uuid)
  - `new_manager_id` (uuid)
  - `change_reason` (text)
  - `effective_date` (date)
  - `changed_by` (uuid)
  - `created_at` (timestamptz)

  ## 2. Table Enhancements

  Add columns to existing `expenses` table:
  - `vendor_id` (uuid) - FK to expense_vendors
  - `reporting_to_at_submission` (uuid) - Manager at time of submission
  - `batch_id` (uuid) - FK to expense_reimbursement_batches
  - `policy_acknowledged` (boolean)
  - `project_code` (text)
  - `cost_center` (text)
  - `is_billable` (boolean)
  - `receipt_image_data` (text) - Base64 encoded receipt
  - `ocr_extracted_data` (jsonb)

  ## 3. Security
  - Enable RLS on all new tables
  - Policies for employees to view their own data
  - Policies for managers to view/approve direct reports' expenses
  - Policies for HR/Admin to manage all expense data
  - Audit logging for all sensitive operations

  ## 4. Important Notes
  - All reporting relationship changes are historized
  - Expense approvals follow the reporting structure at time of submission
  - Enrollment can be managed individually or by department/role
  - Payroll integration uses batch processing for efficiency
*/

-- Employee Reporting Relationships Table
CREATE TABLE IF NOT EXISTS employee_reporting_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  reason text,
  changed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Expense Vendors Table
CREATE TABLE IF NOT EXISTS expense_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  tax_id text,
  is_preferred boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Custom Expense Categories Table (more detailed than expense_categories)
CREATE TABLE IF NOT EXISTS custom_expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  requires_receipt boolean DEFAULT true,
  requires_manager_approval boolean DEFAULT true,
  requires_hr_approval boolean DEFAULT false,
  approval_threshold numeric(10,2) DEFAULT 0,
  icon text DEFAULT 'file-text',
  policy_document_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee Expense Enrollment Table (enhanced version)
CREATE TABLE IF NOT EXISTS employee_expense_enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  is_enrolled boolean DEFAULT false,
  enrollment_date timestamptz,
  max_single_expense numeric(10,2),
  monthly_limit numeric(10,2),
  allowed_categories text[],
  requires_receipt_over numeric(10,2) DEFAULT 25.00,
  auto_approve_under numeric(10,2) DEFAULT 0,
  notes text,
  enrolled_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expense Approval Workflow Table
CREATE TABLE IF NOT EXISTS expense_approval_workflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  approver_id uuid NOT NULL REFERENCES profiles(id),
  approver_role text NOT NULL CHECK (approver_role IN ('manager', 'hr', 'cfo', 'director')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  action_date timestamptz,
  comments text,
  notification_sent_at timestamptz,
  reminder_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Expense Reimbursement Batches Table
CREATE TABLE IF NOT EXISTS expense_reimbursement_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text NOT NULL UNIQUE,
  payroll_period_start date NOT NULL,
  payroll_period_end date NOT NULL,
  total_amount numeric(12,2) DEFAULT 0,
  expense_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'processed', 'paid')),
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expense Audit Log Table
CREATE TABLE IF NOT EXISTS expense_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'modified', 'reimbursed', 'cancelled', 'escalated')),
  actor_id uuid REFERENCES profiles(id),
  actor_name text,
  old_values jsonb,
  new_values jsonb,
  notes text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Reporting Relationship History Table
CREATE TABLE IF NOT EXISTS reporting_relationship_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  old_manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  new_manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  change_reason text,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  changed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Add columns to existing expenses table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='vendor_id') THEN
    ALTER TABLE expenses ADD COLUMN vendor_id uuid REFERENCES expense_vendors(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='reporting_to_at_submission') THEN
    ALTER TABLE expenses ADD COLUMN reporting_to_at_submission uuid REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='batch_id') THEN
    ALTER TABLE expenses ADD COLUMN batch_id uuid REFERENCES expense_reimbursement_batches(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='policy_acknowledged') THEN
    ALTER TABLE expenses ADD COLUMN policy_acknowledged boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='project_code') THEN
    ALTER TABLE expenses ADD COLUMN project_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='cost_center') THEN
    ALTER TABLE expenses ADD COLUMN cost_center text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='is_billable') THEN
    ALTER TABLE expenses ADD COLUMN is_billable boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='receipt_images') THEN
    ALTER TABLE expenses ADD COLUMN receipt_images text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='ocr_data') THEN
    ALTER TABLE expenses ADD COLUMN ocr_data jsonb;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE employee_reporting_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_expense_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reimbursement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_relationship_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_reporting_relationships
CREATE POLICY "Employees can view their own reporting relationships"
  ON employee_reporting_relationships FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Managers can view their direct reports relationships"
  ON employee_reporting_relationships FOR SELECT
  TO authenticated
  USING (
    manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "HR can manage all reporting relationships"
  ON employee_reporting_relationships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for expense_vendors
CREATE POLICY "Authenticated users can view active vendors"
  ON expense_vendors FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR can manage vendors"
  ON expense_vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for custom_expense_categories
CREATE POLICY "Authenticated users can view active categories"
  ON custom_expense_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR can manage custom categories"
  ON custom_expense_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for employee_expense_enrollment
CREATE POLICY "Employees can view their own enrollment"
  ON employee_expense_enrollment FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "HR can manage all enrollment"
  ON employee_expense_enrollment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for expense_approval_workflow
CREATE POLICY "Employees can view their expense approvals"
  ON expense_approval_workflow FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses 
      WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Approvers can view and update their assigned approvals"
  ON expense_approval_workflow FOR SELECT
  TO authenticated
  USING (approver_id = auth.uid());

CREATE POLICY "Approvers can update their approvals"
  ON expense_approval_workflow FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid() AND status = 'pending')
  WITH CHECK (approver_id = auth.uid());

CREATE POLICY "HR can manage all approvals"
  ON expense_approval_workflow FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for expense_reimbursement_batches
CREATE POLICY "Employees can view batches containing their expenses"
  ON expense_reimbursement_batches FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT batch_id FROM expenses 
      WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      AND batch_id IS NOT NULL
    )
  );

CREATE POLICY "HR and payroll can manage batches"
  ON expense_reimbursement_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'cfo')
    )
  );

-- RLS Policies for expense_audit_log
CREATE POLICY "Employees can view audit logs for their expenses"
  ON expense_audit_log FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses 
      WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "HR can view all audit logs"
  ON expense_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'cfo')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON expense_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for reporting_relationship_history
CREATE POLICY "Employees can view their own relationship history"
  ON reporting_relationship_history FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "HR can view all relationship history"
  ON reporting_relationship_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Insert sample vendors
INSERT INTO expense_vendors (name, category, is_preferred, is_active) VALUES
  ('Starbucks', 'Meals & Entertainment', false, true),
  ('Delta Airlines', 'Travel', true, true),
  ('United Airlines', 'Travel', true, true),
  ('Marriott Hotels', 'Lodging', true, true),
  ('Hilton Hotels', 'Lodging', true, true),
  ('Uber', 'Transportation', false, true),
  ('Lyft', 'Transportation', false, true),
  ('Amazon Business', 'Office Supplies', true, true),
  ('Staples', 'Office Supplies', true, true),
  ('FedEx', 'Shipping', false, true),
  ('UPS', 'Shipping', false, true),
  ('Shell Gas Station', 'Fuel', false, true),
  ('Chevron', 'Fuel', false, true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample custom expense categories
INSERT INTO custom_expense_categories (name, description, requires_receipt, requires_manager_approval, requires_hr_approval, approval_threshold, icon, display_order) VALUES
  ('Airfare', 'Commercial airline tickets for business travel', true, true, true, 1000.00, 'plane', 1),
  ('Hotel/Lodging', 'Hotel and accommodation expenses', true, true, false, 500.00, 'bed', 2),
  ('Ground Transportation', 'Taxi, rideshare, rental cars, parking', true, true, false, 200.00, 'car', 3),
  ('Business Meals', 'Client meetings and business meals', true, true, false, 100.00, 'utensils', 4),
  ('Office Supplies', 'Office equipment and supplies', true, false, false, 50.00, 'shopping-cart', 5),
  ('Software/SaaS', 'Software licenses and subscriptions', true, true, false, 500.00, 'code', 6),
  ('Training/Education', 'Professional development and training', true, true, true, 2000.00, 'graduation-cap', 7),
  ('Conference/Events', 'Conference registration and event fees', true, true, true, 1500.00, 'calendar', 8),
  ('Mobile/Internet', 'Mobile phone and internet reimbursement', true, false, false, 100.00, 'smartphone', 9),
  ('Mileage', 'Personal vehicle mileage reimbursement', false, true, false, 200.00, 'gauge', 10),
  ('Client Gifts', 'Gifts and entertainment for clients', true, true, true, 200.00, 'gift', 11),
  ('Other', 'Other miscellaneous business expenses', true, true, false, 100.00, 'file-text', 99)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_reporting_relationships_employee ON employee_reporting_relationships(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_reporting_relationships_manager ON employee_reporting_relationships(manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_reporting_relationships_dates ON employee_reporting_relationships(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_expense_vendors_active ON expense_vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_vendors_name ON expense_vendors(name);
CREATE INDEX IF NOT EXISTS idx_custom_expense_categories_active ON custom_expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_expense_enrollment_employee ON employee_expense_enrollment(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_expense_enrollment_enrolled ON employee_expense_enrollment(is_enrolled);
CREATE INDEX IF NOT EXISTS idx_expense_approval_workflow_expense ON expense_approval_workflow(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approval_workflow_approver ON expense_approval_workflow(approver_id);
CREATE INDEX IF NOT EXISTS idx_expense_approval_workflow_status ON expense_approval_workflow(status);
CREATE INDEX IF NOT EXISTS idx_expense_reimbursement_batches_status ON expense_reimbursement_batches(status);
CREATE INDEX IF NOT EXISTS idx_expense_reimbursement_batches_dates ON expense_reimbursement_batches(payroll_period_start, payroll_period_end);
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_expense ON expense_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_actor ON expense_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_reporting_relationship_history_employee ON reporting_relationship_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_batch ON expenses(batch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_reporting_to ON expenses(reporting_to_at_submission);

-- Function to get current manager for an employee
CREATE OR REPLACE FUNCTION get_current_manager(emp_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT manager_id 
    FROM employee_reporting_relationships 
    WHERE employee_id = emp_id 
      AND effective_from <= CURRENT_DATE 
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create approval workflow when expense is submitted
CREATE OR REPLACE FUNCTION create_expense_approval_workflow()
RETURNS TRIGGER AS $$
DECLARE
  manager_user_id uuid;
  hr_user_id uuid;
BEGIN
  -- Get the manager's user_id from reporting relationship
  SELECT e.user_id INTO manager_user_id
  FROM employees e
  WHERE e.id = NEW.reporting_to_at_submission;
  
  -- Create manager approval if manager exists
  IF manager_user_id IS NOT NULL THEN
    INSERT INTO expense_approval_workflow (expense_id, level, approver_id, approver_role, status)
    VALUES (NEW.id, 1, manager_user_id, 'manager', 'pending');
  END IF;
  
  -- If amount exceeds threshold, add HR approval
  IF NEW.amount > 1000 THEN
    SELECT id INTO hr_user_id
    FROM profiles
    WHERE role = 'hr'
    ORDER BY created_at
    LIMIT 1;
    
    IF hr_user_id IS NOT NULL THEN
      INSERT INTO expense_approval_workflow (expense_id, level, approver_id, approver_role, status)
      VALUES (NEW.id, 2, hr_user_id, 'hr', 'pending');
    END IF;
  END IF;
  
  -- Create audit log entry
  INSERT INTO expense_audit_log (expense_id, action, actor_id, new_values, notes)
  VALUES (NEW.id, 'submitted', NEW.submitted_by, to_jsonb(NEW), 'Expense submitted for approval');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create approval workflow on expense insert
DROP TRIGGER IF EXISTS trigger_create_expense_approval_workflow ON expenses;
CREATE TRIGGER trigger_create_expense_approval_workflow
  AFTER INSERT ON expenses
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION create_expense_approval_workflow();

-- Function to log expense status changes
CREATE OR REPLACE FUNCTION log_expense_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO expense_audit_log (expense_id, action, actor_id, old_values, new_values, notes)
    VALUES (
      NEW.id, 
      NEW.status,
      auth.uid(),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log status changes
DROP TRIGGER IF EXISTS trigger_log_expense_status_change ON expenses;
CREATE TRIGGER trigger_log_expense_status_change
  AFTER UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_status_change();
