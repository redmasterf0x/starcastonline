-- Completely fix RLS on employees table by using simple auth.uid() checks only
-- This avoids any recursion by not querying the employees table in policies

-- Drop ALL existing policies on employees
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable read access for own record" ON employees;
DROP POLICY IF EXISTS "Enable update for own record" ON employees;
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can update own record" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert" ON employees;
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON employees;
DROP POLICY IF EXISTS "Users can insert own employee record" ON employees;
DROP POLICY IF EXISTS "Admin can view all employees" ON employees;
DROP POLICY IF EXISTS "Admin can update all employees" ON employees;

-- Disable RLS temporarily to clear any issues
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can do everything on their own record (no subqueries)
CREATE POLICY "allow_own_record"
ON employees
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to read all employees (needed for admin and community features)
CREATE POLICY "allow_read_all"
ON employees
FOR SELECT
USING (auth.uid() IS NOT NULL);
