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
    console.log("Applying Admin VIP ticket tier columns...")
    await pool.query(`
      ALTER TABLE band_events
        ADD COLUMN IF NOT EXISTS vip_enabled BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS vip_price_cents INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS vip_total_inventory INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS vip_remaining_inventory INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS vip_table_bar_service BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS vip_food_service BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS vip_perks_note TEXT;

      ALTER TABLE band_ticket_orders
        ADD COLUMN IF NOT EXISTS ticket_tier TEXT NOT NULL DEFAULT 'general';

      ALTER TABLE band_ticket_instances
        ADD COLUMN IF NOT EXISTS ticket_tier TEXT NOT NULL DEFAULT 'general';
    `)
    console.log("Migration complete: VIP columns added to band_events, band_ticket_orders, band_ticket_instances.")
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
