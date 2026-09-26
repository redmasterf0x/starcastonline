import { db } from "@/lib/db"
import { inboundEmails } from "@/lib/db/schema"
import { desc, sql } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LifeBuoy, ArrowLeft, Mail, Clock, User, ShieldCheck, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminSupportPage() {
  let emails: any[] = []
  let loadError: string | null = null

  try {
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
    `)

    emails = await db
      .select()
      .from(inboundEmails)
      .orderBy(desc(inboundEmails.receivedAt))
  } catch (err: any) {
    console.error("[AdminSupportPage DB Error]:", err)
    loadError = err?.message || "Failed to load support emails"
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
                  Real-time customer & sponsor emails sent to <span className="text-[#ffd166] font-mono">staff@starcast.online</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                When users, listeners, or sponsors email <span className="text-[#ffd166] font-mono">staff@starcast.online</span>, their messages and attachments will appear here automatically.
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
                          {email.sender}
                        </span>
                        <span className="text-white/20 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 text-[#9a9fc4]">
                          <Clock className="w-3.5 h-3.5" />
                          {email.receivedAt ? new Date(email.receivedAt).toLocaleString() : "Recently"}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        email.status === "unread"
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
                    {email.textBody || "No text body available."}
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

