-- Migration: Upgrade timesheets to approval workflow system
-- This creates a proper timesheet approval system with separate entries table

-- Drop old table and recreate with new structure
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS timesheet_entries CASCADE;

-- Create new timesheets table with approval workflow
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Create timesheet entries table for daily hours
CREATE TABLE timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (hours >= 0 AND hours <= 24),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timesheet_id, work_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_period ON timesheets(period_start, period_end);
CREATE INDEX idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX idx_timesheet_entries_work_date ON timesheet_entries(work_date);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Required for all tables in public schema)
-- ============================================================================
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TIMESHEETS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own timesheets
-- Performance: Uses subquery to cache auth.uid() result (executes once per query, not per row)
CREATE POLICY "timesheets_select_own"
  ON timesheets
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can insert their own timesheets
CREATE POLICY "timesheets_insert_own"
  ON timesheets
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update ONLY their own DRAFT timesheets
-- Rationale: Once submitted/approved, only admins can modify
CREATE POLICY "timesheets_update_own_draft"
  ON timesheets
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id 
    AND status = 'draft'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id 
    AND status = 'draft'
  );

-- Policy: Admins can view all timesheets
-- Performance: Subquery caches auth.uid() lookup
CREATE POLICY "timesheets_select_admin"
  ON timesheets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  );

-- Policy: Admins can update any timesheet (approve, reject, modify)
CREATE POLICY "timesheets_update_admin"
  ON timesheets
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

-- ============================================================================
-- TIMESHEET_ENTRIES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own timesheet entries
-- Performance: Subquery caches auth.uid() for entire query
CREATE POLICY "entries_select_own"
  ON timesheet_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE timesheets.id = timesheet_entries.timesheet_id
      AND timesheets.user_id = (SELECT auth.uid())
    )
  );

-- Policy: Users can insert entries ONLY to their own DRAFT timesheets
CREATE POLICY "entries_insert_own"
  ON timesheet_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE timesheets.id = timesheet_entries.timesheet_id
      AND timesheets.user_id = (SELECT auth.uid())
      AND timesheets.status = 'draft'
    )
  );

-- Policy: Users can update entries ONLY in their own DRAFT timesheets
CREATE POLICY "entries_update_own"
  ON timesheet_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE timesheets.id = timesheet_entries.timesheet_id
      AND timesheets.user_id = (SELECT auth.uid())
      AND timesheets.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE timesheets.id = timesheet_entries.timesheet_id
      AND timesheets.user_id = (SELECT auth.uid())
      AND timesheets.status = 'draft'
    )
  );

-- Policy: Users can delete entries ONLY from their own DRAFT timesheets
CREATE POLICY "entries_delete_own"
  ON timesheet_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE timesheets.id = timesheet_entries.timesheet_id
      AND timesheets.user_id = (SELECT auth.uid())
      AND timesheets.status = 'draft'
    )
  );

-- Policy: Admins can view all timesheet entries for review/approval
CREATE POLICY "entries_select_admin"
  ON timesheet_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = (SELECT auth.uid())
      AND users.is_admin = true
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheet_entries_updated_at BEFORE UPDATE ON timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
