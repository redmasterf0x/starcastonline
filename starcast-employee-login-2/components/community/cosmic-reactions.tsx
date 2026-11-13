"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Star } from "lucide-react"
import {
  togglePostReaction,
  toggleCommentReaction,
} from "@/app/actions/community"
import { toast } from "sonner"

export type ReactionType = "love" | "fire" | "riff" | "cosmic" | "legend" | "hype"

export const COSMIC_REACTIONS: {
  key: ReactionType
  label: string
  emoji: string
  bgHover: string
}[] = [
  { key: "love", label: "Star", emoji: "⭐", bgHover: "hover:bg-amber-500/20" },
  { key: "fire", label: "Fire", emoji: "🔥", bgHover: "hover:bg-orange-500/20" },
  { key: "riff", label: "Riff", emoji: "🎸", bgHover: "hover:bg-fuchsia-500/20" },
  { key: "cosmic", label: "Cosmic", emoji: "🚀", bgHover: "hover:bg-cyan-500/20" },
  { key: "legend", label: "Legend", emoji: "👑", bgHover: "hover:bg-amber-500/20" },
  { key: "hype", label: "Hype", emoji: "💯", bgHover: "hover:bg-emerald-500/20" },
]

export interface ReactionsData {
  counts: Record<string, number>
  userReactions: string[]
  total: number
}

interface CosmicReactionsProps {
  targetId?: string
  targetType?: "post" | "comment"
  currentViewerId?: string | null
  initialReactions?: ReactionsData | null
  reactions?: ReactionsData | null
  onToggleReaction?: (reactionType: ReactionType) => void
  disabled?: boolean
  size?: "sm" | "md"
  compact?: boolean
}

export function CosmicReactions({
  targetId,
  targetType = "post",
  currentViewerId,
  initialReactions,
  reactions: controlledReactions,
  onToggleReaction,
  disabled = false,
  size = "md",
  compact = false,
}: CosmicReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Internal reactions state for optimistic updates
  const [internalReactions, setInternalReactions] = useState<ReactionsData>(
    controlledReactions ||
      initialReactions || {
        counts: {},
        userReactions: [],
        total: 0,
      }
  )

  useEffect(() => {
    if (controlledReactions) {
      setInternalReactions(controlledReactions)
    } else if (initialReactions) {
      setInternalReactions(initialReactions)
    }
  }, [controlledReactions, initialReactions])

  const counts = internalReactions?.counts || {}
  const userReactions = new Set(internalReactions?.userReactions || [])
  const total = internalReactions?.total || 0
  const hasUserReacted = userReactions.size > 0

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    if (disabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setPickerOpen(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setPickerOpen(false)
    }, 350)
  }

  const handleToggle = async (key: ReactionType) => {
    setPickerOpen(false)

    if (onToggleReaction) {
      onToggleReaction(key)
      return
    }

    if (!targetId) return

    if (!currentViewerId) {
      toast.error("Please sign in to react to posts and comments!")
      return
    }

    // Optimistic update
    const prevData = { ...internalReactions }
    const alreadyReacted = userReactions.has(key)

    const nextCounts = { ...counts }
    const nextUserReactions = new Set<string>()

    if (alreadyReacted) {
      // Toggle off current reaction (unlike)
      nextCounts[key] = Math.max(0, (nextCounts[key] || 1) - 1)
    } else {
      // User can only like once: deduct any previous reaction(s) and switch to new one
      for (const prevKey of Array.from(userReactions)) {
        nextCounts[prevKey] = Math.max(0, (nextCounts[prevKey] || 1) - 1)
      }
      nextCounts[key] = (nextCounts[key] || 0) + 1
      nextUserReactions.add(key)
    }

    const nextTotal = Object.values(nextCounts).reduce((a, b) => a + b, 0)
    setInternalReactions({
      counts: nextCounts,
      userReactions: Array.from(nextUserReactions),
      total: nextTotal,
    })

    try {
      if (targetType === "post") {
        await togglePostReaction(targetId, key)
      } else {
        await toggleCommentReaction(targetId, key)
      }
    } catch (err: any) {
      // Revert on error
      setInternalReactions(prevData)
      toast.error(err?.message || "Failed to update reaction.")
    }
  }

  // Active user reaction if any
  const userReactionKey = userReactions.size > 0 ? (Array.from(userReactions)[0] as ReactionType) : null

  // Primary reaction displayed on the main button:
  // If the user reacted, show their reaction. Otherwise show "love" (Star ⭐).
  const primaryReactionKey: ReactionType = userReactionKey || "love"
  const primaryReactionItem = COSMIC_REACTIONS.find((r) => r.key === primaryReactionKey) || COSMIC_REACTIONS[0]

  // Primary count for the main button:
  // If user reacted with primaryReactionKey or if it's the only reaction, show its count or total.
  const primaryCount = counts[primaryReactionKey] || (total > 0 && primaryReactionKey === "love" ? total : 0)

  // Secondary reaction pills:
  // IMPORTANT: Exclude the primary reaction so there is NEVER a duplicate star button!
  const secondaryReactionEntries = Object.entries(counts)
    .filter(([key, count]) => key !== primaryReactionKey && count > 0)
    .sort((a, b) => b[1] - a[1])

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentViewerId) {
      toast.error("Please sign in to star posts and comments!")
      return
    }

    if (hasUserReacted) {
      // Toggle off current reaction (unlike)
      handleToggle(primaryReactionKey)
    } else {
      // 1-click quick star!
      handleToggle("love")
    }
  }

  return (
    <div
      ref={pickerRef}
      className="relative inline-flex items-center gap-1.5 flex-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Reaction Picker Popup */}
      {pickerOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-[#05052d]/95 border border-[#20205a] shadow-[0_0_25px_rgba(32,239,224,0.25)] backdrop-blur-md">
            {COSMIC_REACTIONS.map((r) => {
              const isSelected = userReactions.has(r.key)
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleToggle(r.key)}
                  className={`group relative p-1.5 sm:p-2 rounded-full transition-transform hover:scale-125 active:scale-95 ${
                    r.bgHover
                  } ${isSelected ? "bg-white/10 ring-1 ring-[#20efe0]" : ""}`}
                  title={r.label}
                >
                  <span className="text-lg sm:text-xl select-none leading-none block">
                    {r.emoji}
                  </span>
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0c0c3f] text-[#20efe0] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#20205a] pointer-events-none whitespace-nowrap shadow-md">
                    {r.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Star / Reaction Button (Single Unified Action Button) */}
      <button
        type="button"
        onClick={handleMainButtonClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all select-none cursor-pointer ${
          size === "sm"
            ? "px-2.5 py-1 text-xs"
            : "px-3.5 py-2 text-xs sm:text-sm"
        } ${
          hasUserReacted
            ? "bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/50 shadow-[0_0_12px_rgba(234,111,42,0.15)]"
            : "text-[#cbd0f2] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
        }`}
        title={hasUserReacted ? `${primaryReactionItem.label}ed - Click to unstar` : "Click to Star"}
      >
        <span className="text-base leading-none">
          {primaryReactionItem.emoji}
        </span>
        <span>
          {compact && primaryCount === 0 ? "Star" : primaryCount > 0 ? primaryCount : "Star"}
        </span>
      </button>

      {/* Other Cosmic Reaction Pills (Only for OTHER emojis, never duplicating the main button!) */}
      {!compact &&
        secondaryReactionEntries.map(([reactionKey, count]) => {
          const item = COSMIC_REACTIONS.find((r) => r.key === reactionKey)
          if (!item) return null
          const isSelectedByUser = userReactions.has(reactionKey)

          return (
            <button
              key={reactionKey}
              type="button"
              onClick={() => handleToggle(reactionKey as ReactionType)}
              disabled={disabled}
              className={`inline-flex items-center gap-1 rounded-full font-mono transition-all select-none cursor-pointer ${
                size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
              } ${
                isSelectedByUser
                  ? "bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/50 shadow-[0_0_10px_rgba(32,239,224,0.15)]"
                  : "bg-[#05052d]/70 text-[#cbd0f2] border border-[#20205a]/60 hover:border-[#ea6f2a]/50 hover:text-white"
              }`}
              title={`${item.label} (${count}) - Click to switch reaction`}
            >
              <span className="text-xs leading-none">{item.emoji}</span>
              <span className="font-bold">{count}</span>
            </button>
          )
        })}
    </div>
  )
}
