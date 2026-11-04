import { NextResponse } from "next/server"
import { requireAdminRoute } from "@/lib/require-admin-route"
import { db } from "@/lib/db"
import { inboxMessages } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Verify the requester is an admin or staff
    const guard = await requireAdminRoute()
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status },
      )
    }

    const emailMap = new Map<string, any>()

    // 1. Fetch directly from Resend Receiving API
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails/receiving", {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          cache: "no-store",
        })

        if (res.ok) {
          const resendData = await res.json()
          const items = resendData.data ?? []

          // Fetch full details for top 15 in parallel
          const details = await Promise.all(
            items.slice(0, 15).map(async (item: any) => {
              try {
                const detailRes = await fetch(`https://api.resend.com/emails/receiving/${item.id}`, {
                  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
                  cache: "no-store",
                })
                if (detailRes.ok) {
                  return await detailRes.json()
                }
              } catch {}
              return item
            })
          )

          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const detail = details[i] || item
            const fromAddr = detail.from || (Array.isArray(item.from) ? item.from.join(", ") : item.from) || "Unknown"
            const toAddr = detail.to || (Array.isArray(item.to) ? item.to.join(", ") : item.to) || "staff@starcast.online"

            emailMap.set(item.id, {
              id: item.id,
              resend_id: item.id,
              from_email: typeof fromAddr === "object" ? fromAddr.email || JSON.stringify(fromAddr) : String(fromAddr),
              from_name: null,
              to_email: typeof toAddr === "object" ? toAddr.email || JSON.stringify(toAddr) : String(toAddr),
              subject: detail.subject || item.subject || "(no subject)",
              text_body: detail.text || null,
              html_body: detail.html || null,
              is_read: false,
              replied_at: null,
              created_at: item.created_at || new Date().toISOString(),
            })
          }
        }
      } catch (resendErr) {
        console.warn("[Inbox API Resend Fetch Warning]:", resendErr)
      }
    }

    // 2. Merge with Postgres inbox_messages table
    try {
      const dbEmails = await db
        .select()
        .from(inboxMessages)
        .orderBy(desc(inboxMessages.createdAt))
        .limit(50)

      for (const e of dbEmails) {
        const key = e.resendId || e.id
        if (!emailMap.has(key)) {
          emailMap.set(key, {
            id: e.id,
            resend_id: e.resendId,
            from_email: e.fromEmail,
            from_name: e.fromName,
            to_email: e.toEmail,
            subject: e.subject || "(no subject)",
            text_body: e.textBody || e.body,
            html_body: e.htmlBody,
            is_read: e.isRead,
            replied_at: e.repliedAt,
            created_at: e.createdAt,
          })
        }
      }
    } catch (dbErr) {
      console.warn("[Inbox API DB Warning]:", dbErr)
    }

    const emails = Array.from(emailMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ emails })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 })
  }
}
