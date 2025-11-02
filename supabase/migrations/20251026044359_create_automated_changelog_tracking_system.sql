/*
  # Create Automated Change Log Tracking System
  
  1. Overview
    - Implements dual-source change detection (git commits + database migrations)
    - Adds approval workflow for system changes, auto-fixes, and restorations
    - Tracks deployment history and change sources
    - Provides analytics and metrics for change velocity
    
  2. New Tables Created
    - processed_commits: Tracks which git commits have been logged
    - change_log_approvals: Manages approval workflow for changes
    - change_log_sources: Links changes to multiple detection sources
    - deployment_tracking: Logs each deployment with timestamp
    - change_metrics: Stores analytics data for reporting
    
  3. Enhanced Tables
    - change_log: Adds approval_status, approval_required, approved_by, approved_at fields
    - change_log: Adds source_type to track where change was detected from
    
  4. Security
    - RLS enabled on all tables
    - Approval permissions restricted to HR staff and admins
    - Read access for all authenticated users
    - Write access controlled by role
    
  5. Important Notes
    - System changes require approval before going live
    - Auto-fixes and restorations require approval
    - Features and improvements auto-publish
    - Change log entries can be backdated to actual deployment dates
*/

-- Add new fields to existing change_log table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE change_log ADD COLUMN approval_status text DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'approval_required'
  ) THEN
    ALTER TABLE change_log ADD COLUMN approval_required boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE change_log ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE change_log ADD COLUMN approved_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE change_log ADD COLUMN source_type text DEFAULT 'manual' CHECK (source_type IN ('manual', 'git_commit', 'migration', 'component_detection', 'automated'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'git_commit_hash'
  ) THEN
    ALTER TABLE change_log ADD COLUMN git_commit_hash text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'change_log' AND column_name = 'migration_file'
  ) THEN
    ALTER TABLE change_log ADD COLUMN migration_file text;
  END IF;
END $$;

-- Create processed_commits table
CREATE TABLE IF NOT EXISTS processed_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_hash text UNIQUE NOT NULL,
  commit_message text,
  commit_author text,
  commit_date timestamptz NOT NULL,
  change_log_id uuid REFERENCES change_log(id),
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE processed_commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Processed commits visible to authenticated users"
  ON processed_commits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage processed commits"
  ON processed_commits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create change_log_approvals table
CREATE TABLE IF NOT EXISTS change_log_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_log_id uuid NOT NULL REFERENCES change_log(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES profiles(id),
  submitted_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE change_log_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvals visible to authenticated users"
  ON change_log_approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can manage approvals"
  ON change_log_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'hr')
    )
  );

-- Create change_log_sources table
CREATE TABLE IF NOT EXISTS change_log_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_log_id uuid NOT NULL REFERENCES change_log(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('git_commit', 'migration', 'component_file', 'manual')),
  source_reference text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE change_log_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sources visible to authenticated users"
  ON change_log_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage sources"
  ON change_log_sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create deployment_tracking table
CREATE TABLE IF NOT EXISTS deployment_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id text UNIQUE NOT NULL,
  deployed_at timestamptz NOT NULL DEFAULT now(),
  deployed_by uuid REFERENCES profiles(id),
  git_branch text,
  git_commit_hash text,
  migration_count int DEFAULT 0,
  component_changes_count int DEFAULT 0,
  change_log_entries_created int DEFAULT 0,
  deployment_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deployment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deployments visible to authenticated users"
  ON deployment_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage deployments"
  ON deployment_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create change_metrics table
CREATE TABLE IF NOT EXISTS change_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  total_changes int DEFAULT 0,
  features_added int DEFAULT 0,
  improvements_made int DEFAULT 0,
  bugs_fixed int DEFAULT 0,
  system_changes int DEFAULT 0,
  approval_pending_count int DEFAULT 0,
  approval_approved_count int DEFAULT 0,
  approval_rejected_count int DEFAULT 0,
  avg_approval_time_hours numeric(10,2),
  user_engagement_rate numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE change_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metrics visible to authenticated users"
  ON change_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage metrics"
  ON change_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_log_approval_status ON change_log(approval_status);
CREATE INDEX IF NOT EXISTS idx_change_log_source_type ON change_log(source_type);
CREATE INDEX IF NOT EXISTS idx_change_log_git_commit ON change_log(git_commit_hash);
CREATE INDEX IF NOT EXISTS idx_processed_commits_hash ON processed_commits(commit_hash);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON change_log_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_change_log ON change_log_approvals(change_log_id);
CREATE INDEX IF NOT EXISTS idx_sources_change_log ON change_log_sources(change_log_id);
CREATE INDEX IF NOT EXISTS idx_deployment_date ON deployment_tracking(deployed_at);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON change_metrics(metric_date);

-- Update existing change_log RLS policies to include approval status
DROP POLICY IF EXISTS "Change log visible to authenticated users" ON change_log;

CREATE POLICY "Change log visible to authenticated users based on approval"
  ON change_log FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved' 
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'hr')
    )
  );

-- Create helper function to auto-flag changes requiring approval
CREATE OR REPLACE FUNCTION check_approval_requirement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.change_type IN ('system_change', 'auto_fix', 'restoration') THEN
    NEW.approval_required := true;
    NEW.approval_status := 'pending';
  ELSE
    NEW.approval_required := false;
    NEW.approval_status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set approval requirements
DROP TRIGGER IF EXISTS set_approval_requirement ON change_log;
CREATE TRIGGER set_approval_requirement
  BEFORE INSERT ON change_log
  FOR EACH ROW
  EXECUTE FUNCTION check_approval_requirement();

-- Create function to calculate daily metrics
CREATE OR REPLACE FUNCTION update_daily_change_metrics(metric_date_param date)
RETURNS void AS $$
BEGIN
  INSERT INTO change_metrics (
    metric_date,
    total_changes,
    features_added,
    improvements_made,
    bugs_fixed,
    system_changes,
    approval_pending_count,
    approval_approved_count,
    approval_rejected_count,
    avg_approval_time_hours
  )
  SELECT
    metric_date_param,
    COUNT(*) as total_changes,
    COUNT(*) FILTER (WHERE change_type = 'feature') as features_added,
    COUNT(*) FILTER (WHERE change_type = 'improvement') as improvements_made,
    COUNT(*) FILTER (WHERE change_type = 'fix') as bugs_fixed,
    COUNT(*) FILTER (WHERE change_type = 'system_change') as system_changes,
    COUNT(*) FILTER (WHERE approval_status = 'pending') as approval_pending_count,
    COUNT(*) FILTER (WHERE approval_status = 'approved') as approval_approved_count,
    COUNT(*) FILTER (WHERE approval_status = 'rejected') as approval_rejected_count,
    AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) FILTER (WHERE approved_at IS NOT NULL) as avg_approval_time_hours
  FROM change_log
  WHERE DATE(created_at) = metric_date_param
  ON CONFLICT (metric_date) 
  DO UPDATE SET
    total_changes = EXCLUDED.total_changes,
    features_added = EXCLUDED.features_added,
    improvements_made = EXCLUDED.improvements_made,
    bugs_fixed = EXCLUDED.bugs_fixed,
    system_changes = EXCLUDED.system_changes,
    approval_pending_count = EXCLUDED.approval_pending_count,
    approval_approved_count = EXCLUDED.approval_approved_count,
    approval_rejected_count = EXCLUDED.approval_rejected_count,
    avg_approval_time_hours = EXCLUDED.avg_approval_time_hours,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
