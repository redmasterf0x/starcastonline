const path = require("path")
const { Pool } = require("pg")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") })

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
if (!databaseUrl) {
  console.error("Missing DATABASE_URL")
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
})

async function run() {
  await pool.query(`
    ALTER TABLE band_events
      ALTER COLUMN band_id DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS owner_user_id text,
      ADD COLUMN IF NOT EXISTS organizer_name text,
      ADD COLUMN IF NOT EXISTS custom_links jsonb NOT NULL DEFAULT '[]'::jsonb;
  `)

  await pool.query(`
    ALTER TABLE band_ticket_orders
      ALTER COLUMN band_id DROP NOT NULL;
  `)

  await pool.query(`
    ALTER TABLE band_ticket_instances
      ALTER COLUMN band_id DROP NOT NULL;
  `)

  // Backfill owner_user_id for existing band events
  await pool.query(`
    UPDATE band_events e
    SET owner_user_id = b.owner_user_id
    FROM bands b
    WHERE e.band_id = b.id AND e.owner_user_id IS NULL;
  `)

  console.log("✓ Standalone events, owner_user_id, organizer_name, and custom_links ensured")
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
