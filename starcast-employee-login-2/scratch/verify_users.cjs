const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_rIpm7VNb8OaC@ep-aged-mode-ax3mta9o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function verifyEmail(email) {
  try {
    const res = await pool.query(
      'UPDATE "user" SET "emailVerified" = true WHERE LOWER("email") = LOWER($1) RETURNING id, name, email, "emailVerified";',
      [email]
    );
    if (res.rows.length > 0) {
      console.log('Successfully verified user:', res.rows[0]);
    } else {
      console.log('User not found with email:', email);
    }
  } catch (err) {
    console.error('Error verifying user:', err);
  } finally {
    await pool.end();
  }
}

const targetEmail = process.argv[2] || 'starcastlivemedia@gmail.com';
console.log(`Verifying account for: ${targetEmail}...`);
verifyEmail(targetEmail);
