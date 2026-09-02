import { NextResponse } from "next/server"
import { requireAdminRoute } from "@/lib/require-admin-route"

export async function GET() {
  try {
    // Verify the requester is an admin
    const guard = await requireAdminRoute()
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status },
      )
    }

    // Fetch emails from Resend API
    const res = await fetch("https://api.resend.com/emails?limit=50", {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const resendData = await res.json()

    // Filter to only inbound emails (to staff@starcast.online)
    const emails = (resendData.data ?? resendData ?? [])
      .filter((e: any) => {
        const to = Array.isArray(e.to) ? e.to : [e.to]
        return to.some((addr: string) => addr?.toLowerCase().includes("staff@starcast.online"))
      })
      .map((e: any) => ({
        id: e.id,
        resend_id: e.id,
        from_email: Array.isArray(e.from) ? e.from[0] : e.from,
        from_name: null,
        to_email: Array.isArray(e.to) ? e.to[0] : e.to,
        subject: e.subject ?? "(no subject)",
        text_body: e.text ?? null,
        html_body: e.html ?? null,
        is_read: false,
        replied_at: null,
        created_at: e.created_at,
      }))

    return NextResponse.json({ emails })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 })
  }
}
