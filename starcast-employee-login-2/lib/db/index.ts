import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { getDatabase } from "@netlify/database"
import * as schema from "./schema"

/**
 * Source a real Postgres connection / pool for the app.
 *
 * On Netlify we use Netlify DB (powered by Neon). NETLIFY_DATABASE_URL is
 * injected automatically when the site is deployed with @netlify/database and
 * a Netlify-driven migration set. getDatabase() hands back a usable pool
 * (a pg.Pool) and the connection string, exactly what Better Auth and
 * Drizzle expect.
 *
 * Outside Netlify (local dev, other hosts) we build our own pg.Pool. In that
 * path DATABASE_URL was once mistakenly set to Neon's Data API REST endpoint
 * (an https URL), which is NOT a Postgres wire URL and makes every connection
 * fail. So we only ever accept real postgres(ql):// URLs.
 */
export function resolvePostgresUrl(): string {
  // 1) Netlify's canonical connection string.
  const netlifyUrl = process.env.NETLIFY_DATABASE_URL
  if (netlifyUrl && /^postgres(ql)?:\/\//i.test(netlifyUrl)) {
    return netlifyUrl
  }

  // 2) Local / other deployment targets.
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

const usesNetlifyDriver = () =>
  !!process.env.NETLIFY_DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.NETLIFY_DATABASE_URL)

// Prefer Netlify's managed pool when available; otherwise build a plain pg pool.
const netlifyPool = usesNetlifyDriver() ? (getDatabase().pool as Pool) : undefined

export const pool: Pool = netlifyPool ?? new Pool({ connectionString: resolvePostgresUrl() })
export const db = drizzle(pool, { schema })

