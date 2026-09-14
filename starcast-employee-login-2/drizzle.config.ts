
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',

  schema: './lib/db/schema.ts',
  out: 'netlify/database/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
})
