const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") })
const { Pool } = require("pg")

async function migrate() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in .env.local")
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    console.log("Running user-level Ticket Seller Central schema migration on profiles...")
    await client.query("BEGIN")

    await client.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS ticketing_status TEXT NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS ticketing_application_notes TEXT,
        ADD COLUMN IF NOT EXISTS ticketing_applied_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS ticketing_approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS seller_organizer_name TEXT;
    `)

    await client.query("COMMIT")
    console.log("Migration completed successfully.")
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Migration failed:", err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
