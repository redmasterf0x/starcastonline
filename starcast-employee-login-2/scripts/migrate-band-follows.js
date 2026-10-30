const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running band_follows index migration...');

  // 1. Remove duplicate follows if any exist
  await pool.query(`
    DELETE FROM band_follows a
    USING band_follows b
    WHERE a.id > b.id
      AND a.band_id = b.band_id
      AND a.user_id = b.user_id;
  `);

  // 2. Add unique constraint and indexes
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_band_follows_unique ON band_follows(band_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_band_follows_band ON band_follows(band_id);
    CREATE INDEX IF NOT EXISTS idx_band_follows_user ON band_follows(user_id);
  `);

  console.log('✓ band_follows indexes and unique constraint ensured');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
