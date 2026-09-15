import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { ensureDatabaseTables } from "@/lib/db/init"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const timeRes = await pool.query("SELECT NOW() as current_time, current_database() as database")
    const initResult = await ensureDatabaseTables()

    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    return NextResponse.json({
      ok: true,
      time: timeRes.rows[0].current_time,
      database: timeRes.rows[0].database,
      initResult,
      tables: tablesRes.rows.map((r: { table_name: string }) => r.table_name),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        code: err.code,
      },
      { status: 500 }
    )
  }
}
