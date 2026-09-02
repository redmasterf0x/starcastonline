-- Add submitted column to timesheets table to track when timesheets are submitted to admin
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT false;

-- Add index for querying submitted timesheets
CREATE INDEX IF NOT EXISTS idx_timesheets_submitted ON timesheets(submitted);
