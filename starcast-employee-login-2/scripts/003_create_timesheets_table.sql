-- Create timesheets table to store employee hours
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

-- Enable Row Level Security
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Policies: Employees can only view and manage their own timesheets
CREATE POLICY "Employees can view their own timesheets"
  ON timesheets
  FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can insert their own timesheets"
  ON timesheets
  FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update their own timesheets"
  ON timesheets
  FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can delete their own timesheets"
  ON timesheets
  FOR DELETE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_date ON timesheets(employee_id, work_date);
