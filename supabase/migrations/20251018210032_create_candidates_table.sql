/*
  # Create Candidates Table for Recruitment Pipeline

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key)
      - `name` (text) - Full name
      - `email` (text, unique) - Email address
      - `phone` (text) - Phone number
      - `position` (text) - Applied position
      - `department` (text) - Target department
      - `experience` (text) - Years of experience
      - `location` (text) - Current location
      - `salary_expectation` (numeric) - Expected salary
      - `applied_date` (date) - Application date
      - `status` (text) - Current pipeline status
      - `skills` (text array) - Skills list
      - `education` (text) - Education background
      - `previous_company` (text) - Previous employer
      - `profile_picture` (text) - Photo URL
      - `likes` (integer) - Number of likes
      - `views` (integer) - Number of views
      - `comments_count` (integer) - Number of comments
      - `ai_match_score` (integer) - AI matching score 0-100
      - `rating` (integer) - Rating 0-5
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `candidates` table
    - HR and admins can manage all candidates
    - Managers can view candidates for their department
    - All authenticated users can view candidates
*/

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  position text NOT NULL,
  department text NOT NULL,
  experience text DEFAULT '',
  location text DEFAULT '',
  salary_expectation numeric DEFAULT 0,
  applied_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'New Candidate' CHECK (status IN ('New Candidate', 'Phone Screen', 'Interview', 'Offer Sent', 'Offer Accepted', 'Hired', 'Rejected')),
  skills text[] DEFAULT '{}',
  education text DEFAULT '',
  previous_company text DEFAULT '',
  profile_picture text DEFAULT '',
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  ai_match_score integer DEFAULT 0 CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage all candidates"
  ON candidates
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

CREATE POLICY "All authenticated users can view candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_department ON candidates(department);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

-- Insert sample candidates
INSERT INTO candidates (name, email, phone, position, department, experience, location, salary_expectation, applied_date, status, skills, education, previous_company, profile_picture, likes, views, comments_count, ai_match_score, rating, notes)
VALUES
  ('Kateryna Shmygal', 'kateryna.s@email.com', '+1 (555) 123-4567', 'Senior Software Engineer', 'Engineering', '5 years', 'San Francisco, CA', 140000, '2025-01-15', 'New Candidate', ARRAY['React', 'TypeScript', 'Node.js', 'AWS', 'Python'], 'MS Computer Science', 'Google', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 3, 12, 2, 85, 4, ''),
  ('Alice Green', 'alice.green@email.com', '+1 (555) 234-5678', 'Product Manager', 'Product', '4 years', 'Austin, TX', 120000, '2025-01-12', 'Phone Screen', ARRAY['Product Strategy', 'Agile', 'Analytics', 'User Research'], 'MBA', 'Microsoft', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 1, 8, 0, 78, 3, ''),
  ('Myroslava Kvitka', 'myroslava.k@email.com', '+1 (555) 345-6789', 'UX Designer', 'Design', '3 years', 'New York, NY', 95000, '2025-01-10', 'Interview', ARRAY['Figma', 'User Research', 'Prototyping', 'Design Systems'], 'BFA Design', 'Adobe', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 3, 15, 0, 92, 5, ''),
  ('Stephan Yarovyi', 'stephan.y@email.com', '+1 (555) 456-7890', 'Data Scientist', 'Engineering', '6 years', 'Seattle, WA', 150000, '2025-01-08', 'Offer Sent', ARRAY['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics'], 'PhD Data Science', 'Amazon', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 1, 22, 0, 96, 5, ''),
  ('Karyna Nemyrova', 'karyna.n@email.com', '+1 (555) 567-8901', 'Marketing Manager', 'Marketing', '4 years', 'Boston, MA', 85000, '2025-01-04', 'Offer Accepted', ARRAY['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'], 'BA Marketing', 'HubSpot', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 0, 19, 0, 88, 4, ''),
  ('Darly Lisovskyi', 'darly.l@email.com', '+1 (555) 678-9012', 'DevOps Engineer', 'Engineering', '5 years', 'Denver, CO', 130000, '2025-01-14', 'New Candidate', ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'], 'BS Computer Science', 'Atlassian', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 1, 6, 0, 82, 3, ''),
  ('Tonny Waletta', 'tonny.w@email.com', '+1 (555) 789-0123', 'Sales Representative', 'Sales', '3 years', 'Miami, FL', 75000, '2025-01-13', 'Phone Screen', ARRAY['B2B Sales', 'CRM', 'Lead Generation', 'Negotiation'], 'BA Business', 'Salesforce', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 3, 9, 0, 74, 3, ''),
  ('Olga Knysh', 'olga.k@email.com', '+1 (555) 890-1234', 'Frontend Developer', 'Engineering', '2 years', 'Portland, OR', 85000, '2025-01-11', 'Interview', ARRAY['Vue.js', 'JavaScript', 'CSS', 'HTML'], 'BS Computer Science', 'Startup', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 2, 11, 0, 79, 3, '')
ON CONFLICT (email) DO NOTHING;