const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running track_likes and album_likes migration...');

  // 1. Create track_likes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS track_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id UUID NOT NULL REFERENCES band_tracks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Indexes for track_likes
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_track_likes_unique ON track_likes(track_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_track_likes_track ON track_likes(track_id);
    CREATE INDEX IF NOT EXISTS idx_track_likes_user ON track_likes(user_id);
  `);

  // 3. Create album_likes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS album_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      album_name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 4. Indexes for album_likes
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_album_likes_unique ON album_likes(band_id, album_name, user_id);
    CREATE INDEX IF NOT EXISTS idx_album_likes_band ON album_likes(band_id);
    CREATE INDEX IF NOT EXISTS idx_album_likes_user ON album_likes(user_id);
  `);

  console.log('✓ track_likes and album_likes tables and indexes created successfully');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

