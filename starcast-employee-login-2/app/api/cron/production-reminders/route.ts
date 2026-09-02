import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { productions, productionCrew, profiles } from "@/lib/db/schema"
import { and, gte, inArray, isNull, lte, eq } from "drizzle-orm"
import { Resend } from "resend"
import { sendSms, isSmsConfigured } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Protect: only Vercel cron (or manual calls with CRON_SECRET)
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000) // now + 25 min
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000)   // now + 35 min

  // Find production_crew rows whose production starts in the 30-min window
  // and haven't already received a reminder.
  const crewRows = await db
    .select({
      crewId: productionCrew.id,
      userId: productionCrew.userId,
      role: productionCrew.role,
      productionTitle: productions.title,
      productionStart: productions.startDate,
      productionLocation: productions.location,
    })
    .from(productionCrew)
    .innerJoin(productions, eq(productionCrew.productionId, productions.id))
    .where(
      and(
        gte(productions.startDate, windowStart),
        lte(productions.startDate, windowEnd),
        isNull(productionCrew.reminderSentAt),
      ),
    )

  if (crewRows.length === 0) {
    return NextResponse.json({ processed: 0, emailed: 0 })
  }

  // Load profile info for all affected users in one query
  const userIds = [...new Set(crewRows.map((r) => r.userId))]
  const profileRows = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.userId, userIds))

  const profileMap = new Map(profileRows.map((p) => [p.userId, p]))

  let emailed = 0

  for (const row of crewRows) {
    const profile = profileMap.get(row.userId)
    if (!profile?.email) continue

    const firstName = profile.firstName ?? "there"
    const callTime = row.productionStart
      ? row.productionStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York",
        })
      : "soon"

    const dateStr = row.productionStart
      ? row.productionStart.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "America/New_York",
        })
      : null

    // Send reminder email
    const { error } = await resend.emails.send({
      from: "Starcast Media <staff@starcast.online>",
      to: profile.email,
      subject: `Call time in 30 minutes — ${row.productionTitle}`,
      html: `
        <div style="font-family:Georgia,serif;background:#05052d;color:#f5f7ff;padding:40px;max-width:600px;margin:0 auto;border-radius:8px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#ea6f2a;font-size:28px;margin:0;">Starcast Media</h1>
          </div>
          <h2 style="color:#f5f7ff;font-size:22px;margin-bottom:16px;">Hey ${firstName}, your call time is in 30 minutes!</h2>
          <div style="background:#0c0c3f;border:1px solid #20205a;border-radius:8px;padding:24px;margin-bottom:24px;">
            <h3 style="color:#ea6f2a;margin:0 0 12px 0;font-size:20px;">${row.productionTitle}</h3>
            ${row.role ? `<p style="color:#f5f7ff;margin:4px 0;"><strong>Your Role:</strong> ${row.role}</p>` : ""}
            <p style="color:#f5f7ff;margin:4px 0;"><strong>Call Time:</strong> ${callTime}${dateStr ? ` · ${dateStr}` : ""}</p>
            ${row.productionLocation ? `<p style="color:#f5f7ff;margin:4px 0;"><strong>Location:</strong> ${row.productionLocation}</p>` : ""}
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="https://starcast.online/production" style="background:#ea6f2a;color:#f5f7ff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">View Production</a>
          </div>
          <p style="color:#9a9fc4;font-size:12px;text-align:center;margin-top:32px;">Starcast Media &mdash; staff@starcast.online</p>
        </div>
      `,
    })

    if (!error) {
      emailed++

      // SMS (no-op unless Twilio is configured)
      if (profile.phone && isSmsConfigured()) {
        const smsBody = `Starcast: ${firstName}, your call time for "${row.productionTitle}" is in 30 minutes${row.productionLocation ? ` at ${row.productionLocation}` : ""}. See you soon!`
        await sendSms(profile.phone, smsBody)
      }
    }

    // Mark as sent regardless of email success to avoid retry spam
    await db
      .update(productionCrew)
      .set({ reminderSentAt: new Date() })
      .where(eq(productionCrew.id, row.crewId))
  }

  return NextResponse.json({ processed: crewRows.length, emailed })
}
