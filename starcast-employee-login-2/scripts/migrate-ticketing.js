const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function migrate() {
  console.log('Running ticketing schema migration...');

  // 1. Add ticketing columns to bands
  await pool.query(`
    ALTER TABLE bands 
    ADD COLUMN IF NOT EXISTS ticketing_status text NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS ticketing_application_notes text,
    ADD COLUMN IF NOT EXISTS ticketing_applied_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS stripe_account_id text,
    ADD COLUMN IF NOT EXISTS stripe_account_status text NOT NULL DEFAULT 'not_connected';
  `);
  console.log('✓ bands table columns updated');

  // 2. Create band_events table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS band_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      venue_name text NOT NULL,
      venue_address text,
      event_date timestamp with time zone NOT NULL,
      doors_open_time text,
      start_time text,
      price_cents integer NOT NULL DEFAULT 0,
      total_inventory integer NOT NULL DEFAULT 20,
      remaining_inventory integer NOT NULL DEFAULT 20,
      age_restriction text DEFAULT 'All Ages',
      flyer_url text,
      status text NOT NULL DEFAULT 'active',
      escrow_status text NOT NULL DEFAULT 'held',
      escrow_release_date timestamp with time zone,
      stripe_product_id text,
      stripe_price_id text,
      stripe_transfer_id text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ band_events table created');

  // 3. Create band_ticket_orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS band_ticket_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES band_events(id) ON DELETE CASCADE,
      band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      buyer_user_id text,
      buyer_email text NOT NULL,
      buyer_name text NOT NULL,
      quantity integer NOT NULL DEFAULT 1,
      unit_price_cents integer NOT NULL DEFAULT 0,
      total_cents integer NOT NULL DEFAULT 0,
      platform_fee_cents integer NOT NULL DEFAULT 0,
      stripe_session_id text,
      stripe_payment_intent_id text,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ band_ticket_orders table created');

  // 4. Create band_ticket_instances table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS band_ticket_instances (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES band_ticket_orders(id) ON DELETE CASCADE,
      event_id uuid NOT NULL REFERENCES band_events(id) ON DELETE CASCADE,
      band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      ticket_number integer NOT NULL,
      qr_token text NOT NULL UNIQUE,
      holder_name text NOT NULL,
      holder_email text NOT NULL,
      status text NOT NULL DEFAULT 'valid',
      checked_in_at timestamp with time zone,
      checked_in_by_user_id text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ band_ticket_instances table created');

  // 5. Create helpful indices
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_band_events_band_id ON band_events(band_id);
    CREATE INDEX IF NOT EXISTS idx_band_events_status ON band_events(status);
    CREATE INDEX IF NOT EXISTS idx_band_ticket_orders_event_id ON band_ticket_orders(event_id);
    CREATE INDEX IF NOT EXISTS idx_band_ticket_instances_qr_token ON band_ticket_instances(qr_token);
    CREATE INDEX IF NOT EXISTS idx_band_ticket_instances_event_id ON band_ticket_instances(event_id);
  `);
  console.log('✓ indexes created');

  await pool.end();
  console.log('Ticketing migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
