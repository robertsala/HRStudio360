/*
  # Add Knowledge Base Admin Policies

  1. Updates
    - Add INSERT policies for kb_courses (admin only)
    - Add UPDATE policies for kb_courses (admin only)
    - Add DELETE policies for kb_courses (admin only)
    - Add INSERT policies for kb_company_resources (admin only)
    - Add UPDATE policies for kb_company_resources (admin only)
    - Add DELETE policies for kb_company_resources (admin only)
    - Update kb_articles policies to be admin-only
    - Add INSERT policies for kb_interactive_guides (admin only)

  2. Security
    - Only users with role 'admin' or 'super_admin' can create/edit/delete content
    - All other users can only read published content
*/

-- Helper function to check if user is admin or can manage knowledge base
CREATE OR REPLACE FUNCTION is_kb_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'Product Owner', 'HR Manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update kb_articles policies to require admin role
DROP POLICY IF EXISTS "Users can create articles" ON kb_articles;
DROP POLICY IF EXISTS "Authors can update their articles" ON kb_articles;

CREATE POLICY "Admins can create articles"
  ON kb_articles FOR INSERT
  TO authenticated
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can update articles"
  ON kb_articles FOR UPDATE
  TO authenticated
  USING (is_kb_admin())
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can delete articles"
  ON kb_articles FOR DELETE
  TO authenticated
  USING (is_kb_admin());

-- Add policies for kb_courses
CREATE POLICY "Admins can create courses"
  ON kb_courses FOR INSERT
  TO authenticated
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can update courses"
  ON kb_courses FOR UPDATE
  TO authenticated
  USING (is_kb_admin())
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can delete courses"
  ON kb_courses FOR DELETE
  TO authenticated
  USING (is_kb_admin());

-- Add policies for kb_company_resources
CREATE POLICY "Admins can create resources"
  ON kb_company_resources FOR INSERT
  TO authenticated
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can update resources"
  ON kb_company_resources FOR UPDATE
  TO authenticated
  USING (is_kb_admin())
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can delete resources"
  ON kb_company_resources FOR DELETE
  TO authenticated
  USING (is_kb_admin());

-- Add policies for kb_interactive_guides
CREATE POLICY "Admins can create guides"
  ON kb_interactive_guides FOR INSERT
  TO authenticated
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can update guides"
  ON kb_interactive_guides FOR UPDATE
  TO authenticated
  USING (is_kb_admin())
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can delete guides"
  ON kb_interactive_guides FOR DELETE
  TO authenticated
  USING (is_kb_admin());

-- Add policies for kb_categories (admin management)
CREATE POLICY "Admins can create categories"
  ON kb_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can update categories"
  ON kb_categories FOR UPDATE
  TO authenticated
  USING (is_kb_admin())
  WITH CHECK (is_kb_admin());

CREATE POLICY "Admins can delete categories"
  ON kb_categories FOR DELETE
  TO authenticated
  USING (is_kb_admin());
