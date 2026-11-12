const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running unique likes, stars, and reactions migration...');

  // 1. Post Stars: Deduplicate and ensure UNIQUE constraint on (post_id, "userId")
  console.log('Deduplicating post_stars...');
  const resPostStars = await pool.query(`
    DELETE FROM post_stars a
    USING post_stars b
    WHERE a.created_at < b.created_at
      AND a.post_id = b.post_id
      AND a."userId" = b."userId";
  `);
  await pool.query(`
    DELETE FROM post_stars a
    USING post_stars b
    WHERE a.id < b.id
      AND a.post_id = b.post_id
      AND a."userId" = b."userId";
  `);
  console.log(`Deduplicated post_stars (rows removed: ${resPostStars.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_post_stars_unique ON post_stars(post_id, "userId");
  `);
  console.log('✓ idx_post_stars_unique created');

  // 2. Comment Stars: Deduplicate and ensure UNIQUE constraint on (comment_id, "userId")
  console.log('Deduplicating comment_stars...');
  const resCommentStars = await pool.query(`
    DELETE FROM comment_stars a
    USING comment_stars b
    WHERE a.created_at < b.created_at
      AND a.comment_id = b.comment_id
      AND a."userId" = b."userId";
  `);
  await pool.query(`
    DELETE FROM comment_stars a
    USING comment_stars b
    WHERE a.id < b.id
      AND a.comment_id = b.comment_id
      AND a."userId" = b."userId";
  `);
  console.log(`Deduplicated comment_stars (rows removed: ${resCommentStars.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_stars_unique ON comment_stars(comment_id, "userId");
  `);
  console.log('✓ idx_comment_stars_unique created');

  // 3. Article Likes: Deduplicate and ensure UNIQUE constraint on (article_id, "userId")
  console.log('Deduplicating article_likes...');
  const resArticleLikes = await pool.query(`
    DELETE FROM article_likes a
    USING article_likes b
    WHERE a.created_at < b.created_at
      AND a.article_id = b.article_id
      AND a."userId" = b."userId";
  `);
  await pool.query(`
    DELETE FROM article_likes a
    USING article_likes b
    WHERE a.id < b.id
      AND a.article_id = b.article_id
      AND a."userId" = b."userId";
  `);
  console.log(`Deduplicated article_likes (rows removed: ${resArticleLikes.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_article_likes_unique ON article_likes(article_id, "userId");
  `);
  console.log('✓ idx_article_likes_unique created');

  // 4. Saved Articles: Deduplicate and ensure UNIQUE constraint on (article_id, "userId")
  console.log('Deduplicating saved_articles...');
  const resSavedArticles = await pool.query(`
    DELETE FROM saved_articles a
    USING saved_articles b
    WHERE a.created_at < b.created_at
      AND a.article_id = b.article_id
      AND a."userId" = b."userId";
  `);
  await pool.query(`
    DELETE FROM saved_articles a
    USING saved_articles b
    WHERE a.id < b.id
      AND a.article_id = b.article_id
      AND a."userId" = b."userId";
  `);
  console.log(`Deduplicated saved_articles (rows removed: ${resSavedArticles.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_articles_unique ON saved_articles(article_id, "userId");
  `);
  console.log('✓ idx_saved_articles_unique created');

  // 5. Track Likes: Deduplicate and ensure UNIQUE constraint on (track_id, user_id)
  console.log('Deduplicating track_likes...');
  const resTrackLikes = await pool.query(`
    DELETE FROM track_likes a
    USING track_likes b
    WHERE a.created_at < b.created_at
      AND a.track_id = b.track_id
      AND a.user_id = b.user_id;
  `);
  await pool.query(`
    DELETE FROM track_likes a
    USING track_likes b
    WHERE a.id < b.id
      AND a.track_id = b.track_id
      AND a.user_id = b.user_id;
  `);
  console.log(`Deduplicated track_likes (rows removed: ${resTrackLikes.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_track_likes_unique ON track_likes(track_id, user_id);
  `);
  console.log('✓ idx_track_likes_unique created');

  // 6. Album Likes: Deduplicate and ensure UNIQUE constraint on (band_id, album_name, user_id)
  console.log('Deduplicating album_likes...');
  const resAlbumLikes = await pool.query(`
    DELETE FROM album_likes a
    USING album_likes b
    WHERE a.created_at < b.created_at
      AND a.band_id = b.band_id
      AND a.album_name = b.album_name
      AND a.user_id = b.user_id;
  `);
  await pool.query(`
    DELETE FROM album_likes a
    USING album_likes b
    WHERE a.id < b.id
      AND a.band_id = b.band_id
      AND a.album_name = b.album_name
      AND a.user_id = b.user_id;
  `);
  console.log(`Deduplicated album_likes (rows removed: ${resAlbumLikes.rowCount})`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_album_likes_unique ON album_likes(band_id, album_name, user_id);
  `);
  console.log('✓ idx_album_likes_unique created');

  console.log('🎉 All unique like constraints and indexes are successfully ensured!');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

