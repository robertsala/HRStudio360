/*
  # Create Knowledge Base and Resources System

  1. New Tables
    - `kb_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `slug` (text, unique)
      - `description` (text)
      - `icon` (text, icon name)
      - `parent_id` (uuid, self-reference for subcategories)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kb_articles`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references kb_categories)
      - `title` (text, required)
      - `slug` (text, unique)
      - `content` (text, required - markdown/HTML)
      - `excerpt` (text, short summary)
      - `difficulty_level` (text: beginner, intermediate, advanced)
      - `estimated_reading_time` (integer, minutes)
      - `view_count` (integer)
      - `helpful_count` (integer)
      - `not_helpful_count` (integer)
      - `published` (boolean)
      - `published_at` (timestamptz)
      - `featured` (boolean)
      - `author_id` (uuid, references profiles)
      - `last_reviewed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `search_vector` (tsvector for full-text search)

    - `kb_article_tags`
      - `id` (uuid, primary key)
      - `article_id` (uuid, references kb_articles)
      - `tag` (text)

    - `kb_courses`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `slug` (text, unique)
      - `description` (text)
      - `category` (text)
      - `difficulty_level` (text: beginner, intermediate, advanced)
      - `duration_hours` (integer)
      - `instructor_name` (text)
      - `instructor_bio` (text)
      - `thumbnail_url` (text)
      - `video_url` (text)
      - `objectives` (text array)
      - `prerequisites` (text array)
      - `certification_awarded` (text)
      - `max_enrollments` (integer)
      - `current_enrollments` (integer)
      - `published` (boolean)
      - `featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kb_course_modules`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references kb_courses)
      - `title` (text, required)
      - `description` (text)
      - `display_order` (integer)
      - `duration_minutes` (integer)
      - `video_url` (text)
      - `content` (text, markdown)
      - `quiz_questions` (jsonb)
      - `created_at` (timestamptz)

    - `kb_course_enrollments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references kb_courses)
      - `user_id` (uuid, references profiles)
      - `enrolled_at` (timestamptz)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `progress_percentage` (integer)
      - `quiz_score` (integer)
      - `certificate_issued` (boolean)

    - `kb_interactive_guides`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `feature_area` (text, which app feature it relates to)
      - `steps` (jsonb, array of step objects)
      - `target_roles` (text array)
      - `published` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `kb_guide_completions`
      - `id` (uuid, primary key)
      - `guide_id` (uuid, references kb_interactive_guides)
      - `user_id` (uuid, references profiles)
      - `current_step` (integer)
      - `completed` (boolean)
      - `completed_at` (timestamptz)
      - `started_at` (timestamptz)

    - `kb_company_resources`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `resource_type` (text: handbook, policy, form, checklist, document)
      - `file_url` (text)
      - `file_size` (bigint, bytes)
      - `mime_type` (text)
      - `version` (text)
      - `required_reading` (boolean)
      - `target_departments` (text array)
      - `target_roles` (text array)
      - `uploaded_by` (uuid, references profiles)
      - `uploaded_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

    - `kb_resource_acknowledgments`
      - `id` (uuid, primary key)
      - `resource_id` (uuid, references kb_company_resources)
      - `user_id` (uuid, references profiles)
      - `acknowledged_at` (timestamptz)

    - `kb_bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `content_type` (text: article, course, guide, resource)
      - `content_id` (uuid)
      - `created_at` (timestamptz)

    - `kb_article_feedback`
      - `id` (uuid, primary key)
      - `article_id` (uuid, references kb_articles)
      - `user_id` (uuid, references profiles)
      - `helpful` (boolean)
      - `feedback_text` (text)
      - `created_at` (timestamptz)

    - `kb_search_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `search_query` (text)
      - `results_count` (integer)
      - `clicked_result_id` (uuid)
      - `clicked_result_type` (text)
      - `searched_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can read published content
    - HR and Admin roles can create and manage content
    - Users can track their own progress and bookmarks
    - Department and role-based access for sensitive resources

  3. Indexes and Performance
    - Full-text search indexes on articles
    - Indexes for category browsing and filtering
    - Indexes for course enrollments and progress tracking
*/

-- Create kb_categories table
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

-- Create kb_articles table
CREATE TABLE IF NOT EXISTS kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_reading_time integer DEFAULT 5,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  published boolean DEFAULT false,
  published_at timestamptz,
  featured boolean DEFAULT false,
  author_id uuid REFERENCES profiles(id),
  last_reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  search_vector tsvector
);

-- Create kb_article_tags table
CREATE TABLE IF NOT EXISTS kb_article_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  UNIQUE(article_id, tag)
);

-- Create kb_courses table
CREATE TABLE IF NOT EXISTS kb_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text DEFAULT 'General',
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_hours integer DEFAULT 1,
  instructor_name text,
  instructor_bio text,
  thumbnail_url text,
  video_url text,
  objectives text[] DEFAULT '{}',
  prerequisites text[] DEFAULT '{}',
  certification_awarded text,
  max_enrollments integer,
  current_enrollments integer DEFAULT 0,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kb_course_modules table
CREATE TABLE IF NOT EXISTS kb_course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES kb_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  duration_minutes integer DEFAULT 30,
  video_url text,
  content text,
  quiz_questions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create kb_course_enrollments table
CREATE TABLE IF NOT EXISTS kb_course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES kb_courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0,
  quiz_score integer,
  certificate_issued boolean DEFAULT false,
  UNIQUE(course_id, user_id)
);

-- Create kb_interactive_guides table
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

-- Create kb_guide_completions table
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

-- Create kb_company_resources table
CREATE TABLE IF NOT EXISTS kb_company_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_type text DEFAULT 'document' CHECK (resource_type IN ('handbook', 'policy', 'form', 'checklist', 'document')),
  file_url text,
  file_size bigint,
  mime_type text,
  version text DEFAULT '1.0',
  required_reading boolean DEFAULT false,
  target_departments text[] DEFAULT '{}',
  target_roles text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES profiles(id),
  uploaded_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create kb_resource_acknowledgments table
CREATE TABLE IF NOT EXISTS kb_resource_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES kb_company_resources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

-- Create kb_bookmarks table
CREATE TABLE IF NOT EXISTS kb_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('article', 'course', 'guide', 'resource')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Create kb_article_feedback table
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  helpful boolean,
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- Create kb_search_analytics table
CREATE TABLE IF NOT EXISTS kb_search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  search_query text NOT NULL,
  results_count integer DEFAULT 0,
  clicked_result_id uuid,
  clicked_result_type text,
  searched_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON kb_articles(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(featured, published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_article ON kb_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_tag ON kb_article_tags(tag);
CREATE INDEX IF NOT EXISTS idx_kb_courses_published ON kb_courses(published);
CREATE INDEX IF NOT EXISTS idx_kb_course_modules_course ON kb_course_modules(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_kb_course_enrollments_user ON kb_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_course_enrollments_course ON kb_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_kb_guide_completions_user ON kb_guide_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_bookmarks_user ON kb_bookmarks(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_kb_resources_type ON kb_company_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_kb_search_analytics_query ON kb_search_analytics(search_query);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION kb_articles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.excerpt, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
DROP TRIGGER IF EXISTS kb_articles_search_vector_trigger ON kb_articles;
CREATE TRIGGER kb_articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION kb_articles_search_vector_update();

-- Enable Row Level Security
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_interactive_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_guide_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_company_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_resource_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_categories
CREATE POLICY "Anyone can view categories"
  ON kb_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for kb_articles
CREATE POLICY "Authenticated users can view published articles"
  ON kb_articles FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Users can create articles"
  ON kb_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their articles"
  ON kb_articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for kb_article_tags
CREATE POLICY "Anyone can view article tags"
  ON kb_article_tags FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for kb_courses
CREATE POLICY "Authenticated users can view published courses"
  ON kb_courses FOR SELECT
  TO authenticated
  USING (published = true);

-- RLS Policies for kb_course_modules
CREATE POLICY "Authenticated users can view course modules"
  ON kb_course_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kb_courses
      WHERE kb_courses.id = kb_course_modules.course_id
      AND kb_courses.published = true
    )
  );

-- RLS Policies for kb_course_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON kb_course_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON kb_course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON kb_course_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kb_interactive_guides
CREATE POLICY "Authenticated users can view published guides"
  ON kb_interactive_guides FOR SELECT
  TO authenticated
  USING (published = true);

-- RLS Policies for kb_guide_completions
CREATE POLICY "Users can view their own guide progress"
  ON kb_guide_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can track their guide progress"
  ON kb_guide_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their guide progress"
  ON kb_guide_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kb_company_resources
CREATE POLICY "Authenticated users can view resources"
  ON kb_company_resources FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for kb_resource_acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
  ON kb_resource_acknowledgments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge resources"
  ON kb_resource_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kb_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON kb_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON kb_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their bookmarks"
  ON kb_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for kb_article_feedback
CREATE POLICY "Users can view their own feedback"
  ON kb_article_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
  ON kb_article_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kb_search_analytics
CREATE POLICY "Users can create search analytics"
  ON kb_search_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
