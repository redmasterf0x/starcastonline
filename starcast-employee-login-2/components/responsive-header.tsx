"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  Menu,
  X,
  PanelLeft,
  LayoutDashboard,
  Users,
  Music,
  MessageSquare,
  Calendar,
  Shield,
  HelpCircle,
  Tv,
  FileText,
  ShoppingBag,
  Sparkles,
  Info,
  LogOut,
  LogIn,
  ChevronRight,
  User,
  Radio,
} from "lucide-react"
import { brandAssets } from "@/lib/brand-assets"
import { authClient } from "@/lib/auth-client"
import { getMyProfile } from "@/app/actions/profile"
import { getUnreadNotificationCount } from "@/app/actions/notifications"

interface ResponsiveHeaderProps {
  currentPage?: string
  isAdmin?: boolean
  isCrew?: boolean
  isLoggedIn?: boolean
  onSignOut?: () => void
  onLogin?: () => void
}

export function ResponsiveHeader({
  currentPage,
  isAdmin: isAdminProp,
  isCrew: isCrewProp,
  isLoggedIn: isLoggedInProp,
  onSignOut,
  onLogin,
}: ResponsiveHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(isLoggedInProp ?? false)
  const [isAdmin, setIsAdmin] = useState(isAdminProp ?? false)
  const [isCrew, setIsCrew] = useState(isCrewProp ?? false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [userProfile, setUserProfile] = useState<any>(null)

  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (isAdminProp !== undefined) setIsAdmin(isAdminProp)
    if (isCrewProp !== undefined) setIsCrew(isCrewProp)
    if (isLoggedInProp !== undefined) setLoggedIn(isLoggedInProp)

    if (session?.user) {
      setLoggedIn(true)
      getUnreadNotificationCount().then((count) => setUnreadNotifs(count)).catch(() => {})
      getMyProfile()
        .then((profile: any) => {
          if (profile) {
            setUserProfile(profile)
            if (isAdminProp === undefined && isCrewProp === undefined) {
              const isAdminUser = Boolean(profile.isAdmin || profile.role === "admin")
              const isCrewUser = Boolean(isAdminUser || profile.isEmployee || profile.role === "staff")
              setIsAdmin(isAdminUser)
              setIsCrew(isCrewUser)
            }
          }
        })
        .catch(() => {
          // Not signed in or no profile yet
        })
    } else if (session === null) {
      if (isLoggedInProp === undefined) setLoggedIn(false)
      if (isAdminProp === undefined) setIsAdmin(false)
      if (isCrewProp === undefined) setIsCrew(false)
      setUserProfile(null)
      setUnreadNotifs(0)
    }
  }, [session, isAdminProp, isCrewProp, isLoggedInProp])

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDesktopDrawerOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogin = () => {
    if (onLogin) {
      onLogin()
    } else {
      window.location.href = "/login"
    }
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      await authClient.signOut()
      window.location.href = "/"
    }
  }

  // DESKTOP: Streamlined top header links (Dashboards, Community, Bands, Portal, Production, Admin moved to Left Drawer)
  const desktopNavLinks: { href: string; label: string; show: boolean; external?: boolean }[] = [
    { href: "/", label: "Home", show: true },
    { href: "/watch", label: "Watch", show: true },
    { href: "/articles", label: "Articles", show: true },
    { href: "/music", label: "Music", show: true },
    { href: "/merch", label: "Merch", show: true },
    { href: "/information", label: "Information", show: true },
  ]

  // MOBILE: Complete navigation list for mobile hamburger menu
  const mobileNavLinks: { href: string; label: string; show: boolean; external?: boolean }[] = [
    { href: "/", label: "Home", show: true },
    { href: "/watch", label: "Watch", show: true },
    { href: "/articles", label: "Articles", show: true },
    { href: "/music", label: "Music", show: true },
    { href: "/community", label: "Community", show: true },
    { href: "/bands", label: "Bands", show: true },
    { href: "/portal", label: "Artist Portal", show: true },
    { href: "/information", label: "Information", show: true },
    { href: "/merch", label: "Merch", show: true },
    { href: "/quiz", label: "Quiz", show: true },
    { href: "/production", label: "Production", show: isCrew || isAdmin },
    { href: "/dashboard", label: "Dashboard", show: loggedIn },
    { href: "/admin", label: "Admin", show: isAdmin },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#38bdf8]/40 bg-[#0284c7] shadow-[0_8px_30px_rgba(2,132,199,0.35)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
            {/* Left section: Left Hubs Drawer button + StarCast Logo */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Desktop Left Menu Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setDesktopDrawerOpen(true)}
                className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/25 bg-[#05052d]/75 hover:bg-[#0c0c3f] text-[#f5f7ff] hover:text-[#ffd166] hover:border-[#ffd166]/60 transition-all text-xs font-bold shadow-md group shrink-0"
                aria-label="Open Left Navigation Hubs"
                title="Open Hubs & Dashboards"
              >
                <PanelLeft className="w-4 h-4 text-[#ffd166] group-hover:scale-110 transition-transform" />
                <span>Hubs</span>
                {unreadNotifs > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-pulse" />
                )}
              </button>

              {/* Left-aligned, Bigger StarCast Online Logo with BETA Tag */}
              <Link href="/" className="flex items-center gap-3 sm:gap-3.5 transition-all hover:opacity-90 group shrink-0">
                <div className="relative flex items-center justify-center">
                  <img
                    src={brandAssets.capstone.white || "/placeholder.svg"}
                    alt="StarCast Mascot"
                    className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex flex-col text-left leading-none">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white drop-shadow-md">
                        STARCAST
                      </span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-[#ffd166] drop-shadow-md">
                        ONLINE
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#ea6f2a] px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-md border border-white/40 ring-1 ring-[#ea6f2a]/50">
                    BETA
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (Streamlined on desktop) */}
            <nav className="hidden items-center gap-1 rounded-full border border-white/20 bg-[#05052d]/60 p-1 shadow-inner backdrop-blur-md lg:flex">
              {desktopNavLinks.map(
                (link) =>
                  link.show && (
                    <Link
                      key={link.href}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                        currentPage === link.href
                          ? "bg-[#ea6f2a] text-white shadow-sm font-bold"
                          : link.label === "Merch"
                            ? "text-[#ffd166] font-semibold hover:bg-white/15 hover:text-white"
                            : "text-[#e2e8f0] hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
              )}
            </nav>

            {/* Auth buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {loggedIn ? (
                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-[#05052d]/60 text-white hover:bg-[#05052d] hover:text-white"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleLogin}
                  size="sm"
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-md shadow-[#ea6f2a]/30 border border-white/20"
                >
                  Sign In / Sign Up
                </Button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="rounded-lg p-2 text-[#e4e7f5] transition-colors hover:bg-[#8796cb]/15 hover:text-[#f5f7ff] lg:hidden relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ea6f2a] animate-pulse" />
              )}
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu (Comprehensive on mobile) */}
        {mobileMenuOpen && (
          <div className="flex flex-col gap-2.5 border-t border-[#6477b8]/35 bg-[#1d2053]/96 px-4 py-4 shadow-xl backdrop-blur-xl lg:hidden max-h-[80vh] overflow-y-auto">
            {mobileNavLinks.map(
              (link) =>
                link.show && (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium py-2 px-2.5 rounded-xl transition-colors flex items-center justify-between ${
                      currentPage === link.href
                        ? "bg-[#ea6f2a]/20 text-[#ea6f2a] font-bold"
                        : "text-[#d4d8ee] hover:bg-white/10 hover:text-[#f5f7ff]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.href === "/dashboard" && unreadNotifs > 0 && (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-[#ea6f2a] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadNotifs}
                      </span>
                    )}
                  </Link>
                )
            )}
            <div className="pt-3 border-t border-[#20205a]/60">
              {loggedIn ? (
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="w-full border-[#aeb8dd]/45 bg-[#303568]/35 text-[#e4e7f5] hover:bg-[#8796cb]/20 hover:text-[#f5f7ff]"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  size="sm"
                  className="w-full bg-[#ea6f2a] hover:bg-[#f2854a] text-white font-bold"
                >
                  Sign In / Sign Up
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* DESKTOP LEFT DRAWER (Slide-out menu for Dashboards, Bands, Community, Portal, etc.) */}
      {desktopDrawerOpen && (
        <div className="fixed inset-0 z-[100] hidden lg:block">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDesktopDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside
            className="fixed inset-y-0 left-0 w-80 xl:w-96 bg-gradient-to-b from-[#090938] via-[#060624] to-[#04041a] border-r border-[#20205a]/80 shadow-[0_0_60px_rgba(0,0,0,0.85)] z-10 flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="StarCast Hubs Menu"
          >
            {/* Top drawer header */}
            <div className="p-5 border-b border-[#20205a]/70 bg-[#0c0c3f]/60 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setDesktopDrawerOpen(false)}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <img
                  src={brandAssets.capstone.white || "/placeholder.svg"}
                  alt="StarCast Mascot"
                  className="w-10 h-10 object-contain drop-shadow"
                />
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-lg font-black text-white tracking-wider">STARCAST</span>
                    <span className="text-lg font-black text-[#ffd166] tracking-wider">ONLINE</span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-[#20efe0] tracking-widest mt-1">
                    HUBS & DASHBOARDS
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setDesktopDrawerOpen(false)}
                className="p-1.5 rounded-xl border border-[#20205a] bg-[#05052d] text-[#9a9fc4] hover:text-white hover:border-[#20efe0]/50 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable drawer nav content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* SECTION 1: DASHBOARDS & MEMBER HUBS */}
              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#ffd166] uppercase mb-2.5 px-2 flex items-center justify-between">
                  <span>Dashboards & Hubs</span>
                  <span className="text-[9px] text-[#9a9fc4] font-normal">Direct Access</span>
                </div>
                <div className="space-y-1.5">
                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      currentPage === "/dashboard"
                        ? "border-[#ea6f2a] bg-[#ea6f2a]/15 text-white"
                        : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#20efe0]/40 text-[#cbd0f2] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a] shrink-0">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-tight">Member Dashboard</div>
                        <div className="text-[11px] text-[#9a9fc4]">Profile, notifications & settings</div>
                      </div>
                    </div>
                    {unreadNotifs > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#ea6f2a] text-white text-[11px] font-bold font-mono animate-pulse">
                        {unreadNotifs}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                    )}
                  </Link>

                  {/* Bands & Artists Directory */}
                  <Link
                    href="/bands"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      currentPage === "/bands"
                        ? "border-[#ffd166] bg-[#ffd166]/15 text-white"
                        : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#ffd166]/40 text-[#cbd0f2] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166] shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-tight">Bands & Artists</div>
                        <div className="text-[11px] text-[#9a9fc4]">Band pages, music rosters & bios</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                  </Link>

                  {/* The DECK & Community */}
                  <Link
                    href="/community"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      currentPage === "/community"
                        ? "border-[#20efe0] bg-[#20efe0]/15 text-white"
                        : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#20efe0]/40 text-[#cbd0f2] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0] shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-tight">The DECK & Community</div>
                        <div className="text-[11px] text-[#9a9fc4]">Daily wall, discussions & DMs</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                  </Link>

                  {/* Artist & Soundstage Portal */}
                  <Link
                    href="/portal"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      currentPage === "/portal"
                        ? "border-[#22b573] bg-[#22b573]/15 text-white"
                        : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#22b573]/40 text-[#cbd0f2] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#22b573]/15 border border-[#22b573]/30 flex items-center justify-center text-[#22b573] shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold leading-tight">Artist & Studio Portal</div>
                        <div className="text-[11px] text-[#9a9fc4]">Track uploads, bookings & masters</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                  </Link>

                  {/* Production (if crew/admin) */}
                  {(isCrew || isAdmin) && (
                    <Link
                      href="/production"
                      onClick={() => setDesktopDrawerOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        currentPage === "/production"
                          ? "border-[#ea6f2a] bg-[#ea6f2a]/15 text-white"
                          : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#ea6f2a]/40 text-[#cbd0f2] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a] shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Production & Crew</div>
                          <div className="text-[11px] text-[#9a9fc4]">Staff calendar & call sheets</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                    </Link>
                  )}

                  {/* Admin (if admin) */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setDesktopDrawerOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        currentPage === "/admin"
                          ? "border-[#ef4444] bg-[#ef4444]/15 text-white"
                          : "border-[#20205a]/50 bg-[#0c0c3f]/40 hover:bg-[#0c0c3f] hover:border-[#ef4444]/40 text-[#cbd0f2] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Admin Center</div>
                          <div className="text-[11px] text-[#9a9fc4]">Approvals, roles & telemetry</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9a9fc4]" />
                    </Link>
                  )}
                </div>
              </div>

              {/* SECTION 2: EXPLORE & MORE */}
              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#20efe0] uppercase mb-2 px-2">
                  Network & Explore
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/quiz"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#20205a]/60 bg-[#0c0c3f]/30 hover:bg-[#0c0c3f] hover:border-[#ffd166]/40 text-[#cbd0f2] hover:text-[#ffd166] transition-all font-semibold"
                  >
                    <HelpCircle className="w-4 h-4 text-[#ffd166] shrink-0" />
                    <span className="truncate">Trivia Quiz</span>
                  </Link>
                  <Link
                    href="/watch"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#20205a]/60 bg-[#0c0c3f]/30 hover:bg-[#0c0c3f] hover:border-[#20efe0]/40 text-[#cbd0f2] hover:text-white transition-all font-semibold"
                  >
                    <Tv className="w-4 h-4 text-[#20efe0] shrink-0" />
                    <span className="truncate">Watch Shows</span>
                  </Link>
                  <Link
                    href="/music"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#20205a]/60 bg-[#0c0c3f]/30 hover:bg-[#0c0c3f] hover:border-[#22b573]/40 text-[#cbd0f2] hover:text-white transition-all font-semibold"
                  >
                    <Music className="w-4 h-4 text-[#22b573] shrink-0" />
                    <span className="truncate">Music Hub</span>
                  </Link>
                  <Link
                    href="/merch"
                    onClick={() => setDesktopDrawerOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#20205a]/60 bg-[#0c0c3f]/30 hover:bg-[#0c0c3f] hover:border-[#ea6f2a]/40 text-[#cbd0f2] hover:text-[#ea6f2a] transition-all font-semibold"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#ea6f2a] shrink-0" />
                    <span className="truncate">Shop Merch</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom session / Auth card inside drawer */}
            <div className="p-4 border-t border-[#20205a]/70 bg-[#0c0c3f]/80">
              {loggedIn ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {userProfile?.displayName || userProfile?.username || session?.user?.name || "Member"}
                      </div>
                      <div className="text-[10px] text-[#ffd166] font-mono">
                        {isAdmin ? "Admin" : isCrew ? "Staff" : "Member"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setDesktopDrawerOpen(false)
                      handleSignOut()
                    }}
                    variant="outline"
                    size="sm"
                    className="border-[#20205a] bg-[#05052d] text-[#cbd0f2] hover:text-white hover:bg-[#ea6f2a] hover:border-[#ea6f2a] text-xs h-8 px-3 rounded-xl shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setDesktopDrawerOpen(false)
                    handleLogin()
                  }}
                  className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-[#ea6f2a]/20"
                >
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In / Sign Up
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default ResponsiveHeader
