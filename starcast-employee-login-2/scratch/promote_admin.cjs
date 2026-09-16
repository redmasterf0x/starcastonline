const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_rIpm7VNb8OaC@ep-aged-mode-ax3mta9o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query(`
      UPDATE profiles 
      SET is_admin = true, is_employee = true, can_write_articles = true, can_manage_calendar = true, role = 'admin'
      WHERE LOWER(email) = LOWER('starcastlivemedia@gmail.com')
      RETURNING id, email, first_name, last_name, is_admin, is_employee, can_write_articles, role;
    `);
    console.log('Promoted to Admin:', res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
