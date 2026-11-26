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
    ADD COLUMN IF NOT EXISTS recurrence_frequency text;
  `)
  console.log("✓ band_events.recurrence_frequency column ensured")
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
