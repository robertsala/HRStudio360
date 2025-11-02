/*
  # Add Access Level System and Enhance Employee Data

  ## Overview
  This migration adds a comprehensive access level system and enhances the existing
  employees table with additional fields needed for a complete HRIS.

  ## 1. Table Enhancements

  ### Enhance `employees` table
  Add missing fields for complete employee records:
  - `first_name` (text) - Employee first name
  - `last_name` (text) - Employee last name
  - `email` (text) - Work email
  - `phone` (text) - Phone number
  - `job_title` (text) - Job title as text
  - `location` (text) - Work location
  - `hourly_rate` (numeric) - For hourly employees
  - `profile_picture_url` (text) - Profile picture

  ## 2. New Tables

  ### `access_levels`
  Defines system access levels:
  - Employee (priority: 10)
  - Manager (priority: 30)
  - HR Staff (priority: 50)
  - HR Administrator (priority: 70)
  - Product Owner (priority: 100)

  ### `employee_access_permissions`
  Links employees to access levels with granular permissions

  ## 3. Security
  All tables have RLS enabled with appropriate policies
*/

-- Add new columns to employees table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='first_name') THEN
    ALTER TABLE employees ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='last_name') THEN
    ALTER TABLE employees ADD COLUMN last_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='email') THEN
    ALTER TABLE employees ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='phone') THEN
    ALTER TABLE employees ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='job_title') THEN
    ALTER TABLE employees ADD COLUMN job_title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='location') THEN
    ALTER TABLE employees ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='hourly_rate') THEN
    ALTER TABLE employees ADD COLUMN hourly_rate numeric(6,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='profile_picture_url') THEN
    ALTER TABLE employees ADD COLUMN profile_picture_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='employment_status') THEN
    ALTER TABLE employees ADD COLUMN employment_status text DEFAULT 'Active';
  END IF;
END $$;

-- Create access levels table
CREATE TABLE IF NOT EXISTS access_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  priority integer UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create employee access permissions table
CREATE TABLE IF NOT EXISTS employee_access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  access_level_id uuid NOT NULL REFERENCES access_levels(id) ON DELETE CASCADE,
  can_view_all_employees boolean DEFAULT false,
  can_view_compensation boolean DEFAULT false,
  can_view_performance boolean DEFAULT false,
  can_edit_employees boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_org_chart boolean DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT unique_employee_access UNIQUE (employee_id, access_level_id)
);

-- Enable RLS on new tables
ALTER TABLE access_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_levels
CREATE POLICY "Authenticated users can view access levels"
  ON access_levels FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for employee_access_permissions
CREATE POLICY "Users can view own permissions"
  ON employee_access_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_access_permissions.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all permissions"
  ON employee_access_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM employee_access_permissions eap
      JOIN employees emp ON emp.id = eap.employee_id
      WHERE emp.user_id = auth.uid()
      AND eap.can_manage_users = true
    )
  );

CREATE POLICY "Admins can insert permissions"
  ON employee_access_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM employee_access_permissions eap
      JOIN employees emp ON emp.id = eap.employee_id
      WHERE emp.user_id = auth.uid()
      AND eap.can_manage_users = true
    )
  );

CREATE POLICY "Admins can update permissions"
  ON employee_access_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM employee_access_permissions eap
      JOIN employees emp ON emp.id = eap.employee_id
      WHERE emp.user_id = auth.uid()
      AND eap.can_manage_users = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM employee_access_permissions eap
      JOIN employees emp ON emp.id = eap.employee_id
      WHERE emp.user_id = auth.uid()
      AND eap.can_manage_users = true
    )
  );

CREATE POLICY "Admins can delete permissions"
  ON employee_access_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM employee_access_permissions eap
      JOIN employees emp ON emp.id = eap.employee_id
      WHERE emp.user_id = auth.uid()
      AND eap.can_manage_users = true
    )
  );

-- Insert default access levels
INSERT INTO access_levels (name, code, description, priority) VALUES
  ('Employee', 'employee', 'Basic employee access - can view own data and company directory', 10),
  ('Manager', 'manager', 'Can view and manage direct reports and team data', 30),
  ('HR Staff', 'hr_staff', 'Can view and edit employee data, compensation, and performance', 50),
  ('HR Administrator', 'hr_admin', 'Full HR system access including user management and reports', 70),
  ('Product Owner', 'product_owner', 'Complete system access with all administrative privileges', 100)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_permissions_employee_id ON employee_access_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_permissions_access_level_id ON employee_access_permissions(access_level_id);