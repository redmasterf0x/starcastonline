import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Resolve the Postgres connection string for this app.
 *
 * The app connects to Postgres via the pg wire protocol (pg + Drizzle + Better Auth).
 * We read DATABASE_URL or POSTGRES_URL and only fall back to a placeholder during
 * build-time static page collection.
 */
export function resolvePostgresUrl(): string {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ]
  const valid = candidates.find((u) => u && /^postgres(ql)?:\/\//i.test(u))
  if (!valid) {
    // Fallback placeholder during build-time page data collection.
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  }
  return valid
}

const connectionUrl = resolvePostgresUrl()
export const pool = new Pool({ connectionString: connectionUrl })
export const db = drizzle(pool, { schema })
