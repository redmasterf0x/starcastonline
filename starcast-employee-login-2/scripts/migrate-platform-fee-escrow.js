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
    ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS platform_escrow_status text NOT NULL DEFAULT 'held',
    ADD COLUMN IF NOT EXISTS platform_transfer_id text;
  `)
  console.log("✓ band_events platform fee escrow columns ensured")
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
