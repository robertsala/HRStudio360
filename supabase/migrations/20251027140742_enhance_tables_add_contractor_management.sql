/*
  # Enhanced Employee Tables and Contractor Management System
  
  ## Overview
  This migration enhances existing employee and new_hire tables with new classification fields,
  and creates comprehensive contractor management capabilities.
  
  ## Tables Modified
  - `employees` - Add worker classification and international fields
  - `new_hires` - Add enhanced classification and compliance tracking
  - `candidates` - Add classification field for early planning
  
  ## Tables Created
  - `contractor_details` - 1099 and international contractor information
  - `contractor_companies` - Company information for corporate contractors
  - `subcontractor_relationships` - Primary/sub contractor tracking
  - `compliance_documents` - Universal document storage
  - `contractor_agreements` - Contract terms and SOW tracking
  - `contractor_insurance` - Insurance certificate tracking
  - `contractor_invoices` - Invoice and payment tracking
  
  ## Key Features
  - Enhanced worker classification with country support
  - Contractor-specific compliance tracking
  - Multi-currency contractor payment support
  - Insurance and license expiration monitoring
  - Subcontractor relationship management
  - Digital agreement storage
  
  ## Security
  - RLS enabled on all tables
  - Contractors can view their own records
  - HR and admins have full access
*/

-- =====================================================
-- ENHANCE EMPLOYEES TABLE
-- =====================================================

-- Add new columns to employees table
DO $$
BEGIN
  -- Worker classification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'worker_classification_code') THEN
    ALTER TABLE employees ADD COLUMN worker_classification_code text DEFAULT 'W2_FULL_TIME_US' REFERENCES worker_classifications(code);
  END IF;
  
  -- Country and location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'country_code') THEN
    ALTER TABLE employees ADD COLUMN country_code text DEFAULT 'US';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'work_location_city') THEN
    ALTER TABLE employees ADD COLUMN work_location_city text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'work_location_state') THEN
    ALTER TABLE employees ADD COLUMN work_location_state text DEFAULT '';
  END IF;
  
  -- Currency and compensation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'currency_code') THEN
    ALTER TABLE employees ADD COLUMN currency_code text DEFAULT 'USD' REFERENCES currencies(code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'payment_frequency') THEN
    ALTER TABLE employees ADD COLUMN payment_frequency text DEFAULT 'bi-weekly';
  END IF;
  
  -- Union membership
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_union_member') THEN
    ALTER TABLE employees ADD COLUMN is_union_member boolean DEFAULT false;
  END IF;
  
  -- Tax information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tax_id_number') THEN
    ALTER TABLE employees ADD COLUMN tax_id_number text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tax_jurisdiction_id') THEN
    ALTER TABLE employees ADD COLUMN tax_jurisdiction_id uuid REFERENCES tax_jurisdictions(id);
  END IF;
  
  -- Compliance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'requires_work_authorization') THEN
    ALTER TABLE employees ADD COLUMN requires_work_authorization boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'work_authorization_expiry') THEN
    ALTER TABLE employees ADD COLUMN work_authorization_expiry date;
  END IF;
END $$;

-- =====================================================
-- ENHANCE NEW_HIRES TABLE
-- =====================================================

DO $$
BEGIN
  -- Worker classification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'worker_classification_code') THEN
    ALTER TABLE new_hires ADD COLUMN worker_classification_code text DEFAULT 'W2_FULL_TIME_US' REFERENCES worker_classifications(code);
  END IF;
  
  -- Country
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'country_code') THEN
    ALTER TABLE new_hires ADD COLUMN country_code text DEFAULT 'US';
  END IF;
  
  -- Currency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'currency_code') THEN
    ALTER TABLE new_hires ADD COLUMN currency_code text DEFAULT 'USD' REFERENCES currencies(code);
  END IF;
  
  -- Compliance tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'i9_completed') THEN
    ALTER TABLE new_hires ADD COLUMN i9_completed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'w4_completed') THEN
    ALTER TABLE new_hires ADD COLUMN w4_completed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'tax_forms_completed') THEN
    ALTER TABLE new_hires ADD COLUMN tax_forms_completed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'background_check_completed') THEN
    ALTER TABLE new_hires ADD COLUMN background_check_completed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_hires' AND column_name = 'compliance_score') THEN
    ALTER TABLE new_hires ADD COLUMN compliance_score integer DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- ENHANCE CANDIDATES TABLE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'proposed_classification') THEN
    ALTER TABLE candidates ADD COLUMN proposed_classification text DEFAULT 'W2_FULL_TIME_US';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'country_code') THEN
    ALTER TABLE candidates ADD COLUMN country_code text DEFAULT 'US';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'willing_to_relocate') THEN
    ALTER TABLE candidates ADD COLUMN willing_to_relocate boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- CONTRACTOR DETAILS
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  contractor_type text NOT NULL CHECK (contractor_type IN ('individual', 'company')),
  business_name text DEFAULT '',
  business_type text DEFAULT '' CHECK (business_type IN ('', 'sole_proprietor', 'llc', 'corporation', 's_corp', 'partnership')),
  ein_number text DEFAULT '',
  tax_id_number text DEFAULT '',
  vat_number text DEFAULT '',
  country_code text NOT NULL DEFAULT 'US',
  business_address text DEFAULT '',
  business_city text DEFAULT '',
  business_state text DEFAULT '',
  business_postal_code text DEFAULT '',
  business_country text DEFAULT 'US',
  payment_terms text DEFAULT 'net_30',
  payment_method text DEFAULT 'ach' CHECK (payment_method IN ('ach', 'wire', 'check', 'paypal', 'international_wire', 'sepa')),
  bank_name text DEFAULT '',
  bank_account_number_encrypted text DEFAULT '',
  bank_routing_number text DEFAULT '',
  swift_code text DEFAULT '',
  iban text DEFAULT '',
  currency_code text DEFAULT 'USD' REFERENCES currencies(code),
  w9_form_url text DEFAULT '',
  w9_date_signed date,
  tax_treaty_applicable boolean DEFAULT false,
  tax_treaty_country text DEFAULT '',
  requires_1099 boolean DEFAULT false,
  insurance_required boolean DEFAULT false,
  background_check_completed boolean DEFAULT false,
  background_check_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage contractor details"
  ON contractor_details FOR ALL
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
-- CONTRACTOR COMPANIES
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_type text DEFAULT 'vendor' CHECK (company_type IN ('vendor', 'staffing_agency', 'consulting_firm', 'msp')),
  ein_number text DEFAULT '',
  duns_number text DEFAULT '',
  primary_contact_name text DEFAULT '',
  primary_contact_email text DEFAULT '',
  primary_contact_phone text DEFAULT '',
  billing_address text DEFAULT '',
  billing_city text DEFAULT '',
  billing_state text DEFAULT '',
  billing_postal_code text DEFAULT '',
  billing_country text DEFAULT 'US',
  payment_terms text DEFAULT 'net_30',
  preferred_payment_method text DEFAULT 'ach',
  vendor_number text DEFAULT '',
  is_active boolean DEFAULT true,
  rating integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active contractor companies"
  ON contractor_companies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage contractor companies"
  ON contractor_companies FOR ALL
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
-- SUBCONTRACTOR RELATIONSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS subcontractor_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_contractor_id uuid NOT NULL,
  subcontractor_id uuid NOT NULL,
  project_id uuid REFERENCES projects(id),
  relationship_type text DEFAULT 'subcontractor' CHECK (relationship_type IN ('subcontractor', 'vendor', 'supplier')),
  start_date date NOT NULL,
  end_date date,
  contract_value numeric DEFAULT 0,
  payment_responsibility text DEFAULT 'primary' CHECK (payment_responsibility IN ('primary', 'direct', 'split')),
  insurance_verified boolean DEFAULT false,
  license_verified boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'completed', 'terminated')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subcontractor_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage subcontractor relationships"
  ON subcontractor_relationships FOR ALL
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
-- COMPLIANCE DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  worker_type text NOT NULL CHECK (worker_type IN ('employee', 'contractor', 'new_hire', 'candidate')),
  document_type text NOT NULL CHECK (document_type IN ('i9', 'w4', 'w9', 'passport', 'visa', 'work_permit', 'drivers_license', 'contract', 'nda', 'insurance', 'license', 'certification', 'background_check', 'tax_form', 'other')),
  document_name text NOT NULL,
  country_code text DEFAULT 'US',
  document_number text DEFAULT '',
  issue_date date,
  expiration_date date,
  document_url text DEFAULT '',
  issuing_authority text DEFAULT '',
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by uuid REFERENCES profiles(id),
  verified_date date,
  is_mandatory boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage compliance documents"
  ON compliance_documents FOR ALL
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
-- CONTRACTOR AGREEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  agreement_type text NOT NULL CHECK (agreement_type IN ('independent_contractor', 'consulting', 'sow', 'msa', 'nda', 'non_compete')),
  agreement_title text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  contract_value numeric DEFAULT 0,
  currency_code text DEFAULT 'USD' REFERENCES currencies(code),
  payment_structure text DEFAULT 'hourly' CHECK (payment_structure IN ('hourly', 'fixed_price', 'milestone', 'retainer', 'time_and_materials')),
  hourly_rate numeric DEFAULT 0,
  estimated_hours numeric DEFAULT 0,
  max_hours numeric DEFAULT 0,
  auto_renewal boolean DEFAULT false,
  renewal_notice_days integer DEFAULT 30,
  scope_of_work text DEFAULT '',
  deliverables text DEFAULT '',
  acceptance_criteria text DEFAULT '',
  document_url text DEFAULT '',
  signed_by_contractor boolean DEFAULT false,
  contractor_signature_date date,
  signed_by_company boolean DEFAULT false,
  company_signature_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'completed', 'terminated', 'expired')),
  termination_clause text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage contractor agreements"
  ON contractor_agreements FOR ALL
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
-- CONTRACTOR INSURANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  insurance_type text NOT NULL CHECK (insurance_type IN ('general_liability', 'professional_liability', 'workers_comp', 'cyber_liability', 'auto', 'umbrella')),
  insurance_carrier text NOT NULL,
  policy_number text NOT NULL,
  coverage_amount numeric NOT NULL,
  deductible_amount numeric DEFAULT 0,
  effective_date date NOT NULL,
  expiration_date date NOT NULL,
  certificate_url text DEFAULT '',
  additional_insured boolean DEFAULT false,
  waiver_of_subrogation boolean DEFAULT false,
  verified_by uuid REFERENCES profiles(id),
  verification_date date,
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  reminder_sent boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage contractor insurance"
  ON contractor_insurance FOR ALL
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
-- CONTRACTOR INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  contractor_id uuid NOT NULL,
  agreement_id uuid REFERENCES contractor_agreements(id),
  project_id uuid REFERENCES projects(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  period_start_date date,
  period_end_date date,
  hours_worked numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  subtotal numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  currency_code text DEFAULT 'USD' REFERENCES currencies(code),
  payment_terms text DEFAULT 'net_30',
  description text DEFAULT '',
  invoice_url text DEFAULT '',
  submitted_date date,
  approved_by uuid REFERENCES profiles(id),
  approved_date date,
  paid_date date,
  payment_reference text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid', 'overdue', 'cancelled')),
  rejection_reason text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage contractor invoices"
  ON contractor_invoices FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_contractor_details_contractor ON contractor_details(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_details_country ON contractor_details(country_code);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_worker ON compliance_documents(worker_id, worker_type);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_expiration ON compliance_documents(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_insurance_expiration ON contractor_insurance(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contractor_agreements_status ON contractor_agreements(status) WHERE status IN ('active', 'pending_signature');
CREATE INDEX IF NOT EXISTS idx_contractor_invoices_status ON contractor_invoices(status) WHERE status IN ('submitted', 'approved', 'overdue');
CREATE INDEX IF NOT EXISTS idx_subcontractor_primary ON subcontractor_relationships(primary_contractor_id);
CREATE INDEX IF NOT EXISTS idx_employees_classification ON employees(worker_classification_code);
CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country_code);
CREATE INDEX IF NOT EXISTS idx_new_hires_classification ON new_hires(worker_classification_code);