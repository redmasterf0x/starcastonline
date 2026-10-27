"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Music,
  Radio,
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
  MessageSquare,
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
        .then((res) => {
          if (!mounted || !res.profile) return
          setUserProfile(res.profile)
          const p = res.profile
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

  return (
    <aside
      className={`hidden lg:flex lg:w-64 xl:w-72 flex-col shrink-0 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-[#20205a]/60 bg-[#060624]/95 backdrop-blur-xl z-30 ${className}`}
      aria-label="Desktop Navigation Rail"
    >
      {/* Scrollable Upper Navigation */}
      <div className="flex-1 overflow-y-auto shows-row-scroll p-3.5 space-y-4">
        {/* ── SECTION 1: WORKSPACES & HUBS ── */}
        <div className="rounded-2xl border border-[#20205a]/70 bg-[#0c0c3f]/50 backdrop-blur-md p-3.5 shadow-xl space-y-1.5">
        <div className="flex items-center justify-between px-2 pb-1.5 border-b border-[#20205a]/40">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#ffd166] uppercase">
            Hubs & Spaces
          </span>
          <span className="text-[10px] text-[#9a9fc4] font-mono">STARCAST</span>
        </div>

        {/* Member Dashboard */}
        <Link
          href="/dashboard"
          className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            currentPage === "/dashboard"
              ? "border-[#ea6f2a] bg-[#ea6f2a]/15 text-white"
              : "border-transparent hover:border-[#ea6f2a]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a] shrink-0 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">Member Dashboard</div>
              <div className="text-[10px] text-[#9a9fc4] truncate">Feed, bookmarks & profile</div>
            </div>
          </div>
          {unreadNotifs > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#ea6f2a] text-white shrink-0">
              {unreadNotifs}
            </span>
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          )}
        </Link>

        {/* The DECK & Community */}
        <Link
          href="/community"
          className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            currentPage === "/community"
              ? "border-[#ffd166] bg-[#ffd166]/15 text-white"
              : "border-transparent hover:border-[#ffd166]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166] shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">The DECK & Community</div>
              <div className="text-[10px] text-[#9a9fc4] truncate">Daily wall & discussions</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* Bands & Artists Directory */}
        <Link
          href="/bands"
          className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            currentPage === "/bands"
              ? "border-[#20efe0] bg-[#20efe0]/15 text-white"
              : "border-transparent hover:border-[#20efe0]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0] shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">Bands & Artists</div>
              <div className="text-[10px] text-[#9a9fc4] truncate">Catalog & live rosters</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* Artist & Studio Portal */}
        <Link
          href="/portal"
          className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            currentPage === "/portal"
              ? "border-[#22b573] bg-[#22b573]/15 text-white"
              : "border-transparent hover:border-[#22b573]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#22b573]/15 border border-[#22b573]/30 flex items-center justify-center text-[#22b573] shrink-0 group-hover:scale-105 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">Artist & Studio Portal</div>
              <div className="text-[10px] text-[#9a9fc4] truncate">Music uploads & booking</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* Production & Crew (Staff/Admin) */}
        {(isCrew || isAdmin) && (
          <Link
            href="/production"
            className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              currentPage === "/production"
                ? "border-[#ea6f2a] bg-[#ea6f2a]/15 text-white"
                : "border-transparent hover:border-[#ea6f2a]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a] shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">Production & Crew</div>
                <div className="text-[10px] text-[#9a9fc4] truncate">Staff calendar & ops</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}

        {/* Admin Center (Admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              currentPage === "/admin"
                ? "border-[#ef4444] bg-[#ef4444]/15 text-white"
                : "border-transparent hover:border-[#ef4444]/30 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">Admin Center</div>
                <div className="text-[10px] text-[#9a9fc4] truncate">Roles & approvals</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#9a9fc4] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}
      </div>

      {/* ── SECTION 2: EXPLORE & NETWORK ── */}
      <div className="rounded-2xl border border-[#20205a]/70 bg-[#0c0c3f]/50 backdrop-blur-md p-3.5 shadow-xl space-y-1">
        <div className="flex items-center justify-between px-2 pb-1.5 border-b border-[#20205a]/40">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#20efe0] uppercase">
            Explore & Media
          </span>
        </div>

        {/* Trivia Quiz */}
        <Link
          href="/quiz"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
            currentPage === "/quiz"
              ? "bg-[#ffd166]/15 text-[#ffd166] font-bold"
              : "hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-[#ffd166]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <HelpCircle className="w-4 h-4 text-[#ffd166] shrink-0" />
            <span>Trivia Quiz</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#ffd166]/15 text-[#ffd166] border border-[#ffd166]/30">
            Challenge
          </span>
        </Link>

        {/* Watch Shows */}
        <Link
          href="/watch"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
            currentPage === "/watch"
              ? "bg-[#20efe0]/15 text-[#20efe0] font-bold"
              : "hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Tv className="w-4 h-4 text-[#20efe0] shrink-0" />
            <span>Watch Shows</span>
          </div>
        </Link>

        {/* Music Hub */}
        <Link
          href="/music"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
            currentPage === "/music"
              ? "bg-[#22b573]/15 text-[#22b573] font-bold"
              : "hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Music className="w-4 h-4 text-[#22b573] shrink-0" />
            <span>Music Hub</span>
          </div>
        </Link>

        {/* Shop Merch */}
        <Link
          href="/merch"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
            currentPage === "/merch"
              ? "bg-[#ea6f2a]/15 text-[#ea6f2a] font-bold"
              : "hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-[#ea6f2a]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <ShoppingBag className="w-4 h-4 text-[#ea6f2a] shrink-0" />
            <span>Official Merch</span>
          </div>
        </Link>

        {/* Studio & Network Info */}
        <Link
          href="/information"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
            currentPage === "/information"
              ? "bg-white/10 text-white font-bold"
              : "hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-[#9a9fc4] shrink-0" />
            <span>About Studio</span>
          </div>
        </Link>
      </div>
      </div>

      {/* ── SECTION 3: DOCKED MEMBER PROFILE / AUTH BAR ── */}
      <div className="p-3.5 border-t border-[#20205a]/60 bg-[#050520]/90 shrink-0">
        {loggedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center text-[#ea6f2a] font-bold shrink-0 overflow-hidden">
                {userProfile?.profilePic ? (
                  <img
                    src={userProfile.profilePic}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {userProfile?.displayName || userProfile?.username || session?.user?.name || "Member"}
                </div>
                <div className="text-[10px] text-[#ffd166] font-mono flex items-center gap-1.5">
                  <span>{isAdmin ? "Admin" : isCrew ? "Staff" : "Member"}</span>
                  {userProfile?.username && (
                    <span className="text-[#9a9fc4] truncate">@{userProfile.username}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[#20205a]/50">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 border-[#20205a] bg-[#05052d] text-[#cbd0f2] hover:text-white hover:bg-[#0c0c3f] text-[11px] h-7 rounded-lg"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-[#20205a] bg-[#05052d] text-[#cbd0f2] hover:text-white hover:bg-[#ea6f2a]/80 text-[11px] h-7 px-2.5 rounded-lg shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2.5">
            <div className="text-xs font-bold text-white">Join the Community</div>
            <p className="text-[11px] text-[#9a9fc4] leading-relaxed">
              Post on The DECK, connect with Topeka musicians & access studio tools.
            </p>
            <Button
              asChild
              className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold text-xs h-8 rounded-xl shadow-lg shadow-[#ea6f2a]/20"
            >
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In / Sign Up
              </Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default DesktopLeftNav
