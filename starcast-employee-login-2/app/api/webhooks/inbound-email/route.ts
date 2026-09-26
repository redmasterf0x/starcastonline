import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboundEmails } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend wraps the payload in `data` for email.received events
    const emailData = payload.type === 'email.received' ? payload.data : payload;

    const from = emailData.from || "Unknown";
    const subject = emailData.subject || "No Subject";
    const textBody = emailData.text || "";
    const htmlBody = emailData.html || "";

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
