-- Create community posts table for employee social posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Policies: Employees can view all posts but only manage their own
CREATE POLICY "Anyone can view community posts"
  ON community_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Employees can insert their own posts"
  ON community_posts
  FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update their own posts"
  ON community_posts
  FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can delete their own posts"
  ON community_posts
  FOR DELETE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_community_posts_employee_id ON community_posts(employee_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
