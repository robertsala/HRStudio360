/*
  # Add Worker Classification Support to Onboarding System

  ## Summary
  This migration enhances the onboarding system to support classification-specific workflows.
  It adds worker classification tracking and enables template filtering by classification type.

  ## Changes Made

  1. **onboarding_templates table**
     - Added `worker_classification_code` column to link templates to specific worker types
     - Added `applies_to_all_classifications` flag for universal templates

  2. **new_hires table**
     - Added `worker_classification_code` column to track hired worker's classification
     - Added `classification_risk_score` for tracking IRS test results

  3. **Indexes**
     - Added indexes for efficient classification-based template lookups

  4. **Classification-Specific Templates**
     - Created distinct onboarding templates for:
       * W-2 Employees (standard full-time)
       * 1099 Independent Contractors
       * International Workers
       * Union Members

  ## Security
  - Maintains existing RLS policies
  - No changes to access control
*/

-- =====================================================
-- ADD WORKER CLASSIFICATION TO TEMPLATES
-- =====================================================

ALTER TABLE onboarding_templates
ADD COLUMN IF NOT EXISTS worker_classification_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applies_to_all_classifications boolean DEFAULT false;

COMMENT ON COLUMN onboarding_templates.worker_classification_code IS 'Links template to specific worker classification (e.g., W2_EMPLOYEE, CONTRACTOR_1099)';
COMMENT ON COLUMN onboarding_templates.applies_to_all_classifications IS 'If true, this template applies to all worker types';

-- =====================================================
-- ADD WORKER CLASSIFICATION TO NEW HIRES
-- =====================================================

ALTER TABLE new_hires
ADD COLUMN IF NOT EXISTS worker_classification_code text DEFAULT 'W2_EMPLOYEE',
ADD COLUMN IF NOT EXISTS classification_risk_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS classification_notes text DEFAULT '';

COMMENT ON COLUMN new_hires.worker_classification_code IS 'Worker classification assigned during hiring (from worker_classifications table)';
COMMENT ON COLUMN new_hires.classification_risk_score IS 'Risk score from IRS 20-factor test (0-100)';
COMMENT ON COLUMN new_hires.classification_notes IS 'Additional notes about classification decision';

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_classification
  ON onboarding_templates(worker_classification_code)
  WHERE worker_classification_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_new_hires_classification
  ON new_hires(worker_classification_code);

-- =====================================================
-- CREATE CLASSIFICATION-SPECIFIC TEMPLATES
-- =====================================================

-- W-2 EMPLOYEE TEMPLATE
INSERT INTO onboarding_templates (name, description, role, department, worker_classification_code, active)
VALUES (
  'W-2 Employee Standard Onboarding',
  'Comprehensive onboarding for full-time W-2 employees including tax forms, benefits, and compliance',
  'All Roles',
  'All Departments',
  'W2_EMPLOYEE',
  true
) ON CONFLICT DO NOTHING;

-- 1099 CONTRACTOR TEMPLATE
INSERT INTO onboarding_templates (name, description, role, department, worker_classification_code, active)
VALUES (
  '1099 Independent Contractor Onboarding',
  'Streamlined onboarding for independent contractors with W-9 and agreement setup',
  'All Roles',
  'All Departments',
  'CONTRACTOR_1099',
  true
) ON CONFLICT DO NOTHING;

-- INTERNATIONAL WORKER TEMPLATE
INSERT INTO onboarding_templates (name, description, role, department, worker_classification_code, active)
VALUES (
  'International Worker Onboarding',
  'Specialized onboarding for international workers including work authorization verification',
  'All Roles',
  'All Departments',
  'INTERNATIONAL_EMPLOYEE',
  true
) ON CONFLICT DO NOTHING;

-- UNION MEMBER TEMPLATE
INSERT INTO onboarding_templates (name, description, role, department, worker_classification_code, active)
VALUES (
  'Union Member Onboarding',
  'Union-specific onboarding including CBA orientation and union dues setup',
  'All Roles',
  'All Departments',
  'UNION_MEMBER',
  true
) ON CONFLICT DO NOTHING;

-- UNIVERSAL TEMPLATE (applies to all)
INSERT INTO onboarding_templates (name, description, role, department, applies_to_all_classifications, active)
VALUES (
  'Universal Onboarding Checklist',
  'Basic tasks that apply to all worker types regardless of classification',
  'All Roles',
  'All Departments',
  true,
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- CREATE CLASSIFICATION-SPECIFIC TEMPLATE TASKS
-- =====================================================

-- Get template IDs
DO $$
DECLARE
  w2_template_id uuid;
  contractor_template_id uuid;
  international_template_id uuid;
  union_template_id uuid;
  universal_template_id uuid;
BEGIN
  -- Get template IDs
  SELECT id INTO w2_template_id FROM onboarding_templates WHERE worker_classification_code = 'W2_EMPLOYEE' LIMIT 1;
  SELECT id INTO contractor_template_id FROM onboarding_templates WHERE worker_classification_code = 'CONTRACTOR_1099' LIMIT 1;
  SELECT id INTO international_template_id FROM onboarding_templates WHERE worker_classification_code = 'INTERNATIONAL_EMPLOYEE' LIMIT 1;
  SELECT id INTO union_template_id FROM onboarding_templates WHERE worker_classification_code = 'UNION_MEMBER' LIMIT 1;
  SELECT id INTO universal_template_id FROM onboarding_templates WHERE applies_to_all_classifications = true LIMIT 1;

  -- W-2 EMPLOYEE TASKS
  IF w2_template_id IS NOT NULL THEN
    INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
    VALUES
      (w2_template_id, 'Complete Form I-9 Employment Eligibility', 'Verify identity and employment authorization', 'hr', 0, 'critical', 'Compliance', 1, true),
      (w2_template_id, 'Complete Form W-4 Tax Withholding', 'Federal income tax withholding election', 'new_hire', 0, 'critical', 'Tax & Payroll', 2, true),
      (w2_template_id, 'Enroll in Benefits Program', 'Select health insurance, 401(k), and other benefits', 'new_hire', 30, 'high', 'Benefits', 3, true),
      (w2_template_id, 'Sign Employee Handbook Acknowledgment', 'Review and acknowledge company policies', 'new_hire', 1, 'high', 'Compliance', 4, true),
      (w2_template_id, 'Complete Direct Deposit Setup', 'Provide banking information for payroll', 'new_hire', 3, 'high', 'Payroll', 5, false),
      (w2_template_id, 'Set up IT Equipment and Accounts', 'Provision laptop, email, and system access', 'it', 1, 'critical', 'IT & Systems', 6, true),
      (w2_template_id, 'Complete Required Training Modules', 'Safety, harassment prevention, and compliance training', 'new_hire', 14, 'medium', 'Training', 7, true),
      (w2_template_id, 'Schedule 30-Day Check-in Meeting', 'Review progress and address any concerns', 'manager', 30, 'medium', 'Performance', 8, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 1099 CONTRACTOR TASKS
  IF contractor_template_id IS NOT NULL THEN
    INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
    VALUES
      (contractor_template_id, 'Complete Form W-9 Tax Information', 'Provide TIN/EIN for 1099 reporting', 'new_hire', 0, 'critical', 'Tax & Compliance', 1, true),
      (contractor_template_id, 'Sign Independent Contractor Agreement', 'Execute contract defining terms and scope', 'hr', 0, 'critical', 'Legal', 2, true),
      (contractor_template_id, 'Verify Insurance Coverage', 'Confirm liability insurance (if required)', 'hr', 0, 'high', 'Compliance', 3, false),
      (contractor_template_id, 'Set up Payment Method', 'Configure ACH, wire, or PayPal for payments', 'new_hire', 1, 'high', 'Payroll', 4, true),
      (contractor_template_id, 'Provide System Access (limited)', 'Grant access to necessary tools only', 'it', 1, 'medium', 'IT & Systems', 5, true),
      (contractor_template_id, 'Review Scope of Work Document', 'Clarify deliverables and timeline', 'manager', 2, 'high', 'Project Management', 6, true),
      (contractor_template_id, 'Submit Invoicing Instructions', 'Explain invoice format and submission process', 'new_hire', 3, 'medium', 'Payroll', 7, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- INTERNATIONAL WORKER TASKS
  IF international_template_id IS NOT NULL THEN
    INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
    VALUES
      (international_template_id, 'Verify Work Authorization', 'Review visa, work permit, or green card', 'hr', 0, 'critical', 'Immigration', 1, true),
      (international_template_id, 'Complete Form I-9 with Visa Documentation', 'Employment eligibility verification for foreign nationals', 'hr', 0, 'critical', 'Compliance', 2, true),
      (international_template_id, 'Set up International Tax Withholding', 'Configure tax treaty benefits if applicable', 'payroll', 0, 'critical', 'Tax & Payroll', 3, true),
      (international_template_id, 'Review Visa Expiration and Renewal Process', 'Ensure ongoing work authorization', 'hr', 1, 'high', 'Immigration', 4, true),
      (international_template_id, 'Set up International Payment Method', 'Configure cross-border payment (wire, Wise, etc.)', 'payroll', 2, 'high', 'Payroll', 5, true),
      (international_template_id, 'Provide Relocation Support (if applicable)', 'Housing, transportation, local orientation', 'hr', 3, 'medium', 'Relocation', 6, false),
      (international_template_id, 'Complete Cultural Integration Training', 'Company culture and US workplace norms', 'new_hire', 7, 'medium', 'Training', 7, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- UNION MEMBER TASKS
  IF union_template_id IS NOT NULL THEN
    INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
    VALUES
      (union_template_id, 'Complete Union Membership Application', 'Enroll in applicable union local chapter', 'new_hire', 0, 'critical', 'Union', 1, true),
      (union_template_id, 'Review Collective Bargaining Agreement', 'Understand CBA terms, wages, and benefits', 'new_hire', 1, 'critical', 'Union', 2, true),
      (union_template_id, 'Set up Union Dues Deduction', 'Configure automatic dues payment from paycheck', 'payroll', 0, 'critical', 'Payroll', 3, true),
      (union_template_id, 'Review Seniority System and Bidding Process', 'Understand seniority rights and job postings', 'new_hire', 3, 'high', 'Union', 4, true),
      (union_template_id, 'Meet Union Steward and Representatives', 'Introduction to union leadership', 'manager', 5, 'medium', 'Union', 5, false),
      (union_template_id, 'Complete Union Safety Training', 'Union-specific safety protocols and procedures', 'new_hire', 7, 'high', 'Training', 6, true),
      (union_template_id, 'Complete Form I-9 Employment Eligibility', 'Verify identity and employment authorization', 'hr', 0, 'critical', 'Compliance', 7, true),
      (union_template_id, 'Review Grievance Procedures', 'Understand process for filing grievances', 'new_hire', 14, 'medium', 'Union', 8, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- UNIVERSAL TASKS (apply to everyone)
  IF universal_template_id IS NOT NULL THEN
    INSERT INTO onboarding_template_tasks (template_id, title, description, assignee_type, due_days_from_start, priority, category, order_index, required)
    VALUES
      (universal_template_id, 'Welcome Email and First Day Instructions', 'Send welcome package with start info', 'hr', -2, 'high', 'Communication', 1, true),
      (universal_template_id, 'Workspace Setup and Badge Assignment', 'Prepare workspace and issue security badge', 'facilities', 0, 'high', 'Facilities', 2, true),
      (universal_template_id, 'Introduction to Team and Key Contacts', 'Meet team members and important stakeholders', 'manager', 1, 'medium', 'Onboarding', 3, true),
      (universal_template_id, 'Review Emergency Procedures', 'Safety protocols and evacuation routes', 'new_hire', 1, 'medium', 'Safety', 4, true),
      (universal_template_id, 'Complete First Week Check-in', 'Address questions and provide feedback', 'manager', 5, 'low', 'Performance', 5, false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- CREATE HELPER FUNCTION TO GET APPLICABLE TEMPLATES
-- =====================================================

CREATE OR REPLACE FUNCTION get_onboarding_templates_for_classification(
  p_worker_classification_code text,
  p_role text DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  task_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    COUNT(tt.id) as task_count
  FROM onboarding_templates t
  LEFT JOIN onboarding_template_tasks tt ON tt.template_id = t.id
  WHERE t.active = true
    AND (
      t.worker_classification_code = p_worker_classification_code
      OR t.applies_to_all_classifications = true
    )
    AND (p_role IS NULL OR t.role = 'All Roles' OR t.role = p_role)
    AND (p_department IS NULL OR t.department = 'All Departments' OR t.department = p_department)
  GROUP BY t.id, t.name, t.description
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_onboarding_templates_for_classification IS 'Returns applicable onboarding templates for a specific worker classification';
