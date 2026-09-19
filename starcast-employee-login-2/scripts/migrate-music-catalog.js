const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running music catalog schema migration...');

  // 1. Add music_catalog columns to bands table
  await pool.query(`
    ALTER TABLE bands 
    ADD COLUMN IF NOT EXISTS music_catalog_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS music_catalog_title text DEFAULT 'Original Music & Tracks';
  `);
  console.log('✓ bands table updated with music catalog flags');

  // 2. Create band_tracks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS band_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      title text NOT NULL,
      audio_url text NOT NULL,
      duration_seconds integer DEFAULT 0,
      album_name text,
      cover_art_url text,
      release_year text,
      genre text,
      description text,
      lyrics text,
      allow_download boolean NOT NULL DEFAULT true,
      play_count integer NOT NULL DEFAULT 0,
      position integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ band_tracks table created');

  // 3. Create indices for performant querying
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_band_tracks_band_id ON band_tracks(band_id);
    CREATE INDEX IF NOT EXISTS idx_band_tracks_position ON band_tracks(band_id, position);
  `);
  console.log('✓ band_tracks indexes created');

  await pool.end();
  console.log('Music catalog migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Music catalog migration failed:', err);
  process.exit(1);
});
