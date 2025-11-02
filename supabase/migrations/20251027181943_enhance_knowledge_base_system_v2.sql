/*
  # Enhance Knowledge Base System with Advanced Features

  ## Changes
  1. Add missing tables for comprehensive functionality:
     - kb_article_tags (junction table for flexible tagging)
     - kb_tags (separate tag management)
     - kb_access_rules (granular role-based access control)
     - kb_reading_progress (track required reading completion)
     - kb_content_suggestions (crowdsourced improvement requests)
  
  2. Enhance existing tables:
     - Add archived_at to kb_articles
     - Add parent_id to kb_categories for hierarchical structure
     - Add display_order and active to kb_categories
  
  3. Add full-text search indexes for AI-powered search
  4. Add comprehensive RLS policies for new tables
  5. Add triggers and functions for automation

  ## Security
  - All new tables have RLS enabled
  - Policies enforce role-based access control
  - User-specific data isolated by user_id
*/

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add missing columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_articles' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE kb_articles ADD COLUMN archived_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE kb_categories ADD COLUMN parent_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE kb_categories ADD COLUMN display_order integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_categories' AND column_name = 'active'
  ) THEN
    ALTER TABLE kb_categories ADD COLUMN active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_categories' AND column_name = 'color'
  ) THEN
    ALTER TABLE kb_categories ADD COLUMN color text DEFAULT '#6366f1';
  END IF;
END $$;

-- Tags table for flexible categorization
CREATE TABLE IF NOT EXISTS kb_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Article-Tag junction table
CREATE TABLE IF NOT EXISTS kb_article_tags (
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES kb_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (article_id, tag_id)
);

-- Access rules for granular role-based permissions
CREATE TABLE IF NOT EXISTS kb_access_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE NOT NULL,
  role text,
  department text,
  access_level text DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Reading progress tracking for compliance
CREATE TABLE IF NOT EXISTS kb_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Content suggestions for crowdsourced improvements
CREATE TABLE IF NOT EXISTS kb_content_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_article ON kb_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_tag ON kb_article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_kb_access_rules_article ON kb_access_rules(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_reading_progress_user_incomplete ON kb_reading_progress(user_id) WHERE completed_at IS NULL;

-- Create full-text search indexes with trigram support
CREATE INDEX IF NOT EXISTS idx_kb_articles_title_trgm ON kb_articles USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_articles_content_trgm ON kb_articles USING gin(content gin_trgm_ops);

-- Enable RLS on new tables
ALTER TABLE kb_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_content_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_tags
CREATE POLICY "Anyone can view tags"
  ON kb_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON kb_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for kb_article_tags
CREATE POLICY "Anyone can view article tags"
  ON kb_article_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage article tags"
  ON kb_article_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for kb_access_rules
CREATE POLICY "Admins can view access rules"
  ON kb_access_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage access rules"
  ON kb_access_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for kb_reading_progress
CREATE POLICY "Users can manage their own reading progress"
  ON kb_reading_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all reading progress"
  ON kb_reading_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for kb_content_suggestions
CREATE POLICY "Users can view all suggestions"
  ON kb_content_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own suggestions"
  ON kb_content_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own suggestions"
  ON kb_content_suggestions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all suggestions"
  ON kb_content_suggestions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kb_tags
  SET usage_count = usage_count + 1
  WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tag usage
DROP TRIGGER IF EXISTS trigger_increment_tag_usage ON kb_article_tags;
CREATE TRIGGER trigger_increment_tag_usage
  AFTER INSERT ON kb_article_tags
  FOR EACH ROW
  EXECUTE FUNCTION increment_tag_usage();

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kb_tags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id = OLD.tag_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tag usage decrement
DROP TRIGGER IF EXISTS trigger_decrement_tag_usage ON kb_article_tags;
CREATE TRIGGER trigger_decrement_tag_usage
  AFTER DELETE ON kb_article_tags
  FOR EACH ROW
  EXECUTE FUNCTION decrement_tag_usage();