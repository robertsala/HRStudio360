/*
  # AI System, Change Log, and Restoration Schema

  ## Overview
  This migration creates a comprehensive system for AI-powered diagnostics, auto-fixes,
  snapshots, restoration, and change tracking with historical logging capabilities.

  ## New Tables

  ### 1. `system_snapshots`
  Stores system state snapshots for restoration with 30-day retention
  - `id` (uuid, primary key)
  - `name` (text) - User-friendly snapshot name
  - `description` (text) - Snapshot description
  - `snapshot_data` (jsonb) - Compressed system state
  - `snapshot_type` (text) - 'manual', 'automatic', 'pre_operation'
  - `triggered_by` (uuid) - User who created snapshot
  - `modules_included` (text[]) - Array of affected modules
  - `size_bytes` (bigint) - Snapshot size
  - `expires_at` (timestamptz) - Expiration date (30 days from creation)
  - `created_at` (timestamptz)

  ### 2. `ai_fixes_pending`
  Proposed AI fixes awaiting Product Owner or HR approval
  - `id` (uuid, primary key)
  - `fix_type` (text) - Type of fix proposed
  - `category` (text) - 'data_quality', 'compliance', 'formatting', etc.
  - `severity` (text) - 'low', 'medium', 'high', 'critical'
  - `affected_table` (text) - Database table affected
  - `affected_record_id` (uuid) - Specific record ID
  - `current_value` (jsonb) - Current state before fix
  - `proposed_value` (jsonb) - Proposed state after fix
  - `reason` (text) - AI explanation for the fix
  - `auto_fix_confidence` (numeric) - Confidence score 0-100
  - `status` (text) - 'pending', 'approved', 'rejected', 'applied'
  - `reviewed_by` (uuid) - User who reviewed
  - `reviewed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 3. `ai_fixes_history`
  Historical record of all approved and rejected fixes
  - `id` (uuid, primary key)
  - `fix_id` (uuid) - Reference to original pending fix
  - `fix_type` (text)
  - `category` (text)
  - `action_taken` (text) - 'approved', 'rejected', 'auto_applied'
  - `affected_table` (text)
  - `affected_record_id` (uuid)
  - `before_state` (jsonb)
  - `after_state` (jsonb)
  - `applied_by` (uuid)
  - `applied_at` (timestamptz)
  - `impact_summary` (text)

  ### 4. `change_log`
  Comprehensive system change tracking with notifications
  - `id` (uuid, primary key)
  - `change_type` (text) - 'update', 'improvement', 'fix', 'feature', 'system_change', 'auto_fix', 'restoration', 'configuration'
  - `title` (text) - Short change title
  - `description` (text) - Detailed change description
  - `affected_modules` (text[]) - Array of affected modules
  - `impact_level` (text) - 'low', 'medium', 'high', 'critical'
  - `visibility_scope` (text) - 'all_employees', 'hr_only', 'product_owner_only'
  - `user_id` (uuid) - User who made the change
  - `technical_details` (jsonb) - Additional technical information
  - `notification_sent` (boolean) - Whether notifications were sent
  - `version` (text) - System version or build number
  - `created_at` (timestamptz)

  ### 5. `change_notifications`
  Tracks notification delivery for changes
  - `id` (uuid, primary key)
  - `change_log_id` (uuid, references change_log)
  - `user_id` (uuid) - User receiving notification
  - `notification_type` (text) - 'in_app', 'email', 'digest'
  - `delivered_at` (timestamptz)
  - `read_at` (timestamptz)
  - `acknowledged` (boolean)

  ### 6. `ai_recommendations`
  AI-generated recommendations for system improvements
  - `id` (uuid, primary key)
  - `recommendation_type` (text) - 'turnover_risk', 'workforce_optimization', 'benefits', etc.
  - `priority` (integer) - Priority score 1-100
  - `title` (text)
  - `description` (text)
  - `affected_modules` (text[])
  - `actionable_steps` (jsonb) - Array of suggested actions
  - `potential_impact` (text)
  - `status` (text) - 'active', 'in_progress', 'completed', 'dismissed'
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### 7. `system_health_metrics`
  Tracks system performance and data quality metrics
  - `id` (uuid, primary key)
  - `metric_type` (text) - 'data_quality', 'performance', 'security', etc.
  - `metric_name` (text)
  - `metric_value` (numeric)
  - `threshold_value` (numeric)
  - `status` (text) - 'healthy', 'warning', 'critical'
  - `details` (jsonb)
  - `measured_at` (timestamptz)

  ### 8. `restoration_history`
  Tracks all system restoration operations
  - `id` (uuid, primary key)
  - `snapshot_id` (uuid, references system_snapshots)
  - `restore_type` (text) - 'full_system', 'module_specific', 'selective_records'
  - `modules_restored` (text[])
  - `records_affected` (integer)
  - `initiated_by` (uuid)
  - `completed_at` (timestamptz)
  - `success` (boolean)
  - `error_message` (text)
  - `restore_summary` (jsonb)

  ### 9. `snapshot_retention_alerts`
  Manages snapshot expiration notifications
  - `id` (uuid, primary key)
  - `snapshot_id` (uuid, references system_snapshots)
  - `alert_type` (text) - '7_day_warning', '1_day_warning', 'expired'
  - `sent_to` (uuid[]) - Array of user IDs who received alert
  - `sent_at` (timestamptz)
  - `acknowledged_by` (uuid[])

  ### 10. `historical_changes`
  Stores retrospectively mined changes from code and git history
  - `id` (uuid, primary key)
  - `change_date` (timestamptz) - Original date of change
  - `change_type` (text)
  - `title` (text)
  - `description` (text)
  - `source` (text) - 'git_commit', 'manual_entry', 'code_analysis'
  - `commit_hash` (text)
  - `imported_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Product Owner and HR have full access to all features
  - Employees have read-only access to change_log entries marked for all_employees
  - Managers can view team-related recommendations
  - Strict access controls on restoration and AI fix approval features

  ## Indexes
  - Create indexes on frequently queried columns for performance
  - Add composite indexes for common filter combinations
*/

-- Create system_snapshots table
CREATE TABLE IF NOT EXISTS system_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  snapshot_data jsonb NOT NULL,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('manual', 'automatic', 'pre_operation')),
  triggered_by uuid REFERENCES auth.users(id),
  modules_included text[] NOT NULL DEFAULT '{}',
  size_bytes bigint,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Create ai_fixes_pending table
CREATE TABLE IF NOT EXISTS ai_fixes_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fix_type text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_table text NOT NULL,
  affected_record_id uuid,
  current_value jsonb NOT NULL,
  proposed_value jsonb NOT NULL,
  reason text NOT NULL,
  auto_fix_confidence numeric CHECK (auto_fix_confidence >= 0 AND auto_fix_confidence <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create ai_fixes_history table
CREATE TABLE IF NOT EXISTS ai_fixes_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fix_id uuid REFERENCES ai_fixes_pending(id),
  fix_type text NOT NULL,
  category text NOT NULL,
  action_taken text NOT NULL CHECK (action_taken IN ('approved', 'rejected', 'auto_applied')),
  affected_table text NOT NULL,
  affected_record_id uuid,
  before_state jsonb,
  after_state jsonb,
  applied_by uuid REFERENCES auth.users(id),
  applied_at timestamptz DEFAULT now(),
  impact_summary text
);

-- Create change_log table
CREATE TABLE IF NOT EXISTS change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type text NOT NULL CHECK (change_type IN ('update', 'improvement', 'fix', 'feature', 'system_change', 'auto_fix', 'restoration', 'configuration')),
  title text NOT NULL,
  description text NOT NULL,
  affected_modules text[] DEFAULT '{}',
  impact_level text NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  visibility_scope text NOT NULL DEFAULT 'all_employees' CHECK (visibility_scope IN ('all_employees', 'hr_only', 'product_owner_only')),
  user_id uuid REFERENCES auth.users(id),
  technical_details jsonb,
  notification_sent boolean DEFAULT false,
  version text,
  created_at timestamptz DEFAULT now()
);

-- Create change_notifications table
CREATE TABLE IF NOT EXISTS change_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_log_id uuid REFERENCES change_log(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  notification_type text NOT NULL CHECK (notification_type IN ('in_app', 'email', 'digest')),
  delivered_at timestamptz DEFAULT now(),
  read_at timestamptz,
  acknowledged boolean DEFAULT false
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type text NOT NULL,
  priority integer CHECK (priority >= 1 AND priority <= 100),
  title text NOT NULL,
  description text NOT NULL,
  affected_modules text[] DEFAULT '{}',
  actionable_steps jsonb,
  potential_impact text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  threshold_value numeric,
  status text NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
  details jsonb,
  measured_at timestamptz DEFAULT now()
);

-- Create restoration_history table
CREATE TABLE IF NOT EXISTS restoration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid REFERENCES system_snapshots(id),
  restore_type text NOT NULL CHECK (restore_type IN ('full_system', 'module_specific', 'selective_records')),
  modules_restored text[] DEFAULT '{}',
  records_affected integer,
  initiated_by uuid REFERENCES auth.users(id),
  completed_at timestamptz DEFAULT now(),
  success boolean NOT NULL,
  error_message text,
  restore_summary jsonb
);

-- Create snapshot_retention_alerts table
CREATE TABLE IF NOT EXISTS snapshot_retention_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid REFERENCES system_snapshots(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('7_day_warning', '1_day_warning', 'expired')),
  sent_to uuid[] DEFAULT '{}',
  sent_at timestamptz DEFAULT now(),
  acknowledged_by uuid[] DEFAULT '{}'
);

-- Create historical_changes table
CREATE TABLE IF NOT EXISTS historical_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_date timestamptz NOT NULL,
  change_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  source text NOT NULL CHECK (source IN ('git_commit', 'manual_entry', 'code_analysis')),
  commit_hash text,
  imported_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_snapshots_expires_at ON system_snapshots(expires_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON system_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_fixes_status ON ai_fixes_pending(status);
CREATE INDEX IF NOT EXISTS idx_ai_fixes_created_at ON ai_fixes_pending(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON change_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_type ON change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_change_log_visibility ON change_log(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_change_notifications_user ON change_notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_health_metrics_measured_at ON system_health_metrics(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_restoration_history_snapshot ON restoration_history(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_historical_changes_date ON historical_changes(change_date DESC);

-- Enable Row Level Security
ALTER TABLE system_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fixes_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fixes_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE restoration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_snapshots
-- Product Owner and HR can view all snapshots
CREATE POLICY "Product Owner and HR can view all snapshots"
  ON system_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- Product Owner and HR can create snapshots
CREATE POLICY "Product Owner and HR can create snapshots"
  ON system_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- Product Owner and HR can delete snapshots
CREATE POLICY "Product Owner and HR can delete snapshots"
  ON system_snapshots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- RLS Policies for ai_fixes_pending
-- Product Owner and HR can view pending fixes
CREATE POLICY "Product Owner and HR can view pending fixes"
  ON ai_fixes_pending FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- System can insert pending fixes
CREATE POLICY "System can insert pending fixes"
  ON ai_fixes_pending FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Product Owner and HR can update pending fixes (approve/reject)
CREATE POLICY "Product Owner and HR can update pending fixes"
  ON ai_fixes_pending FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- RLS Policies for ai_fixes_history
-- Product Owner and HR can view fix history
CREATE POLICY "Product Owner and HR can view fix history"
  ON ai_fixes_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- System can insert fix history
CREATE POLICY "System can insert fix history"
  ON ai_fixes_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for change_log
-- Employees can view changes marked for all_employees
CREATE POLICY "Employees can view applicable changes"
  ON change_log FOR SELECT
  TO authenticated
  USING (
    visibility_scope = 'all_employees'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (visibility_scope = 'hr_only' AND (profiles.role = 'hr' OR profiles.department = 'HR'))
        OR (visibility_scope = 'product_owner_only' AND profiles.role = 'admin')
        OR profiles.role IN ('admin', 'hr')
        OR profiles.department = 'HR'
      )
    )
  );

-- Authenticated users can create change log entries
CREATE POLICY "Authenticated users can create change log entries"
  ON change_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for change_notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON change_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON change_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON change_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_recommendations
-- All authenticated users can view recommendations
CREATE POLICY "All users can view recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- System can create recommendations
CREATE POLICY "System can create recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Product Owner and HR can update recommendations
CREATE POLICY "Product Owner and HR can update recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- RLS Policies for system_health_metrics
-- Product Owner and HR can view health metrics
CREATE POLICY "Product Owner and HR can view health metrics"
  ON system_health_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- System can insert health metrics
CREATE POLICY "System can insert health metrics"
  ON system_health_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for restoration_history
-- Product Owner and HR can view restoration history
CREATE POLICY "Product Owner and HR can view restoration history"
  ON restoration_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- System can create restoration history
CREATE POLICY "System can create restoration history"
  ON restoration_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for snapshot_retention_alerts
-- Product Owner and HR can view retention alerts
CREATE POLICY "Product Owner and HR can view retention alerts"
  ON snapshot_retention_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'hr') OR profiles.department = 'HR')
    )
  );

-- System can create retention alerts
CREATE POLICY "System can create retention alerts"
  ON snapshot_retention_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- System can update retention alerts
CREATE POLICY "System can update retention alerts"
  ON snapshot_retention_alerts FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for historical_changes
-- All authenticated users can view historical changes
CREATE POLICY "All users can view historical changes"
  ON historical_changes FOR SELECT
  TO authenticated
  USING (true);

-- Product Owner can insert historical changes
CREATE POLICY "Product Owner can insert historical changes"
  ON historical_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
