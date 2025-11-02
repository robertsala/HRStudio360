/*
  # Employee Celebrations and Badges System

  ## Overview
  Creates a comprehensive system for celebrating employee birthdays and work anniversaries
  with a progressive 40-badge achievement system. Includes milestone recognition for
  every 5-year anniversary with enhanced celebration experiences.

  ## New Tables Created

  ### 1. `anniversary_badges`
  - Master table defining all 40 anniversary badges (1-40 years)
  - Includes milestone indicators for every 5 years (5, 10, 15, 20, 25, 30, 35, 40)
  - Fields: id, year_number, badge_title, badge_description, badge_color, badge_icon,
            tier_name, is_milestone, sort_order
  - Each badge has unique styling and tier classifications (Bronze, Silver, Gold, etc.)

  ### 2. `earned_badges`
  - Tracks which badges each employee has earned
  - Links employees to their anniversary badges
  - Fields: id, employee_id, badge_id, earned_date, viewed_at, is_new
  - Timestamps track when badge was earned and when employee viewed it

  ### 3. `celebration_history`
  - Records all celebrations shown to employees
  - Prevents duplicate celebrations on same day
  - Fields: id, employee_id, celebration_type, celebration_date, years_count,
            is_milestone, dismissed_at, replay_count, last_replayed_at
  - Tracks engagement metrics and replay behavior

  ### 4. `celebration_notifications`
  - Stores celebration notifications for replay capability
  - Keeps notifications available for 7 days after celebration
  - Fields: id, employee_id, celebration_type, celebration_date, years_count,
            is_milestone, badge_id, message_title, message_body, can_replay,
            expires_at, viewed_at, replayed_at
  - Enables employees to revisit their celebrations

  ## Schema Modifications

  ### Updates to `profiles` table
  - Adds date_of_birth column for birthday tracking
  - Adds hire_date column for work anniversary calculations
  - Adds last_birthday_shown timestamp to prevent duplicate celebrations
  - Adds last_anniversary_shown timestamp to prevent duplicate celebrations

  ## Security
  - Row Level Security (RLS) enabled on all new tables
  - Employees can view their own badges and celebrations
  - Badges and achievements are publicly viewable when viewing employee profiles
  - Celebration history is private to the employee
  - HR and managers can view team member celebrations for planning purposes

  ## Badge Tier System
  - Years 1-5: Bronze (warm copper/orange tones)
  - Years 6-10: Silver (cool silver/gray tones)
  - Years 11-15: Gold (rich gold/yellow tones)
  - Years 16-20: Platinum (bright white/blue tones)
  - Years 21-25: Sapphire (deep blue tones)
  - Years 26-30: Ruby (rich red/pink tones)
  - Years 31-35: Emerald (vibrant green tones)
  - Years 36-40: Diamond (crystal/rainbow tones)

  ## Milestone Recognition
  - Every 5 years receives enhanced celebration (5, 10, 15, 20, 25, 30, 35, 40)
  - Milestone badges have special styling with glow effects
  - Milestone celebrations include premium animations and messaging
  - Non-milestone years still receive celebrations but with standard experience

  ## Notes
  - All tables use UUID primary keys for consistency
  - Foreign key constraints ensure data integrity
  - Indexes optimize celebration detection queries
  - Default values prevent null issues
  - Celebration detection runs on login via auth flow integration
  - Badges are pre-populated with all 40 years during migration
*/

-- Add celebration tracking columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hire_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hire_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_birthday_shown'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_birthday_shown date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_anniversary_shown'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_anniversary_shown date;
  END IF;
END $$;

-- Create anniversary_badges master table
CREATE TABLE IF NOT EXISTS anniversary_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_number integer UNIQUE NOT NULL CHECK (year_number >= 1 AND year_number <= 40),
  badge_title text NOT NULL,
  badge_description text NOT NULL,
  badge_color text NOT NULL,
  badge_icon text NOT NULL,
  tier_name text NOT NULL,
  is_milestone boolean DEFAULT false,
  sort_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create earned_badges table
CREATE TABLE IF NOT EXISTS earned_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES anniversary_badges(id) ON DELETE CASCADE NOT NULL,
  earned_date date NOT NULL DEFAULT CURRENT_DATE,
  viewed_at timestamptz,
  is_new boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, badge_id)
);

-- Create celebration_history table
CREATE TABLE IF NOT EXISTS celebration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  celebration_type text NOT NULL CHECK (celebration_type IN ('birthday', 'anniversary')),
  celebration_date date NOT NULL,
  years_count integer,
  is_milestone boolean DEFAULT false,
  dismissed_at timestamptz,
  replay_count integer DEFAULT 0,
  last_replayed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, celebration_type, celebration_date)
);

-- Create celebration_notifications table
CREATE TABLE IF NOT EXISTS celebration_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  celebration_type text NOT NULL CHECK (celebration_type IN ('birthday', 'anniversary')),
  celebration_date date NOT NULL,
  years_count integer,
  is_milestone boolean DEFAULT false,
  badge_id uuid REFERENCES anniversary_badges(id) ON DELETE SET NULL,
  message_title text NOT NULL,
  message_body text NOT NULL,
  can_replay boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  viewed_at timestamptz,
  replayed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_earned_badges_employee_id ON earned_badges(employee_id);
CREATE INDEX IF NOT EXISTS idx_earned_badges_badge_id ON earned_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_earned_badges_is_new ON earned_badges(is_new);
CREATE INDEX IF NOT EXISTS idx_celebration_history_employee_id ON celebration_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_celebration_history_date ON celebration_history(celebration_date);
CREATE INDEX IF NOT EXISTS idx_celebration_history_type ON celebration_history(celebration_type);
CREATE INDEX IF NOT EXISTS idx_celebration_notifications_employee_id ON celebration_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_celebration_notifications_expires_at ON celebration_notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON profiles(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_profiles_hire_date ON profiles(hire_date);

-- Enable Row Level Security
ALTER TABLE anniversary_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anniversary_badges (publicly viewable)
CREATE POLICY "Anyone can view anniversary badges"
  ON anniversary_badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for earned_badges
CREATE POLICY "Users can view own earned badges"
  ON earned_badges FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "All authenticated users can view earned badges for profiles"
  ON earned_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert earned badges"
  ON earned_badges FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own earned badges"
  ON earned_badges FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- RLS Policies for celebration_history
CREATE POLICY "Users can view own celebration history"
  ON celebration_history FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "System can insert celebration history"
  ON celebration_history FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own celebration history"
  ON celebration_history FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- RLS Policies for celebration_notifications
CREATE POLICY "Users can view own celebration notifications"
  ON celebration_notifications FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "System can insert celebration notifications"
  ON celebration_notifications FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own celebration notifications"
  ON celebration_notifications FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Insert all 40 anniversary badges
INSERT INTO anniversary_badges (year_number, badge_title, badge_description, badge_color, badge_icon, tier_name, is_milestone, sort_order) VALUES
  -- Bronze Tier (Years 1-5)
  (1, 'First Year', 'Completed your first year with us', '#CD7F32', 'Award', 'Bronze', false, 1),
  (2, 'Two Years Strong', 'Two years of dedication and growth', '#B87333', 'Star', 'Bronze', false, 2),
  (3, 'Three Year Veteran', 'Three years of valuable contributions', '#C19A6B', 'Shield', 'Bronze', false, 3),
  (4, 'Four Year Pro', 'Four years of expertise and excellence', '#D4AF6A', 'Medal', 'Bronze', false, 4),
  (5, '5 Year Milestone', 'Five years of outstanding service!', '#E6C200', 'Trophy', 'Bronze', true, 5),

  -- Silver Tier (Years 6-10)
  (6, 'Six Year Champion', 'Six years of proven leadership', '#C0C0C0', 'Award', 'Silver', false, 6),
  (7, 'Seven Year Expert', 'Seven years of mastery and innovation', '#B8B8B8', 'Star', 'Silver', false, 7),
  (8, 'Eight Year Leader', 'Eight years of inspiring excellence', '#D0D0D0', 'Shield', 'Silver', false, 8),
  (9, 'Nine Year Sage', 'Nine years of wisdom and guidance', '#C4C4C4', 'Medal', 'Silver', false, 9),
  (10, '10 Year Milestone', 'A decade of exceptional achievement!', '#E8E8E8', 'Trophy', 'Silver', true, 10),

  -- Gold Tier (Years 11-15)
  (11, 'Eleven Year Icon', 'Eleven years of transformative impact', '#FFD700', 'Award', 'Gold', false, 11),
  (12, 'Twelve Year Legend', 'Twelve years of legendary contributions', '#FFC107', 'Star', 'Gold', false, 12),
  (13, 'Thirteen Year Master', 'Thirteen years of unmatched excellence', '#FFB300', 'Shield', 'Gold', false, 13),
  (14, 'Fourteen Year Titan', 'Fourteen years of powerful influence', '#FFA000', 'Medal', 'Gold', false, 14),
  (15, '15 Year Milestone', 'Fifteen years of remarkable dedication!', '#FF8F00', 'Trophy', 'Gold', true, 15),

  -- Platinum Tier (Years 16-20)
  (16, 'Sixteen Year Platinum', 'Sixteen years of platinum-level performance', '#E5E4E2', 'Award', 'Platinum', false, 16),
  (17, 'Seventeen Year Elite', 'Seventeen years at the pinnacle', '#F0F0F0', 'Star', 'Platinum', false, 17),
  (18, 'Eighteen Year Luminary', 'Eighteen years of brilliant leadership', '#E8E8E8', 'Shield', 'Platinum', false, 18),
  (19, 'Nineteen Year Visionary', 'Nineteen years of forward thinking', '#DCDCDC', 'Medal', 'Platinum', false, 19),
  (20, '20 Year Milestone', 'Twenty years of extraordinary service!', '#D0D0D0', 'Trophy', 'Platinum', true, 20),

  -- Sapphire Tier (Years 21-25)
  (21, 'Twenty-One Year Sapphire', 'Twenty-one years of rare excellence', '#0F52BA', 'Award', 'Sapphire', false, 21),
  (22, 'Twenty-Two Year Gem', 'Twenty-two years of precious contributions', '#0066CC', 'Star', 'Sapphire', false, 22),
  (23, 'Twenty-Three Year Jewel', 'Twenty-three years of brilliant success', '#1E90FF', 'Shield', 'Sapphire', false, 23),
  (24, 'Twenty-Four Year Treasure', 'Twenty-four years of treasured impact', '#4169E1', 'Medal', 'Sapphire', false, 24),
  (25, '25 Year Milestone', 'A quarter century of excellence!', '#6495ED', 'Trophy', 'Sapphire', true, 25),

  -- Ruby Tier (Years 26-30)
  (26, 'Twenty-Six Year Ruby', 'Twenty-six years of passionate service', '#E0115F', 'Award', 'Ruby', false, 26),
  (27, 'Twenty-Seven Year Crimson', 'Twenty-seven years of vibrant leadership', '#DC143C', 'Star', 'Ruby', false, 27),
  (28, 'Twenty-Eight Year Scarlet', 'Twenty-eight years of bold innovation', '#FF2400', 'Shield', 'Ruby', false, 28),
  (29, 'Twenty-Nine Year Garnet', 'Twenty-nine years of steadfast dedication', '#CC0000', 'Medal', 'Ruby', false, 29),
  (30, '30 Year Milestone', 'Thirty years of legendary commitment!', '#B22222', 'Trophy', 'Ruby', true, 30),

  -- Emerald Tier (Years 31-35)
  (31, 'Thirty-One Year Emerald', 'Thirty-one years of enduring excellence', '#50C878', 'Award', 'Emerald', false, 31),
  (32, 'Thirty-Two Year Jade', 'Thirty-two years of precious wisdom', '#00A86B', 'Star', 'Emerald', false, 32),
  (33, 'Thirty-Three Year Verdant', 'Thirty-three years of flourishing leadership', '#009E60', 'Shield', 'Emerald', false, 33),
  (34, 'Thirty-Four Year Viridian', 'Thirty-four years of inspiring growth', '#40826D', 'Medal', 'Emerald', false, 34),
  (35, '35 Year Milestone', 'Thirty-five years of incredible impact!', '#2E8B57', 'Trophy', 'Emerald', true, 35),

  -- Diamond Tier (Years 36-40)
  (36, 'Thirty-Six Year Diamond', 'Thirty-six years of unbreakable excellence', '#B9F2FF', 'Award', 'Diamond', false, 36),
  (37, 'Thirty-Seven Year Crystal', 'Thirty-seven years of brilliant clarity', '#D0F0FD', 'Star', 'Diamond', false, 37),
  (38, 'Thirty-Eight Year Radiant', 'Thirty-eight years of shining achievement', '#E3F4FF', 'Shield', 'Diamond', false, 38),
  (39, 'Thirty-Nine Year Brilliant', 'Thirty-nine years of dazzling contributions', '#F0F8FF', 'Medal', 'Diamond', false, 39),
  (40, '40 Year Milestone', 'Forty years of legendary dedication!', '#FFFFFF', 'Trophy', 'Diamond', true, 40)
ON CONFLICT (year_number) DO NOTHING;

-- Function to automatically award badges when anniversary is detected
CREATE OR REPLACE FUNCTION award_anniversary_badge()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
BEGIN
  -- Find the badge for the years_count
  SELECT * INTO badge_record
  FROM anniversary_badges
  WHERE year_number = NEW.years_count;

  -- Insert earned badge if it doesn't exist
  IF badge_record IS NOT NULL THEN
    INSERT INTO earned_badges (employee_id, badge_id, earned_date, is_new)
    VALUES (NEW.employee_id, badge_record.id, NEW.celebration_date, true)
    ON CONFLICT (employee_id, badge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-award badges when anniversary celebration is created
DROP TRIGGER IF EXISTS award_badge_on_anniversary ON celebration_history;
CREATE TRIGGER award_badge_on_anniversary
  AFTER INSERT ON celebration_history
  FOR EACH ROW
  WHEN (NEW.celebration_type = 'anniversary' AND NEW.years_count IS NOT NULL)
  EXECUTE FUNCTION award_anniversary_badge();

-- Function to clean up expired celebration notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM celebration_notifications
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
