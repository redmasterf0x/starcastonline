import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "@/lib/require-admin-route"
import { db } from "@/lib/db"
import { inboxMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminRoute()
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status },
      )
    }

    const { emailId } = await req.json()

    if (!emailId) {
      return NextResponse.json({ error: "Missing emailId" }, { status: 400 })
    }

    // Get the email from DB
    const rows = await db.select().from(inboxMessages).where(eq(inboxMessages.id, emailId)).limit(1)
    const email = rows[0]

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // If already has content, return it
    if (email.textBody || email.htmlBody) {
      return NextResponse.json({ success: true, message: "Email already has content" })
    }

    // Try to fetch from Resend Receiving API using the resend_id
    // IMPORTANT: For inbound emails, use /emails/receiving/{id} NOT /emails/{id}
    if (email.resendId && process.env.RESEND_API_KEY) {
      const apiUrl = `https://api.resend.com/emails/receiving/${email.resendId}`
      console.log("[v0] Refresh - fetching from:", apiUrl)
      
      const r = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      
      const responseText = await r.text()

      if (r.ok) {
        const full = JSON.parse(responseText)
        const textBody = full.text ?? null
        const htmlBody = full.html ?? null

        if (textBody || htmlBody) {
          await db
            .update(inboxMessages)
            .set({ textBody, htmlBody })
            .where(eq(inboxMessages.id, emailId))

          return NextResponse.json({ success: true, message: "Content refreshed" })
        } else {
          return NextResponse.json({ success: false, message: "Email has no text or html content in Resend" })
        }
      } else {
        return NextResponse.json({ success: false, message: `Resend API error: ${r.status} - ${responseText.substring(0, 200)}` })
      }
    }

    return NextResponse.json({ success: false, message: "No resend_id or API key" })
  } catch (err: any) {
    console.error("[v0] Refresh error:", err?.message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
