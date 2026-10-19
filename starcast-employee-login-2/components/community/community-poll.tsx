"use client"

import { useState } from "react"
import { BarChart3, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { voteOnPoll } from "@/app/actions/community"
import { toast } from "sonner"

export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface PollData {
  question: string
  options: PollOption[]
  totalVotes: number
  userVotedOptionId: string | null
}

interface CommunityPollProps {
  postId: string
  poll: PollData
  currentUserId?: string | null
  currentViewerId?: string | null
  onVoteChange?: (updatedPoll: PollData) => void
}

export function CommunityPoll({
  postId,
  poll,
  currentUserId,
  currentViewerId,
  onVoteChange,
}: CommunityPollProps) {
  const activeUserId = currentUserId ?? currentViewerId ?? null
  const [optimisticPoll, setOptimisticPoll] = useState<PollData>(poll)
  const [submitting, setSubmitting] = useState(false)

  const hasVoted = Boolean(optimisticPoll.userVotedOptionId)

  const handleVote = async (optionId: string) => {
    if (!activeUserId) {
      toast.error("Please sign in to vote on community polls!")
      return
    }

    if (submitting) return

    setSubmitting(true)
    const prevPoll = { ...optimisticPoll }

    // Calculate optimistic state
    const isRetracting = optimisticPoll.userVotedOptionId === optionId
    const newVotedId = isRetracting ? null : optionId

    const newOptions = optimisticPoll.options.map((opt) => {
      let voteDelta = 0
      if (opt.id === optionId) {
        voteDelta = isRetracting ? -1 : 1
      } else if (opt.id === optimisticPoll.userVotedOptionId) {
        voteDelta = -1
      }
      return {
        ...opt,
        votes: Math.max(0, opt.votes + voteDelta),
      }
    })

    const newTotalVotes = Math.max(
      0,
      optimisticPoll.totalVotes + (isRetracting ? -1 : optimisticPoll.userVotedOptionId ? 0 : 1)
    )

    const updatedWithPercentages: PollData = {
      ...optimisticPoll,
      options: newOptions.map((opt) => ({
        ...opt,
        percentage:
          newTotalVotes > 0 ? Math.round((opt.votes / newTotalVotes) * 100) : 0,
      })),
      totalVotes: newTotalVotes,
      userVotedOptionId: newVotedId,
    }

    setOptimisticPoll(updatedWithPercentages)
    onVoteChange?.(updatedWithPercentages)

    try {
      await voteOnPoll(postId, optionId)
      if (isRetracting) {
        toast.info("Vote retracted")
      } else {
        toast.success("Vote recorded! 🌟")
      }
    } catch (err: any) {
      setOptimisticPoll(prevPoll)
      onVoteChange?.(prevPoll)
      toast.error(err?.message || "Failed to submit vote")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/80 shadow-lg space-y-3.5 backdrop-blur-sm">
      {/* Poll Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#20205a]/60 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ffd166]">
          <BarChart3 className="w-4 h-4 text-[#ffd166]" />
          <span>Community StarVote</span>
        </div>
        <span className="text-[11px] font-mono text-[#9a9fc4]">
          {optimisticPoll.totalVotes} {optimisticPoll.totalVotes === 1 ? "vote" : "votes"}
        </span>
      </div>

      {/* Question */}
      <h4 className="text-base sm:text-lg font-bold text-[#f5f7ff] leading-snug">
        {optimisticPoll.question}
      </h4>

      {/* Options List */}
      <div className="space-y-2.5 pt-1">
        {optimisticPoll.options.map((opt) => {
          const isSelected = optimisticPoll.userVotedOptionId === opt.id

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={submitting}
              className={`group relative w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all overflow-hidden flex items-center justify-between gap-3 ${
                isSelected
                  ? "border-[#20efe0] bg-[#20efe0]/10 shadow-[0_0_15px_rgba(32,239,224,0.15)] ring-1 ring-[#20efe0]/50"
                  : "border-[#20205a] bg-[#0c0c3f]/50 hover:border-[#ea6f2a]/60 hover:bg-[#0c0c3f]/80"
              }`}
            >
              {/* Progress Bar Fill */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none ${
                    isSelected
                      ? "bg-gradient-to-r from-[#20efe0]/30 via-[#20efe0]/20 to-[#20efe0]/10"
                      : "bg-gradient-to-r from-[#ea6f2a]/20 via-[#ea6f2a]/15 to-transparent"
                  }`}
                  style={{ width: `${opt.percentage}%` }}
                />
              )}

              {/* Option Text & Checkmark */}
              <div className="relative z-10 flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-[#20efe0] bg-[#20efe0] text-black"
                      : "border-[#9a9fc4]/40 group-hover:border-[#ea6f2a]"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-sm sm:text-base font-semibold truncate ${
                    isSelected ? "text-[#20efe0]" : "text-[#f5f7ff] group-hover:text-white"
                  }`}
                >
                  {opt.text}
                </span>
              </div>

              {/* Percentage & Vote Count */}
              {hasVoted && (
                <div className="relative z-10 shrink-0 text-right font-mono">
                  <span
                    className={`text-sm font-bold ${
                      isSelected ? "text-[#20efe0]" : "text-[#cbd0f2]"
                    }`}
                  >
                    {opt.percentage}%
                  </span>
                  <span className="text-[10px] text-[#9a9fc4] ml-1.5 hidden sm:inline">
                    ({opt.votes})
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#9a9fc4] pt-1">
        <span>
          {hasVoted
            ? "Click your choice again to retract or change your vote"
            : "Click an option to cast your vote"}
        </span>
        {submitting && (
          <span className="inline-flex items-center gap-1 text-[#20efe0]">
            <Loader2 className="w-3 h-3 animate-spin" /> Updating...
          </span>
        )}
      </div>
    </div>
  )
}
