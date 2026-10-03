"use server"

import { db } from "@/lib/db"
import { profiles, inboxMessages } from "@/lib/db/schema"
import { eq, desc, or, ilike, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
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
  repliedAt: string | null
  createdAt: string
}

export interface StaffMailboxData {
  staffEmail: string
  staffName: string
  messages: StaffInboxMessageItem[]
  unreadCount: number
}

async function getStaffViewer() {
  const viewer = await requireStaff()

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, viewer.userId))
    .limit(1)

  if (!profile) throw new Error("Profile not found")

  return { profile, perms: viewer }
}

/**
 * Get all messages in the authenticated staff member's official inbox.
 */
export async function getStaffMailbox(): Promise<StaffMailboxData> {
  const { profile, perms } = await getStaffViewer()

  const staffEmail =
    profile.staffEmail?.trim().toLowerCase() ||
    `${(profile.firstName || profile.username || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}.staff@starcast.online`

  // Fetch messages directed to this staff profile or their staff email
  const conditions = [
    eq(inboxMessages.staffProfileId, profile.id),
    ilike(inboxMessages.toEmail, `%${staffEmail}%`),
  ]

  // If user has firstName, also check for their handle variant
  if (profile.firstName) {
    const handle = profile.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    conditions.push(ilike(inboxMessages.toEmail, `%${handle}@starcast.online%`))
    conditions.push(ilike(inboxMessages.toEmail, `%${handle}.staff@starcast.online%`))
  }

  const rows = await db
    .select()
    .from(inboxMessages)
    .where(or(...conditions))
    .orderBy(desc(inboxMessages.createdAt))

  const messages: StaffInboxMessageItem[] = rows.map((m) => ({
    id: m.id,
    resendId: m.resendId,
    fromEmail: m.fromEmail || "Unknown Sender",
    fromName: m.fromName,
    toEmail: m.toEmail || staffEmail,
    subject: m.subject || "(No Subject)",
    textBody: m.textBody || m.body || "",
    htmlBody: m.htmlBody,
    isRead: m.isRead,
    status: m.status || (m.isRead ? "read" : "unread"),
    repliedAt: m.repliedAt ? m.repliedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  }))

  const unreadCount = messages.filter((m) => !m.isRead).length
  const staffName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || "Staff Member"

  return {
    staffEmail,
    staffName,
    messages,
    unreadCount,
  }
}

/**
 * Mark a message as read by the staff member.
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
 * Reply to an email from the staff member's official inbox.
 */
export async function replyToStaffMessage({
  messageId,
  replyText,
}: {
  messageId: string
  replyText: string
}) {
  const { profile } = await getStaffViewer()

  if (!replyText || !replyText.trim()) {
    throw new Error("Reply content cannot be empty")
  }

  const [msg] = await db
    .select()
    .from(inboxMessages)
    .where(eq(inboxMessages.id, messageId))
    .limit(1)

  if (!msg) throw new Error("Message not found")
  if (!msg.fromEmail) throw new Error("Recipient address not found")

  const staffEmail =
    profile.staffEmail?.trim().toLowerCase() ||
    `${(profile.firstName || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}.staff@starcast.online`

  const senderName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "StarCast Staff"
  const replySubject = msg.subject?.startsWith("Re:") ? msg.subject : `Re: ${msg.subject || "Inquiry"}`

  const formattedHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 15px;">
      <p style="white-space: pre-wrap;">${replyText.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      <br/>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <div style="color: #64748b; font-size: 13px;">
        <strong>${senderName}</strong><br/>
        StarCast Media Network &bull; Production Staff<br/>
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
        text: replyText.trim(),
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
