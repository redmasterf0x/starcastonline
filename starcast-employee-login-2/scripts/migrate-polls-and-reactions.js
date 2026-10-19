const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running polls and cosmic reactions migration...');

  await pool.query(`
    -- 1. Polls on community_posts
    ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS poll_data jsonb;

    -- 2. Poll votes table
    CREATE TABLE IF NOT EXISTS community_poll_votes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL,
      option_id text NOT NULL,
      user_id text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT uq_post_poll_user UNIQUE(post_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_poll_votes_post ON community_poll_votes(post_id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON community_poll_votes(user_id);

    -- 3. Reaction types on post_stars and comment_stars
    ALTER TABLE post_stars ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'love';
    ALTER TABLE comment_stars ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'love';

    CREATE INDEX IF NOT EXISTS idx_post_stars_post_reaction ON post_stars(post_id, reaction_type);
    CREATE INDEX IF NOT EXISTS idx_comment_stars_comment_reaction ON comment_stars(comment_id, reaction_type);
  `);

  console.log('✓ community_poll_votes table, poll_data column, and reaction_type columns created successfully');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
