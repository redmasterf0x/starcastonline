import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboundEmails } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Webhook } from "svix";

export async function POST(req: Request) {
  try {
    const payloadString = await req.text();
    const headerPayload = req.headers;
    
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers");
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET || "");
    let evt: any;

    try {
      evt = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.log("Error verifying webhook:", err);
      return new Response("Error occured", {
        status: 400,
      });
    }

    const payload = evt;
    // Resend wraps the payload in `data` for email.received events
    const emailData = payload.type === 'email.received' ? payload.data : payload;

    const from = emailData.from || "Unknown";
    const subject = emailData.subject || "No Subject";
    const textBody = emailData.text || "";
    const htmlBody = emailData.html || "";

    // Ensure table exists
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

    await db.insert(inboundEmails).values({
      sender: from,
      subject: subject,
      textBody: textBody,
      htmlBody: htmlBody,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing inbound email webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
