/*
  # Create Comprehensive Onboarding System

  ## Overview
  This migration creates a complete onboarding system that converts accepted candidates
  into new hire employees and assigns role-based tasks to new hires, departments, and managers.

  ## New Tables

  ### 1. `onboarding_templates`
  Template definitions for different roles/departments
  - `id` (uuid, primary key)
  - `name` (text) - Template name (e.g., "Software Engineer Onboarding")
  - `description` (text) - Template description
  - `role` (text) - Role this template applies to
  - `department` (text) - Department this template applies to
  - `active` (boolean) - Whether template is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `created_by` (uuid) - FK to profiles

  ### 2. `onboarding_template_tasks`
  Tasks within each template
  - `id` (uuid, primary key)
  - `template_id` (uuid) - FK to onboarding_templates
  - `title` (text) - Task title
  - `description` (text) - Task description
  - `assignee_type` (text) - Who gets this task: 'new_hire', 'manager', 'hr', 'it', 'facilities', 'payroll'
  - `due_days_from_start` (integer) - Days from start date when task is due
  - `priority` (text) - 'low', 'medium', 'high', 'critical'
  - `category` (text) - Task category (e.g., 'Paperwork', 'Equipment', 'Training')
  - `order_index` (integer) - Display order
  - `required` (boolean) - Whether task is required
  - `created_at` (timestamptz)

  ### 3. `new_hires`
  Tracks new hire employees during onboarding
  - `id` (uuid, primary key)
  - `employee_id` (uuid) - FK to employees (nullable until employee record created)
  - `candidate_id` (uuid) - Original candidate ID from hiring
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text)
  - `phone` (text)
  - `role` (text)
  - `department` (text)
  - `manager_id` (uuid) - FK to employees
  - `start_date` (date)
  - `salary` (numeric)
  - `employment_type` (text) - 'Full-time', 'Part-time', 'Contract'
  - `onboarding_template_id` (uuid) - FK to onboarding_templates
  - `status` (text) - 'pending', 'in_progress', 'completed'
  - `offer_accepted_date` (date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `onboarding_tasks`
  Actual task instances assigned to people
  - `id` (uuid, primary key)
  - `new_hire_id` (uuid) - FK to new_hires
  - `template_task_id` (uuid) - FK to onboarding_template_tasks
  - `title` (text)
  - `description` (text)
  - `assignee_id` (uuid) - FK to profiles (who needs to complete this)
  - `assignee_type` (text) - 'new_hire', 'manager', 'hr', 'it', 'facilities', 'payroll'
  - `due_date` (date)
  - `priority` (text)
  - `category` (text)
  - `status` (text) - 'pending', 'in_progress', 'completed', 'blocked'
  - `completed_at` (timestamptz)
  - `completed_by` (uuid) - FK to profiles
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - HR and managers can view and manage onboarding
  - New hires can view their own tasks
  - Department members can view tasks assigned to them

  ## Functions
  - Function to convert candidate to new hire and generate tasks
*/

-- Create onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  role text NOT NULL,
  department text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage onboarding templates"
  ON onboarding_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "All authenticated users can view active templates"
  ON onboarding_templates
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create onboarding template tasks table
CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  assignee_type text NOT NULL CHECK (assignee_type IN ('new_hire', 'manager', 'hr', 'it', 'facilities', 'payroll')),
  due_days_from_start integer DEFAULT 0,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text DEFAULT 'General',
  order_index integer DEFAULT 0,
  required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage template tasks"
  ON onboarding_template_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "All authenticated users can view template tasks"
  ON onboarding_template_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_templates
      WHERE onboarding_templates.id = template_id
      AND onboarding_templates.active = true
    )
  );

-- Create new hires table
CREATE TABLE IF NOT EXISTS new_hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  candidate_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role text NOT NULL,
  department text NOT NULL,
  manager_id uuid REFERENCES employees(id),
  start_date date NOT NULL,
  salary numeric DEFAULT 0,
  employment_type text DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
  onboarding_template_id uuid REFERENCES onboarding_templates(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  offer_accepted_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE new_hires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage new hires"
  ON new_hires
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "Managers can view their new hires"
  ON new_hires
  FOR SELECT
  TO authenticated
  USING (
    manager_id IN (
      SELECT id FROM employees
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "New hires can view their own record"
  ON new_hires
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Create onboarding tasks table
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_hire_id uuid NOT NULL REFERENCES new_hires(id) ON DELETE CASCADE,
  template_task_id uuid REFERENCES onboarding_template_tasks(id),
  title text NOT NULL,
  description text DEFAULT '',
  assignee_id uuid REFERENCES profiles(id),
  assignee_type text NOT NULL CHECK (assignee_type IN ('new_hire', 'manager', 'hr', 'it', 'facilities', 'payroll')),
  due_date date NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text DEFAULT 'General',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage all onboarding tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "Users can view and update their assigned tasks"
  ON onboarding_tasks
  FOR ALL
  TO authenticated
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

CREATE POLICY "Managers can view tasks for their new hires"
  ON onboarding_tasks
  FOR SELECT
  TO authenticated
  USING (
    new_hire_id IN (
      SELECT id FROM new_hires
      WHERE manager_id IN (
        SELECT id FROM employees
        WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Create function to convert candidate to new hire
CREATE OR REPLACE FUNCTION convert_candidate_to_new_hire(
  p_candidate_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_role text,
  p_department text,
  p_manager_id uuid,
  p_start_date date,
  p_salary numeric,
  p_employment_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_hire_id uuid;
  v_template_id uuid;
  v_template_task RECORD;
  v_assignee_id uuid;
  v_task_due_date date;
BEGIN
  -- Find appropriate onboarding template
  SELECT id INTO v_template_id
  FROM onboarding_templates
  WHERE role = p_role
    AND department = p_department
    AND active = true
  LIMIT 1;

  -- If no exact match, try department match
  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id
    FROM onboarding_templates
    WHERE department = p_department
      AND active = true
    LIMIT 1;
  END IF;

  -- Create new hire record
  INSERT INTO new_hires (
    candidate_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    department,
    manager_id,
    start_date,
    salary,
    employment_type,
    onboarding_template_id,
    status
  ) VALUES (
    p_candidate_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_role,
    p_department,
    p_manager_id,
    p_start_date,
    p_salary,
    p_employment_type,
    v_template_id,
    'in_progress'
  )
  RETURNING id INTO v_new_hire_id;

  -- Generate tasks from template if template exists
  IF v_template_id IS NOT NULL THEN
    FOR v_template_task IN
      SELECT * FROM onboarding_template_tasks
      WHERE template_id = v_template_id
      ORDER BY order_index
    LOOP
      -- Determine assignee based on assignee_type
      v_assignee_id := NULL;

      CASE v_template_task.assignee_type
        WHEN 'new_hire' THEN
          -- Will be assigned when new hire gets account
          v_assignee_id := NULL;
        WHEN 'manager' THEN
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE email = (SELECT email FROM employees WHERE id = p_manager_id)
            LIMIT 1
          );
        WHEN 'hr' THEN
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role = 'HR'
            LIMIT 1
          );
        ELSE
          -- For IT, facilities, payroll - assign to HR for now
          v_assignee_id := (
            SELECT id FROM profiles
            WHERE role = 'HR'
            LIMIT 1
          );
      END CASE;

      -- Calculate due date
      v_task_due_date := p_start_date + (v_template_task.due_days_from_start || ' days')::interval;

      -- Create task
      INSERT INTO onboarding_tasks (
        new_hire_id,
        template_task_id,
        title,
        description,
        assignee_id,
        assignee_type,
        due_date,
        priority,
        category,
        status
      ) VALUES (
        v_new_hire_id,
        v_template_task.id,
        v_template_task.title,
        v_template_task.description,
        v_assignee_id,
        v_template_task.assignee_type,
        v_task_due_date,
        v_template_task.priority,
        v_template_task.category,
        'pending'
      );
    END LOOP;
  END IF;

  RETURN v_new_hire_id;
END;
$$;

-- Insert default onboarding templates
INSERT INTO onboarding_templates (name, description, role, department, active)
VALUES
  ('Software Engineer Onboarding', 'Standard onboarding for software engineers', 'Software Engineer', 'Engineering', true),
  ('Marketing Manager Onboarding', 'Standard onboarding for marketing managers', 'Marketing Manager', 'Marketing', true),
  ('Sales Representative Onboarding', 'Standard onboarding for sales representatives', 'Sales Representative', 'Sales', true),
  ('HR Specialist Onboarding', 'Standard onboarding for HR specialists', 'HR Specialist', 'Human Resources', true),
  ('General Employee Onboarding', 'Default onboarding for all employees', 'General', 'General', true);

-- Insert default template tasks for Software Engineer
INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete I-9 Form',
  'Complete Section 1 of Form I-9 and provide required documentation',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  1,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete Tax Forms (W-4)',
  'Complete federal and state tax withholding forms',
  'new_hire',
  0,
  'critical',
  'Paperwork',
  2,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set up Direct Deposit',
  'Provide bank account information for direct deposit',
  'new_hire',
  1,
  'high',
  'Payroll',
  3,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Create Email Account',
  'Set up company email account and configure access',
  'it',
  -2,
  'critical',
  'IT Setup',
  4,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Laptop',
  'Assign and configure laptop with necessary software',
  'it',
  -1,
  'critical',
  'IT Setup',
  5,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set up Development Environment',
  'Install IDE, Git, Docker, and other development tools',
  'it',
  0,
  'high',
  'IT Setup',
  6,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Assign Desk and Phone',
  'Assign workspace, desk phone, and office supplies',
  'facilities',
  -1,
  'high',
  'Workspace',
  7,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Schedule Welcome Meeting',
  'Schedule 1:1 welcome meeting with new hire',
  'manager',
  0,
  'high',
  'Management',
  8,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Introduce to Team',
  'Introduce new hire to team members and schedule team lunch',
  'manager',
  1,
  'medium',
  'Management',
  9,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete Company Orientation',
  'Attend company orientation and culture training',
  'new_hire',
  1,
  'high',
  'Training',
  10,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Complete Security Training',
  'Complete required security and compliance training',
  'new_hire',
  3,
  'high',
  'Training',
  11,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Review Codebase and Documentation',
  'Review company codebase, coding standards, and technical documentation',
  'new_hire',
  5,
  'medium',
  'Training',
  12,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Set 30-day Goals',
  'Work with manager to set goals for first 30 days',
  'manager',
  3,
  'high',
  'Management',
  13,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
SELECT
  id,
  'Enroll in Benefits',
  'Review and enroll in health insurance and other benefits',
  'new_hire',
  14,
  'high',
  'Benefits',
  14,
  true
FROM onboarding_templates WHERE name = 'Software Engineer Onboarding';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_role_dept ON onboarding_templates(role, department);
CREATE INDEX IF NOT EXISTS idx_onboarding_template_tasks_template ON onboarding_template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_new_hires_status ON new_hires(status);
CREATE INDEX IF NOT EXISTS idx_new_hires_manager ON new_hires(manager_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_assignee ON onboarding_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_new_hire ON onboarding_tasks(new_hire_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
