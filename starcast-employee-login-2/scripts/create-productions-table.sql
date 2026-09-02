-- Create productions table for upcoming shows/projects
CREATE TABLE IF NOT EXISTS productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read productions
CREATE POLICY "Allow authenticated users to read productions"
ON productions FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert/update/delete productions
CREATE POLICY "Allow admins to manage productions"
ON productions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.is_admin = true
  )
);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_productions_start_date ON productions(start_date);
CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status);
