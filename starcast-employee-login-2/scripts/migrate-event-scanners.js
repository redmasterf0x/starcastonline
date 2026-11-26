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
    CREATE TABLE IF NOT EXISTS band_event_scanners (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES band_events(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      email text NOT NULL,
      added_by_user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_band_event_scanners_unique
    ON band_event_scanners(event_id, user_id);
  `)
  console.log("✓ band_event_scanners table & unique index ensured")
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
