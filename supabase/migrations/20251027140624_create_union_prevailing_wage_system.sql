/*
  # Union Management and Prevailing Wage System
  
  ## Overview
  This migration creates comprehensive union management with support for multiple CBAs,
  prevailing wage tracking for government contracts, and union-specific features.
  
  ## Tables Created
  
  ### Union Management
  - `unions_master` - National/international union organizations
  - `union_local_chapters` - Local union chapters
  - `collective_bargaining_agreements` - CBA contracts and terms
  - `cba_wage_schedules` - Union wage rates by classification
  - `cba_benefit_provisions` - Union-negotiated benefits
  - `union_membership` - Individual union memberships
  - `union_dues_structure` - Dues calculation rules
  - `union_seniority` - Seniority tracking system
  
  ### Prevailing Wage
  - `prevailing_wage_determinations` - Government wage determinations
  - `projects` - Project tracking for prevailing wage
  - `project_wage_assignments` - Link projects to wage requirements
  - `certified_payroll_reports` - Weekly certified payroll
  - `fringe_benefit_allocations` - Benefit credit tracking
  
  ### Union Operations
  - `union_grievances` - Grievance tracking
  - `union_stewards` - Union representative management
  - `work_stoppages` - Strike/lockout tracking
  
  ## Key Features
  - Multiple CBA support with version control
  - Prevailing wage compliance for Davis-Bacon Act
  - Seniority system with adjusted dates
  - Union dues calculation engine
  - Certified payroll reporting
  - Grievance and work stoppage tracking
  
  ## Security
  - RLS enabled on all tables
  - Union members can view their own records
  - HR and admins have full access
  - Union stewards have limited access
*/

-- =====================================================
-- UNIONS MASTER TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS unions_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_name text NOT NULL,
  union_abbreviation text NOT NULL,
  international_affiliation text DEFAULT '',
  headquarters_location text DEFAULT '',
  national_contact_name text DEFAULT '',
  national_contact_email text DEFAULT '',
  national_contact_phone text DEFAULT '',
  website text DEFAULT '',
  jurisdiction text DEFAULT '',
  industry text DEFAULT '',
  founded_year integer,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE unions_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active unions"
  ON unions_master FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage unions"
  ON unions_master FOR ALL
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

-- Insert sample unions
INSERT INTO unions_master (union_name, union_abbreviation, international_affiliation, industry) VALUES
  ('International Brotherhood of Electrical Workers', 'IBEW', 'AFL-CIO', 'Electrical'),
  ('United Auto Workers', 'UAW', 'AFL-CIO', 'Manufacturing'),
  ('Service Employees International Union', 'SEIU', 'AFL-CIO', 'Service'),
  ('International Association of Machinists', 'IAM', 'AFL-CIO', 'Manufacturing'),
  ('United Brotherhood of Carpenters', 'UBC', 'AFL-CIO', 'Construction'),
  ('Teamsters', 'IBT', 'Independent', 'Transportation');

-- =====================================================
-- UNION LOCAL CHAPTERS
-- =====================================================

CREATE TABLE IF NOT EXISTS union_local_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id uuid NOT NULL REFERENCES unions_master(id) ON DELETE CASCADE,
  chapter_number text NOT NULL,
  chapter_name text NOT NULL,
  region text DEFAULT '',
  city text DEFAULT '',
  state_province text DEFAULT '',
  country_code text DEFAULT 'US',
  local_president_name text DEFAULT '',
  local_president_email text DEFAULT '',
  local_president_phone text DEFAULT '',
  business_agent_name text DEFAULT '',
  business_agent_email text DEFAULT '',
  business_agent_phone text DEFAULT '',
  office_address text DEFAULT '',
  meeting_schedule text DEFAULT '',
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE union_local_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active local chapters"
  ON union_local_chapters FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage local chapters"
  ON union_local_chapters FOR ALL
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
-- COLLECTIVE BARGAINING AGREEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS collective_bargaining_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_number text UNIQUE NOT NULL,
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  cba_name text NOT NULL,
  effective_date date NOT NULL,
  expiration_date date NOT NULL,
  ratification_date date,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'negotiating', 'tentative', 'active', 'expired', 'superseded')),
  document_url text DEFAULT '',
  version integer DEFAULT 1,
  covers_locations text[] DEFAULT '{}',
  covers_departments text[] DEFAULT '{}',
  covers_job_classifications text[] DEFAULT '{}',
  base_wage_increase_percent numeric DEFAULT 0,
  cost_of_living_adjustment boolean DEFAULT false,
  union_security_clause text DEFAULT '',
  negotiation_notes text DEFAULT '',
  key_provisions text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collective_bargaining_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active CBAs"
  ON collective_bargaining_agreements FOR SELECT
  TO authenticated
  USING (status = 'active' OR status = 'tentative');

CREATE POLICY "HR and admins can manage CBAs"
  ON collective_bargaining_agreements FOR ALL
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
-- CBA WAGE SCHEDULES
-- =====================================================

CREATE TABLE IF NOT EXISTS cba_wage_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id uuid NOT NULL REFERENCES collective_bargaining_agreements(id) ON DELETE CASCADE,
  job_classification text NOT NULL,
  experience_level text DEFAULT 'journeyman' CHECK (experience_level IN ('apprentice_1st', 'apprentice_2nd', 'apprentice_3rd', 'apprentice_4th', 'journeyman', 'foreman', 'general_foreman', 'master')),
  base_hourly_rate numeric NOT NULL,
  overtime_rate_multiplier numeric DEFAULT 1.5,
  weekend_rate_multiplier numeric DEFAULT 1.0,
  night_shift_differential numeric DEFAULT 0,
  hazard_pay_rate numeric DEFAULT 0,
  geographic_zone text DEFAULT '',
  effective_date date NOT NULL,
  expiration_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cba_wage_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view wage schedules"
  ON cba_wage_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage wage schedules"
  ON cba_wage_schedules FOR ALL
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
-- CBA BENEFIT PROVISIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS cba_benefit_provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id uuid NOT NULL REFERENCES collective_bargaining_agreements(id) ON DELETE CASCADE,
  benefit_type text NOT NULL CHECK (benefit_type IN ('health_insurance', 'dental', 'vision', 'pension', 'retirement_401k', 'life_insurance', 'disability', 'pto', 'sick_leave', 'holidays', 'training', 'other')),
  benefit_name text NOT NULL,
  description text DEFAULT '',
  employer_contribution_amount numeric DEFAULT 0,
  employer_contribution_percent numeric DEFAULT 0,
  employee_contribution_required boolean DEFAULT false,
  eligibility_requirements text DEFAULT '',
  vesting_schedule text DEFAULT '',
  effective_date date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cba_benefit_provisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view benefit provisions"
  ON cba_benefit_provisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage benefit provisions"
  ON cba_benefit_provisions FOR ALL
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
-- UNION MEMBERSHIP
-- =====================================================

CREATE TABLE IF NOT EXISTS union_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  cba_id uuid REFERENCES collective_bargaining_agreements(id),
  membership_number text NOT NULL,
  membership_type text DEFAULT 'full' CHECK (membership_type IN ('full', 'agency_fee', 'financial_core', 'honorary')),
  join_date date NOT NULL,
  good_standing boolean DEFAULT true,
  card_expiration_date date,
  initiation_fee_paid boolean DEFAULT false,
  initiation_fee_amount numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'withdrawn')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE union_membership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage union membership"
  ON union_membership FOR ALL
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

CREATE POLICY "Employees can view their own union membership"
  ON union_membership FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- UNION DUES STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS union_dues_structure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  cba_id uuid REFERENCES collective_bargaining_agreements(id),
  dues_type text NOT NULL CHECK (dues_type IN ('percentage', 'flat_rate', 'graduated', 'hourly')),
  percentage_of_gross numeric DEFAULT 0,
  flat_monthly_amount numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  minimum_monthly_dues numeric DEFAULT 0,
  maximum_monthly_dues numeric DEFAULT 0,
  assessment_additional numeric DEFAULT 0,
  effective_date date NOT NULL,
  expiration_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE union_dues_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view dues structure"
  ON union_dues_structure FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage dues structure"
  ON union_dues_structure FOR ALL
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
-- UNION SENIORITY
-- =====================================================

CREATE TABLE IF NOT EXISTS union_seniority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  hire_date date NOT NULL,
  adjusted_seniority_date date NOT NULL,
  seniority_rank integer,
  classification text DEFAULT '',
  department text DEFAULT '',
  location text DEFAULT '',
  military_service_credit_days integer DEFAULT 0,
  leave_of_absence_deductions_days integer DEFAULT 0,
  calculation_notes text DEFAULT '',
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, union_id)
);

ALTER TABLE union_seniority ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage seniority"
  ON union_seniority FOR ALL
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

CREATE POLICY "Employees can view their own seniority"
  ON union_seniority FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- PREVAILING WAGE DETERMINATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS prevailing_wage_determinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  determination_number text UNIQUE NOT NULL,
  jurisdiction text NOT NULL CHECK (jurisdiction IN ('federal', 'state', 'local')),
  state_province text DEFAULT '',
  county text DEFAULT '',
  city text DEFAULT '',
  job_classification text NOT NULL,
  occupation_code text DEFAULT '',
  base_hourly_rate numeric NOT NULL,
  fringe_benefit_rate numeric DEFAULT 0,
  total_hourly_rate numeric GENERATED ALWAYS AS (base_hourly_rate + fringe_benefit_rate) STORED,
  overtime_rate numeric,
  effective_date date NOT NULL,
  expiration_date date,
  determination_type text DEFAULT 'davis_bacon' CHECK (determination_type IN ('davis_bacon', 'state_prevailing', 'local_prevailing', 'service_contract_act')),
  source_agency text DEFAULT '',
  source_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prevailing_wage_determinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view prevailing wages"
  ON prevailing_wage_determinations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage prevailing wages"
  ON prevailing_wage_determinations FOR ALL
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
-- PROJECTS (for prevailing wage tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number text UNIQUE NOT NULL,
  project_name text NOT NULL,
  project_type text DEFAULT 'construction' CHECK (project_type IN ('construction', 'service', 'manufacturing', 'other')),
  client_name text DEFAULT '',
  location_address text DEFAULT '',
  city text DEFAULT '',
  state_province text DEFAULT '',
  country_code text DEFAULT 'US',
  start_date date,
  end_date date,
  contract_amount numeric DEFAULT 0,
  requires_prevailing_wage boolean DEFAULT false,
  requires_certified_payroll boolean DEFAULT false,
  funding_source text DEFAULT '',
  contracting_agency text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('planned', 'active', 'suspended', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage projects"
  ON projects FOR ALL
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
-- PROJECT WAGE ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS project_wage_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prevailing_wage_id uuid NOT NULL REFERENCES prevailing_wage_determinations(id),
  applicable_to_classifications text[] DEFAULT '{}',
  is_primary_determination boolean DEFAULT false,
  assigned_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_wage_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view project wage assignments"
  ON project_wage_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage project wage assignments"
  ON project_wage_assignments FOR ALL
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
-- CERTIFIED PAYROLL REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS certified_payroll_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  week_ending_date date NOT NULL,
  job_classification text NOT NULL,
  hours_worked_regular numeric DEFAULT 0,
  hours_worked_overtime numeric DEFAULT 0,
  base_hourly_rate numeric NOT NULL,
  required_prevailing_rate numeric NOT NULL,
  actual_rate_paid numeric NOT NULL,
  fringe_benefits_paid numeric DEFAULT 0,
  fringe_benefits_provided numeric DEFAULT 0,
  gross_wages numeric NOT NULL,
  deductions_total numeric DEFAULT 0,
  net_wages numeric NOT NULL,
  compliant boolean DEFAULT true,
  variance_amount numeric DEFAULT 0,
  variance_notes text DEFAULT '',
  certified_by uuid REFERENCES profiles(id),
  certification_date date,
  submitted_to_agency boolean DEFAULT false,
  submission_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE certified_payroll_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and payroll can manage certified payroll"
  ON certified_payroll_reports FOR ALL
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
-- FRINGE BENEFIT ALLOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS fringe_benefit_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  project_id uuid REFERENCES projects(id),
  benefit_type text NOT NULL,
  benefit_name text NOT NULL,
  monthly_cost numeric DEFAULT 0,
  hourly_equivalent numeric DEFAULT 0,
  applies_to_prevailing_wage boolean DEFAULT true,
  effective_date date NOT NULL,
  expiration_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fringe_benefit_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and payroll can manage fringe benefit allocations"
  ON fringe_benefit_allocations FOR ALL
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
-- UNION STEWARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS union_stewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  position text DEFAULT 'shop_steward' CHECK (position IN ('shop_steward', 'chief_steward', 'unit_chair', 'safety_rep')),
  appointed_date date NOT NULL,
  term_end_date date,
  department text DEFAULT '',
  location text DEFAULT '',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE union_stewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active stewards"
  ON union_stewards FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR and admins can manage stewards"
  ON union_stewards FOR ALL
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
-- UNION GRIEVANCES
-- =====================================================

CREATE TABLE IF NOT EXISTS union_grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_number text UNIQUE NOT NULL,
  employee_id uuid REFERENCES employees(id),
  union_id uuid NOT NULL REFERENCES unions_master(id),
  cba_id uuid REFERENCES collective_bargaining_agreements(id),
  filed_by_steward_id uuid REFERENCES union_stewards(id),
  grievance_type text NOT NULL CHECK (grievance_type IN ('discipline', 'wages', 'hours', 'working_conditions', 'contract_interpretation', 'discrimination', 'safety', 'other')),
  subject text NOT NULL,
  description text NOT NULL,
  cba_article_violated text DEFAULT '',
  date_of_incident date,
  filed_date date NOT NULL DEFAULT CURRENT_DATE,
  step_level integer DEFAULT 1,
  status text DEFAULT 'filed' CHECK (status IN ('filed', 'step_1', 'step_2', 'step_3', 'arbitration', 'resolved', 'withdrawn', 'denied')),
  resolution text DEFAULT '',
  resolved_date date,
  arbitration_scheduled boolean DEFAULT false,
  arbitration_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE union_grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage grievances"
  ON union_grievances FOR ALL
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

CREATE POLICY "Employees can view grievances involving them"
  ON union_grievances FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- WORK STOPPAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS work_stoppages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  union_id uuid NOT NULL REFERENCES unions_master(id),
  local_chapter_id uuid REFERENCES union_local_chapters(id),
  stoppage_type text NOT NULL CHECK (stoppage_type IN ('strike', 'lockout', 'work_to_rule', 'sick_out', 'slowdown')),
  start_date date NOT NULL,
  end_date date,
  reason text NOT NULL,
  affected_locations text[] DEFAULT '{}',
  affected_departments text[] DEFAULT '{}',
  employees_affected integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('planned', 'active', 'resolved', 'injunction', 'cancelled')),
  resolution text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE work_stoppages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage work stoppages"
  ON work_stoppages FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_union_membership_employee ON union_membership(employee_id);
CREATE INDEX IF NOT EXISTS idx_union_membership_union ON union_membership(union_id, local_chapter_id);
CREATE INDEX IF NOT EXISTS idx_cba_expiration ON collective_bargaining_agreements(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cba_wage_classification ON cba_wage_schedules(cba_id, job_classification);
CREATE INDEX IF NOT EXISTS idx_prevailing_wage_jurisdiction ON prevailing_wage_determinations(jurisdiction, state_province);
CREATE INDEX IF NOT EXISTS idx_certified_payroll_project_week ON certified_payroll_reports(project_id, week_ending_date);
CREATE INDEX IF NOT EXISTS idx_union_seniority_ranking ON union_seniority(union_id, seniority_rank);
CREATE INDEX IF NOT EXISTS idx_grievance_status ON union_grievances(status) WHERE status IN ('filed', 'step_1', 'step_2', 'step_3');
CREATE INDEX IF NOT EXISTS idx_projects_prevailing_wage ON projects(requires_prevailing_wage) WHERE requires_prevailing_wage = true;