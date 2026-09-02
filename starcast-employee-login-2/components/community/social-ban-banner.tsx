"use client"

import { useEffect, useState } from "react"
import { Ban } from "lucide-react"
import { getMySocialStatus } from "@/app/actions/community"

/**
 * Explains to a socially banned member why interactions are unavailable.
 *
 * Renders nothing for members in good standing, so it is safe to mount on any
 * social surface (community boards, band pages, profiles).
 */
export function SocialBanBanner({ className = "" }: { className?: string }) {
  const [state, setState] = useState<{ socialBanned: boolean; reason: string | null } | null>(null)

  useEffect(() => {
    getMySocialStatus()
      .then(setState)
      .catch(() => setState(null))
  }, [])

  if (!state?.socialBanned) return null

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 ${className}`}
    >
      <Ban className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-[#f5f7ff] text-sm">Your social privileges are suspended</p>
        <p className="text-sm text-[#c9cdea] mt-1 leading-relaxed">
          You can still browse the site and manage your bookings, but you cannot post, comment, like, send messages,
          or add friends.
          {state.reason ? ` Reason: ${state.reason}` : ""}
        </p>
      </div>
    </div>
  )
}
