"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Heart } from "lucide-react"
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
  { key: "love", label: "Love", emoji: "❤️", bgHover: "hover:bg-red-500/20" },
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
    const nextUserReactions = new Set(userReactions)

    if (alreadyReacted) {
      nextCounts[key] = Math.max(0, (nextCounts[key] || 1) - 1)
      nextUserReactions.delete(key)
    } else {
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

  // Active reactions with count > 0, sorted by counts descending
  const activeReactionEntries = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

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

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (pickerOpen) {
            handleToggle("love")
          } else {
            setPickerOpen(true)
          }
        }}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all select-none ${
          size === "sm"
            ? "px-2.5 py-1 text-xs"
            : "px-3.5 py-2 text-xs sm:text-sm"
        } ${
          hasUserReacted
            ? "bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/50 shadow-[0_0_12px_rgba(234,111,42,0.15)]"
            : "text-[#cbd0f2] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
        }`}
      >
        <span className="text-base leading-none">
          {hasUserReacted && userReactions.has("riff")
            ? "🎸"
            : hasUserReacted && userReactions.has("fire")
            ? "🔥"
            : hasUserReacted && userReactions.has("cosmic")
            ? "🚀"
            : hasUserReacted && userReactions.has("legend")
            ? "👑"
            : hasUserReacted && userReactions.has("hype")
            ? "💯"
            : "❤️"}
        </span>
        <span>
          {compact && total === 0 ? "Like" : total > 0 ? total : "React"}
        </span>
      </button>

      {/* Active Reaction Pills */}
      {!compact &&
        activeReactionEntries.map(([reactionKey, count]) => {
          const item = COSMIC_REACTIONS.find((r) => r.key === reactionKey)
          if (!item) return null
          const isSelectedByUser = userReactions.has(reactionKey)

          return (
            <button
              key={reactionKey}
              type="button"
              onClick={() => handleToggle(reactionKey as ReactionType)}
              disabled={disabled}
              className={`inline-flex items-center gap-1 rounded-full font-mono transition-all select-none ${
                size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
              } ${
                isSelectedByUser
                  ? "bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/50 shadow-[0_0_10px_rgba(32,239,224,0.15)]"
                  : "bg-[#05052d]/70 text-[#cbd0f2] border border-[#20205a]/60 hover:border-[#ea6f2a]/50 hover:text-white"
              }`}
              title={`${item.label} (${count})`}
            >
              <span className="text-xs leading-none">{item.emoji}</span>
              <span className="font-bold">{count}</span>
            </button>
          )
        })}
    </div>
  )
}
