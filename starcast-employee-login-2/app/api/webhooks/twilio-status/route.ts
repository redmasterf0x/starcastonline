import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Twilio Status Callback webhook.
 *
 * Twilio POSTs here after each message delivery attempt.
 * MessageStatus values: queued | sending | sent | delivered | undelivered | failed
 *
 * To register this URL in Twilio:
 * 1. Go to console.twilio.com → Phone Numbers → Manage → Active Numbers
 * 2. Click your sender number
 * 3. Under "Messaging" → "A Message Comes In" — you can optionally set this URL here too
 * 4. More reliably: pass StatusCallback in the API call (already done in lib/sms.ts)
 *
 * Webhook URL to paste in Twilio:
 *   https://<your-domain>/api/webhooks/twilio-status
 */

function twilioSignatureValid(req: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false

  const twilioSig = req.headers.get("x-twilio-signature")
  if (!twilioSig) return false

  // Reconstruct the full URL Twilio signed.
  const url = req.url

  // Twilio signature = HMAC-SHA1 of (url + sorted params concatenated)
  const params = Object.fromEntries(new URLSearchParams(body))
  const sortedKeys = Object.keys(params).sort()
  const signingStr = url + sortedKeys.map((k) => k + params[k]).join("")

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(signingStr)
    .digest("base64")

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(twilioSig))
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Validate Twilio signature in production.
  if (process.env.NODE_ENV === "production") {
    if (!twilioSignatureValid(req, body)) {
      console.log("[twilio-webhook] invalid signature — rejected")
      return new NextResponse("Forbidden", { status: 403 })
    }
  }

  const params = Object.fromEntries(new URLSearchParams(body))
  const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = params

  console.log("[twilio-webhook] status update:", {
    MessageSid,
    MessageStatus,
    To,
    ErrorCode: ErrorCode || null,
    ErrorMessage: ErrorMessage || null,
  })

  // Logs are sufficient to confirm delivery in Vercel's log drain.
  // Extend this to write to an sms_logs table in Neon if needed.
  if (MessageStatus === "failed" || MessageStatus === "undelivered") {
    console.log(
      `[twilio-webhook] DELIVERY FAILURE — to: ${To}, sid: ${MessageSid}, ` +
        `code: ${ErrorCode}, msg: ${ErrorMessage}`,
    )
  }

  // Twilio expects a 200 (empty body or TwiML). We return empty 200.
  return new NextResponse(null, { status: 200 })
}
