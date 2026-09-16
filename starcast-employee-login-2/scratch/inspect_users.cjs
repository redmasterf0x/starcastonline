const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  const users = await pool.query('SELECT id, email, "emailVerified", "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 10;');
  console.log("Recent Users in DB:", users.rows);

  const verifications = await pool.query('SELECT * FROM "verification" ORDER BY "createdAt" DESC LIMIT 10;');
  console.log("Recent Verifications in DB:", verifications.rows);
}

checkUsers().then(() => pool.end()).catch(console.error);
