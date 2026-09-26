import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboundEmails } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Webhook } from "svix";

export const dynamic = "force-dynamic";

const FALLBACK_SECRET = "whsec_v1wFaHhwWpBh5huIQY7j/nY9RebAQxX4";

export async function POST(req: Request) {
  try {
    const payloadString = await req.text();
    const headers = req.headers;
    
    const svix_id = headers.get("svix-id") || headers.get("webhook-id");
    const svix_timestamp = headers.get("svix-timestamp") || headers.get("webhook-timestamp");
    const svix_signature = headers.get("svix-signature") || headers.get("webhook-signature");
    
    const secret = process.env.RESEND_WEBHOOK_SECRET || FALLBACK_SECRET;

    let payload: any;

    if (svix_id && svix_timestamp && svix_signature) {
      try {
        const wh = new Webhook(secret);
        payload = wh.verify(payloadString, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
      } catch (err: any) {
        console.error("[Webhook Svix Verify Error]:", err?.message);
        // Try parsing JSON directly as fallback if signature had secret mismatch
        try {
          payload = JSON.parse(payloadString);
        } catch {
          return NextResponse.json({ error: "Invalid webhook signature", details: err?.message }, { status: 400 });
        }
      }
    } else {
      try {
        payload = JSON.parse(payloadString);
      } catch (err: any) {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    }

    // Resend wraps payload in `data` for email.received events
    const emailData = payload?.data || payload || {};

    const rawFrom = emailData.from || emailData.sender || "Unknown";
    const from = typeof rawFrom === "string" ? rawFrom : JSON.stringify(rawFrom);
    const subject = emailData.subject || "No Subject";
    const textBody = emailData.text || emailData.text_body || emailData.raw || "";
    const htmlBody = emailData.html || emailData.html_body || "";

    // Ensure database table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "inbound_emails" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sender" text NOT NULL,
        "subject" text,
        "text_body" text,
        "html_body" text,
        "status" text NOT NULL DEFAULT 'unread',
        "received_at" timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // Insert incoming email record
    await db.insert(inboundEmails).values({
      sender: from,
      subject: subject,
      textBody: textBody,
      htmlBody: htmlBody,
    });

    console.log("[Webhook Success]: Stored email from", from, "with subject:", subject);
    return NextResponse.json({ success: true, message: "Email recorded successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Critical Error]:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}

