import { getInboundEmails, saveInboundEmail, InboundEmailRecord } from "@/lib/firebase/firestore-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LifeBuoy, ArrowLeft, Mail, Clock, User, ShieldCheck, KeyRound, Sparkles } from "lucide-react"
import { SyncButton } from "./sync-button"
import { db } from "@/lib/db"
import { inboxMessages } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export interface DisplayEmail {
  id: string
  resendEmailId?: string
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  status: "open" | "in_progress" | "resolved"
  createdAt: string
  isVerification?: boolean
  verificationCode?: string
}

function extractVerificationCode(subject: string, text: string): string | undefined {
  const combined = `${subject}\n${text}`
  const match =
    combined.match(/code\s+is\s+([0-9a-zA-Z]{4,8})/i) ||
    combined.match(/verification\s+code[:\s]+([0-9a-zA-Z]{4,8})/i) ||
    combined.match(/\b([0-9]{5,6})\b/)
  return match ? match[1] : undefined
}

async function fetchAllInboundEmails(): Promise<DisplayEmail[]> {
  const emailMap = new Map<string, DisplayEmail>()
  const resendApiKey = process.env.RESEND_API_KEY

  // 1. Fetch directly from Resend Receiving API
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails/receiving", {
        headers: { Authorization: `Bearer ${resendApiKey}` },
        cache: "no-store",
      })

      if (res.ok) {
        const list = await res.json()
        const items = list.data || []

        // Fetch details for the top 15 emails in parallel
        await Promise.all(
          items.slice(0, 15).map(async (item: any) => {
            try {
              const detailRes = await fetch(`https://api.resend.com/emails/receiving/${item.id}`, {
                headers: { Authorization: `Bearer ${resendApiKey}` },
                cache: "no-store",
              })

              let sender = Array.isArray(item.from) ? item.from.join(", ") : item.from || "Unknown"
              let recipient = Array.isArray(item.to) ? item.to.join(", ") : item.to || "staff@starcast.online"
              let subject = item.subject || "Support Inquiry"
              let textBody = ""
              let htmlBody = ""

              if (detailRes.ok) {
                const detail = await detailRes.json()
                sender =
                  detail.headers?.from ||
                  detail.from ||
                  (Array.isArray(detail.from) ? detail.from.join(", ") : detail.from) ||
                  sender
                recipient =
                  detail.headers?.to ||
                  detail.to ||
                  (Array.isArray(detail.to) ? detail.to.join(", ") : detail.to) ||
                  recipient
                subject = detail.subject || subject
                textBody = detail.text || (detail.html ? detail.html.replace(/<[^>]*>?/gm, "").trim() : "")
                htmlBody = detail.html || ""
              }

              const vCode = extractVerificationCode(subject, textBody)

              emailMap.set(item.id, {
                id: item.id,
                resendEmailId: item.id,
                from: String(sender),
                to: String(recipient),
                subject: String(subject),
                text: String(textBody),
                html: String(htmlBody),
                status: "open",
                createdAt: item.created_at || new Date().toISOString(),
                isVerification: Boolean(vCode || subject.toLowerCase().includes("code") || subject.toLowerCase().includes("verif")),
                verificationCode: vCode,
              })

              // Persist to Postgres in the background
              try {
                const existing = await db
                  .select({ id: inboxMessages.id })
                  .from(inboxMessages)
                  .where(eq(inboxMessages.resendId, String(item.id)))
                  .limit(1)

                if (existing.length === 0) {
                  await db.insert(inboxMessages).values({
                    resendId: String(item.id),
                    fromEmail: String(sender),
                    fromName: String(sender).split("<")[0].trim().replace(/"/g, "") || null,
                    toEmail: String(recipient),
                    subject: String(subject),
                    body: String(textBody),
                    textBody: String(textBody),
                    htmlBody: htmlBody ? String(htmlBody) : null,
                    status: "unread",
                    isRead: false,
                    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
                  })
                }
              } catch {}

              // Also persist to Firestore if available
              saveInboundEmail({
                id: item.id,
                resendEmailId: item.id,
                from: String(sender),
                to: String(recipient),
                subject: String(subject),
                text: String(textBody),
                html: String(htmlBody),
                status: "open",
              }).catch(() => {})
            } catch (detailErr) {
              console.warn("[Support Detail Fetch Warning]:", detailErr)
            }
          })
        )
      }
    } catch (err) {
      console.warn("[Support Resend Fetch Warning]:", err)
    }
  }

  // 2. Merge Postgres inbox_messages table
  try {
    const dbRows = await db
      .select()
      .from(inboxMessages)
      .orderBy(desc(inboxMessages.createdAt))
      .limit(50)

    for (const row of dbRows) {
      const key = row.resendId || row.id
      if (!emailMap.has(key)) {
        const text = row.textBody || row.body || ""
        const subj = row.subject || "Support Inquiry"
        const vCode = extractVerificationCode(subj, text)

        emailMap.set(key, {
          id: row.id,
          resendEmailId: row.resendId || undefined,
          from: row.fromEmail || "Unknown",
          to: row.toEmail || "staff@starcast.online",
          subject: subj,
          text,
          html: row.htmlBody || undefined,
          status: (row.status as any) || "open",
          createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
          isVerification: Boolean(vCode || subj.toLowerCase().includes("code") || subj.toLowerCase().includes("verif")),
          verificationCode: vCode,
        })
      }
    }
  } catch (dbErr) {
    console.warn("[Support DB Fetch Warning]:", dbErr)
  }

  // 3. Merge Firestore inbound_emails collection
  try {
    const firestoreEmails = await getInboundEmails(50)
    for (const f of firestoreEmails) {
      const key = f.resendEmailId || f.id
      if (!emailMap.has(key)) {
        const text = f.text || ""
        const subj = f.subject || "Support Inquiry"
        const vCode = extractVerificationCode(subj, text)

        emailMap.set(key, {
          id: f.id,
          resendEmailId: f.resendEmailId,
          from: f.from,
          to: f.to,
          subject: subj,
          text,
          html: f.html,
          status: f.status,
          createdAt: typeof f.createdAt === "string" ? f.createdAt : new Date(f.createdAt).toISOString(),
          isVerification: Boolean(vCode || subj.toLowerCase().includes("code") || subj.toLowerCase().includes("verif")),
          verificationCode: vCode,
        })
      }
    }
  } catch (fsErr) {
    console.warn("[Support Firestore Fetch Warning]:", fsErr)
  }

  return Array.from(emailMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export default async function AdminSupportPage() {
  const emails = await fetchAllInboundEmails()

  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#20205a]/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ffd166] hover:text-[#ea6f2a] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea6f2a] to-[#ffd166] flex items-center justify-center text-[#05052d] shadow-lg shadow-[#ea6f2a]/20">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f7ff]">
                  Inbound Support Inbox
                </h1>
                <p className="text-sm text-[#9a9fc4]">
                  Live customer, sponsor &amp; system emails received at{" "}
                  <span className="text-[#ffd166] font-mono font-bold">staff@starcast.online</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SyncButton />
            <Link href="/admin">
              <Button variant="outline" className="border-[#20205a] text-[#d4d8ee] hover:bg-[#20205a]/60 bg-[#0c0c3f]/50">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Email Count & Connection Status */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#0c0c3f]/80 border border-[#20205a] text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[#ffd166] font-mono font-bold">RESEND RECEIVING ACTIVE</span>
            <span className="text-[#9a9fc4] hidden sm:inline">•</span>
            <span className="text-[#cbd0f2] hidden sm:inline">Multi-store live sync (Resend + Postgres + Firestore)</span>
          </div>
          <span className="font-mono text-[#20efe0] font-bold">
            {emails.length} {emails.length === 1 ? "Email" : "Emails"} Total
          </span>
        </div>

        {/* Email Cards List */}
        <div className="grid gap-5">
          {emails.length === 0 ? (
            <div className="text-center py-16 px-6 border border-[#20205a]/60 rounded-2xl bg-[#0c0c3f]/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#20205a]/50 text-[#ffd166] flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#f5f7ff]">No Support Emails Found</h3>
              <p className="text-sm text-[#9a9fc4] max-w-md mx-auto">
                When users, sponsors, or services email <span className="text-[#ffd166] font-mono">staff@starcast.online</span>, their messages will appear here immediately.
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <Card
                key={email.id}
                className={`overflow-hidden border transition-all hover:border-[#ea6f2a]/60 shadow-xl ${
                  email.isVerification
                    ? "border-[#ffd166]/60 bg-[#0c0c3f]/90"
                    : "border-[#20205a]/70 bg-[#0c0c3f]/80"
                }`}
              >
                <CardHeader className="bg-[#080838]/80 pb-4 border-b border-[#20205a]/60">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {email.isVerification && (
                          <Badge className="bg-[#ffd166] text-[#05052d] font-black text-[10px] uppercase tracking-wider gap-1">
                            <KeyRound className="w-3 h-3" /> VERIFICATION CODE
                          </Badge>
                        )}
                        <CardTitle className="text-lg sm:text-xl font-bold text-[#f5f7ff] truncate">
                          {email.subject || "No Subject"}
                        </CardTitle>
                      </div>

                      <CardDescription className="text-xs sm:text-sm text-[#9a9fc4] flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1.5 text-[#ffd166] font-medium">
                          <User className="w-3.5 h-3.5 text-[#9a9fc4]" />
                          From: {email.from}
                        </span>
                        <span className="text-white/20 hidden sm:inline">•</span>
                        <span className="text-[#20efe0] font-mono text-xs">
                          To: {email.to}
                        </span>
                        <span className="text-white/20 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 text-[#9a9fc4]">
                          <Clock className="w-3.5 h-3.5" />
                          {email.createdAt ? new Date(email.createdAt).toLocaleString() : "Recently"}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={
                          email.status === "open"
                            ? "bg-[#ea6f2a] text-white hover:bg-[#bc3f00] uppercase text-[10px] tracking-wider font-bold"
                            : "bg-[#20205a] text-[#9a9fc4] uppercase text-[10px] tracking-wider font-semibold"
                        }
                      >
                        {email.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-5 pb-6 space-y-4">
                  {/* Verification Code Callout Banner */}
                  {email.verificationCode && (
                    <div className="p-4 rounded-xl border border-[#ffd166]/50 bg-gradient-to-r from-[#ffd166]/15 via-[#0c0c3f] to-[#ea6f2a]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div>
                        <p className="text-[11px] font-mono uppercase font-bold text-[#ffd166]">
                          Extracted Verification Code
                        </p>
                        <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest mt-0.5 select-all">
                          {email.verificationCode}
                        </p>
                      </div>
                      <span className="text-xs text-[#cbd0f2] font-mono">
                        Copy and enter in verification prompt
                      </span>
                    </div>
                  )}

                  {/* Email text body */}
                  <div className="whitespace-pre-wrap text-sm text-[#d4d8ee] leading-relaxed font-normal bg-[#05052d]/60 p-4 rounded-xl border border-[#20205a]/40 font-mono">
                    {email.text || (email.html ? email.html.replace(/<[^>]*>?/gm, "").trim() : "No text body available.")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
