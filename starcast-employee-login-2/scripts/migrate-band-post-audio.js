const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running band posts audio & post types schema migration...');

  await pool.query(`
    ALTER TABLE band_posts 
    ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS audio_tracks jsonb DEFAULT '[]'::jsonb;
  `);
  console.log('✓ band_posts updated with post_type and audio_tracks columns');

  await pool.end();
  console.log('Band posts audio migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
