import { pool } from "./index"
import fs from "fs"
import path from "path"

let initPromise: Promise<{ initialized: boolean; tablesCount?: number; error?: string }> | null = null

export async function ensureDatabaseTables() {
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const sqlFile = path.join(process.cwd(), "lib", "db", "init-schema.sql")
      if (!fs.existsSync(sqlFile)) {
        return { initialized: false, error: "init-schema.sql not found" }
      }

      const content = fs.readFileSync(sqlFile, "utf8")
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean)

      for (const stmt of statements) {
        await pool.query(stmt).catch((err) => {
          if (!err.message?.includes("already exists")) {
            console.warn("[init-schema] Warning:", err.message)
          }
        })
      }

      const countRes = await pool.query(`
        SELECT count(*)::int as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)

      return { initialized: true, tablesCount: countRes.rows[0]?.count ?? 0 }
    } catch (err: any) {
      console.error("[init-schema] Initialization error:", err.message)
      return { initialized: false, error: err.message }
    }
  })()

  return initPromise
}
