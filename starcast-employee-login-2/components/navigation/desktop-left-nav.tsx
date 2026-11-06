"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Music,
  Calendar,
  Shield,
  HelpCircle,
  Tv,
  ShoppingBag,
  Info,
  LogOut,
  LogIn,
  ChevronRight,
  User,
  Sparkles,
  FileText,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { getMyProfile } from "@/app/actions/profile"
import { getUnreadNotificationCount } from "@/app/actions/notifications"

interface DesktopLeftNavProps {
  currentPage?: string
  className?: string
}

export function DesktopLeftNav({ currentPage = "/", className = "" }: DesktopLeftNavProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [loggedIn, setLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  useEffect(() => {
    let mounted = true

    if (session?.user) {
      setLoggedIn(true)
      getMyProfile()
        .then((res: any) => {
          const profile = res?.profile || res
          if (!mounted || !profile) return
          setUserProfile(profile)
          const p = profile
          const isStaff =
            p.role === "staff" ||
            p.role === "admin" ||
            Boolean(p.isEmployee) ||
            Boolean(p.isAdmin)
          const isAdm = p.role === "admin" || Boolean(p.isAdmin)
          setIsAdmin(isAdm)
          setIsCrew(isStaff)
        })
        .catch(() => {})

      getUnreadNotificationCount()
        .then((count) => {
          if (mounted) setUnreadNotifs(count)
        })
        .catch(() => {})
    } else {
      setLoggedIn(false)
      setUserProfile(null)
      setIsAdmin(false)
      setIsCrew(false)
    }

    return () => {
      mounted = false
    }
  }, [session])

  const handleSignOut = async () => {
    await authClient.signOut()
    setLoggedIn(false)
    setUserProfile(null)
    router.push("/")
  }

  const isMusicActive =
    currentPage === "/music" ||
    currentPage?.startsWith("/music/") ||
    currentPage === "/bands" ||
    currentPage?.startsWith("/bands/")

  const mainNavItems = [
    {
      href: "/",
      label: "Home",
      caption: "Broadcasts, Shows & News",
      icon: Home,
      active: currentPage === "/",
      accent: "#ea6f2a",
      iconBg: "from-[#ea6f2a]/25 to-[#ea6f2a]/5 border-[#ea6f2a]/40 text-[#ea6f2a]",
    },
    {
      href: "/watch",
      label: "Watch Shows",
      caption: "Episodes & Live Streams",
      icon: Tv,
      active: currentPage === "/watch" || currentPage?.startsWith("/shows"),
      accent: "#20efe0",
      iconBg: "from-[#20efe0]/25 to-[#20efe0]/5 border-[#20efe0]/40 text-[#20efe0]",
    },
    {
      href: "/music",
      label: "Music",
      caption: "Songs, Artists, Bands & DJs",
      icon: Music,
      active: isMusicActive,
      accent: "#38ef7d",
      iconBg: "from-emerald-500/25 to-emerald-500/5 border-emerald-400/40 text-emerald-400",
    },
    {
      href: "/articles",
      label: "Articles",
      caption: "Stories, Reviews & Press",
      icon: FileText,
      active: currentPage === "/articles" || currentPage?.startsWith("/articles/"),
      accent: "#38bdf8",
      iconBg: "from-sky-500/25 to-sky-500/5 border-sky-400/40 text-sky-400",
    },
  ]

  const communityNavItems = [
    {
      href: "/community",
      label: "The DECK",
      caption: "Community Wall, Polls & DMs",
      icon: Sparkles,
      active: currentPage === "/community",
      accent: "#ffd166",
      iconBg: "from-[#ffd166]/25 to-[#ffd166]/5 border-[#ffd166]/40 text-[#ffd166]",
    },
    {
      href: "/merch",
      label: "Merch Store",
      caption: "Official Apparel & Gear",
      icon: ShoppingBag,
      active: currentPage === "/merch" || currentPage?.startsWith("/merch/"),
      accent: "#f472b6",
      iconBg: "from-pink-500/25 to-pink-500/5 border-pink-400/40 text-pink-400",
    },
    {
      href: "/quiz",
      label: "Trivia Quiz",
      caption: "Show & Lore Challenge",
      icon: HelpCircle,
      active: currentPage === "/quiz",
      accent: "#a78bfa",
      iconBg: "from-violet-500/25 to-violet-500/5 border-violet-400/40 text-violet-400",
      badgeText: "PLAY",
    },
    {
      href: "/information",
      label: "About StarCast",
      caption: "Network & Studio Info",
      icon: Info,
      active: currentPage === "/information",
      accent: "#94a3b8",
      iconBg: "from-slate-500/25 to-slate-500/5 border-slate-400/40 text-slate-300",
    },
  ]

  return (
    <aside
      className={`hidden lg:flex lg:w-64 xl:w-68 flex-col shrink-0 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-white/[0.08] bg-gradient-to-b from-[#080926] via-[#05061a] to-[#030311] z-30 select-none relative overflow-hidden ${className}`}
      aria-label="Desktop Navigation Rail"
    >
      {/* Subtle Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 rounded-full bg-[#20efe0]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 -right-20 w-52 h-52 rounded-full bg-[#ea6f2a]/10 blur-3xl" />

      {/* Top Network Status Strip */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#e2e8f0]">
              ON AIR // TOPEKA
            </span>
          </div>
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#ea6f2a]/20 text-[#ffd166] border border-[#ea6f2a]/30">
            24/7
          </span>
        </div>
      </div>

      {/* Scrollable Navigation Rail */}
      <div className="flex-1 overflow-y-auto shows-row-scroll px-3 py-2 space-y-5">
        {/* ── GROUP 1: BROADCAST & MUSIC ── */}
        <div className="space-y-1">
          <div className="px-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#7f84ad]">
              Broadcast &amp; Music
            </span>
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  item.active
                    ? "bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    : "text-[#b8bddc] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: item.accent, color: item.accent }}
                  />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-[#7f84ad] group-hover:text-[#9a9fc4] truncate mt-0.5">
                      {item.caption}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-all ${
                    item.active
                      ? "text-white opacity-90 translate-x-0.5"
                      : "text-[#7f84ad] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                  }`}
                />
              </Link>
            )
          })}
        </div>

        {/* ── GROUP 2: COMMUNITY & INTERACTIVE ── */}
        <div className="space-y-1 pt-2 border-t border-white/[0.06]">
          <div className="px-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#7f84ad]">
              Community &amp; Network
            </span>
          </div>

          {communityNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  item.active
                    ? "bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    : "text-[#b8bddc] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: item.accent, color: item.accent }}
                  />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-[#7f84ad] group-hover:text-[#9a9fc4] truncate mt-0.5">
                      {item.caption}
                    </div>
                  </div>
                </div>
                {item.badgeText ? (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-400/30 shrink-0">
                    {item.badgeText}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-all ${
                      item.active
                        ? "text-white opacity-90 translate-x-0.5"
                        : "text-[#7f84ad] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                    }`}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* ── GROUP 3: MEMBER & CREW WORKSPACE ── */}
        <div className="space-y-1 pt-2 border-t border-white/[0.06]">
          <div className="px-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#7f84ad]">
              Workspace
            </span>
          </div>

          {/* Member Dashboard */}
          <Link
            href="/dashboard"
            className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
              currentPage === "/dashboard"
                ? "bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                : "text-[#b8bddc] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {currentPage === "/dashboard" && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#ea6f2a] shadow-[0_0_12px_#ea6f2a]" />
            )}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ea6f2a]/25 to-[#ea6f2a]/5 border border-[#ea6f2a]/40 text-[#ea6f2a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">My Dashboard</div>
                <div className="text-[10px] text-[#7f84ad] group-hover:text-[#9a9fc4] truncate mt-0.5">
                  Profile, Saved &amp; Alerts
                </div>
              </div>
            </div>
            {unreadNotifs > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#ea6f2a] text-white shrink-0">
                {unreadNotifs}
              </span>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#7f84ad] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            )}
          </Link>

          {/* Production & Crew (Staff/Admin) */}
          {(isCrew || isAdmin) && (
            <Link
              href="/production"
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                currentPage === "/production"
                  ? "bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent text-white"
                  : "text-[#b8bddc] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {currentPage === "/production" && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-500/5 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Production &amp; Crew</div>
                  <div className="text-[10px] text-[#7f84ad] group-hover:text-[#9a9fc4] truncate mt-0.5">
                    Schedule &amp; Staff Ops
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#7f84ad] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </Link>
          )}

          {/* Admin Center (Admin) */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                currentPage === "/admin" || currentPage?.startsWith("/admin/")
                  ? "bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent text-white"
                  : "text-[#b8bddc] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {(currentPage === "/admin" || currentPage?.startsWith("/admin/")) && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/25 to-rose-500/5 border border-rose-400/40 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Admin Control</div>
                  <div className="text-[10px] text-[#7f84ad] group-hover:text-[#9a9fc4] truncate mt-0.5">
                    Users, Content &amp; Support
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#7f84ad] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* ── DOCKED USER FOOTER ── */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#040414]/90 backdrop-blur-md shrink-0">
        {loggedIn ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ea6f2a] to-[#20efe0] p-0.5 shrink-0">
                <div className="w-full h-full rounded-[10px] bg-[#05051f] flex items-center justify-center overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img
                      src={userProfile.profilePic}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-[#ffd166]" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {userProfile?.displayName || userProfile?.username || session?.user?.name || "Member"}
                </div>
                <div className="text-[10px] font-mono flex items-center gap-1.5">
                  <span className="text-[#20efe0] font-semibold">
                    {isAdmin ? "Admin" : isCrew ? "Staff" : "Member"}
                  </span>
                  {userProfile?.username && (
                    <span className="text-[#7f84ad] truncate">@{userProfile.username}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 border-white/10 bg-white/[0.03] text-[#cbd0f2] hover:text-white hover:bg-white/[0.08] text-[11px] h-7 rounded-lg"
              >
                <Link href="/dashboard">Profile</Link>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/[0.03] text-[#cbd0f2] hover:text-white hover:bg-rose-500/80 hover:border-rose-500 text-[11px] h-7 px-2.5 rounded-lg shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#ea6f2a]/10 via-[#0c0c3f]/40 to-[#20efe0]/10 p-3.5 text-center space-y-2">
            <div className="text-xs font-bold text-white">Join StarCast Online</div>
            <p className="text-[11px] text-[#9a9fc4] leading-snug">
              Post on The DECK, follow artists &amp; create your own music page.
            </p>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#d65b18] hover:opacity-95 text-white font-bold text-xs h-8 rounded-xl shadow-lg shadow-[#ea6f2a]/20"
            >
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In / Join
              </Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default DesktopLeftNav
