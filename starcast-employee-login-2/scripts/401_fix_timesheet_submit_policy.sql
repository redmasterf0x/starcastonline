-- Fix RLS policy to allow users to submit their own timesheets
-- The previous policy only allowed updates when status='draft' in WITH CHECK,
-- which blocked changing status from 'draft' to 'submitted'

-- Drop the restrictive policy
DROP POLICY IF EXISTS "timesheets_update_own_draft" ON timesheets;

-- Create new policy that allows users to update their own timesheets
-- USING: Can only update if currently in draft or submitted status (own timesheets)
-- WITH CHECK: Can only change to submitted status (not back to draft, and not to approved/rejected)
CREATE POLICY "timesheets_update_own"
  ON timesheets
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id 
    AND status IN ('draft', 'submitted')
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id 
    AND status IN ('draft', 'submitted')
  );
