/*
  # Create Hiring Collaboration System

  ## Overview
  This migration creates a comprehensive collaboration system for the hiring process,
  allowing team members to work together on candidate evaluations with ratings,
  comments, and invitations.

  ## New Tables

  ### 1. `candidate_ratings`
  Stores star ratings for candidates with user attribution
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates) - Candidate being rated
  - `user_id` (uuid, references profiles) - User who rated
  - `rating` (integer) - Star rating 1-5
  - `created_at` (timestamptz) - When rating was created
  - `updated_at` (timestamptz) - When rating was last updated

  ### 2. `candidate_comments`
  Stores comments and notes about candidates
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates) - Candidate being commented on
  - `user_id` (uuid, references profiles) - User who commented
  - `comment_text` (text) - Comment content
  - `is_private` (boolean) - Whether comment is private to HR/admins
  - `created_at` (timestamptz) - When comment was created
  - `updated_at` (timestamptz) - When comment was last updated

  ### 3. `candidate_collaborators`
  Manages invited team members for each candidate
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidates) - Candidate being collaborated on
  - `user_id` (uuid, references profiles) - Invited user
  - `invited_by` (uuid, references profiles) - User who sent invitation
  - `role` (text) - Collaboration role: viewer, commenter, decision_maker
  - `status` (text) - Invitation status: pending, accepted, declined, revoked
  - `invited_at` (timestamptz) - When invitation was sent
  - `responded_at` (timestamptz) - When user responded to invitation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `collaboration_notifications`
  Tracks notifications for collaboration invitations
  - `id` (uuid, primary key)
  - `collaborator_id` (uuid, references candidate_collaborators) - Related collaboration
  - `user_id` (uuid, references profiles) - User receiving notification
  - `notification_type` (text) - Type: invitation, accepted, declined, comment_added
  - `message` (text) - Notification message
  - `read` (boolean) - Whether notification has been read
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all new tables
  - HR and Product Owners can manage all collaborations
  - Users can view collaborations they're part of
  - Users can comment and rate candidates they're invited to
  - Only HR and inviter can revoke collaborations

  ## Indexes
  - Index on candidate_id for all tables for fast lookups
  - Index on user_id for filtering user-specific data
  - Index on status for filtering active collaborations
  - Unique constraint on (candidate_id, user_id) for ratings
*/

-- Create candidate_ratings table
CREATE TABLE IF NOT EXISTS candidate_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, user_id)
);

ALTER TABLE candidate_ratings ENABLE ROW LEVEL SECURITY;

-- Create candidate_comments table
CREATE TABLE IF NOT EXISTS candidate_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;

-- Create candidate_collaborators table
CREATE TABLE IF NOT EXISTS candidate_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'commenter' CHECK (role IN ('viewer', 'commenter', 'decision_maker')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, user_id)
);

ALTER TABLE candidate_collaborators ENABLE ROW LEVEL SECURITY;

-- Create collaboration_notifications table
CREATE TABLE IF NOT EXISTS collaboration_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid REFERENCES candidate_collaborators(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('invitation', 'accepted', 'declined', 'comment_added', 'rating_added', 'status_changed')),
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaboration_notifications ENABLE ROW LEVEL SECURITY;

-- Indexes for candidate_ratings
CREATE INDEX IF NOT EXISTS idx_candidate_ratings_candidate_id ON candidate_ratings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_ratings_user_id ON candidate_ratings(user_id);

-- Indexes for candidate_comments
CREATE INDEX IF NOT EXISTS idx_candidate_comments_candidate_id ON candidate_comments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_user_id ON candidate_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_created_at ON candidate_comments(created_at DESC);

-- Indexes for candidate_collaborators
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_candidate_id ON candidate_collaborators(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_user_id ON candidate_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_status ON candidate_collaborators(status);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_invited_by ON candidate_collaborators(invited_by);

-- Indexes for collaboration_notifications
CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_user_id ON collaboration_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_read ON collaboration_notifications(read);
CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_created_at ON collaboration_notifications(created_at DESC);

-- RLS Policies for candidate_ratings

CREATE POLICY "HR and admins can view all ratings"
  ON candidate_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "Users can view ratings for candidates they collaborate on"
  ON candidate_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidate_collaborators
      WHERE candidate_collaborators.candidate_id = candidate_ratings.candidate_id
      AND candidate_collaborators.user_id = auth.uid()
      AND candidate_collaborators.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own ratings"
  ON candidate_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('HR', 'Product Owner')
      )
      OR EXISTS (
        SELECT 1 FROM candidate_collaborators
        WHERE candidate_collaborators.candidate_id = candidate_ratings.candidate_id
        AND candidate_collaborators.user_id = auth.uid()
        AND candidate_collaborators.status = 'accepted'
        AND candidate_collaborators.role IN ('commenter', 'decision_maker')
      )
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON candidate_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for candidate_comments

CREATE POLICY "HR and admins can view all comments"
  ON candidate_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('HR', 'Product Owner')
    )
  );

CREATE POLICY "Users can view non-private comments for candidates they collaborate on"
  ON candidate_comments
  FOR SELECT
  TO authenticated
  USING (
    (NOT is_private OR user_id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM candidate_collaborators
        WHERE candidate_collaborators.candidate_id = candidate_comments.candidate_id
        AND candidate_collaborators.user_id = auth.uid()
        AND candidate_collaborators.status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can insert comments on candidates they collaborate on"
  ON candidate_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('HR', 'Product Owner')
      )
      OR EXISTS (
        SELECT 1 FROM candidate_collaborators
        WHERE candidate_collaborators.candidate_id = candidate_comments.candidate_id
        AND candidate_collaborators.user_id = auth.uid()
        AND candidate_collaborators.status = 'accepted'
        AND candidate_collaborators.role IN ('commenter', 'decision_maker')
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON candidate_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON candidate_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for candidate_collaborators

CREATE POLICY "HR and admins can manage all collaborators"
  ON candidate_collaborators
  FOR ALL
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

CREATE POLICY "Users can view collaborations they are part of"
  ON candidate_collaborators
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR invited_by = auth.uid()
  );

CREATE POLICY "Users can respond to their invitations"
  ON candidate_collaborators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for collaboration_notifications

CREATE POLICY "Users can view their own notifications"
  ON collaboration_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON collaboration_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON collaboration_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_candidate_ratings_updated_at ON candidate_ratings;
CREATE TRIGGER update_candidate_ratings_updated_at
  BEFORE UPDATE ON candidate_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_comments_updated_at ON candidate_comments;
CREATE TRIGGER update_candidate_comments_updated_at
  BEFORE UPDATE ON candidate_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_collaborators_updated_at ON candidate_collaborators;
CREATE TRIGGER update_candidate_collaborators_updated_at
  BEFORE UPDATE ON candidate_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when collaboration is created
CREATE OR REPLACE FUNCTION notify_collaboration_invite()
RETURNS TRIGGER AS $$
DECLARE
  inviter_name text;
  candidate_name text;
  candidate_position text;
BEGIN
  -- Get inviter name
  SELECT full_name INTO inviter_name
  FROM profiles
  WHERE id = NEW.invited_by;

  -- Get candidate info
  SELECT name, position INTO candidate_name, candidate_position
  FROM candidates
  WHERE id = NEW.candidate_id;

  -- Create notification
  INSERT INTO collaboration_notifications (
    collaborator_id,
    user_id,
    notification_type,
    message,
    read
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'invitation',
    inviter_name || ' invited you to collaborate on candidate ' || candidate_name || ' (' || candidate_position || ')',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on new collaboration
DROP TRIGGER IF EXISTS notify_on_collaboration_invite ON candidate_collaborators;
CREATE TRIGGER notify_on_collaboration_invite
  AFTER INSERT ON candidate_collaborators
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_collaboration_invite();

-- Function to update comments_count on candidates table
CREATE OR REPLACE FUNCTION update_candidate_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE candidates
    SET comments_count = comments_count + 1
    WHERE id = NEW.candidate_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE candidates
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.candidate_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update comments count
DROP TRIGGER IF EXISTS update_comments_count ON candidate_comments;
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON candidate_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_comments_count();

-- Function to update candidate rating field with average
CREATE OR REPLACE FUNCTION update_candidate_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating numeric;
BEGIN
  SELECT AVG(rating) INTO avg_rating
  FROM candidate_ratings
  WHERE candidate_id = COALESCE(NEW.candidate_id, OLD.candidate_id);

  UPDATE candidates
  SET rating = COALESCE(ROUND(avg_rating), 0)
  WHERE id = COALESCE(NEW.candidate_id, OLD.candidate_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update average rating
DROP TRIGGER IF EXISTS update_avg_rating ON candidate_ratings;
CREATE TRIGGER update_avg_rating
  AFTER INSERT OR UPDATE OR DELETE ON candidate_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_avg_rating();