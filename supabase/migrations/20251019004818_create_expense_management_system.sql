/*
  # Create Expense Management System

  1. New Tables
    - `expense_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (Travel, Meals, Office Supplies, etc.)
      - `description` (text) - Category description
      - `requires_receipt` (boolean) - Whether receipt is required
      - `max_amount_without_approval` (numeric) - Auto-approve threshold
      - `active` (boolean) - Whether category is active
      - `created_at` (timestamptz)
    
    - `expenses`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `category_id` (uuid, references expense_categories)
      - `amount` (numeric) - Expense amount
      - `currency` (text) - Currency code (default: USD)
      - `expense_date` (date) - Date of expense
      - `merchant` (text) - Vendor/merchant name
      - `description` (text) - Expense description
      - `receipt_url` (text) - URL to receipt image
      - `status` (text) - pending, approved, rejected, reimbursed
      - `submitted_at` (timestamptz) - When expense was submitted
      - `submitted_by` (uuid) - User who submitted (for HR proxy submissions)
      - `manager_approved_by` (uuid) - Manager who approved
      - `manager_approved_at` (timestamptz)
      - `hr_approved_by` (uuid) - HR who approved
      - `hr_approved_at` (timestamptz)
      - `rejection_reason` (text) - Reason for rejection
      - `payroll_period_id` (uuid) - Link to payroll period for reimbursement
      - `reimbursed_at` (timestamptz) - When reimbursement was processed
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `expense_approvals`
      - `id` (uuid, primary key)
      - `expense_id` (uuid, references expenses)
      - `approver_id` (uuid, references profiles)
      - `approval_type` (text) - manager, hr, cfo
      - `status` (text) - pending, approved, rejected
      - `decision_at` (timestamptz)
      - `comments` (text)
      - `created_at` (timestamptz)
    
    - `employee_expense_access`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `enabled` (boolean) - Whether employee can submit expenses
      - `max_single_expense` (numeric) - Maximum single expense amount
      - `monthly_limit` (numeric) - Monthly expense limit
      - `enabled_at` (timestamptz)
      - `enabled_by` (uuid) - HR who granted access
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for employees to view/submit their own expenses
    - Add policies for managers to approve expenses for their reports
    - Add policies for HR to manage all expenses
    - Add policies for CFO to review expenses
*/

-- Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  requires_receipt boolean DEFAULT true,
  max_amount_without_approval numeric(10,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "HR and admins can manage expense categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  category_id uuid REFERENCES expense_categories(id),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  expense_date date NOT NULL,
  merchant text NOT NULL,
  description text NOT NULL,
  receipt_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  submitted_at timestamptz DEFAULT now(),
  submitted_by uuid REFERENCES profiles(id),
  manager_approved_by uuid REFERENCES profiles(id),
  manager_approved_at timestamptz,
  hr_approved_by uuid REFERENCES profiles(id),
  hr_approved_at timestamptz,
  rejection_reason text,
  payroll_period_id uuid,
  reimbursed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Employees can update their pending expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  );

CREATE POLICY "Managers can view expenses for their reports"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.manager_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR and admins can view all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'cfo')
    )
  );

CREATE POLICY "HR and admins can manage all expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Expense Approvals Table
CREATE TABLE IF NOT EXISTS expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES profiles(id),
  approval_type text NOT NULL CHECK (approval_type IN ('manager', 'hr', 'cfo')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_at timestamptz,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view approvals for their expenses"
  ON expense_approvals FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN employees emp ON e.employee_id = emp.id
      WHERE emp.user_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can view their assigned approvals"
  ON expense_approvals FOR SELECT
  TO authenticated
  USING (approver_id = auth.uid());

CREATE POLICY "Approvers can update their assigned approvals"
  ON expense_approvals FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid() AND status = 'pending');

CREATE POLICY "HR can manage all approvals"
  ON expense_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Employee Expense Access Table
CREATE TABLE IF NOT EXISTS employee_expense_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  enabled boolean DEFAULT false,
  max_single_expense numeric(10,2),
  monthly_limit numeric(10,2),
  enabled_at timestamptz,
  enabled_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_expense_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own expense access"
  ON employee_expense_access FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "HR can manage employee expense access"
  ON employee_expense_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Insert default expense categories
INSERT INTO expense_categories (name, description, requires_receipt, max_amount_without_approval) VALUES
  ('Travel', 'Business travel expenses including flights, hotels, car rentals', true, 0),
  ('Meals & Entertainment', 'Business meals and client entertainment', true, 75),
  ('Office Supplies', 'Office supplies and equipment', true, 50),
  ('Software & Subscriptions', 'Software licenses and subscriptions', true, 0),
  ('Professional Development', 'Training, conferences, certifications', true, 0),
  ('Mileage', 'Business mileage reimbursement', false, 100),
  ('Phone & Internet', 'Mobile phone and internet expenses', true, 100),
  ('Other', 'Other business expenses', true, 0)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_at ON expenses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense_id ON expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver_id ON expense_approvals(approver_id);
