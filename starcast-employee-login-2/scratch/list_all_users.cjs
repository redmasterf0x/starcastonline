const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAll() {
  const users = await pool.query('SELECT id, name, email, "emailVerified", "createdAt" FROM "user" ORDER BY "createdAt" DESC;');
  console.log("All Users in Database:");
  console.table(users.rows);
}

checkAll().then(() => pool.end()).catch(console.error);
