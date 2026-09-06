import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Resolve the Postgres (Neon) connection string for this app.
 *
 * The app uses its own Neon database via the Postgres wire protocol
 * (pg + Drizzle + Better Auth). We prefer the explicit Neon env vars and only
 * fall back to a placeholder during build-time static collection.
 *
 * IMPORTANT: This project deliberately avoids Neon's Data API REST endpoint
 * (https://…apirest.neon.tech/…), which is NOT a Postgres wire URL and makes
 * every `pg` connection fail with "Connection terminated unexpectedly". So we
 * only ever accept real postgres(ql):// strings here.
 */
export function resolvePostgresUrl(): string {
  const candidates = [
    process.env.NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ]
  const valid = candidates.find((u) => u && /^postgres(ql)?:\/\//i.test(u))
  if (!valid) {
    // Fallback placeholder during build-time page data collection.
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  }
  return valid
}

export const pool = new Pool({ connectionString: resolvePostgresUrl() })
export const db = drizzle(pool, { schema })
