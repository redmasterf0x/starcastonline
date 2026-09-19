const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function migrate() {
  console.log('Running standalone tracks schema migration...');

  // 1. Add slug, artist_name, producer, featured_artists to band_tracks
  await pool.query(`
    ALTER TABLE band_tracks 
    ADD COLUMN IF NOT EXISTS slug text,
    ADD COLUMN IF NOT EXISTS artist_name text,
    ADD COLUMN IF NOT EXISTS producer text,
    ADD COLUMN IF NOT EXISTS featured_artists text;
  `);
  console.log('✓ band_tracks table updated with slug, artist_name, producer, featured_artists');

  // 2. Add unique index on slug
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_band_tracks_slug ON band_tracks(slug) WHERE slug IS NOT NULL;
  `);
  console.log('✓ idx_band_tracks_slug created');

  // 3. Populate missing slugs for existing tracks
  const { rows } = await pool.query(`SELECT id, title, album_name FROM band_tracks WHERE slug IS NULL OR slug = ''`);
  for (const row of rows) {
    const baseSlug = slugify(row.title) || 'track';
    const shortId = row.id.split('-')[0];
    const uniqueSlug = `${baseSlug}-${shortId}`;
    await pool.query(`UPDATE band_tracks SET slug = $1 WHERE id = $2`, [uniqueSlug, row.id]);
  }
  console.log(`✓ Generated slugs for ${rows.length} existing tracks`);

  // 4. Create track_comments table for fan discussion on song pages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS track_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id uuid NOT NULL REFERENCES band_tracks(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      author_name text NOT NULL,
      author_avatar text,
      content text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_track_comments_track_id ON track_comments(track_id);
  `);
  console.log('✓ track_comments table and index created');

  await pool.end();
  console.log('Standalone tracks migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
