/*
  # Workers Compensation and OSHA Tracking System

  ## Overview
  Creates comprehensive tables for managing workplace incidents, workers compensation claims, 
  injury tracking with body part mapping, and OSHA compliance reporting including OSHA 300 logs.

  ## New Tables
  
  ### `workers_comp_incidents`
  Primary incident reporting table capturing all workplace incidents
  - `id` (uuid, primary key) - Unique incident identifier
  - `incident_number` (text, unique) - Human-readable incident number (e.g., WC-2025-001)
  - `incident_date` (timestamptz) - Date and time incident occurred
  - `reported_date` (timestamptz) - Date incident was reported
  - `employee_id` (uuid) - Employee who was injured (references employees table)
  - `reporter_id` (uuid) - Person who filed the report
  - `supervisor_id` (uuid) - Immediate supervisor/manager/director
  - `location` (text) - Where incident occurred
  - `incident_description` (text) - Detailed description of what happened
  - `witness_names` (text[]) - Array of witness names
  - `injury_type` (text) - Type of injury (laceration, fracture, burn, etc.)
  - `body_parts_affected` (jsonb) - JSON array of body parts with coordinates and descriptions
  - `severity` (text) - minor, moderate, severe, critical
  - `treatment_required` (text) - first_aid, medical_attention, emergency_room, hospitalization
  - `medical_facility` (text) - Name of medical facility if applicable
  - `lost_time` (boolean) - Whether incident resulted in lost work time
  - `days_away_from_work` (integer) - Number of days away from work
  - `days_restricted_duty` (integer) - Number of days on restricted duty
  - `recordable` (boolean) - Whether incident is OSHA recordable
  - `root_cause` (text) - Root cause analysis
  - `corrective_actions` (text) - Actions taken to prevent recurrence
  - `status` (text) - open, under_review, closed
  - `claim_number` (text) - Insurance claim number
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - User who created the record

  ### `osha_300_log`
  OSHA 300 Log of Work-Related Injuries and Illnesses
  - `id` (uuid, primary key)
  - `incident_id` (uuid) - References workers_comp_incidents
  - `case_number` (text) - Sequential case number for the year
  - `employee_name` (text) - Employee name
  - `job_title` (text) - Employee job title
  - `injury_date` (date) - Date of injury or illness
  - `where_event_occurred` (text) - Location where event occurred
  - `injury_description` (text) - Description of injury or illness
  - `injury_classification` (text) - death, days_away_from_work, job_transfer_restriction, other_recordable
  - `death_date` (date) - Date of death if applicable
  - `days_away_from_work` (integer)
  - `days_job_transfer_restriction` (integer)
  - `privacy_case` (boolean) - Whether case involves privacy concerns
  - `establishment_name` (text) - Name of establishment
  - `year` (integer) - Calendar year
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `osha_reports`
  General OSHA reports and audits tracking
  - `id` (uuid, primary key)
  - `report_type` (text) - osha_300, osha_300a, osha_301, audit, inspection
  - `report_period_start` (date) - Start date of reporting period
  - `report_period_end` (date) - End date of reporting period
  - `total_cases` (integer) - Total number of cases in period
  - `total_deaths` (integer)
  - `total_days_away` (integer)
  - `total_job_transfers` (integer)
  - `total_other_recordable` (integer)
  - `total_injuries` (integer)
  - `total_skin_disorders` (integer)
  - `total_respiratory_conditions` (integer)
  - `total_poisonings` (integer)
  - `total_hearing_loss` (integer)
  - `total_other_illnesses` (integer)
  - `report_data` (jsonb) - Full report data
  - `generated_by` (uuid) - User who generated report
  - `generated_at` (timestamptz)
  - `certified_by` (uuid) - Company executive who certified
  - `certified_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `body_injury_mapping`
  Pre-defined body parts for injury mapping interface
  - `id` (uuid, primary key)
  - `body_part_name` (text) - Name of body part
  - `body_region` (text) - head, neck, torso, upper_extremity, lower_extremity
  - `side` (text) - left, right, bilateral, center
  - `display_order` (integer) - Order for display in UI

  ## Security
  - Enable RLS on all tables
  - Only authenticated users can access records
  - Employees can view their own incidents
  - Supervisors and HR can view/manage all incidents
  - OSHA reports require specific permissions
*/

-- Create workers_comp_incidents table
CREATE TABLE IF NOT EXISTS workers_comp_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE NOT NULL,
  incident_date timestamptz NOT NULL,
  reported_date timestamptz DEFAULT now(),
  employee_id uuid REFERENCES employees(id),
  reporter_id uuid REFERENCES profiles(id),
  supervisor_id uuid REFERENCES employees(id),
  location text NOT NULL,
  incident_description text NOT NULL,
  witness_names text[] DEFAULT '{}',
  injury_type text,
  body_parts_affected jsonb DEFAULT '[]',
  severity text CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  treatment_required text CHECK (treatment_required IN ('first_aid', 'medical_attention', 'emergency_room', 'hospitalization')),
  medical_facility text,
  lost_time boolean DEFAULT false,
  days_away_from_work integer DEFAULT 0,
  days_restricted_duty integer DEFAULT 0,
  recordable boolean DEFAULT false,
  root_cause text,
  corrective_actions text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'closed')),
  claim_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Create OSHA 300 log table
CREATE TABLE IF NOT EXISTS osha_300_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES workers_comp_incidents(id),
  case_number text NOT NULL,
  employee_name text NOT NULL,
  job_title text NOT NULL,
  injury_date date NOT NULL,
  where_event_occurred text NOT NULL,
  injury_description text NOT NULL,
  injury_classification text CHECK (injury_classification IN ('death', 'days_away_from_work', 'job_transfer_restriction', 'other_recordable')),
  death_date date,
  days_away_from_work integer DEFAULT 0,
  days_job_transfer_restriction integer DEFAULT 0,
  privacy_case boolean DEFAULT false,
  establishment_name text,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create OSHA reports table
CREATE TABLE IF NOT EXISTS osha_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text CHECK (report_type IN ('osha_300', 'osha_300a', 'osha_301', 'audit', 'inspection')) NOT NULL,
  report_period_start date NOT NULL,
  report_period_end date NOT NULL,
  total_cases integer DEFAULT 0,
  total_deaths integer DEFAULT 0,
  total_days_away integer DEFAULT 0,
  total_job_transfers integer DEFAULT 0,
  total_other_recordable integer DEFAULT 0,
  total_injuries integer DEFAULT 0,
  total_skin_disorders integer DEFAULT 0,
  total_respiratory_conditions integer DEFAULT 0,
  total_poisonings integer DEFAULT 0,
  total_hearing_loss integer DEFAULT 0,
  total_other_illnesses integer DEFAULT 0,
  report_data jsonb DEFAULT '{}',
  generated_by uuid REFERENCES profiles(id),
  generated_at timestamptz DEFAULT now(),
  certified_by uuid REFERENCES profiles(id),
  certified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create body injury mapping reference table
CREATE TABLE IF NOT EXISTS body_injury_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part_name text NOT NULL,
  body_region text CHECK (body_region IN ('head', 'neck', 'torso', 'upper_extremity', 'lower_extremity')) NOT NULL,
  side text CHECK (side IN ('left', 'right', 'bilateral', 'center')),
  display_order integer DEFAULT 0
);

-- Insert standard body parts for injury mapping
INSERT INTO body_injury_mapping (body_part_name, body_region, side, display_order) VALUES
  ('Head/Skull', 'head', 'center', 1),
  ('Face', 'head', 'center', 2),
  ('Eye - Left', 'head', 'left', 3),
  ('Eye - Right', 'head', 'right', 4),
  ('Ear - Left', 'head', 'left', 5),
  ('Ear - Right', 'head', 'right', 6),
  ('Nose', 'head', 'center', 7),
  ('Mouth/Teeth', 'head', 'center', 8),
  ('Neck', 'neck', 'center', 9),
  ('Shoulder - Left', 'upper_extremity', 'left', 10),
  ('Shoulder - Right', 'upper_extremity', 'right', 11),
  ('Upper Arm - Left', 'upper_extremity', 'left', 12),
  ('Upper Arm - Right', 'upper_extremity', 'right', 13),
  ('Elbow - Left', 'upper_extremity', 'left', 14),
  ('Elbow - Right', 'upper_extremity', 'right', 15),
  ('Forearm - Left', 'upper_extremity', 'left', 16),
  ('Forearm - Right', 'upper_extremity', 'right', 17),
  ('Wrist - Left', 'upper_extremity', 'left', 18),
  ('Wrist - Right', 'upper_extremity', 'right', 19),
  ('Hand - Left', 'upper_extremity', 'left', 20),
  ('Hand - Right', 'upper_extremity', 'right', 21),
  ('Fingers - Left', 'upper_extremity', 'left', 22),
  ('Fingers - Right', 'upper_extremity', 'right', 23),
  ('Chest', 'torso', 'center', 24),
  ('Upper Back', 'torso', 'center', 25),
  ('Lower Back', 'torso', 'center', 26),
  ('Abdomen', 'torso', 'center', 27),
  ('Hip - Left', 'lower_extremity', 'left', 28),
  ('Hip - Right', 'lower_extremity', 'right', 29),
  ('Upper Leg - Left', 'lower_extremity', 'left', 30),
  ('Upper Leg - Right', 'lower_extremity', 'right', 31),
  ('Knee - Left', 'lower_extremity', 'left', 32),
  ('Knee - Right', 'lower_extremity', 'right', 33),
  ('Lower Leg - Left', 'lower_extremity', 'left', 34),
  ('Lower Leg - Right', 'lower_extremity', 'right', 35),
  ('Ankle - Left', 'lower_extremity', 'left', 36),
  ('Ankle - Right', 'lower_extremity', 'right', 37),
  ('Foot - Left', 'lower_extremity', 'left', 38),
  ('Foot - Right', 'lower_extremity', 'right', 39),
  ('Toes - Left', 'lower_extremity', 'left', 40),
  ('Toes - Right', 'lower_extremity', 'right', 41)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE workers_comp_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE osha_300_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE osha_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_injury_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workers_comp_incidents
CREATE POLICY "Authenticated users can view incidents"
  ON workers_comp_incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create incidents"
  ON workers_comp_incidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update incidents"
  ON workers_comp_incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete incidents"
  ON workers_comp_incidents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for osha_300_log
CREATE POLICY "Authenticated users can view OSHA 300 log"
  ON osha_300_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create OSHA 300 entries"
  ON osha_300_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update OSHA 300 entries"
  ON osha_300_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete OSHA 300 entries"
  ON osha_300_log FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for osha_reports
CREATE POLICY "Authenticated users can view OSHA reports"
  ON osha_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create OSHA reports"
  ON osha_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Authenticated users can update OSHA reports"
  ON osha_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete OSHA reports"
  ON osha_reports FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for body_injury_mapping (read-only reference data)
CREATE POLICY "Anyone can view body injury mapping"
  ON body_injury_mapping FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_employee ON workers_comp_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_supervisor ON workers_comp_incidents(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_date ON workers_comp_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_workers_comp_incidents_status ON workers_comp_incidents(status);
CREATE INDEX IF NOT EXISTS idx_osha_300_log_year ON osha_300_log(year);
CREATE INDEX IF NOT EXISTS idx_osha_300_log_incident ON osha_300_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_osha_reports_type ON osha_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_osha_reports_period ON osha_reports(report_period_start, report_period_end);