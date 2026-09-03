export type SendSmsResult = { ok: true; sid?: string } | { ok: false; skipped?: boolean; error?: string }

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  )
}

/**
 * Send an SMS via Twilio. Includes a StatusCallback so Twilio POSTs delivery
 * receipts back to /api/webhooks/twilio-status on this app.
 */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (!isSmsConfigured()) {
    console.log("[sms] sendSms skipped — Twilio env vars not set ->", to)
    return { ok: false, skipped: true }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_FROM_NUMBER!

  // Build the status-callback URL from the public app URL if available.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || process.env.VERCEL_URL
  const statusCallback = appUrl
    ? `https://${appUrl.replace(/^https?:\/\//, "")}/api/webhooks/twilio-status`
    : undefined

  const params: Record<string, string> = { To: to, From: from, Body: body }
  if (statusCallback) params.StatusCallback = statusCallback

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    console.log("[sms] Twilio error", res.status, text)
    return { ok: false, error: `Twilio ${res.status}: ${text}` }
  }

  const json = await res.json()
  console.log("[sms] sent ->", to, "sid:", json.sid)
  return { ok: true, sid: json.sid }
}
