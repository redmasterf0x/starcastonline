"use server"

import { db } from "@/lib/db"
import { profiles, inboxMessages } from "@/lib/db/schema"
import { eq, desc, or, ilike } from "drizzle-orm"
import { requireStaff } from "@/lib/permissions"
import { resend } from "@/lib/email"

export interface StaffInboxMessageItem {
  id: string
  resendId: string | null
  fromEmail: string
  fromName: string | null
  toEmail: string
  subject: string
  textBody: string
  htmlBody: string | null
  isRead: boolean
  status: string
  direction: "inbound" | "outbound"
  repliedAt: string | null
  createdAt: string
}

export interface StaffMailboxData {
  staffEmail: string
  staffName: string
  messages: StaffInboxMessageItem[]
  unreadCount: number
  sentCount: number
}

function sanitizeEmailHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .trim()
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function textToCleanHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const escaped = para
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
      return escaped ? `<p>${escaped}</p>` : ""
    })
    .filter(Boolean)
    .join("")
}

async function getStaffViewer() {
  const viewer = await requireStaff()

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, viewer.userId))
    .limit(1)

  if (!profile) throw new Error("Profile not found")

  let resolvedStaffEmail = profile.staffEmail?.trim().toLowerCase() || ""
  if (!resolvedStaffEmail) {
    const baseHandle =
      (profile.firstName || profile.username || "staff")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "staff"
    let candidate = `${baseHandle}.staff@starcast.online`

    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.staffEmail, candidate))
      .limit(1)

    if (existing.length > 0 && existing[0].id !== profile.id) {
      candidate = `${baseHandle}.${profile.id.slice(0, 4)}.staff@starcast.online`
    }

    await db
      .update(profiles)
      .set({ staffEmail: candidate })
      .where(eq(profiles.id, profile.id))

    resolvedStaffEmail = candidate
  }

  return { profile, perms: viewer, staffEmail: resolvedStaffEmail }
}

/**
 * Get all messages in the authenticated staff / production member's official inbox & sent box.
 */
export async function getStaffMailbox(): Promise<StaffMailboxData> {
  const { profile, staffEmail } = await getStaffViewer()

  const conditions = [
    eq(inboxMessages.staffProfileId, profile.id),
    ilike(inboxMessages.toEmail, `%${staffEmail}%`),
    ilike(inboxMessages.fromEmail, `%${staffEmail}%`),
  ]

  if (profile.firstName) {
    const handle = profile.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    if (handle) {
      conditions.push(ilike(inboxMessages.toEmail, `%${handle}@starcast.online%`))
      conditions.push(ilike(inboxMessages.toEmail, `%${handle}.staff@starcast.online%`))
    }
  }

  const rows = await db
    .select()
    .from(inboxMessages)
    .where(or(...conditions))
    .orderBy(desc(inboxMessages.createdAt))

  const messages: StaffInboxMessageItem[] = rows.map((m) => {
    const isOutbound =
      m.status === "sent" ||
      (m.fromEmail?.toLowerCase().includes(staffEmail) ?? false)

    return {
      id: m.id,
      resendId: m.resendId,
      fromEmail: m.fromEmail || "Unknown Sender",
      fromName: m.fromName,
      toEmail: m.toEmail || staffEmail,
      subject: m.subject || "(No Subject)",
      textBody: m.textBody || m.body || "",
      htmlBody: m.htmlBody,
      isRead: isOutbound ? true : m.isRead,
      status: m.status || (m.isRead ? "read" : "unread"),
      direction: isOutbound ? "outbound" : "inbound",
      repliedAt: m.repliedAt ? m.repliedAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }
  })

  const unreadCount = messages.filter((m) => m.direction === "inbound" && !m.isRead).length
  const sentCount = messages.filter((m) => m.direction === "outbound").length
  const staffName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username ||
    "Production Staff"

  return {
    staffEmail,
    staffName,
    messages,
    unreadCount,
    sentCount,
  }
}

/**
 * Mark a message as read by the staff/production member.
 */
export async function markStaffMessageRead(messageId: string) {
  await getStaffViewer()
  await db
    .update(inboxMessages)
    .set({ isRead: true, status: "read" })
    .where(eq(inboxMessages.id, messageId))
  return { success: true }
}

/**
 * Compose and send a brand-new email from the staff / production member's official inbox.
 */
export async function sendNewStaffEmail({
  toEmail,
  ccEmail,
  subject,
  htmlBody,
  textBody,
}: {
  toEmail: string
  ccEmail?: string
  subject: string
  htmlBody?: string
  textBody: string
}) {
  const { profile, staffEmail } = await getStaffViewer()

  const recipients = toEmail
    .split(/[,;]+/)
    .map((e) => e.trim())
    .filter(Boolean)

  if (recipients.length === 0 || recipients.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
    throw new Error("Please enter at least one valid recipient email address.")
  }

  const ccRecipients = (ccEmail || "")
    .split(/[,;]+/)
    .map((e) => e.trim())
    .filter(Boolean)

  if (ccRecipients.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
    throw new Error("One or more CC email addresses are invalid.")
  }

  const cleanSubject = subject.trim()
  if (!cleanSubject) {
    throw new Error("Subject line cannot be empty.")
  }

  const cleanHtml = htmlBody ? sanitizeEmailHtml(htmlBody) : ""
  const cleanText = (textBody || stripHtmlToText(cleanHtml)).trim()

  if (!cleanText && !cleanHtml) {
    throw new Error("Message body cannot be empty.")
  }

  const senderName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username ||
    "StarCast Staff"

  const bodyHtmlContent = cleanHtml || textToCleanHtml(cleanText)

  const formattedHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.65; font-size: 15px; max-width: 680px;">
      <div>${bodyHtmlContent}</div>
      <br/>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <div style="color: #64748b; font-size: 13px;">
        <strong style="color: #0f172a;">${senderName}</strong><br/>
        StarCast Media Network &bull; Production &amp; Staff<br/>
        <span style="color: #475569;">${staffEmail}</span> &bull;
        <a href="https://starcast.online" style="color: #ea6f2a; text-decoration: none;">starcast.online</a>
      </div>
    </div>
  `

  let resendId: string | null = null
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `${senderName} <noreply@starcast.online>`,
        replyTo: staffEmail,
        to: recipients.length === 1 ? recipients[0] : recipients,
        ...(ccRecipients.length > 0 ? { cc: ccRecipients } : {}),
        subject: cleanSubject,
        text: cleanText,
        html: formattedHtml,
      })
      resendId = result?.data?.id ?? null
    } catch (err: any) {
      console.error("[Resend Compose Error]:", err)
      throw new Error(`Failed to send email: ${err?.message || "Unknown error"}`)
    }
  }

  await db.insert(inboxMessages).values({
    resendId,
    fromEmail: staffEmail,
    fromName: senderName,
    toEmail: recipients.join(", "),
    subject: cleanSubject,
    body: cleanText,
    textBody: cleanText,
    htmlBody: bodyHtmlContent,
    isRead: true,
    status: "sent",
    staffProfileId: profile.id,
  })

  return { success: true }
}

/**
 * Reply to an email from the staff/production member's official inbox.
 */
export async function replyToStaffMessage({
  messageId,
  replyText,
  replyHtml,
}: {
  messageId: string
  replyText: string
  replyHtml?: string
}) {
  const { profile, staffEmail } = await getStaffViewer()

  const cleanHtml = replyHtml ? sanitizeEmailHtml(replyHtml) : ""
  const cleanText = (replyText || stripHtmlToText(cleanHtml)).trim()

  if (!cleanText && !cleanHtml) {
    throw new Error("Reply content cannot be empty")
  }

  const [msg] = await db
    .select()
    .from(inboxMessages)
    .where(eq(inboxMessages.id, messageId))
    .limit(1)

  if (!msg) throw new Error("Message not found")
  if (!msg.fromEmail) throw new Error("Recipient address not found")

  const senderName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "StarCast Staff"
  const replySubject = msg.subject?.startsWith("Re:")
    ? msg.subject
    : `Re: ${msg.subject || "Inquiry"}`

  const bodyHtmlContent = cleanHtml || textToCleanHtml(cleanText)

  const formattedHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.65; font-size: 15px;">
      <div>${bodyHtmlContent}</div>
      <br/>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <div style="color: #64748b; font-size: 13px;">
        <strong style="color: #0f172a;">${senderName}</strong><br/>
        StarCast Media Network &bull; Production &amp; Staff<br/>
        <span style="color: #475569;">${staffEmail}</span> &bull;
        <a href="https://starcast.online" style="color: #ea6f2a; text-decoration: none;">starcast.online</a>
      </div>
      <br/>
      <blockquote style="margin: 20px 0 0 0; padding-left: 12px; border-left: 3px solid #cbd5e1; color: #64748b; font-size: 13px;">
        <p><strong>On ${new Date(msg.createdAt).toLocaleDateString()}, ${msg.fromEmail} wrote:</strong></p>
        <p style="white-space: pre-wrap;">${(msg.textBody || msg.body || "").slice(0, 500)}</p>
      </blockquote>
    </div>
  `

  if (resend) {
    try {
      await resend.emails.send({
        from: `${senderName} <noreply@starcast.online>`,
        replyTo: staffEmail,
        to: msg.fromEmail,
        subject: replySubject,
        text: cleanText,
        html: formattedHtml,
      })
    } catch (err: any) {
      console.error("[Resend Reply Error]:", err)
      throw new Error(`Failed to send reply email: ${err?.message || "Unknown error"}`)
    }
  }

  await db
    .update(inboxMessages)
    .set({
      isRead: true,
      status: "replied",
      repliedAt: new Date(),
    })
    .where(eq(inboxMessages.id, messageId))

  return { success: true }
}

/**
 * Delete a message from staff inbox.
 */
export async function deleteStaffMessage(messageId: string) {
  await getStaffViewer()
  await db.delete(inboxMessages).where(eq(inboxMessages.id, messageId))
  return { success: true }
}

function smartPolishFallback(rawText: string, senderName: string): { html: string; text: string } {
  let polished = rawText.trim()

  const replacements: Array<[RegExp, string]> = [
    [/\bu\b/gi, "you"],
    [/\bur\b/gi, "your"],
    [/\br\b/gi, "are"],
    [/\bpls\b|\bplz\b/gi, "please"],
    [/\bthx\b|\btks\b/gi, "thank you"],
    [/\bwanna\b/gi, "would like to"],
    [/\bgonna\b/gi, "going to"],
    [/\bgotta\b/gi, "need to"],
    [/\bkind of\b|\bkinda\b/gi, "somewhat"],
    [/\blmk\b/gi, "please let me know"],
    [/\basap\b/gi, "at your earliest convenience"],
    [/\bfyi\b/gi, "for your reference"],
    [/\bbtw\b/gi, "additionally"],
    [/\bidk\b/gi, "I am currently confirming"],
    [/\bi'm\b|\bim\b/gi, "I am"],
    [/\bdont\b/gi, "do not"],
    [/\bcant\b/gi, "cannot"],
    [/\bwont\b/gi, "will not"],
  ]

  for (const [pattern, replacement] of replacements) {
    polished = polished.replace(pattern, replacement)
  }

  // Capitalize standalone "i" and first character of sentences
  polished = polished.replace(/\bi\b/g, "I")
  polished = polished.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (m) => m.toUpperCase())

  // Ensure ending punctuation
  if (polished && !/[.!?]$/.test(polished)) {
    polished += "."
  }

  const hasGreeting = /^(hi|hello|dear|good\s+(morning|afternoon|evening)|greetings)/i.test(polished)
  const hasSignOff = /(best|regards|sincerely|thank you|thanks|warmly)[,\s]*$/i.test(polished)

  const lines: string[] = []
  if (!hasGreeting) {
    lines.push("Hello,")
  }
  lines.push(polished)
  if (!hasSignOff) {
    lines.push(`Thank you for your time and collaboration.\n\nBest regards,\n${senderName}`)
  }

  const finalText = lines.join("\n\n")
  return {
    text: finalText,
    html: textToCleanHtml(finalText),
  }
}

/**
 * AI "Make Me Sound Smart" rewording endpoint for Staff & Production Mailbox.
 */
export async function rewordStaffMessageWithAi({
  text,
  contextSubject,
  tone = "executive",
}: {
  text: string
  contextSubject?: string
  tone?: "executive" | "friendly" | "concise"
}): Promise<{
  rewrittenHtml: string
  rewrittenText: string
  provider: "gemini" | "openai" | "local-polish"
}> {
  const { profile } = await getStaffViewer()
  const senderName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "StarCast Staff"

  const cleanInput = text.trim()
  if (!cleanInput) {
    throw new Error("Write a draft or a few bullet points first, then click Make me sound smart.")
  }

  const toneInstruction =
    tone === "concise"
      ? "Be crisp, direct, and concise while sounding polished and executive."
      : tone === "friendly"
      ? "Sound warm, articulate, collaborative, and polished."
      : "Sound articulate, intelligent, polished, and executive-ready without being stiff or robotic."

  const systemPrompt = [
    `You are an elite executive communications editor at StarCast Media Network writing on behalf of ${senderName}.`,
    `Rewrite the user's draft email so it sounds clear, articulate, persuasive, and smart. ${toneInstruction}`,
    `Preserve every fact, name, date, number, link, and core intent accurately—do not invent details.`,
    contextSubject ? `Email Subject context: "${contextSubject}"` : "",
    `Return ONLY valid JSON with two keys: "html" (clean semantic HTML using <p>, <strong>, <ul>, <li>, <br/> only—no markdown code fences) and "text" (the plain-text equivalent).`,
  ]
    .filter(Boolean)
    .join("\n")

  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: cleanInput }] }],
            generationConfig: {
              temperature: 0.55,
              responseMimeType: "application/json",
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const rawOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        if (rawOut) {
          const parsed = JSON.parse(rawOut)
          const html = sanitizeEmailHtml(String(parsed.html || ""))
          const plain = String(parsed.text || stripHtmlToText(html)).trim()
          if (html || plain) {
            return {
              rewrittenHtml: html || textToCleanHtml(plain),
              rewrittenText: plain || stripHtmlToText(html),
              provider: "gemini",
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Gemini Reword Fallback Triggered]:", err)
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY || ""
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.55,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: cleanInput },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawOut = data?.choices?.[0]?.message?.content || ""
        if (rawOut) {
          const parsed = JSON.parse(rawOut)
          const html = sanitizeEmailHtml(String(parsed.html || ""))
          const plain = String(parsed.text || stripHtmlToText(html)).trim()
          if (html || plain) {
            return {
              rewrittenHtml: html || textToCleanHtml(plain),
              rewrittenText: plain || stripHtmlToText(html),
              provider: "openai",
            }
          }
        }
      }
    } catch (err) {
      console.warn("[OpenAI Reword Fallback Triggered]:", err)
    }
  }

  const fallback = smartPolishFallback(cleanInput, senderName)
  return {
    rewrittenHtml: fallback.html,
    rewrittenText: fallback.text,
    provider: "local-polish",
  }
}
