const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running notifications table migration...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      actor_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type text NOT NULL,
      post_id uuid,
      comment_id uuid,
      friendship_id uuid,
      post_title text,
      snippet text,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_profile_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  `);

  console.log('✓ notifications table & indexes created');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
