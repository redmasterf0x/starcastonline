"use client"

import type React from "react"
import Link from "next/link"
import {
  Radio,
  Music,
  Users,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  UserCheck,
  Disc3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BandDirectoryEntry } from "@/app/actions/band-pages"

interface CommunityRightRailProps {
  suggestedBands: BandDirectoryEntry[]
  onToggleFollow: (band: BandDirectoryEntry) => void
  friends: Array<{
    id: string
    user_id: string
    first_name: string
    last_name: string
    profile_pic?: string
    is_employee?: boolean
  }>
  onStartChat: (profileId: string) => void
  currentUserId: string | null
  onViewAllBands: () => void
}

function getInitials(first?: string, last?: string) {
  const f = (first ?? "").trim()[0] ?? ""
  const l = (last ?? "").trim()[0] ?? ""
  return `${f}${l}` || "?"
}

export function CommunityRightRail({
  suggestedBands,
  onToggleFollow,
  friends,
  onStartChat,
  currentUserId,
  onViewAllBands,
}: CommunityRightRailProps) {
  return (
    <aside className="hidden xl:flex xl:w-80 flex-col shrink-0 sticky top-24 space-y-5">
      {/* Broadcast & Scene Spotlight */}
      <div className="relative overflow-hidden rounded-3xl border border-[#20205a]/70 bg-gradient-to-br from-[#0c0c3f]/90 via-[#0a0a38]/80 to-[#05052d]/95 p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ea6f2a]/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 text-[#20efe0] text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-pulse" />
          <span>StarCast Network</span>
        </div>
        <h3 className="font-extrabold text-[#f5f7ff] text-base leading-snug">
          Live Soundstage &amp; Studio Sessions
        </h3>
        <p className="text-xs text-[#dbe0fb] mt-1.5 leading-relaxed">
          Watch original shows, artist interviews, and live performances direct from StarCast Studios.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-md shadow-[#ea6f2a]/20"
          >
            <Link href="/watch">
              <Radio className="w-3.5 h-3.5" /> Watch Live
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#20205a] bg-[#05052d]/80 text-[#dbe0fb] hover:text-white hover:bg-[#20205a]/60 rounded-xl text-xs h-9 px-3 gap-1"
          >
            <Link href="/music">
              <Disc3 className="w-3.5 h-3.5 text-[#20efe0]" /> Music Hub
            </Link>
          </Button>
        </div>
      </div>

      {/* Suggested Kansas Bands to Follow */}
      <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#ea6f2a]" />
            <h3 className="font-bold text-[#f5f7ff] text-sm uppercase tracking-wider">
              Bands To Follow
            </h3>
          </div>
          <button
            onClick={onViewAllBands}
            className="text-xs text-[#20efe0] hover:text-white font-semibold transition-colors"
          >
            See All
          </button>
        </div>

        {suggestedBands.length === 0 ? (
          <p className="text-xs text-[#9a9fc4] py-3 text-center">
            No new soundstage bands right now.
          </p>
        ) : (
          <div className="space-y-3.5">
            {suggestedBands.slice(0, 4).map((band) => (
              <div key={band.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/bands/${band.slug}`}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0 flex items-center justify-center">
                    {band.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={band.logo_url}
                        alt={band.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-[#ea6f2a]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#f5f7ff] truncate group-hover:text-[#ea6f2a] transition-colors">
                      {band.name}
                    </p>
                    <p className="text-[11px] text-[#9a9fc4] truncate">
                      {band.genre || "Original Act"} • {band.follower_count} {band.follower_count === 1 ? "fan" : "fans"}
                    </p>
                  </div>
                </Link>

                {currentUserId && (
                  <Button
                    size="sm"
                    variant={band.is_following ? "outline" : "default"}
                    onClick={() => onToggleFollow(band)}
                    className={`h-8 px-3 rounded-full text-xs font-bold shrink-0 transition-all ${
                      band.is_following
                        ? "border-[#20205a] text-[#9a9fc4] hover:text-white hover:bg-red-500/20 hover:border-red-500/40"
                        : "bg-[#20efe0]/15 text-[#20efe0] hover:bg-[#20efe0] hover:text-black border border-[#20efe0]/30"
                    }`}
                  >
                    {band.is_following ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Chat / Active Friends */}
      {currentUserId && friends.length > 0 && (
        <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#20efe0]" />
              <h3 className="font-bold text-[#f5f7ff] text-sm uppercase tracking-wider">
                Friends
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#9a9fc4]">
              {friends.length} {friends.length === 1 ? "friend" : "friends"}
            </span>
          </div>

          <div className="space-y-3">
            {friends.slice(0, 5).map((friend) => (
              <div key={friend.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/profile/${friend.id}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <div className="relative w-8 h-8 rounded-full bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0 flex items-center justify-center">
                    {friend.profile_pic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={friend.profile_pic}
                        alt={`${friend.first_name} ${friend.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-bold text-[#f5f7ff]">
                        {getInitials(friend.first_name, friend.last_name)}
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#05052d]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#f5f7ff] truncate group-hover:text-[#20efe0] transition-colors">
                      {friend.first_name} {friend.last_name}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => onStartChat(friend.id)}
                  title={`Message ${friend.first_name}`}
                  className="w-7 h-7 rounded-full bg-[#05052d] hover:bg-[#ea6f2a] text-[#20efe0] hover:text-white flex items-center justify-center border border-[#20205a] transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Vibe & Scene Guidelines */}
      <div className="rounded-3xl border border-[#20205a]/50 bg-[#05052d]/60 p-4 text-xs text-[#9a9fc4] space-y-2">
        <div className="flex items-center gap-1.5 text-[#f5f7ff] font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
          <span>Kansas Music Community</span>
        </div>
        <p className="leading-relaxed">
          Support local bands, respect fellow fans, and keep comments constructive. Want to get your band featured? Visit the Artist Portal!
        </p>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-[#20efe0] hover:underline font-semibold pt-1"
        >
          Artist Portal &amp; Bookings <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  )
}
