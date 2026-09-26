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
        const verified = wh.verify(payloadString, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
        payload = typeof verified === "string" ? JSON.parse(verified) : verified;
      } catch (err: any) {
        console.error("[Webhook Svix Verify Error]:", err?.message);
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

    // Double check if payload was double-stringified
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {}
    }

    // Extract Resend email data structure
    const data = payload?.data || payload || {};

    // 1. Sender extraction
    let sender =
      data.from ||
      data.sender ||
      data.from_email ||
      data.headers?.from ||
      data.headers?.From ||
      payload.from ||
      payload.sender ||
      "";

    if (Array.isArray(sender)) {
      sender = sender.join(", ");
    } else if (typeof sender === "object" && sender !== null) {
      sender = sender.email || sender.address || sender.name || JSON.stringify(sender);
    }

    if (!sender || sender === "Unknown") {
      sender = data.envelope?.from || "staff@starcast.online inquiry";
    }

    // 2. Subject extraction
    let subject =
      data.subject ||
      data.headers?.subject ||
      data.headers?.Subject ||
      payload.subject ||
      "";

    if (!subject) {
      subject = "Support Request";
    }

    // 3. Body extraction
    let textBody =
      data.text ||
      data.text_body ||
      data.plain ||
      data.body ||
      data.content ||
      data.message ||
      data.snippet ||
      payload.text ||
      payload.body ||
      "";

    const htmlBody =
      data.html ||
      data.html_body ||
      data.body_html ||
      payload.html ||
      "";

    // If textBody is empty but we have payload data, format readable summary
    if (!textBody && htmlBody) {
      // Strip HTML tags for clean text fallback
      textBody = htmlBody.replace(/<[^>]*>?/gm, "").trim();
    }

    if (!textBody && !htmlBody) {
      textBody = typeof data === "object" ? JSON.stringify(data, null, 2) : payloadString;
    }

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
      sender: String(sender),
      subject: String(subject),
      textBody: String(textBody),
      htmlBody: String(htmlBody),
    });

    console.log("[Webhook Success]: Stored email from", sender, "with subject:", subject);
    return NextResponse.json({ success: true, message: "Email recorded successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Critical Error]:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}


