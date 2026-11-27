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
    console.log("Adding event_end_date to band_events and backfilling existing rows...")
    await client.query("BEGIN")

    await client.query(`
      ALTER TABLE band_events
        ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMPTZ;
    `)

    // Backfill event_end_date = event_date + 3 hours for any existing event missing an end time,
    // and align escrow_release_date = event_end_date + 24 hours for held events
    await client.query(`
      UPDATE band_events
      SET event_end_date = event_date + INTERVAL '3 hours'
      WHERE event_end_date IS NULL;
    `)

    await client.query(`
      UPDATE band_events
      SET escrow_release_date = event_end_date + INTERVAL '24 hours'
      WHERE escrow_status = 'held' AND event_end_date IS NOT NULL;
    `)

    await client.query("COMMIT")
    console.log("event_end_date migration completed successfully.")
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
