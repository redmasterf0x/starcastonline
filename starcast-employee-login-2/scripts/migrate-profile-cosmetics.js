const { Pool } = require("pg")
const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") })

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in .env.local")
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  })

  try {
    console.log("Applying profile leveling & cosmetics columns...")
    await pool.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS equipped_frame TEXT NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS equipped_banner TEXT NOT NULL DEFAULT 'cosmic-grid',
        ADD COLUMN IF NOT EXISTS bonus_xp INTEGER NOT NULL DEFAULT 0;
    `)
    console.log("Migration complete: equipped_frame, equipped_banner, bonus_xp ready.")
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
