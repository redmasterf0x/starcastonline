import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "@/lib/require-admin-route"

export async function POST(req: NextRequest) {
  try {
    // Verify caller is an admin
    const guard = await requireAdminRoute()
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status },
      )
    }

    const { to, subject, text, messageId } = await req.json()

    if (!to || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 })
    }

    const body: Record<string, unknown> = {
      from: "Starcast Staff <staff@starcast.online>",
      to: [to],
      subject: subject || "Re: Your message",
      text,
    }

    // Thread the reply if we have the original message ID
    if (messageId) {
      body.headers = {
        "In-Reply-To": messageId,
        "References": messageId,
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[reply] Resend error:", err)
      return NextResponse.json({ error: "Resend error" }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reply] Unexpected error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
