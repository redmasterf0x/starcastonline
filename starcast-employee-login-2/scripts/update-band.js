const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function run() {
  const res = await pool.query(`
    UPDATE bands 
    SET banner_url = '/images/space-bg.png', logo_url = '/images/starcast-mascot.png' 
    WHERE slug = 'jetplane-bungalow'
  `);
  console.log('Updated rows:', res.rowCount);
  pool.end();
}

run().catch(console.error);
