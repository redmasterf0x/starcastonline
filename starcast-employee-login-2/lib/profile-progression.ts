export interface ProfileFrameDef {
  id: string
  name: string
  unlockLevel: number
  description: string
  /** Outer ring container classes/styles */
  ringClass: string
  ringStyle?: Record<string, string>
  /** Optional animated spinning layer behind avatar */
  animatedConic?: string
  /** Level badge pill colors */
  badgeClass: string
}

export interface ProfileBannerDef {
  id: string
  name: string
  unlockLevel: number
  description: string
  bgClass: string
  bgStyle?: Record<string, string>
  overlayPattern?: "dots" | "grid" | "stars" | "rays"
}

export interface XpActivityCounts {
  postsCount: number
  commentsCount: number
  starsReceived: number
  friendsCount: number
  ticketsCount: number
  tracksUploaded: number
  ownsBand: boolean
  hasAvatar: boolean
  hasBio: boolean
  hasLocationOrWebsite: boolean
  weeksMember: number
  bonusXp: number
}

export interface XpBreakdownItem {
  label: string
  xp: number
  detail: string
}

export interface LevelProgress {
  level: number
  rankTitle: string
  totalXp: number
  currentLevelFloorXp: number
  nextLevelXp: number
  xpIntoLevel: number
  xpNeededForNext: number
  progressPercent: number
  breakdown: XpBreakdownItem[]
}

export const RANK_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 25, title: "Galactic Sovereign" },
  { minLevel: 20, title: "Supernova Legend" },
  { minLevel: 15, title: "Pulsar Commander" },
  { minLevel: 10, title: "Nebula Vanguard" },
  { minLevel: 7, title: "Solar Voyager" },
  { minLevel: 5, title: "Broadcast Regular" },
  { minLevel: 3, title: "Orbit Walker" },
  { minLevel: 2, title: "Signal Listener" },
  { minLevel: 1, title: "Stargazer" },
]

/** Total cumulative XP required to reach `level` (Level 1 = 0 XP). */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.35))
}

export function getRankTitle(level: number): string {
  for (const r of RANK_TITLES) {
    if (level >= r.minLevel) return r.title
  }
  return "Stargazer"
}

export function calculateLevelProgress(counts: XpActivityCounts): LevelProgress {
  const breakdown: XpBreakdownItem[] = []

  const memberBaseXp = 25 + Math.min(520, Math.max(0, counts.weeksMember) * 5)
  breakdown.push({
    label: "StarCast Membership",
    xp: memberBaseXp,
    detail: `Joined + ${Math.max(0, counts.weeksMember)} wk${counts.weeksMember === 1 ? "" : "s"} active`,
  })

  const profileSetupXp =
    (counts.hasAvatar ? 20 : 0) +
    (counts.hasBio ? 15 : 0) +
    (counts.hasLocationOrWebsite ? 15 : 0)
  if (profileSetupXp > 0) {
    breakdown.push({
      label: "Profile Setup",
      xp: profileSetupXp,
      detail: "Avatar, bio & links",
    })
  }

  if (counts.postsCount > 0) {
    breakdown.push({
      label: "Community Posts",
      xp: counts.postsCount * 35,
      detail: `${counts.postsCount} post${counts.postsCount === 1 ? "" : "s"} (35 XP ea)`,
    })
  }

  if (counts.commentsCount > 0) {
    breakdown.push({
      label: "Comments & Replies",
      xp: counts.commentsCount * 12,
      detail: `${counts.commentsCount} comment${counts.commentsCount === 1 ? "" : "s"} (12 XP ea)`,
    })
  }

  if (counts.starsReceived > 0) {
    breakdown.push({
      label: "Stars Earned",
      xp: counts.starsReceived * 15,
      detail: `${counts.starsReceived} ⭐ received (15 XP ea)`,
    })
  }

  if (counts.friendsCount > 0) {
    breakdown.push({
      label: "Friends Connected",
      xp: counts.friendsCount * 25,
      detail: `${counts.friendsCount} friend${counts.friendsCount === 1 ? "" : "s"} (25 XP ea)`,
    })
  }

  if (counts.ticketsCount > 0) {
    breakdown.push({
      label: "Live Show Tickets",
      xp: counts.ticketsCount * 60,
      detail: `${counts.ticketsCount} ticket order${counts.ticketsCount === 1 ? "" : "s"} (60 XP ea)`,
    })
  }

  const creatorXp = (counts.ownsBand ? 80 : 0) + counts.tracksUploaded * 40
  if (creatorXp > 0) {
    breakdown.push({
      label: "Artist & Music Catalog",
      xp: creatorXp,
      detail: `${counts.ownsBand ? "Registered Act" : ""}${counts.tracksUploaded > 0 ? ` • ${counts.tracksUploaded} track(s)` : ""}`.replace(/^ • /, ""),
    })
  }

  if (counts.bonusXp > 0) {
    breakdown.push({
      label: "Special Bonus XP",
      xp: counts.bonusXp,
      detail: "Event & milestone awards",
    })
  }

  const totalXp = breakdown.reduce((sum, b) => sum + b.xp, 0)

  let level = 1
  while (level < 100 && totalXp >= xpRequiredForLevel(level + 1)) {
    level += 1
  }

  const currentLevelFloorXp = xpRequiredForLevel(level)
  const nextLevelXp = xpRequiredForLevel(level + 1)
  const xpIntoLevel = Math.max(0, totalXp - currentLevelFloorXp)
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelFloorXp)
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpNeededForNext) * 100)))

  return {
    level,
    rankTitle: getRankTitle(level),
    totalXp,
    currentLevelFloorXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForNext,
    progressPercent,
    breakdown,
  }
}

export const PROFILE_FRAMES: ProfileFrameDef[] = [
  {
    id: "none",
    name: "Standard StarCast",
    unlockLevel: 1,
    description: "Classic StarCast Sunset Orange border.",
    ringClass: "bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] shadow-[0_0_20px_rgba(234,111,42,0.3)]",
    badgeClass: "bg-[#ea6f2a] text-white border-white/30",
  },
  {
    id: "cyan-pulse",
    name: "Cyan Signal Ring",
    unlockLevel: 1,
    description: "Crisp electric cyan broadcast ring.",
    ringClass: "bg-gradient-to-br from-[#20efe0] via-[#06b6d4] to-[#0284c7] shadow-[0_0_26px_rgba(32,239,224,0.45)]",
    badgeClass: "bg-[#20efe0] text-[#05051f] border-white/50",
  },
  {
    id: "sunset-flare",
    name: "Solar Flare",
    unlockLevel: 2,
    description: "Radiant solar gold-to-crimson corona.",
    ringClass: "bg-gradient-to-tr from-[#bc3f00] via-[#ea6f2a] to-[#ffd166] shadow-[0_0_30px_rgba(255,209,102,0.45)]",
    badgeClass: "bg-gradient-to-r from-[#ea6f2a] to-[#ffd166] text-[#05051f] border-white/50",
  },
  {
    id: "top-city-neon",
    name: "Top City Neon",
    unlockLevel: 3,
    description: "Electric magenta & neon cyan concert glow.",
    ringClass: "bg-gradient-to-tr from-[#e845d6] via-[#9333ea] to-[#20efe0] shadow-[0_0_32px_rgba(232,69,214,0.5)]",
    badgeClass: "bg-gradient-to-r from-[#e845d6] to-[#20efe0] text-[#05051f] border-white/50",
  },
  {
    id: "emerald-aurora",
    name: "Aurora Borealis",
    unlockLevel: 5,
    description: "Shimmering emerald & polar cyan plasma.",
    ringClass: "bg-gradient-to-br from-[#22b573] via-[#10b981] to-[#20efe0] shadow-[0_0_32px_rgba(34,181,115,0.5)]",
    badgeClass: "bg-[#22b573] text-[#05051f] border-white/50",
  },
  {
    id: "golden-star",
    name: "Golden Starlight",
    unlockLevel: 7,
    description: "Forged championship gold halo with warm starlight.",
    ringClass: "bg-gradient-to-b from-[#fffbeb] via-[#ffd166] to-[#d97706] shadow-[0_0_36px_rgba(255,209,102,0.65)]",
    badgeClass: "bg-[#ffd166] text-[#05051f] border-white/70",
  },
  {
    id: "void-vortex",
    name: "Quantum Vortex",
    unlockLevel: 10,
    description: "Animated orbital energy ring spinning through cosmic wavelengths.",
    ringClass: "bg-[#05052d] shadow-[0_0_38px_rgba(168,85,247,0.6)]",
    animatedConic: "conic-gradient(from 0deg, #20efe0, #e845d6, #ffd166, #7c3aed, #20efe0)",
    badgeClass: "bg-gradient-to-r from-[#7c3aed] to-[#e845d6] text-white border-white/50",
  },
  {
    id: "supernova-crown",
    name: "Supernova Sovereign",
    unlockLevel: 15,
    description: "Mythic prismatic plasma frame reserved for high-level legends.",
    ringClass: "bg-[#05052d] shadow-[0_0_45px_rgba(234,111,42,0.65),0_0_22px_rgba(32,239,224,0.55)]",
    animatedConic: "conic-gradient(from 0deg, #ffd166, #ea6f2a, #e845d6, #20efe0, #22b573, #ffd166)",
    badgeClass: "bg-gradient-to-r from-[#ffd166] via-[#ea6f2a] to-[#20efe0] text-[#05051f] border-white",
  },
]

export const PROFILE_BANNERS: ProfileBannerDef[] = [
  {
    id: "cosmic-grid",
    name: "Deep Space Grid",
    unlockLevel: 1,
    description: "Classic StarCast deep space star-matrix backdrop.",
    bgClass: "bg-gradient-to-br from-[#20205a] via-[#0c0c3f] to-[#05052d]",
    overlayPattern: "dots",
  },
  {
    id: "horizon-sunset",
    name: "Broadcast Sunset",
    unlockLevel: 1,
    description: "Warm sunset broadcast glow across deep indigo skies.",
    bgClass: "bg-gradient-to-r from-[#7c2d12] via-[#ea6f2a]/70 to-[#1e1b4b]",
    overlayPattern: "rays",
  },
  {
    id: "cyber-cyan",
    name: "Electric Telemetry",
    unlockLevel: 2,
    description: "High-frequency cyan telemetry grid over midnight navy.",
    bgClass: "bg-gradient-to-br from-[#042f4e] via-[#0e7490] to-[#090d2e]",
    overlayPattern: "grid",
  },
  {
    id: "top-city-nights",
    name: "Top City Nights",
    unlockLevel: 3,
    description: "Vibrant purple-pink & neon blue stage lights.",
    bgClass: "bg-gradient-to-r from-[#4a0e68] via-[#c72bb8] to-[#0aa6bd]",
    overlayPattern: "stars",
  },
  {
    id: "emerald-nebula",
    name: "Emerald Nebula",
    unlockLevel: 5,
    description: "Glowing emerald & teal aurora clouds drifting across space.",
    bgClass: "bg-gradient-to-br from-[#022c22] via-[#059669]/80 to-[#0f172a]",
    overlayPattern: "stars",
  },
  {
    id: "solar-eclipse",
    name: "Golden Eclipse",
    unlockLevel: 7,
    description: "Radiant golden solar corona breaking over the horizon.",
    bgClass: "bg-gradient-to-tr from-[#1c0f04] via-[#b45309] to-[#ffd166]/85",
    overlayPattern: "rays",
  },
  {
    id: "ultraviolet-warp",
    name: "Ultraviolet Warp",
    unlockLevel: 10,
    description: "Deep hyperdrive violet & magenta starfield.",
    bgClass: "bg-gradient-to-r from-[#1e1b4b] via-[#6d28d9] to-[#db2777]",
    overlayPattern: "grid",
  },
  {
    id: "supernova-prism",
    name: "Supernova Prism",
    unlockLevel: 15,
    description: "Legendary multi-spectrum cosmic nebula reserved for top ranks.",
    bgClass: "bg-gradient-to-r from-[#ea6f2a] via-[#c026d3] to-[#20efe0]",
    overlayPattern: "stars",
  },
]

export function getFrameById(id?: string | null): ProfileFrameDef {
  return PROFILE_FRAMES.find((f) => f.id === id) || PROFILE_FRAMES[0]
}

export function getBannerById(id?: string | null): ProfileBannerDef {
  return PROFILE_BANNERS.find((b) => b.id === id) || PROFILE_BANNERS[0]
}
