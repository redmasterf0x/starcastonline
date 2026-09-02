-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
DROP POLICY IF EXISTS "Employees can update their own data" ON employees;
DROP POLICY IF EXISTS "Users can insert their own employee record" ON employees;

-- Create more permissive policies that allow authenticated users to manage their records
CREATE POLICY "Enable insert for authenticated users"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select for users based on user_id"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
