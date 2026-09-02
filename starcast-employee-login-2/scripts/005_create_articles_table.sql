-- Create articles table to store employee articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policies: Employees can view all articles but only manage their own
CREATE POLICY "Anyone can view articles"
  ON articles
  FOR SELECT
  USING (true);

CREATE POLICY "Employees can insert their own articles"
  ON articles
  FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update their own articles"
  ON articles
  FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can delete their own articles"
  ON articles
  FOR DELETE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_employee_id ON articles(employee_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
