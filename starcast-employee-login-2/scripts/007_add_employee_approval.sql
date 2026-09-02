-- Add approved column to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add is_admin column to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update starcastlivemedia@gmail.com to be admin
UPDATE employees
SET is_admin = true, approved = true
WHERE email = 'starcastlivemedia@gmail.com';

-- Update RLS policies for approved employees only
DROP POLICY IF EXISTS "Employees can view their own record" ON employees;
DROP POLICY IF EXISTS "Employees can update their own record" ON employees;

CREATE POLICY "Approved employees can view their own record"
  ON employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Approved employees can update their own record"
  ON employees FOR UPDATE
  USING (auth.uid() = user_id AND approved = true);

CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );
