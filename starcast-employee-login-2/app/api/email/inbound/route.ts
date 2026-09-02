import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { inboxMessages } from "@/lib/db/schema"

// Allow Resend to verify the webhook endpoint
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "email-inbound" })
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text()
    const payload = JSON.parse(rawText)
    const data = payload?.data ?? payload

    // Extract fields
    const emailId = data.email_id ?? data.id ?? null
    const fromRaw = data.from ?? ""
    const fromEmail = Array.isArray(fromRaw) ? fromRaw[0] : String(fromRaw)
    const toRaw = data.to ?? []
    const toEmail = Array.isArray(toRaw) ? toRaw[0] : String(toRaw)
    const subject = data.subject ?? "(no subject)"

    // Get body directly from webhook payload
    const textBody = data.text ?? data.body ?? null
    const htmlBody = data.html ?? null

    await db.insert(inboxMessages).values({
      resendId: emailId,
      fromEmail,
      toEmail,
      subject,
      textBody,
      htmlBody,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[v0] inbound email error:", err?.message)
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
