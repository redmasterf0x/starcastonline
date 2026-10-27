const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
});

async function migrate() {
  console.log('Running audio fingerprinting & copyright compliance migration...');

  await pool.query(`
    ALTER TABLE band_tracks 
    ADD COLUMN IF NOT EXISTS audio_hash text,
    ADD COLUMN IF NOT EXISTS fingerprint text,
    ADD COLUMN IF NOT EXISTS fingerprint_algorithm text DEFAULT 'starcast-spectral-v1',
    ADD COLUMN IF NOT EXISTS copyright_status text NOT NULL DEFAULT 'clean',
    ADD COLUMN IF NOT EXISTS copyright_details jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS proof_of_master_hash text;
  `);
  console.log('✓ band_tracks table updated with audio fingerprint & copyright columns');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_band_tracks_audio_hash ON band_tracks(audio_hash);
    CREATE INDEX IF NOT EXISTS idx_band_tracks_copyright_status ON band_tracks(copyright_status);
  `);
  console.log('✓ Indexes for audio_hash and copyright_status created');

  await pool.end();
  console.log('Audio fingerprint migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Audio fingerprint migration failed:', err);
  process.exit(1);
});
