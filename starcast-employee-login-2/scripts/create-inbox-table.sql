-- Inbox messages table: stores inbound emails received via Resend webhook
CREATE TABLE IF NOT EXISTS inbox_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id     TEXT UNIQUE,                        -- Resend's message ID (dedup)
  from_email    TEXT NOT NULL,
  from_name     TEXT,
  to_email      TEXT NOT NULL,
  subject       TEXT,
  text_body     TEXT,
  html_body     TEXT,
  headers       JSONB,
  attachments   JSONB,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only admins can read/update inbox messages
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read inbox"
  ON inbox_messages FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update inbox"
  ON inbox_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete inbox"
  ON inbox_messages FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

-- Service role can insert (used by the webhook route)
CREATE POLICY "Service role can insert inbox"
  ON inbox_messages FOR INSERT
  WITH CHECK (true);

-- Index for unread count and ordering
CREATE INDEX IF NOT EXISTS inbox_messages_created_at_idx ON inbox_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS inbox_messages_is_read_idx ON inbox_messages (is_read);
