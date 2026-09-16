const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_rIpm7VNb8OaC@ep-aged-mode-ax3mta9o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    const users = await pool.query('SELECT id, name, email, "emailVerified", "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 5;');
    console.log('Recent Users:', users.rows);
    const cols = await pool.query("SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_name = 'verification';");
    console.log('Verification Columns:', cols.rows);
    const count = await pool.query('SELECT count(*) FROM "verification";');
    console.log('Verification Total Count:', count.rows);
    const allVerifs = await pool.query('SELECT * FROM "verification";');
    console.log('All Verifications in DB:', allVerifs.rows);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

run();
