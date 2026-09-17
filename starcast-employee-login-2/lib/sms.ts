export type SendSmsResult = { ok: true; sid?: string } | { ok: false; skipped?: boolean; error?: string }

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_VERIFY_SERVICE_SID)
  )
}

export function isVerifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  )
}

/**
 * Send an OTP code via Twilio Verify V2 API.
 */
export async function sendTwilioVerification(to: string): Promise<{ ok: boolean; error?: string }> {
  if (!isVerifyConfigured()) {
    return { ok: false, error: "Twilio Verify service not configured" }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!

  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Channel: "sms" }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.warn("[Twilio Verify] Send error:", res.status, text)
      return { ok: false, error: text }
    }

    return { ok: true }
  } catch (err: any) {
    console.error("[Twilio Verify] Exception in sendTwilioVerification:", err)
    return { ok: false, error: err?.message }
  }
}

/**
 * Validate an OTP code via Twilio Verify V2 API.
 */
export async function checkTwilioVerification(to: string, code: string): Promise<{ ok: boolean; approved: boolean; error?: string }> {
  if (!isVerifyConfigured()) {
    return { ok: false, approved: false, error: "Twilio Verify service not configured" }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!

  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Code: code.trim() }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.warn("[Twilio Verify] Check error:", res.status, text)
      return { ok: false, approved: false, error: text }
    }

    const json = await res.json()
    const approved = json.status === "approved"
    return { ok: true, approved }
  } catch (err: any) {
    console.error("[Twilio Verify] Exception in checkTwilioVerification:", err)
    return { ok: false, approved: false, error: err?.message }
  }
}

/**
 * Send an SMS via Twilio Programmable Messaging. Includes a StatusCallback so Twilio POSTs delivery
 * receipts back to /api/webhooks/twilio-status on this app.
 */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
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
