const { Pool } = require('pg');

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

async function run() {
  try {
    console.log('--- Syncing band_posts.audio_tracks to band_tracks ---');

    const postsWithAudio = await pool.query(`
      SELECT bp.id as post_id, bp.band_id, bp.audio_tracks, bp.created_at, b.name as band_name, b.slug as band_slug, b.logo_url as band_logo
      FROM band_posts bp
      JOIN bands b ON bp.band_id = b.id
      WHERE bp.audio_tracks IS NOT NULL AND jsonb_array_length(bp.audio_tracks) > 0
    `);

    console.log(`Found ${postsWithAudio.rows.length} audio post(s) to process.`);

    for (const post of postsWithAudio.rows) {
      const tracks = post.audio_tracks;
      if (!Array.isArray(tracks)) continue;

      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (!t.audio_url && !t.audioUrl) continue;
        const audioUrl = (t.audio_url || t.audioUrl).trim();
        const title = (t.title || 'Untitled Track').trim();
        const artistName = (t.artist_name || t.artistName || post.band_name || '').trim();
        const producer = (t.producer || '').trim() || null;
        const coverArtUrl = (t.cover_art_url || t.coverArtUrl || post.band_logo || '').trim() || null;
        const durationSeconds = t.duration_seconds || t.durationSeconds || 0;
        const allowDownload = t.allow_download !== false && t.allowDownload !== false;

        // Check if track already exists in band_tracks for this band with matching audio_url
        const existing = await pool.query(
          'SELECT id, slug FROM band_tracks WHERE band_id = $1 AND audio_url = $2',
          [post.band_id, audioUrl]
        );

        if (existing.rows.length > 0) {
          console.log(`Track "${title}" already exists in band_tracks (${existing.rows[0].id}).`);
        } else {
          const baseSlug = slugify(title) || 'track';
          const randomSuffix = Math.random().toString(36).substring(2, 7);
          const slug = `${baseSlug}-${randomSuffix}`;

          const posRes = await pool.query(
            'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM band_tracks WHERE band_id = $1',
            [post.band_id]
          );
          const nextPos = parseInt(posRes.rows[0].next_pos, 10) || 0;

          const inserted = await pool.query(
            `INSERT INTO band_tracks (
              band_id, title, slug, artist_name, producer, audio_url,
              duration_seconds, cover_art_url, allow_download, position, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
            RETURNING id, title, slug`,
            [
              post.band_id,
              title,
              slug,
              artistName || null,
              producer,
              audioUrl,
              durationSeconds,
              coverArtUrl,
              allowDownload,
              nextPos,
              post.created_at || new Date(),
            ]
          );

          console.log(`✓ Inserted track: "${inserted.rows[0].title}" [${inserted.rows[0].slug}] (id: ${inserted.rows[0].id})`);
        }

        // Make sure band has musicCatalogEnabled = true
        await pool.query('UPDATE bands SET music_catalog_enabled = true WHERE id = $1', [post.band_id]);
      }
    }

    const finalCount = await pool.query('SELECT count(*) FROM band_tracks');
    console.log('Final band_tracks count:', finalCount.rows[0].count);

    const allTracks = await pool.query(`
      SELECT bt.id, bt.title, bt.slug, bt.audio_url, b.name as band_name 
      FROM band_tracks bt 
      JOIN bands b ON bt.band_id = b.id
    `);
    console.log('All tracks in DB now:', allTracks.rows);

  } catch (e) {
    console.error('Sync error:', e);
  } finally {
    await pool.end();
  }
}

run();
