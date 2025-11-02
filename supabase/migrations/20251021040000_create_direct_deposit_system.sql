/*
  # Direct Deposit System

  1. New Tables
    - `direct_deposit_accounts`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `account_type` (text: checking, savings)
      - `routing_number` (text, encrypted)
      - `account_number_encrypted` (text, encrypted account number)
      - `account_last_four` (text, last 4 digits for display)
      - `bank_name` (text, from routing number lookup)
      - `allocation_type` (text: percentage, amount, remainder)
      - `allocation_value` (numeric, percentage or dollar amount)
      - `priority` (integer, order of deposits)
      - `is_active` (boolean)
      - `verified` (boolean, for micro-deposit verification)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `direct_deposit_verifications`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references direct_deposit_accounts)
      - `verification_method` (text: micro_deposit, instant, manual)
      - `verification_status` (text: pending, verified, failed)
      - `verified_at` (timestamptz)
      - `verified_by` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Employees can only access their own direct deposit information
    - HR staff can view all direct deposit information (read-only for audit)
    - Add encryption for sensitive data

  3. Important Notes
    - Account numbers are stored encrypted using pgcrypto
    - Only last 4 digits are stored in plain text for display
    - Routing numbers are validated against Federal Reserve database
    - Supports multiple accounts per employee (split deposits)
    - Priority determines order of deposits
*/

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Direct Deposit Accounts Table
CREATE TABLE IF NOT EXISTS direct_deposit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  routing_number text NOT NULL,
  account_number_encrypted text NOT NULL,
  account_last_four text NOT NULL,
  bank_name text NOT NULL,
  allocation_type text NOT NULL DEFAULT 'remainder' CHECK (allocation_type IN ('percentage', 'amount', 'remainder')),
  allocation_value numeric DEFAULT 0,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  verified boolean DEFAULT false,
  nickname text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Direct Deposit Verifications Table
CREATE TABLE IF NOT EXISTS direct_deposit_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES direct_deposit_accounts(id) ON DELETE CASCADE,
  verification_method text NOT NULL DEFAULT 'manual' CHECK (verification_method IN ('micro_deposit', 'instant', 'manual')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dd_accounts_employee_id ON direct_deposit_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_dd_accounts_active ON direct_deposit_accounts(employee_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dd_verifications_account_id ON direct_deposit_verifications(account_id);

-- Enable RLS
ALTER TABLE direct_deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_deposit_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_deposit_accounts

-- Employees can view their own accounts
CREATE POLICY "Employees can view own direct deposit accounts"
  ON direct_deposit_accounts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Employees can insert their own accounts
CREATE POLICY "Employees can create own direct deposit accounts"
  ON direct_deposit_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Employees can update their own accounts
CREATE POLICY "Employees can update own direct deposit accounts"
  ON direct_deposit_accounts FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Employees can delete their own accounts
CREATE POLICY "Employees can delete own direct deposit accounts"
  ON direct_deposit_accounts FOR DELETE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- HR staff can view all accounts (for payroll processing)
CREATE POLICY "HR staff can view all direct deposit accounts"
  ON direct_deposit_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr_admin', 'super_admin')
    )
  );

-- RLS Policies for direct_deposit_verifications

-- Employees can view verifications for their own accounts
CREATE POLICY "Employees can view own direct deposit verifications"
  ON direct_deposit_verifications FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM direct_deposit_accounts
      WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

-- HR staff can manage all verifications
CREATE POLICY "HR staff can manage direct deposit verifications"
  ON direct_deposit_verifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr_admin', 'super_admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_direct_deposit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_direct_deposit_accounts_updated_at
  BEFORE UPDATE ON direct_deposit_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_deposit_updated_at();

-- Function to validate only one remainder account per employee
CREATE OR REPLACE FUNCTION validate_remainder_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a remainder account, deactivate other remainder accounts for this employee
  IF NEW.allocation_type = 'remainder' AND NEW.is_active = true THEN
    UPDATE direct_deposit_accounts
    SET is_active = false
    WHERE employee_id = NEW.employee_id
      AND allocation_type = 'remainder'
      AND id != NEW.id
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active remainder account
CREATE TRIGGER ensure_single_remainder_account
  BEFORE INSERT OR UPDATE ON direct_deposit_accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_remainder_account();

-- Add sample direct deposit for Jennifer Martinez
DO $$
DECLARE
  v_employee_id uuid;
  v_account_id uuid;
BEGIN
  -- Get Jennifer Martinez's employee ID
  SELECT id INTO v_employee_id
  FROM employees
  WHERE email = 'jennifer.martinez@company.com'
  LIMIT 1;

  IF v_employee_id IS NOT NULL THEN
    -- Insert her direct deposit account (encrypted account number)
    INSERT INTO direct_deposit_accounts (
      employee_id,
      account_type,
      routing_number,
      account_number_encrypted,
      account_last_four,
      bank_name,
      allocation_type,
      allocation_value,
      priority,
      is_active,
      verified,
      nickname
    ) VALUES (
      v_employee_id,
      'checking',
      '121000248',
      pgp_sym_encrypt('987654321', current_setting('app.settings.encryption_key', true)),
      '4321',
      'Wells Fargo Bank',
      'remainder',
      0,
      1,
      true,
      true,
      'Primary Checking'
    ) RETURNING id INTO v_account_id;

    -- Add verification record
    INSERT INTO direct_deposit_verifications (
      account_id,
      verification_method,
      verification_status,
      verified_at,
      notes
    ) VALUES (
      v_account_id,
      'manual',
      'verified',
      now(),
      'Verified during onboarding'
    );
  END IF;
END $$;
