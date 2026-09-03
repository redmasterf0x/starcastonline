import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { sendSms, isSmsConfigured } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_build_placeholder")

export async function POST(req: NextRequest) {
  try {
    const { to, phone, firstName, productionTitle, productionDate, productionLocation, role } = await req.json()

    if (!to || !productionTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const name = firstName || "there"
    const dateStr = productionDate
      ? new Date(productionDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : null

    const { error } = await resend.emails.send({
      from: "Starcast Media <staff@starcast.online>",
      to,
      subject: `You've been added to "${productionTitle}"`,
      html: `
        <div style="font-family: Georgia, serif; background: #05052d; color: #f5f7ff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ea6f2a; font-size: 28px; margin: 0;">Starcast Media</h1>
          </div>
          <h2 style="color: #f5f7ff; font-size: 22px; margin-bottom: 16px;">Hey ${name}, you're on the crew!</h2>
          <p style="color: #9a9fc4; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            You've been added to the following production:
          </p>
          <div style="background: #0c0c3f; border: 1px solid #20205a; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #ea6f2a; margin: 0 0 12px 0; font-size: 20px;">${productionTitle}</h3>
            ${role ? `<p style="color: #f5f7ff; margin: 4px 0;"><strong>Your Role:</strong> ${role}</p>` : ""}
            ${dateStr ? `<p style="color: #f5f7ff; margin: 4px 0;"><strong>Date:</strong> ${dateStr}</p>` : ""}
            ${productionLocation ? `<p style="color: #f5f7ff; margin: 4px 0;"><strong>Location:</strong> ${productionLocation}</p>` : ""}
          </div>
          <p style="color: #9a9fc4; font-size: 14px; line-height: 1.6;">
            Log in to the Starcast portal to view full production details, your schedule, and any additional information.
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://starcast.online/production" style="background: #ea6f2a; color: #f5f7ff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">View Production</a>
          </div>
          <p style="color: #9a9fc4; font-size: 12px; text-align: center; margin-top: 32px;">
            Starcast Media &mdash; staff@starcast.online
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also text them if they have a phone number and Twilio is configured.
    let smsSent = false
    if (phone && isSmsConfigured()) {
      const datePart = dateStr ? ` on ${dateStr}` : ""
      const locationPart = productionLocation ? ` at ${productionLocation}` : ""
      const smsBody = `Starcast Media: ${name}, you've been scheduled for "${productionTitle}"${datePart}${locationPart}. View details: https://starcast.online/production`
      const smsResult = await sendSms(phone, smsBody)
      smsSent = smsResult.ok
    }

    return NextResponse.json({ ok: true, smsSent })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 })
  }
}
