/*
  # Payroll Fun Facts System

  ## Overview
  Creates a fun, engaging paycheck experience by showing employees humorous comparisons
  of what their paycheck could buy (e.g., "Could buy a bank in the 1850s" or "10 cows, 10 bulls, 200 pigs").

  ## New Tables Created

  ### 1. `pay_stubs`
  - Stores actual payroll records for employees
  - Fields: id, employee_id, pay_period_start, pay_period_end, pay_date, gross_pay, net_pay, 
    regular_hours, overtime_hours, regular_rate, overtime_rate, regular_pay, overtime_pay, deductions (jsonb)
  - Links to employees table
  - Timestamps: created_at, updated_at

  ### 2. `paycheck_fun_facts`
  - Collection of fun fact templates with dynamic placeholders
  - Fields: id, category, min_amount, max_amount, fact_template, enabled
  - Categories: historical, animals, food, entertainment, travel, quirky
  - Timestamps: created_at, updated_at

  ### 3. `employee_fun_fact_history`
  - Tracks which fun facts have been shown to prevent immediate repetition
  - Fields: id, employee_id, pay_stub_id, fun_fact_id, shown_at
  - Ensures variety in employee experience

  ## Security
  - RLS enabled on all tables
  - Employees can only view their own pay stubs
  - Fun facts are viewable by all authenticated users
  - HR admins can manage fun facts library

  ## Sample Data
  - Populates 50+ fun facts across all categories
  - Covers pay ranges from $500 to $15,000+
*/

-- Create pay_stubs table
CREATE TABLE IF NOT EXISTS pay_stubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  pay_date date NOT NULL,
  gross_pay numeric(10, 2) NOT NULL DEFAULT 0,
  net_pay numeric(10, 2) NOT NULL DEFAULT 0,
  regular_hours numeric(5, 2) DEFAULT 0,
  overtime_hours numeric(5, 2) DEFAULT 0,
  regular_rate numeric(10, 2) DEFAULT 0,
  overtime_rate numeric(10, 2) DEFAULT 0,
  regular_pay numeric(10, 2) DEFAULT 0,
  overtime_pay numeric(10, 2) DEFAULT 0,
  deductions jsonb DEFAULT '{}'::jsonb,
  fun_fact_shown text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create paycheck_fun_facts table
CREATE TABLE IF NOT EXISTS paycheck_fun_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  min_amount numeric(10, 2) NOT NULL DEFAULT 0,
  max_amount numeric(10, 2) NOT NULL DEFAULT 999999.99,
  fact_template text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_fun_fact_history table
CREATE TABLE IF NOT EXISTS employee_fun_fact_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  pay_stub_id uuid REFERENCES pay_stubs(id) ON DELETE CASCADE,
  fun_fact_id uuid REFERENCES paycheck_fun_facts(id) ON DELETE CASCADE NOT NULL,
  fun_fact_text text NOT NULL,
  shown_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pay_stubs_employee_id ON pay_stubs(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_stubs_pay_date ON pay_stubs(pay_date);
CREATE INDEX IF NOT EXISTS idx_paycheck_fun_facts_amount_range ON paycheck_fun_facts(min_amount, max_amount);
CREATE INDEX IF NOT EXISTS idx_paycheck_fun_facts_category ON paycheck_fun_facts(category);
CREATE INDEX IF NOT EXISTS idx_employee_fun_fact_history_employee ON employee_fun_fact_history(employee_id);

-- Enable RLS
ALTER TABLE pay_stubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE paycheck_fun_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_fun_fact_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pay_stubs
CREATE POLICY "Employees can view own pay stubs"
  ON pay_stubs FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "HR admins can view all pay stubs"
  ON pay_stubs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "HR admins can insert pay stubs"
  ON pay_stubs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for paycheck_fun_facts
CREATE POLICY "Authenticated users can view enabled fun facts"
  ON paycheck_fun_facts FOR SELECT
  TO authenticated
  USING (enabled = true);

CREATE POLICY "HR admins can manage fun facts"
  ON paycheck_fun_facts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for employee_fun_fact_history
CREATE POLICY "Employees can view own fun fact history"
  ON employee_fun_fact_history FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert fun fact history"
  ON employee_fun_fact_history FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_pay_stubs_updated_at BEFORE UPDATE ON pay_stubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paycheck_fun_facts_updated_at BEFORE UPDATE ON paycheck_fun_facts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert fun facts library
INSERT INTO paycheck_fun_facts (category, min_amount, max_amount, fact_template) VALUES
  -- Historical purchases (various ranges)
  ('historical', 0, 500, 'You could buy {amount} loaves of bread in ancient Rome (that''s a lot of carbs!)'),
  ('historical', 500, 1500, 'In 1920, your ${amount} paycheck could rent a luxury apartment in Manhattan for 6 months!'),
  ('historical', 1500, 3000, 'With ${amount}, you could have bought a brand new Ford Model T in 1925!'),
  ('historical', 3000, 5000, 'In the 1850s, ${amount} could buy you a small-town bank. You''d be the richest person in town!'),
  ('historical', 5000, 10000, 'Your ${amount} could have purchased 3 acres of prime Manhattan real estate in 1850. Ouch!'),
  ('historical', 10000, 999999, 'With ${amount}, you could have funded a small expedition to California during the Gold Rush!'),
  
  -- Animal equivalents
  ('animals', 0, 500, 'You could buy approximately {count} chickens and start your own egg empire!'),
  ('animals', 500, 1500, 'Your paycheck equals about {count} guinea pigs. That''s a lot of squeaking!'),
  ('animals', 1500, 3000, 'You could purchase {count} sheep and become a wool magnate!'),
  ('animals', 3000, 5000, 'With this paycheck, you could buy 10 cows, 10 bulls, and 200 pigs. Welcome to farming!'),
  ('animals', 5000, 8000, 'Your ${amount} could buy {count} alpacas. Time to start that alpaca sweater business!'),
  ('animals', 8000, 999999, 'You could purchase {count} thoroughbred horses and start your own racing stable!'),
  
  -- Food and beverage
  ('food', 0, 500, 'That''s {count} cups of artisan coffee. You''d be caffeinated for life!'),
  ('food', 500, 1500, 'You could buy {count} fancy avocado toasts. Millennial dream achieved!'),
  ('food', 1500, 3000, 'Your paycheck equals {count} gourmet pizzas from that fancy Italian place downtown!'),
  ('food', 3000, 5000, 'You could treat {count} friends to a Michelin-star dining experience!'),
  ('food', 5000, 8000, 'That''s {count} bottles of champagne. Time to celebrate in style!'),
  ('food', 8000, 999999, 'You could cater an epic party with {count} pounds of prime ribeye steak!'),
  
  -- Entertainment
  ('entertainment', 0, 500, 'You could stream {count} months of every streaming service simultaneously!'),
  ('entertainment', 500, 1500, 'That''s {count} concert tickets to see your favorite band. Road trip time!'),
  ('entertainment', 1500, 3000, 'You could buy {count} gaming consoles and become the most popular person on the block!'),
  ('entertainment', 3000, 5000, 'Your paycheck could fund {count} weekend music festival VIP passes. Party on!'),
  ('entertainment', 5000, 8000, 'You could buy {count} high-end home theater systems. Movie night, anyone?'),
  ('entertainment', 8000, 999999, 'That''s enough for {count} front-row Super Bowl tickets. Score!'),
  
  -- Travel
  ('travel', 0, 500, 'You could drive {count} miles with this paycheck. That''s like driving to [nearby city] and back!'),
  ('travel', 500, 1500, 'Your ${amount} could cover {count} nights in a cozy bed & breakfast!'),
  ('travel', 1500, 3000, 'You could take a round-trip flight to Hawaii and back. Aloha!'),
  ('travel', 3000, 5000, 'That''s a week-long European vacation with hotels and meals included!'),
  ('travel', 5000, 8000, 'You could book {count} nights in a luxury resort in the Maldives. Paradise awaits!'),
  ('travel', 8000, 999999, 'Your paycheck could fund a month-long around-the-world adventure. Bon voyage!'),
  
  -- Quirky and unexpected
  ('quirky', 0, 500, 'You could buy {count} rubber ducks. That''s enough for a serious bathtub armada!'),
  ('quirky', 500, 1500, 'Your paycheck equals {count} fancy fountain pens. Time to write the next great novel!'),
  ('quirky', 1500, 3000, 'You could purchase {count} vintage typewriters and open a hipster typing cafe!'),
  ('quirky', 3000, 5000, 'That''s enough to buy {count} professional-grade telescopes. Stargazing party!'),
  ('quirky', 5000, 8000, 'You could purchase {count} pounds of premium saffron. That''s worth its weight in gold!'),
  ('quirky', 8000, 999999, 'Your paycheck could buy a small meteorite. You''d literally own a piece of space!'),
  
  -- Technology
  ('technology', 0, 500, 'That''s {count} months of cloud storage for all your cat photos!'),
  ('technology', 500, 1500, 'You could buy {count} smartwatches and track everyone''s steps!'),
  ('technology', 1500, 3000, 'Your ${amount} equals {count} high-end smartphones. Upgrade time!'),
  ('technology', 3000, 5000, 'You could purchase {count} powerful laptops and start your own tech company!'),
  ('technology', 5000, 8000, 'That''s enough for {count} professional camera setups. Your Instagram will be fire!'),
  ('technology', 8000, 999999, 'You could build {count} gaming PCs that would make any streamer jealous!'),
  
  -- Sports and fitness
  ('sports', 0, 500, 'You could buy {count} months of gym membership. New year, new you!'),
  ('sports', 500, 1500, 'That''s {count} pairs of premium running shoes. Time to hit the trail!'),
  ('sports', 1500, 3000, 'You could purchase {count} high-end bicycles. Cycling club, here we come!'),
  ('sports', 3000, 5000, 'Your paycheck equals {count} complete home gym setups. Gains await!'),
  ('sports', 5000, 8000, 'You could buy {count} paddle boards and start a beach rental business!'),
  ('sports', 8000, 999999, 'That''s enough for {count} season tickets to your favorite sports team. Go team!'),
  
  -- Books and education
  ('education', 0, 500, 'You could buy {count} bestselling books. Time to start that reading challenge!'),
  ('education', 500, 1500, 'That''s {count} online courses to learn literally anything you want!'),
  ('education', 1500, 3000, 'You could purchase {count} professional certifications. Level up your career!'),
  ('education', 3000, 5000, 'Your paycheck could fund {count} college credit courses. Never stop learning!'),
  ('education', 5000, 999999, 'You could buy an entire library of {count} classic literature collections!');
