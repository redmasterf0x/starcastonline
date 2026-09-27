import { getInboundEmails, saveInboundEmail, InboundEmailRecord } from "@/lib/firebase/firestore-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LifeBuoy, ArrowLeft, Mail, Clock, User, ShieldCheck } from "lucide-react"
import { SyncButton } from "./sync-button"

export const dynamic = "force-dynamic"

async function autoSyncFromResend() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) return

    // Fetch recent received emails from Resend Receiving API
    const res = await fetch("https://api.resend.com/emails/receiving", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
      cache: "no-store",
    })

    if (res.ok) {
      const list = await res.json()
      const items = list.data || []

      for (const item of items) {
        const detailRes = await fetch(`https://api.resend.com/emails/receiving/${item.id}`, {
          headers: { Authorization: `Bearer ${resendApiKey}` },
          cache: "no-store",
        })

        if (detailRes.ok) {
          const detail = await detailRes.json()
          const sender =
            detail.headers?.from ||
            detail.from ||
            (Array.isArray(item.from) ? item.from.join(", ") : item.from) ||
            "staff@starcast.online inquiry"
          const subject = detail.subject || item.subject || "Support Inquiry"
          const textBody =
            detail.text ||
            (detail.html ? detail.html.replace(/<[^>]*>?/gm, "").trim() : "") ||
            "No message body."
          const htmlBody = detail.html || ""

          await saveInboundEmail({
            id: item.id,
            resendEmailId: item.id,
            from: String(sender),
            to: "support@starcast.online",
            subject: String(subject),
            text: String(textBody),
            html: String(htmlBody),
            status: "open",
          })
        }
      }
    }
  } catch (err) {
    console.error("[AutoSync On-Load Error]:", err)
  }
}

export default async function AdminSupportPage() {
  let emails: InboundEmailRecord[] = []

  try {
    // Automatically pull latest emails from Resend on every page load
    await autoSyncFromResend()
    emails = await getInboundEmails(50)
  } catch (err: any) {
    console.error("[AdminSupportPage Error]:", err)
  }

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
                  Cloud Firestore live customer & sponsor emails sent to <span className="text-[#ffd166] font-mono">staff@starcast.online</span>
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

        {/* Email Cards List */}
        <div className="grid gap-5">
          {emails.length === 0 ? (
            <div className="text-center py-16 px-6 border border-[#20205a]/60 rounded-2xl bg-[#0c0c3f]/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#20205a]/50 text-[#ffd166] flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#f5f7ff]">No Support Emails Yet</h3>
              <p className="text-sm text-[#9a9fc4] max-w-md mx-auto">
                When users, listeners, or sponsors email <span className="text-[#ffd166] font-mono">staff@starcast.online</span>, their messages will appear here in Cloud Firestore automatically.
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <Card
                key={email.id}
                className="overflow-hidden border-[#20205a]/70 bg-[#0c0c3f]/80 backdrop-blur-md shadow-xl transition-all hover:border-[#ea6f2a]/40"
              >
                <CardHeader className="bg-[#080838]/80 pb-4 border-b border-[#20205a]/60">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg sm:text-xl font-bold text-[#f5f7ff]">
                        {email.subject || "No Subject"}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-[#9a9fc4] flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1.5 text-[#ffd166] font-medium">
                          <User className="w-3.5 h-3.5 text-[#9a9fc4]" />
                          {email.from}
                        </span>
                        <span className="text-white/20 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 text-[#9a9fc4]">
                          <Clock className="w-3.5 h-3.5" />
                          {email.createdAt ? new Date(email.createdAt).toLocaleString() : "Recently"}
                        </span>
                      </CardDescription>
                    </div>
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
                </CardHeader>
                <CardContent className="pt-5 pb-6">
                  <div className="whitespace-pre-wrap text-sm text-[#d4d8ee] leading-relaxed font-normal bg-[#05052d]/60 p-4 rounded-xl border border-[#20205a]/40">
                    {email.text || "No text body available."}
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
