/*
  # Fix Expense Enrollment RLS Policies

  ## Overview
  This migration fixes the Row Level Security policies on the employee_expense_enrollment table
  to allow Product Owners and other elevated roles to manage expense enrollments.

  ## Changes Made

  ### 1. Drop Existing Restrictive Policy
  - Removes the old "HR can manage all enrollment" policy that only allowed 'hr' and 'admin' roles

  ### 2. Create New Comprehensive Policy
  - Allows users with these roles to manage all enrollments:
    - admin
    - hr
    - Product Owner
    - HR Manager
    - Finance Manager
  - Covers SELECT, INSERT, UPDATE, and DELETE operations
  - Uses proper USING and WITH CHECK clauses for full control

  ## Security Notes
  - Maintains security by checking authenticated user's role
  - Only elevated roles can manage enrollments
  - Employees can still view their own enrollment through the existing policy
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "HR can manage all enrollment" ON employee_expense_enrollment;

-- Create comprehensive policy for enrollment management
CREATE POLICY "Admins and managers can manage all enrollments"
  ON employee_expense_enrollment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr', 'Product Owner', 'HR Manager', 'Finance Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr', 'Product Owner', 'HR Manager', 'Finance Manager')
    )
  );
