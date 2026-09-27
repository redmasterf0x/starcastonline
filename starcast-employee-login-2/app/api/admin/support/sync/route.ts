import { NextResponse } from "next/server";
import { saveInboundEmail } from "@/lib/firebase/firestore-service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY not set" }, { status: 400 });
    }

    // Fetch list from Resend Receiving API
    const res = await fetch("https://api.resend.com/emails/receiving", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    });
    
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: errText }, { status: 500 });
    }

    const list = await res.json();
    const items = list.data || [];
    let syncedCount = 0;

    for (const item of items) {
      // Fetch email details
      const detailRes = await fetch(`https://api.resend.com/emails/receiving/${item.id}`, {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const sender = detail.headers?.from || detail.from || (Array.isArray(item.from) ? item.from.join(", ") : item.from) || "Unknown";
        const subject = detail.subject || item.subject || "Support Inquiry";
        const textBody = detail.text || (detail.html ? detail.html.replace(/<[^>]*>?/gm, "").trim() : "");
        const htmlBody = detail.html || "";

        await saveInboundEmail({
          id: item.id,
          resendEmailId: item.id,
          from: String(sender),
          to: "support@starcast.online",
          subject: String(subject),
          text: String(textBody),
          html: String(htmlBody),
          status: "open",
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error("[Support Sync Error]:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
