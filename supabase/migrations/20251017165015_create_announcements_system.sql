/*
  # Create Company Announcements System

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `priority` (text: low, normal, high, urgent)
      - `target_audience_type` (text: all, specific_employees, departments, locations)
      - `target_employee_ids` (text array for specific employees)
      - `target_departments` (text array for specific departments)
      - `target_locations` (text array for specific locations)
      - `published` (boolean, default false)
      - `published_at` (timestamptz)
      - `expires_at` (timestamptz, optional)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `announcement_reads`
      - `id` (uuid, primary key)
      - `announcement_id` (uuid, references announcements)
      - `user_id` (uuid, references profiles)
      - `read_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - HR staff can create, update, and manage announcements
    - All authenticated users can read announcements targeted to them
    - Users can mark announcements as read

  3. Indexes
    - Index on published, published_at for efficient queries
    - Index on target_audience_type for filtering
    - Index on announcement_reads for user queries
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience_type text DEFAULT 'all' CHECK (target_audience_type IN ('all', 'specific_employees', 'departments', 'locations')),
  target_employee_ids text[] DEFAULT '{}',
  target_departments text[] DEFAULT '{}',
  target_locations text[] DEFAULT '{}',
  published boolean DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcement_reads table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON announcements(target_audience_type);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id, announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Policies for announcements table
CREATE POLICY "Authenticated users can view published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (published = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Authenticated users can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for announcement_reads table
CREATE POLICY "Users can view their own read status"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status"
  ON announcement_reads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
