import { Resend } from "resend"
import QRCode from "qrcode"

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_build_placeholder")

const FROM = "StarCast Media <noreply@starcast.online>"
const BRAND_ORANGE = "#D4722B"
const BRAND_NAVY = "#0A1828"
const BRAND_CREAM = "#F5F1E6"

/**
 * Wrap body content in a consistent, email-client-safe branded shell.
 * Uses inline styles + tables since email clients strip <style>/flexbox.
 */
function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND_NAVY};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_NAVY};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0F1F2E;border:1px solid rgba(212,114,43,0.25);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <p style="margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ORANGE};font-weight:bold;">StarCast Media</p>
                <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.3;color:${BRAND_CREAM};">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;color:#BFA98E;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0 0;font-size:12px;color:#5c6b7a;">© ${new Date().getFullYear()} StarCast Media · starcast.online</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;">
    <tr>
      <td style="border-radius:8px;background:${BRAND_ORANGE};">
        <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:${BRAND_CREAM};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`
}

/** Send the account email-verification link (used by Better Auth on signup + resend). */
export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  // Always log the verification link for easy developer / admin access and debugging
  console.log(
    `\n=======================================================\n` +
    `[EMAIL VERIFICATION]\n` +
    `To: ${to}\n` +
    `Verification Link: ${url}\n` +
    `=======================================================\n`
  )

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.warn(
      `[EMAIL] RESEND_API_KEY is not configured or is a placeholder. ` +
      `Skipping Resend dispatch. The account verification link has been printed to the server log above.`
    )
    return
  }

  const body = `
    <p style="margin:0 0 16px 0;">Welcome to StarCast Media! Confirm this email address to activate your account and start booking sessions.</p>
    ${button(url, "Verify my email")}
    <p style="margin:0 0 8px 0;font-size:13px;">Or paste this link into your browser:</p>
    <p style="margin:0 0 16px 0;word-break:break-all;"><a href="${url}" target="_blank" style="color:${BRAND_ORANGE};">${url}</a></p>
    <p style="margin:0;font-size:13px;color:#5c6b7a;">If you didn&apos;t create this account, you can safely ignore this email.</p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your StarCast Media account",
      html: shell("Confirm your email", body),
    })

    if (error) {
      console.error("[EMAIL] Resend send error with primary domain:", error)
      console.warn("[EMAIL] Attempting fallback delivery via onboarding@resend.dev...")
      const fallbackRes = await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to,
        subject: "Verify your StarCast Media account",
        html: shell("Confirm your email", body),
      })
      if (fallbackRes.error) {
        console.error("[EMAIL] Fallback sender error:", fallbackRes.error)
      } else {
        console.log("[EMAIL] Fallback verification email sent via onboarding@resend.dev ID:", fallbackRes.data?.id)
      }
    } else {
      console.log("[EMAIL] Verification email sent successfully via Resend. ID:", data?.id)
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error while sending email via Resend:", err)
    console.log(`[EMAIL] Fallback verification link for ${to}: ${url}`)
  }
}

/** Send the password reset link (used by Better Auth forgetPassword). */
export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  console.log(
    `\n=======================================================\n` +
    `[PASSWORD RESET]\n` +
    `To: ${to}\n` +
    `Reset Link: ${url}\n` +
    `=======================================================\n`
  )

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.warn(`[EMAIL] RESEND_API_KEY not configured. Reset link printed above.`)
    return
  }

  const body = `
    <p style="margin:0 0 16px 0;">We received a request to reset your StarCast Media password.</p>
    ${button(url, "Reset password")}
    <p style="margin:0 0 8px 0;font-size:13px;">Or paste this link into your browser:</p>
    <p style="margin:0 0 16px 0;word-break:break-all;"><a href="${url}" target="_blank" style="color:${BRAND_ORANGE};">${url}</a></p>
    <p style="margin:0;font-size:13px;color:#5c6b7a;">If you didn&apos;t request this, you can safely ignore this email.</p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your StarCast Media password",
      html: shell("Reset your password", body),
    })

    if (error) {
      console.error("[EMAIL] Resend reset error:", error)
      const fallbackRes = await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to,
        subject: "Reset your StarCast Media password",
        html: shell("Reset your password", body),
      })
      if (!fallbackRes.error) {
        console.log("[EMAIL] Fallback password reset sent ID:", fallbackRes.data?.id)
      }
    } else {
      console.log("[EMAIL] Password reset sent successfully ID:", data?.id)
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendPasswordResetEmail:", err)
  }
}

export interface TicketEmailPayload {
  to: string
  buyerName: string
  bandName: string
  eventTitle: string
  venueName: string
  venueAddress?: string | null
  eventDate: Date
  doorsOpenTime?: string | null
  startTime?: string | null
  totalCents: number
  ticketTier?: "general" | "vip"
  vipTableBarService?: boolean
  vipFoodService?: boolean
  vipPerksNote?: string | null
  tickets: Array<{
    ticketNumber: number
    qrToken: string
  }>
}

/** Email purchased/reserved QR ticket passes to the buyer. */
export async function sendTicketConfirmationEmail(payload: TicketEmailPayload): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"
  const formattedDate = new Date(payload.eventDate).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.warn(`[EMAIL] RESEND_API_KEY not configured. Skipping ticket email to ${payload.to}.`)
    return
  }

  const attachments: Array<{
    filename: string
    content: Buffer
    contentId: string
  }> = []

  const ticketCardsHtml = (
    await Promise.all(
      payload.tickets.map(async (t, idx) => {
        const ticketUrl = `${baseUrl}/tickets/${t.qrToken}`
        const cid = `ticket-qr-${idx}`
        try {
          const pngBuffer = await QRCode.toBuffer(ticketUrl, {
            width: 220,
            margin: 2,
            color: { dark: "#05051f", light: "#ffffff" },
          })
          attachments.push({
            filename: `starcast-ticket-${t.ticketNumber}.png`,
            content: pngBuffer,
            contentId: cid,
          })
        } catch (qrErr) {
          console.warn("[EMAIL] QR buffer generation warning:", qrErr)
        }

        return `
          <div style="margin:16px 0;padding:18px;border:1px solid rgba(212,114,43,0.35);border-radius:10px;background:#081421;text-align:center;">
            <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND_ORANGE};font-weight:bold;">
              Ticket #${t.ticketNumber} &bull; ${payload.buyerName}
            </p>
            <img src="cid:${cid}" alt="Ticket #${t.ticketNumber} QR Code" width="180" height="180" style="display:block;margin:12px auto;border-radius:8px;background:#ffffff;padding:6px;" />
            <p style="margin:8px 0 12px 0;font-size:11px;font-family:monospace;color:#8ea0b5;">Token: ${t.qrToken.slice(0, 12)}...</p>
            ${button(ticketUrl, `Open Ticket #${t.ticketNumber} Pass`)}
          </div>
        `
      })
    )
  ).join("")

  const priceDisplay =
    payload.totalCents > 0 ? `$${(payload.totalCents / 100).toFixed(2)}` : "Free Pass"
  const isVip = payload.ticketTier === "vip"
  const vipServices: string[] = []
  if (payload.vipTableBarService !== false) vipServices.push("Table Bar Service")
  if (payload.vipFoodService !== false) vipServices.push("Food Service")

  const body = `
    <p style="margin:0 0 14px 0;">Hi <strong>${payload.buyerName}</strong>,</p>
    <p style="margin:0 0 16px 0;">Your ${isVip ? "<strong>VIP</strong> " : ""}${payload.tickets.length === 1 ? "ticket is" : `${payload.tickets.length} tickets are`} confirmed for <strong>${payload.bandName} — ${payload.eventTitle}</strong>!</p>
    ${
      isVip
        ? `<div style="padding:14px 16px;border-radius:8px;background:#241a05;border:1px solid #ffd166;margin-bottom:16px;">
            <p style="margin:0 0 4px 0;color:#ffd166;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;">★ VIP Table Pass Included</p>
            <p style="margin:0;font-size:13px;color:${BRAND_CREAM};">Includes <strong>${vipServices.join(" &amp; ") || "VIP Hospitality"}</strong>${payload.vipPerksNote ? ` &mdash; ${payload.vipPerksNote}` : ""}.</p>
          </div>`
        : ""
    }
    <div style="padding:14px 16px;border-radius:8px;background:#081421;border:1px solid rgba(255,255,255,0.08);margin-bottom:18px;">
      <p style="margin:0 0 6px 0;color:${BRAND_CREAM};font-weight:bold;">${payload.eventTitle}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Tier:</strong> ${isVip ? "VIP Pass (Table, Bar &amp; Food Service)" : "General Admission"}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Time:</strong> Doors ${payload.doorsOpenTime || "7:00 PM"} &bull; Show ${payload.startTime || "8:00 PM"}</p>
      <p style="margin:0 0 4px 0;font-size:13px;"><strong>Venue:</strong> ${payload.venueName}${payload.venueAddress ? ` (${payload.venueAddress})` : ""}</p>
      <p style="margin:0;font-size:13px;"><strong>Total Paid:</strong> ${priceDisplay}</p>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:${BRAND_CREAM};">Present your QR code at the door for instant check-in:</p>
    ${ticketCardsHtml}
  `

  const subject = `Your Ticket${payload.tickets.length > 1 ? "s" : ""}: ${payload.bandName} — ${payload.eventTitle}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject,
      html: shell("Your Event Tickets", body),
      attachments,
    })

    if (error) {
      console.error("[EMAIL] Ticket confirmation error:", error)
      await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to: payload.to,
        subject,
        html: shell("Your Event Tickets", body),
        attachments,
      })
    } else {
      console.log("[EMAIL] Ticket confirmation sent ID:", data?.id)
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error sending ticket confirmation:", err)
  }
}

export interface EventRefundEmailPayload {
  to: string
  buyerName: string
  organizerName: string
  eventTitle: string
  venueName: string
  eventDate: Date | string
  quantity: number
  refundAmountCents: number
}

/** Notify a ticket buyer that an event was deleted/cancelled and their Stripe refund was issued. */
export async function sendEventCancelledRefundEmail(payload: EventRefundEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.log(
      `[EMAIL] Event cancellation/refund notice for ${payload.to}: ${payload.eventTitle} — Refund $${(payload.refundAmountCents / 100).toFixed(2)}`
    )
    return
  }

  const formattedDate = new Date(payload.eventDate).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const isPaid = payload.refundAmountCents > 0
  const refundDisplay = `$${(payload.refundAmountCents / 100).toFixed(2)}`

  const body = `
    <p style="margin:0 0 14px 0;">Hi <strong>${payload.buyerName}</strong>,</p>
    <p style="margin:0 0 16px 0;">
      <strong>${payload.organizerName} — ${payload.eventTitle}</strong> scheduled for ${formattedDate} at ${payload.venueName} has been cancelled and removed.
    </p>
    ${
      isPaid
        ? `<div style="padding:14px 16px;border-radius:8px;background:#081421;border:1px solid rgba(34,181,115,0.4);margin-bottom:18px;">
            <p style="margin:0 0 6px 0;color:#22b573;font-weight:bold;">Full Refund Issued: ${refundDisplay}</p>
            <p style="margin:0;font-size:13px;color:${BRAND_CREAM};">
              We have automatically refunded <strong>${refundDisplay}</strong> (${payload.quantity} ${payload.quantity === 1 ? "ticket" : "tickets"}) back to your original payment method via Stripe. Depending on your bank, funds typically appear within 5&ndash;10 business days.
            </p>
          </div>`
        : `<p style="margin:0 0 16px 0;font-size:14px;">Your free pass (${payload.quantity} ${payload.quantity === 1 ? "ticket" : "tickets"}) has been cancelled automatically. No charge was made.</p>`
    }
    <p style="margin:0;font-size:13px;color:#5c6b7a;">If you have any questions, reply to this email or contact StarCast support at starcast.online.</p>
  `

  const subject = isPaid
    ? `Refund Issued (${refundDisplay}): ${payload.eventTitle} Cancelled`
    : `Event Cancelled: ${payload.eventTitle}`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject,
      html: shell(isPaid ? "Event Cancelled & Refund Issued" : "Event Cancelled", body),
    })
    if (error) {
      await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to: payload.to,
        subject,
        html: shell(isPaid ? "Event Cancelled & Refund Issued" : "Event Cancelled", body),
      })
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error sending event refund email:", err)
  }
}


