-- Create employees table to store employee information
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can only view and update their own data
CREATE POLICY "Employees can view their own data"
  ON employees
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Employees can update their own data"
  ON employees
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Allow insert during signup (authenticated users can insert their own record)
CREATE POLICY "Users can insert their own employee record"
  ON employees
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
