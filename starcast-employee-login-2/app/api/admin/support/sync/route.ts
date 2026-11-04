import { NextResponse } from "next/server"
import { saveInboundEmail } from "@/lib/firebase/firestore-service"
import { db } from "@/lib/db"
import { inboxMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY not set" }, { status: 400 })
    }

    // Fetch received emails from Resend Receiving API
    const res = await fetch("https://api.resend.com/emails/receiving", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
      cache: "no-store",
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: errText }, { status: 500 })
    }

    const list = await res.json()
    const items = list.data || []
    let syncedCount = 0

    // Fetch details in parallel batches
    await Promise.all(
      items.map(async (item: any) => {
        try {
          const detailRes = await fetch(`https://api.resend.com/emails/receiving/${item.id}`, {
            headers: { Authorization: `Bearer ${resendApiKey}` },
            cache: "no-store",
          })

          let sender = Array.isArray(item.from) ? item.from.join(", ") : item.from || "Unknown"
          let recipient = Array.isArray(item.to) ? item.to.join(", ") : item.to || "staff@starcast.online"
          let subject = item.subject || "Support Inquiry"
          let textBody = ""
          let htmlBody = ""

          if (detailRes.ok) {
            const detail = await detailRes.json()
            sender =
              detail.headers?.from ||
              detail.from ||
              (Array.isArray(detail.from) ? detail.from.join(", ") : detail.from) ||
              sender
            recipient =
              detail.headers?.to ||
              detail.to ||
              (Array.isArray(detail.to) ? detail.to.join(", ") : detail.to) ||
              recipient
            subject = detail.subject || subject
            textBody = detail.text || (detail.html ? detail.html.replace(/<[^>]*>?/gm, "").trim() : "")
            htmlBody = detail.html || ""
          }

          // 1. Sync to Postgres inbox_messages
          try {
            const existing = await db
              .select({ id: inboxMessages.id })
              .from(inboxMessages)
              .where(eq(inboxMessages.resendId, String(item.id)))
              .limit(1)

            if (existing.length === 0) {
              await db.insert(inboxMessages).values({
                resendId: String(item.id),
                fromEmail: String(sender),
                fromName: String(sender).split("<")[0].trim().replace(/"/g, "") || null,
                toEmail: String(recipient),
                subject: String(subject),
                body: String(textBody),
                textBody: String(textBody),
                htmlBody: htmlBody ? String(htmlBody) : null,
                status: "unread",
                isRead: false,
                createdAt: item.created_at ? new Date(item.created_at) : new Date(),
              })
            }
          } catch (dbErr) {
            console.warn("[Support Sync DB Warning]:", dbErr)
          }

          // 2. Sync to Firestore (with graceful error handling)
          try {
            await saveInboundEmail({
              id: item.id,
              resendEmailId: item.id,
              from: String(sender),
              to: String(recipient),
              subject: String(subject),
              text: String(textBody),
              html: String(htmlBody),
              status: "open",
            })
          } catch (fsErr) {
            console.warn("[Support Sync Firestore Warning]:", fsErr)
          }

          syncedCount++
        } catch (itemErr) {
          console.warn("[Support Sync Item Error]:", itemErr)
        }
      })
    )

    return NextResponse.json({ success: true, count: syncedCount })
  } catch (error: any) {
    console.error("[Support Sync Error]:", error)
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 })
  }
}
