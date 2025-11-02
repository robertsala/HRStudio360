/*
  # Global Enterprise Worker Classification System - Part 1: Core Infrastructure
  
  ## Overview
  This migration establishes the foundation for a comprehensive global worker classification system
  supporting US and international workers, multiple union contracts, prevailing wage tracking,
  and multi-currency operations.
  
  ## Tables Created
  
  ### Worker Classification
  - `worker_classifications` - Master list of all worker types
  - `worker_country_config` - Country-specific employment rules
  - `tax_jurisdictions` - Multi-level tax jurisdiction tracking
  - `country_compliance_requirements` - Required documents by country and worker type
  
  ### Currency and Localization
  - `currencies` - Supported currencies with exchange rates
  - `exchange_rates` - Historical exchange rate tracking
  
  ### Work Authorization
  - `work_authorizations` - Visa and work permit tracking
  - `international_tax_forms` - Country-specific tax document tracking
  
  ### Audit and Compliance
  - `worker_classification_audit_log` - Complete audit trail
  - `classification_approvals` - Approval workflow tracking
  
  ## Key Features
  - Supports both US (W2/1099) and international worker classifications
  - Multi-currency with exchange rate tracking
  - Comprehensive audit logging for compliance
  - Work authorization and visa expiration monitoring
  - Country-specific compliance requirement mapping
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - HR and Product Owner roles have full access
  - Managers can view their team members
  - Workers can view their own records
*/

-- =====================================================
-- WORKER CLASSIFICATION MASTER TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('W2_EMPLOYEE', 'CONTRACTOR', 'UNION', 'TEMPORARY', 'INTERN')),
  country_code text NOT NULL DEFAULT 'US',
  is_active boolean DEFAULT true,
  requires_tax_withholding boolean DEFAULT false,
  requires_benefits boolean DEFAULT false,
  requires_work_authorization boolean DEFAULT false,
  default_payment_frequency text DEFAULT 'bi-weekly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active worker classifications"
  ON worker_classifications FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage worker classifications"
  ON worker_classifications FOR ALL
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

-- Insert core worker classifications
INSERT INTO worker_classifications (code, name, description, category, country_code, requires_tax_withholding, requires_benefits, requires_work_authorization) VALUES
  ('W2_FULL_TIME_US', 'W-2 Full-Time Employee (US)', 'Full-time employee with benefits, US-based', 'W2_EMPLOYEE', 'US', true, true, true),
  ('W2_PART_TIME_US', 'W-2 Part-Time Employee (US)', 'Part-time employee, US-based', 'W2_EMPLOYEE', 'US', true, false, true),
  ('W2_SEASONAL_US', 'W-2 Seasonal Employee (US)', 'Seasonal employee, US-based', 'W2_EMPLOYEE', 'US', true, false, true),
  ('CONTRACTOR_1099_US', '1099 Independent Contractor (US)', 'US-based 1099 contractor, self-employed', 'CONTRACTOR', 'US', false, false, true),
  ('INDEPENDENT_CONSULTANT_US', 'Independent Consultant (US)', 'US-based independent consultant', 'CONTRACTOR', 'US', false, false, true),
  ('SUBCONTRACTOR_US', 'Subcontractor (US)', 'US-based subcontractor working under primary contractor', 'CONTRACTOR', 'US', false, false, true),
  ('UNION_MEMBER', 'Union Member', 'Employee covered by collective bargaining agreement', 'UNION', 'US', true, true, true),
  ('TEMP_AGENCY', 'Temporary Agency Worker', 'Worker employed by staffing agency', 'TEMPORARY', 'US', false, false, true),
  ('INTERN', 'Intern', 'Intern or co-op student', 'INTERN', 'US', true, false, false),
  ('APPRENTICE', 'Apprentice', 'Registered apprentice in training program', 'UNION', 'US', true, true, true),
  ('W2_FULL_TIME_INTL', 'W-2 Full-Time Employee (International)', 'Full-time international employee', 'W2_EMPLOYEE', 'INTL', true, true, true),
  ('W2_PART_TIME_INTL', 'W-2 Part-Time Employee (International)', 'Part-time international employee', 'W2_EMPLOYEE', 'INTL', true, false, true),
  ('CONTRACTOR_INTL', 'International Contractor', 'Independent contractor outside US', 'CONTRACTOR', 'INTL', false, false, false),
  ('SUBCONTRACTOR_INTL', 'International Subcontractor', 'Subcontractor outside US', 'CONTRACTOR', 'INTL', false, false, false),
  ('PERMALANCER', 'Permalancer', 'Long-term contractor treated like employee', 'CONTRACTOR', 'US', false, false, true);

-- =====================================================
-- COUNTRY CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_country_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text UNIQUE NOT NULL,
  country_name text NOT NULL,
  requires_local_entity boolean DEFAULT false,
  statutory_probation_days integer DEFAULT 90,
  statutory_notice_days integer DEFAULT 30,
  requires_written_contract boolean DEFAULT true,
  max_weekly_hours integer DEFAULT 40,
  minimum_wage_local_currency numeric DEFAULT 0,
  currency_code text DEFAULT 'USD',
  tax_year_end text DEFAULT '12-31',
  has_thirteenth_month_salary boolean DEFAULT false,
  has_national_insurance boolean DEFAULT false,
  gdpr_applicable boolean DEFAULT false,
  primary_language text DEFAULT 'en',
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_country_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view country configs"
  ON worker_country_config FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage country configs"
  ON worker_country_config FOR ALL
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

-- Insert major countries
INSERT INTO worker_country_config (country_code, country_name, currency_code, requires_local_entity, has_national_insurance, gdpr_applicable, primary_language) VALUES
  ('US', 'United States', 'USD', false, true, false, 'en'),
  ('CA', 'Canada', 'CAD', false, true, false, 'en'),
  ('GB', 'United Kingdom', 'GBP', false, true, true, 'en'),
  ('DE', 'Germany', 'EUR', false, true, true, 'de'),
  ('FR', 'France', 'EUR', false, true, true, 'fr'),
  ('AU', 'Australia', 'AUD', false, true, false, 'en'),
  ('IN', 'India', 'INR', false, true, false, 'en'),
  ('MX', 'Mexico', 'MXN', false, true, false, 'es'),
  ('BR', 'Brazil', 'BRL', true, true, false, 'pt'),
  ('JP', 'Japan', 'JPY', false, true, false, 'ja'),
  ('SG', 'Singapore', 'SGD', false, true, false, 'en'),
  ('NL', 'Netherlands', 'EUR', false, true, true, 'nl'),
  ('IE', 'Ireland', 'EUR', false, true, true, 'en'),
  ('PL', 'Poland', 'PLN', false, true, true, 'pl'),
  ('ES', 'Spain', 'EUR', false, true, true, 'es');

-- =====================================================
-- CURRENCY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  decimal_places integer DEFAULT 2,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view currencies"
  ON currencies FOR SELECT
  TO authenticated
  USING (is_active = true);

INSERT INTO currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('CAD', 'Canadian Dollar', 'C$'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('INR', 'Indian Rupee', '₹'),
  ('MXN', 'Mexican Peso', 'MXN'),
  ('BRL', 'Brazilian Real', 'R$'),
  ('JPY', 'Japanese Yen', '¥'),
  ('SGD', 'Singapore Dollar', 'S$'),
  ('PLN', 'Polish Zloty', 'zł');

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL REFERENCES currencies(code),
  to_currency text NOT NULL REFERENCES currencies(code),
  rate numeric NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage exchange rates"
  ON exchange_rates FOR ALL
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

-- Insert base exchange rates (USD as base)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'USD', 1.00),
  ('USD', 'EUR', 0.92),
  ('USD', 'GBP', 0.79),
  ('USD', 'CAD', 1.35),
  ('USD', 'AUD', 1.52),
  ('USD', 'INR', 83.12),
  ('USD', 'MXN', 17.15),
  ('USD', 'BRL', 4.98),
  ('USD', 'JPY', 149.50),
  ('USD', 'SGD', 1.34),
  ('USD', 'PLN', 3.98);

-- =====================================================
-- TAX JURISDICTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  state_province text DEFAULT '',
  city text DEFAULT '',
  jurisdiction_type text NOT NULL CHECK (jurisdiction_type IN ('federal', 'state', 'local')),
  tax_id_format text DEFAULT '',
  withholding_required boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view tax jurisdictions"
  ON tax_jurisdictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage tax jurisdictions"
  ON tax_jurisdictions FOR ALL
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

-- =====================================================
-- WORK AUTHORIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS work_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  authorization_type text NOT NULL CHECK (authorization_type IN ('US_CITIZEN', 'PERMANENT_RESIDENT', 'WORK_VISA', 'EAD', 'OTHER')),
  document_type text DEFAULT '',
  document_number text DEFAULT '',
  issuing_country text DEFAULT 'US',
  issue_date date,
  expiration_date date,
  sponsorship_required boolean DEFAULT false,
  document_url text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'revoked')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE work_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage work authorizations"
  ON work_authorizations FOR ALL
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

CREATE POLICY "Employees can view their own work authorization"
  ON work_authorizations FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- INTERNATIONAL TAX FORMS
-- =====================================================

CREATE TABLE IF NOT EXISTS international_tax_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  worker_type text NOT NULL CHECK (worker_type IN ('employee', 'contractor')),
  country_code text NOT NULL,
  form_type text NOT NULL,
  form_name text NOT NULL,
  submission_date date,
  tax_year integer,
  document_url text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE international_tax_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage international tax forms"
  ON international_tax_forms FOR ALL
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

-- =====================================================
-- COUNTRY COMPLIANCE REQUIREMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS country_compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  worker_classification_code text NOT NULL REFERENCES worker_classifications(code),
  requirement_type text NOT NULL CHECK (requirement_type IN ('tax_form', 'work_authorization', 'contract', 'insurance', 'license', 'background_check', 'other')),
  requirement_name text NOT NULL,
  description text DEFAULT '',
  is_mandatory boolean DEFAULT true,
  due_within_days integer DEFAULT 30,
  renewal_frequency_days integer,
  responsible_party text DEFAULT 'HR' CHECK (responsible_party IN ('HR', 'employee', 'contractor', 'manager', 'payroll')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE country_compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view compliance requirements"
  ON country_compliance_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage compliance requirements"
  ON country_compliance_requirements FOR ALL
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

-- Insert key US compliance requirements
INSERT INTO country_compliance_requirements (country_code, worker_classification_code, requirement_type, requirement_name, description, is_mandatory, due_within_days) VALUES
  ('US', 'W2_FULL_TIME_US', 'tax_form', 'Form W-4', 'Federal tax withholding form', true, 1),
  ('US', 'W2_FULL_TIME_US', 'work_authorization', 'Form I-9', 'Employment eligibility verification', true, 3),
  ('US', 'CONTRACTOR_1099_US', 'tax_form', 'Form W-9', 'Taxpayer identification form', true, 7),
  ('US', 'CONTRACTOR_1099_US', 'contract', 'Independent Contractor Agreement', 'Written agreement defining relationship', true, 1),
  ('US', 'UNION_MEMBER', 'contract', 'Union Membership Application', 'Application to join union', true, 7),
  ('US', 'UNION_MEMBER', 'contract', 'Dues Authorization', 'Authorization for union dues deduction', true, 7);

-- =====================================================
-- AUDIT AND APPROVAL TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_classification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  worker_type text NOT NULL CHECK (worker_type IN ('employee', 'contractor', 'new_hire', 'candidate')),
  old_classification text DEFAULT '',
  new_classification text NOT NULL REFERENCES worker_classifications(code),
  change_reason text NOT NULL,
  risk_assessment_score integer,
  changed_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approval_date timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_classification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can view classification audit log"
  ON worker_classification_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "System can insert classification audit log"
  ON worker_classification_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- CLASSIFICATION APPROVALS
-- =====================================================

CREATE TABLE IF NOT EXISTS classification_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  worker_type text NOT NULL CHECK (worker_type IN ('employee', 'contractor', 'new_hire')),
  classification_code text NOT NULL REFERENCES worker_classifications(code),
  requested_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  justification text DEFAULT '',
  approval_notes text DEFAULT '',
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classification_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage classification approvals"
  ON classification_approvals FOR ALL
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_work_auth_employee ON work_authorizations(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_auth_expiration ON work_authorizations(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tax_forms_worker ON international_tax_forms(worker_id, worker_type);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_worker ON worker_classification_audit_log(worker_id, worker_type);
CREATE INDEX IF NOT EXISTS idx_classification_country ON worker_classifications(country_code) WHERE is_active = true;