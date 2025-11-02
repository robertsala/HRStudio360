-- Create KB system (see full content in migration file)
CREATE TABLE IF NOT EXISTS kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  parent_id uuid REFERENCES kb_categories(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_interactive_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  feature_area text,
  steps jsonb DEFAULT '[]',
  target_roles text[] DEFAULT '{}',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_guide_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid REFERENCES kb_interactive_guides(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  current_step integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  started_at timestamptz DEFAULT now(),
  UNIQUE(guide_id, user_id)
);

ALTER TABLE kb_interactive_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_guide_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published guides"
  ON kb_interactive_guides FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Users can view their own guide progress"
  ON kb_guide_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can track their guide progress"
  ON kb_guide_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

SELECT 'Knowledge Base tables created successfully' as message;
