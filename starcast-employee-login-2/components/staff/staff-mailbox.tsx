"use client"

import { useState, useEffect } from "react"
import {
  getStaffMailbox,
  markStaffMessageRead,
  replyToStaffMessage,
  deleteStaffMessage,
  type StaffInboxMessageItem,
  type StaffMailboxData,
} from "@/app/actions/staff-inbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  MailOpen,
  Send,
  Reply,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Sparkles,
  Inbox,
  User,
  Shield,
} from "lucide-react"

export function StaffMailbox() {
  const [data, setData] = useState<StaffMailboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "replied">("all")
  const [selectedMessage, setSelectedMessage] = useState<StaffInboxMessageItem | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function loadMailbox(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true)
    try {
      const res = await getStaffMailbox()
      setData(res)
      if (selectedMessage) {
        const updated = res.messages.find((m) => m.id === selectedMessage.id)
        if (updated) setSelectedMessage(updated)
      }
    } catch (err: any) {
      console.error("Failed to load staff mailbox:", err)
      setFeedback({ type: "error", text: err?.message || "Failed to load mailbox" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMailbox()
  }, [])

  function handleCopyEmail() {
    if (!data?.staffEmail) return
    navigator.clipboard.writeText(data.staffEmail).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSelectMessage(msg: StaffInboxMessageItem) {
    setSelectedMessage(msg)
    setReplyText("")
    setFeedback(null)

    if (!msg.isRead) {
      try {
        await markStaffMessageRead(msg.id)
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            messages: prev.messages.map((m) =>
              m.id === msg.id ? { ...m, isRead: true, status: m.status === "unread" ? "read" : m.status } : m
            ),
          }
        })
      } catch (err) {
        console.error("Error marking message as read:", err)
      }
    }
  }

  async function handleSendReply() {
    if (!selectedMessage || !replyText.trim()) return
    setSendingReply(true)
    setFeedback(null)

    try {
      await replyToStaffMessage({
        messageId: selectedMessage.id,
        replyText: replyText.trim(),
      })
      setFeedback({ type: "success", text: `Reply sent successfully to ${selectedMessage.fromEmail}!` })
      setReplyText("")
      await loadMailbox()
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to send reply" })
    } finally {
      setSendingReply(false)
    }
  }

  async function handleDelete(messageId: string) {
    try {
      await deleteStaffMessage(messageId)
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
      await loadMailbox()
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to delete message" })
    }
  }

  const filteredMessages = (data?.messages || []).filter((msg) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      msg.fromEmail.toLowerCase().includes(q) ||
      (msg.fromName && msg.fromName.toLowerCase().includes(q)) ||
      msg.subject.toLowerCase().includes(q) ||
      msg.textBody.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !msg.isRead) ||
      (statusFilter === "replied" && (msg.status === "replied" || msg.repliedAt !== null))

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="py-16 text-center text-[#9a9fc4] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ea6f2a]" />
        <p className="text-sm">Connecting to your StarCast Staff Mailbox...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── STAFF EMAIL ADDRESS BANNER ── */}
      <div className="rounded-3xl border border-[#20205a]/80 bg-gradient-to-r from-[#0c0c3f] via-[#10104a] to-[#0c0c3f] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#ffd166]">
              <Shield className="w-4 h-4 text-[#ea6f2a]" /> OFFICIAL STAFF INBOX
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
              {data?.staffName}&apos;s Mailbox
            </h2>
            <p className="text-xs sm:text-sm text-[#9a9fc4]">
              Incoming emails sent to your staff address route directly to this dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#05052d] border border-[#20205a] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-mono text-[#20efe0] shadow-inner">
              <Mail className="w-4 h-4 text-[#ea6f2a]" />
              <span className="font-semibold">{data?.staffEmail}</span>
              <button
                onClick={handleCopyEmail}
                className="p-1 rounded-md hover:bg-[#20205a]/60 text-[#9a9fc4] hover:text-white transition-colors ml-1"
                title="Copy staff email address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <Button
              onClick={() => loadMailbox(true)}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="border-[#20205a] bg-[#05052d]/60 text-[#f5f7ff] hover:bg-[#20205a]/60 rounded-xl h-10 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-[#ea6f2a]" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
              : "bg-red-950/40 border-red-500/50 text-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9a9fc4] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sender, subject, or message text..."
            className="pl-10 h-10 bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#05052d] border border-[#20205a]/60 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#ea6f2a] text-white shadow-sm"
                : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            All ({data?.messages.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === "unread"
                ? "bg-[#20efe0] text-[#05051f] shadow-sm font-bold"
                : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            Unread
            {(data?.unreadCount || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ea6f2a] text-white text-[10px] font-bold">
                {data?.unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter("replied")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "replied"
                ? "bg-[#ffd166] text-[#05051f] shadow-sm font-bold"
                : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            Replied
          </button>
        </div>
      </div>

      {/* ── TWO-COLUMN MAILBOX INTERFACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Message List */}
        <div className={`space-y-3 ${selectedMessage ? "lg:col-span-5" : "lg:col-span-12"}`}>
          {filteredMessages.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
              <Inbox className="w-10 h-10 text-[#9a9fc4]/50 mx-auto" />
              <p className="text-base font-bold text-[#f5f7ff]">No messages in this view</p>
              <p className="text-xs text-[#9a9fc4] max-w-sm mx-auto">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search terms or filters."
                  : `Any email sent to ${data?.staffEmail} will appear here.`}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#ea6f2a] bg-[#12124a] shadow-lg shadow-[#ea6f2a]/10"
                      : !msg.isRead
                      ? "border-[#20efe0]/50 bg-[#0c0c3f] hover:border-[#20efe0]"
                      : "border-[#20205a]/60 bg-[#0c0c3f]/60 hover:border-[#20205a] hover:bg-[#0c0c3f]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {!msg.isRead ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#20efe0] animate-pulse shrink-0" />
                      ) : (
                        <MailOpen className="w-3.5 h-3.5 text-[#9a9fc4] shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-bold truncate ${!msg.isRead ? "text-[#f5f7ff]" : "text-[#dbe0fb]"}`}>
                        {msg.fromName || msg.fromEmail}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-[#9a9fc4] shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className={`text-xs font-semibold line-clamp-1 mb-1 ${!msg.isRead ? "text-[#ffd166]" : "text-[#f5f7ff]"}`}>
                    {msg.subject}
                  </p>

                  <p className="text-xs text-[#9a9fc4] line-clamp-2 leading-relaxed">
                    {msg.textBody || "No text preview available."}
                  </p>

                  {msg.status === "replied" && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Replied
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right column: Selected Message Viewer & Reply Composer */}
        {selectedMessage && (
          <div className="lg:col-span-7 rounded-3xl border border-[#20205a] bg-[#0c0c3f] p-5 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Message Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#20205a]/80">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#f5f7ff]">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#9a9fc4]">
                    <span>From: <strong className="text-[#f5f7ff]">{selectedMessage.fromEmail}</strong></span>
                    <span>&bull;</span>
                    <span>To: <strong className="text-[#20efe0]">{selectedMessage.toEmail}</strong></span>
                    <span>&bull;</span>
                    <span className="font-mono">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => handleDelete(selectedMessage.id)}
                    size="icon"
                    variant="ghost"
                    className="text-[#9a9fc4] hover:text-red-400 hover:bg-red-950/30 rounded-xl h-9 w-9"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Message Content */}
              <div className="py-2">
                {selectedMessage.htmlBody ? (
                  <div
                    className="text-xs sm:text-sm text-[#dbe0fb] leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto pr-2"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-[#dbe0fb] leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto pr-2">
                    {selectedMessage.textBody || "(Empty message body)"}
                  </p>
                )}
              </div>
            </div>

            {/* Inline Reply Composer */}
            <div className="pt-4 border-t border-[#20205a]/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#ffd166] flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 text-[#ea6f2a]" /> Reply as {data?.staffEmail}
                </label>
                {selectedMessage.status === "replied" && (
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px]">
                    Already Replied
                  </Badge>
                )}
              </div>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type your reply to ${selectedMessage.fromEmail}...`}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 min-h-[110px] rounded-2xl text-xs sm:text-sm p-3.5 resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#9a9fc4]">
                  Delivered with StarCast signature &bull; Reply-To set to your staff email
                </span>

                <Button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl px-5 h-10 shadow-md shadow-[#ea6f2a]/20 text-xs sm:text-sm"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
