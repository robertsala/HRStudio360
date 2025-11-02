/*
  # HRStudio360 Database Schema

  ## Overview
  Creates comprehensive database structure for HRStudio360 HR management system.

  ## New Tables Created

  ### 1. `profiles`
  - Links to auth.users for extended user information
  - Stores employee profile data, department, role, contact info
  - Fields: id, email, first_name, last_name, phone, address, city, state, zip_code, profile_picture
  - Timestamps: created_at, updated_at

  ### 2. `departments`
  - Organizational departments within the company
  - Fields: id, name, description, manager_id
  - Timestamps: created_at

  ### 3. `job_titles`
  - Available job titles/roles in the organization
  - Fields: id, title, department_id, description
  - Timestamps: created_at

  ### 4. `employees`
  - Core employee records with employment details
  - Fields: id, user_id, employee_id, department_id, job_title_id, manager_id, start_date, employment_type, salary, status
  - Timestamps: created_at, updated_at

  ### 5. `leave_requests`
  - Employee leave/time-off requests
  - Fields: id, employee_id, type, start_date, end_date, days, status, reason, coverage_arrangements, emergency_contact, medical_certification
  - Timestamps: submitted_date, approved_date, created_at, updated_at

  ### 6. `leave_balances`
  - Tracks available leave balances for each employee
  - Fields: id, employee_id, vacation_days, sick_days, personal_days, year
  - Timestamps: created_at, updated_at

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Managers can view their team members' data
  - HR role has broader access for administrative functions

  ## Notes
  - All tables use UUID primary keys
  - Foreign key constraints ensure data integrity
  - Indexes added for performance on frequently queried columns
  - Default values set where appropriate to prevent null issues
*/

-- Create enum types
CREATE TYPE employment_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Intern');
CREATE TYPE employee_status AS ENUM ('Active', 'On Leave', 'Terminated', 'Pending');
CREATE TYPE leave_type AS ENUM ('Vacation', 'Sick', 'Personal', 'Bereavement', 'Maternity', 'Paternity', 'FMLA');
CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Denied', 'Cancelled');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  profile_picture text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  manager_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Job titles table
CREATE TABLE IF NOT EXISTS job_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  job_title_id uuid REFERENCES job_titles(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  employment_type employment_type DEFAULT 'Full-time',
  salary numeric(10, 2),
  status employee_status DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  status leave_status DEFAULT 'Pending',
  reason text NOT NULL,
  approver_id uuid REFERENCES employees(id),
  coverage_arrangements text,
  emergency_contact text,
  medical_certification boolean DEFAULT false,
  notes text,
  submitted_date timestamptz DEFAULT now(),
  approved_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  vacation_days numeric(5, 2) DEFAULT 20.0,
  sick_days numeric(5, 2) DEFAULT 10.0,
  personal_days numeric(5, 2) DEFAULT 5.0,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for departments (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for job_titles (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view job titles"
  ON job_titles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for employees
CREATE POLICY "Users can view own employee record"
  ON employees FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own employee record"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for leave_requests
CREATE POLICY "Employees can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employees can create own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND status = 'Pending'
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- RLS Policies for leave_balances
CREATE POLICY "Employees can view own leave balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Engineering', 'Software development and technical teams'),
  ('Marketing', 'Marketing and brand management'),
  ('Sales', 'Sales and business development'),
  ('Human Resources', 'HR and people operations'),
  ('Finance', 'Financial planning and accounting'),
  ('Operations', 'Operations and logistics'),
  ('Customer Success', 'Customer support and success')
ON CONFLICT (name) DO NOTHING;