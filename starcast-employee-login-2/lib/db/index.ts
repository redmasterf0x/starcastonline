import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Resolve a real Postgres connection string for the `pg` Pool.
 *
 * NOTE: In this project `DATABASE_URL` was populated with the Neon **Data API
 * REST** endpoint (https://….apirest.neon.tech/neondb/rest/v1), which is NOT a
 * Postgres wire-protocol URL. Handing that to `pg` makes every connection fail
 * with "Connection terminated unexpectedly". So we prefer the real Neon
 * Postgres URLs and only fall back to DATABASE_URL if it actually looks like a
 * postgres:// string.
 */
function resolvePostgresUrl(): string {
  const candidates = [
    process.env.NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ]
  const valid = candidates.find((u) => u && /^postgres(ql)?:\/\//i.test(u))
  if (!valid) {
    // Fallback placeholder during build-time page data collection
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  }
  return valid
}

export const pool = new Pool({ connectionString: resolvePostgresUrl() })
export const db = drizzle(pool, { schema })
