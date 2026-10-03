import { NextResponse } from "next/server";
import { saveInboundEmail } from "@/lib/firebase/firestore-service";
import { db } from "@/lib/db";
import { profiles, inboxMessages } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";
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

    let payload: any = {};

    if (svix_id && svix_timestamp && svix_signature) {
      try {
        const wh = new Webhook(secret);
        const verified = wh.verify(payloadString, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
        payload = typeof verified === "string" ? JSON.parse(verified) : (verified || {});
      } catch (err: any) {
        console.warn("[Webhook Svix Verify Warning]:", err?.message);
        try {
          payload = JSON.parse(payloadString);
        } catch {
          payload = { raw: payloadString };
        }
      }
    } else {
      try {
        payload = JSON.parse(payloadString);
      } catch {
        payload = { raw: payloadString };
      }
    }

    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = { raw: payload };
      }
    }

    if (!payload || typeof payload !== "object") {
      payload = {};
    }

    // Extract Resend email data structure
    const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) || {};

    // 1. Sender extraction
    let sender =
      data?.from ||
      data?.sender ||
      data?.from_email ||
      data?.headers?.from ||
      data?.headers?.From ||
      payload?.from ||
      payload?.sender ||
      "";

    if (Array.isArray(sender)) {
      sender = sender.join(", ");
    } else if (typeof sender === "object" && sender !== null) {
      sender = sender.email || sender.address || sender.name || JSON.stringify(sender);
    }

    // 2. Recipient extraction
    let recipient =
      data?.to ||
      data?.recipient ||
      data?.headers?.to ||
      data?.headers?.To ||
      payload?.to ||
      "";

    if (Array.isArray(recipient)) {
      recipient = recipient.join(", ");
    } else if (typeof recipient === "object" && recipient !== null) {
      recipient = recipient.email || recipient.address || JSON.stringify(recipient);
    }

    // 3. Subject extraction
    let subject =
      data?.subject ||
      data?.headers?.subject ||
      data?.headers?.Subject ||
      payload?.subject ||
      "";

    // 4. Body extraction
    let textBody =
      data?.text ||
      data?.text_body ||
      data?.plain ||
      data?.body ||
      data?.content ||
      data?.message ||
      data?.snippet ||
      payload?.text ||
      payload?.body ||
      "";

    let htmlBody =
      data?.html ||
      data?.html_body ||
      data?.body_html ||
      payload?.html ||
      "";

    // 5. Auto-fetch full email details from Resend Receiving API if email_id is present
    const emailId = data?.email_id || data?.id || payload?.email_id || payload?.id;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (emailId && resendApiKey) {
      try {
        const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        });
        if (res.ok) {
          const resendDoc = await res.json();
          if (resendDoc && typeof resendDoc === "object") {
            if (resendDoc.headers?.from) {
              sender = String(resendDoc.headers.from);
            } else if (resendDoc.from) {
              sender = Array.isArray(resendDoc.from) ? resendDoc.from.join(", ") : String(resendDoc.from);
            }
            if (resendDoc.headers?.to) {
              recipient = String(resendDoc.headers.to);
            } else if (resendDoc.to) {
              recipient = Array.isArray(resendDoc.to) ? resendDoc.to.join(", ") : String(resendDoc.to);
            }
            if (resendDoc.subject) {
              subject = String(resendDoc.subject);
            }
            if (resendDoc.text) {
              textBody = String(resendDoc.text);
            }
            if (resendDoc.html) {
              htmlBody = String(resendDoc.html);
            }
          }
        }
      } catch (fetchErr) {
        console.warn("[Resend Receiving API fetch warning]:", fetchErr);
      }
    }

    if (!sender) {
      sender = "Inquirer";
    }

    if (!recipient) {
      recipient = "support@starcast.online";
    }

    if (!subject) {
      subject = "Message for Staff";
    }

    if (!textBody && htmlBody) {
      textBody = htmlBody.replace(/<[^>]*>?/gm, "").trim();
    }

    if (!textBody && !htmlBody) {
      textBody = typeof data === "object" ? JSON.stringify(data, null, 2) : payloadString;
    }

    // Match recipient to staff member profile in Postgres
    let staffProfileId: string | null = null;
    try {
      const cleanRecipient = String(recipient).toLowerCase().trim();
      const matchedProfiles = await db
        .select({ id: profiles.id, staffEmail: profiles.staffEmail, firstName: profiles.firstName })
        .from(profiles)
        .where(
          or(
            eq(profiles.staffEmail, cleanRecipient),
            ilike(profiles.staffEmail, `%${cleanRecipient}%`)
          )
        )
        .limit(1);

      if (matchedProfiles.length > 0) {
        staffProfileId = matchedProfiles[0].id;
      }
    } catch (matchErr) {
      console.warn("[Staff Match Lookup Warning]:", matchErr);
    }

    // 1. Store in Postgres inbox_messages (for Staff Mailbox)
    try {
      await db.insert(inboxMessages).values({
        resendId: emailId ? String(emailId) : null,
        fromEmail: String(sender),
        fromName: String(sender).split("<")[0].trim().replace(/"/g, "") || null,
        toEmail: String(recipient),
        subject: String(subject),
        body: String(textBody),
        textBody: String(textBody),
        htmlBody: htmlBody ? String(htmlBody) : null,
        staffProfileId: staffProfileId || undefined,
        status: "unread",
        isRead: false,
      });
    } catch (dbErr) {
      console.warn("[Postgres inbox_messages Insert Warning]:", dbErr);
    }

    // 2. Save to Cloud Firestore (for Admin Support Inbox)
    const docId = await saveInboundEmail({
      resendEmailId: emailId,
      from: String(sender),
      to: String(recipient),
      subject: String(subject),
      text: String(textBody),
      html: String(htmlBody),
      status: "open",
    });

    console.log("[Webhook Success]: Stored email in DB & Firestore [", docId, "] from", sender, "to", recipient);
    return NextResponse.json({ success: true, message: "Email recorded successfully", id: docId }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Critical Error]:", error);
    return NextResponse.json({ 
      success: true,
      message: "Handled with fallback",
      error: error?.message || String(error) 
    }, { status: 200 });
  }
}
