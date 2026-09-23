"use client"

import { useState, useTransition } from "react"
import { submitAccountDeletionRequest } from "@/app/actions/delete-account"
import { Trash2, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react"

export function DeleteAccountForm() {
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    success?: boolean
    ticketId?: string
    message?: string
    error?: string
  } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !confirmed) return

    startTransition(async () => {
      const res = await submitAccountDeletionRequest({
        email,
        reason,
        confirmed,
      })
      setResult(res)
    })
  }

  if (result?.success) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Deletion Request Confirmed</h3>
            <p className="text-xs text-emerald-300">Request Reference Ticket: <span className="font-mono font-bold text-white">{result.ticketId}</span></p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
          {result.message}
        </p>

        <div className="pt-3 border-t border-emerald-500/20 text-[11px] text-emerald-300/80">
          A record of this deletion has been logged. You may now close this page or return to the StarCast homepage.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-[#20205a] bg-[#0c0c3f] space-y-5 shadow-xl">
      <div className="flex items-center gap-3 pb-3 border-b border-[#20205a]">
        <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#f5f7ff]">Submit Online Deletion Request</h3>
          <p className="text-xs text-[#9a9fc4]">Instant self-serve deletion request form</p>
        </div>
      </div>

      {result?.error && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-[#9a9fc4] mb-1.5">
          Account Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          required
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#05052d] border border-[#20205a] text-[#f5f7ff] placeholder-[#5a5f8a] text-sm focus:outline-none focus:border-[#ea6f2a] focus:ring-1 focus:ring-[#ea6f2a] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-[#9a9fc4] mb-1.5">
          Reason for Leaving (Optional)
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#05052d] border border-[#20205a] text-[#f5f7ff] text-sm focus:outline-none focus:border-[#ea6f2a] focus:ring-1 focus:ring-[#ea6f2a] transition-all"
        >
          <option value="">Select a reason...</option>
          <option value="no_longer_use">No longer using the platform</option>
          <option value="privacy_concerns">Privacy or data concerns</option>
          <option value="created_duplicate">Created a duplicate account</option>
          <option value="other">Other reason</option>
        </select>
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-[#20205a] bg-[#05052d] text-[#ea6f2a] focus:ring-0 focus:ring-offset-0 accent-[#ea6f2a] cursor-pointer"
          />
          <span className="text-xs text-[#c4c7da] leading-relaxed">
            I understand and confirm that this action is <strong className="text-red-400">permanent</strong> and will permanently wipe my profile, saved bookmarks, session tokens, and activity.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || !email || !confirmed}
        className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-red-600 to-[#ea6f2a] hover:from-red-500 hover:to-[#f07d3b] text-white font-bold text-sm tracking-wide shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing Deletion Request...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Request Permanent Account Deletion
          </>
        )}
      </button>
    </form>
  )
}
