const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const EMAIL = "raystarnes816@gmail.com";

async function clearUser() {
  console.log(`\n=== Looking up all data for ${EMAIL} ===\n`);

  // 1. Find the user row
  const userRes = await pool.query(
    'SELECT id, name, email, "emailVerified", "createdAt" FROM "user" WHERE email = $1',
    [EMAIL]
  );
  console.log("User rows:", userRes.rows);

  if (userRes.rows.length === 0) {
    console.log("No user found with that email. Checking verification table...");
    const vRes = await pool.query(
      'SELECT * FROM "verification" WHERE identifier = $1',
      [EMAIL]
    );
    console.log("Verification rows:", vRes.rows);
    if (vRes.rows.length > 0) {
      await pool.query('DELETE FROM "verification" WHERE identifier = $1', [EMAIL]);
      console.log("Deleted orphaned verification rows.");
    }
    return;
  }

  const userId = userRes.rows[0].id;
  console.log(`User ID: ${userId}`);

  // 2. Show linked accounts
  const accRes = await pool.query(
    'SELECT id, "accountId", "providerId", "createdAt" FROM "account" WHERE "userId" = $1',
    [userId]
  );
  console.log("Account rows:", accRes.rows);

  // 3. Show sessions
  const sessRes = await pool.query(
    'SELECT id, token, "expiresAt" FROM "session" WHERE "userId" = $1',
    [userId]
  );
  console.log("Session rows:", sessRes.rows);

  // 4. Show verifications
  const verifRes = await pool.query(
    'SELECT * FROM "verification" WHERE identifier = $1',
    [EMAIL]
  );
  console.log("Verification rows:", verifRes.rows);

  // 5. Show profile
  const profRes = await pool.query(
    'SELECT id, "userId", email, username, onboarding_completed FROM profiles WHERE "userId" = $1',
    [userId]
  );
  console.log("Profile rows:", profRes.rows);

  // 6. Show phone verifications
  const phoneRes = await pool.query(
    'SELECT * FROM "phone_verifications" WHERE "user_id" = $1',
    [userId]
  );
  console.log("Phone verification rows:", phoneRes.rows);

  // ---- DELETE EVERYTHING (cascading from user will handle session + account) ----
  console.log("\n=== DELETING all data ===\n");

  // Delete app-level rows first (no cascade from user table)
  await pool.query('DELETE FROM "phone_verifications" WHERE "user_id" = $1', [userId]);
  console.log("Deleted phone_verifications");

  await pool.query('DELETE FROM "profiles" WHERE "userId" = $1', [userId]);
  console.log("Deleted profiles");

  await pool.query('DELETE FROM "verification" WHERE identifier = $1', [EMAIL]);
  console.log("Deleted verifications");

  // Cascade: deleting the user row also deletes session + account rows
  await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);
  console.log("Deleted user (sessions + accounts cascade-deleted)");

  // Verify
  const check = await pool.query('SELECT count(*) FROM "user" WHERE email = $1', [EMAIL]);
  console.log(`\nRemaining user rows for ${EMAIL}: ${check.rows[0].count}`);
  console.log("Done! You can now sign up fresh.");
}

clearUser()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
  });
