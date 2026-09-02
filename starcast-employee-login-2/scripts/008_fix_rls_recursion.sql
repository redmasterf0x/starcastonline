-- Fix infinite recursion in RLS policies for employees table
-- The issue is that policies are referencing the same table they're protecting

-- First, drop all existing policies on employees table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON employees;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON employees;
DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
DROP POLICY IF EXISTS "Employees can update their own data" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert their own data" ON employees;
DROP POLICY IF EXISTS "Admin can view all employees" ON employees;
DROP POLICY IF EXISTS "Admin can update all employees" ON employees;

-- Create simple, non-recursive policies
-- Allow authenticated users to insert their own record
CREATE POLICY "employees_insert_own" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own record
CREATE POLICY "employees_select_own" ON employees
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own record
CREATE POLICY "employees_update_own" ON employees
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- For admin access, we use a simple email check instead of a subquery
-- This avoids the infinite recursion
CREATE POLICY "admin_select_all" ON employees
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'starcastlivemedia@gmail.com'
  );

CREATE POLICY "admin_update_all" ON employees
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = 'starcastlivemedia@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'starcastlivemedia@gmail.com');
