import { NextRequest, NextResponse } from "next/server"
import { sweepMatureTicketEscrows } from "@/app/actions/band-tickets"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const summary = await sweepMatureTicketEscrows()
    return NextResponse.json({ ok: true, ...summary })
  } catch (err: any) {
    console.error("escrow-payouts cron error:", err)
    return NextResponse.json(
      { ok: false, error: err?.message || "Escrow sweep failed" },
      { status: 500 }
    )
  }
}
