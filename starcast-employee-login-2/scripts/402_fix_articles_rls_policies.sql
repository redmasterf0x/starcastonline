-- Fix Articles RLS policies following Supabase best practices
-- Allows crew to create/edit their own articles and submit for approval
-- Allows admins to approve/reject all articles

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "articles_select_all" ON articles;
DROP POLICY IF EXISTS "articles_select_approved" ON articles;
DROP POLICY IF EXISTS "articles_insert_own" ON articles;
DROP POLICY IF EXISTS "articles_update_own" ON articles;
DROP POLICY IF EXISTS "articles_delete_own" ON articles;
DROP POLICY IF EXISTS "articles_select_admin" ON articles;
DROP POLICY IF EXISTS "articles_update_admin" ON articles;

-- ============================================================================
-- ARTICLES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Anyone can view APPROVED articles
-- Rationale: Public-facing content should be visible to all
CREATE POLICY "articles_select_approved"
  ON articles
  FOR SELECT
  USING (approved = true);

-- Policy: Authors can view their own articles (even if not approved)
-- Rationale: Authors need to see their drafts and pending articles
CREATE POLICY "articles_select_own"
  ON articles
  FOR SELECT
  USING ((SELECT auth.uid()) = author_id);

-- Policy: Users can insert their own articles
-- Rationale: Crew members create articles for review
CREATE POLICY "articles_insert_own"
  ON articles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- Policy: Authors can update their own unapproved articles
-- Rationale: Can edit drafts, but once approved only admins can modify
CREATE POLICY "articles_update_own"
  ON articles
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = author_id 
    AND approved = false
  )
  WITH CHECK (
    (SELECT auth.uid()) = author_id 
    AND approved = false
  );

-- Policy: Authors can delete their own unapproved articles
-- Rationale: Can remove drafts before approval
CREATE POLICY "articles_delete_own"
  ON articles
  FOR DELETE
  USING (
    (SELECT auth.uid()) = author_id 
    AND approved = false
  );

-- Policy: Admins can view all articles (approved and pending)
-- Rationale: Admins need to review all submissions
CREATE POLICY "articles_select_admin"
  ON articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  );

-- Policy: Admins can update any article (approve, edit, etc.)
-- Rationale: Admins manage all article approvals and modifications
CREATE POLICY "articles_update_admin"
  ON articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  );

-- Policy: Admins can delete any article
-- Rationale: Admins have full content management control
CREATE POLICY "articles_delete_admin"
  ON articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  );
