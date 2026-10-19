import React from "react"
import { Crown, Radio, Music2, Ticket, Flame } from "lucide-react"

export interface SceneBadgeFlags {
  isAdmin?: boolean | null
  isEmployee?: boolean | null
  role?: string | null
  isArtist?: boolean | null
  isVip?: boolean | null
  isRegular?: boolean | null
}

interface SceneBadgesProps {
  flags?: SceneBadgeFlags | null
  size?: "xs" | "sm" | "md"
  className?: string
  maxBadges?: number
}

export function SceneBadges({
  flags,
  size = "xs",
  className = "",
  maxBadges = 3,
}: SceneBadgesProps) {
  if (!flags) return null

  const badges: {
    key: string
    label: string
    icon: React.ReactNode
    className: string
  }[] = []

  const isAdmin = !!flags.isAdmin || flags.role === "admin"
  const isStaff = !!flags.isEmployee || flags.role === "staff"
  const isArtist = !!flags.isArtist
  const isVip = !!flags.isVip
  const isRegular = !!flags.isRegular

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  }

  const textSizes = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
  }

  if (isAdmin) {
    badges.push({
      key: "admin",
      label: "Admin",
      icon: <Crown className={`${iconSizes[size]} text-amber-300 fill-amber-300/30 shrink-0`} />,
      className:
        "bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-amber-400/40 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    })
  }

  if (isStaff && !isAdmin) {
    badges.push({
      key: "crew",
      label: "Studio Crew",
      icon: <Radio className={`${iconSizes[size]} text-cyan-300 shrink-0 animate-pulse`} />,
      className:
        "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-cyan-600/20 border-cyan-400/40 text-cyan-200 shadow-[0_0_10px_rgba(32,239,224,0.15)]",
    })
  }

  if (isArtist) {
    badges.push({
      key: "artist",
      label: "Artist",
      icon: <Music2 className={`${iconSizes[size]} text-fuchsia-300 shrink-0`} />,
      className:
        "bg-gradient-to-r from-fuchsia-500/20 via-purple-500/15 to-pink-600/20 border-fuchsia-400/40 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.15)]",
    })
  }

  if (isVip) {
    badges.push({
      key: "vip",
      label: "VIP",
      icon: <Ticket className={`${iconSizes[size]} text-emerald-300 shrink-0`} />,
      className:
        "bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-600/20 border-emerald-400/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    })
  }

  if (isRegular && !isAdmin && !isStaff) {
    badges.push({
      key: "regular",
      label: "Regular",
      icon: <Flame className={`${iconSizes[size]} text-[#ea6f2a] fill-[#ea6f2a]/20 shrink-0`} />,
      className:
        "bg-gradient-to-r from-[#ea6f2a]/20 via-orange-500/15 to-rose-500/20 border-[#ea6f2a]/40 text-orange-200 shadow-[0_0_10px_rgba(234,111,42,0.15)]",
    })
  }

  if (badges.length === 0) return null

  const displayedBadges = badges.slice(0, maxBadges)

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {displayedBadges.map((b) => (
        <span
          key={b.key}
          className={`inline-flex items-center rounded-full border font-medium tracking-wide backdrop-blur-sm select-none ${textSizes[size]} ${b.className}`}
        >
          {b.icon}
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  )
}
