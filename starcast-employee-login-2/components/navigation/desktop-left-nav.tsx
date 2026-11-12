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
  LogOut,
  User,
  Sparkles,
  FileText,
  Home,
} from "lucide-react"
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

  // Only show the left nav bar when signed in
  if (!loggedIn) {
    return null
  }

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

  const primaryLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: currentPage === "/dashboard",
      badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
    },
    {
      href: "/community",
      label: "The DECK",
      icon: Sparkles,
      active: currentPage === "/community",
    },
    {
      href: "/music",
      label: "Music",
      icon: Music,
      active: isMusicActive,
    },
    {
      href: "/watch",
      label: "Watch Shows",
      icon: Tv,
      active: currentPage === "/watch" || currentPage?.startsWith("/shows"),
    },
    {
      href: "/articles",
      label: "Articles",
      icon: FileText,
      active: currentPage === "/articles" || currentPage?.startsWith("/articles/"),
    },
    {
      href: "/merch",
      label: "Merch",
      icon: ShoppingBag,
      active: currentPage === "/merch" || currentPage?.startsWith("/merch/"),
    },
    {
      href: "/quiz",
      label: "Trivia Quiz",
      icon: HelpCircle,
      active: currentPage === "/quiz",
    },
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: currentPage === "/",
    },
  ]

  const staffLinks = [
    ...(isCrew || isAdmin
      ? [
          {
            href: "/production",
            label: "Production",
            icon: Calendar,
            active: currentPage === "/production",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: Shield,
            active: currentPage === "/admin" || currentPage?.startsWith("/admin/"),
          },
        ]
      : []),
  ]

  const displayName =
    userProfile?.displayName ||
    (userProfile?.firstName
      ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
      : null) ||
    userProfile?.username ||
    session?.user?.name ||
    "Member"

  return (
    <aside
      className={`hidden lg:flex lg:w-56 xl:w-60 flex-col shrink-0 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-[#38bdf8]/25 bg-gradient-to-b from-[#162058] via-[#111845] to-[#0c1136] shadow-[4px_0_24px_rgba(2,132,199,0.18)] z-40 select-none relative overflow-hidden ${className}`}
      aria-label="Member Navigation"
    >
      {/* Bright Top Sky-Blue Ambient Glow */}
      <div className="pointer-events-none absolute -top-16 -left-12 w-48 h-48 rounded-full bg-[#38bdf8]/20 blur-3xl" />

      {/* Prominent User Profile Header at the Top */}
      <div className="px-3.5 pt-4 pb-3.5 border-b border-white/[0.12] relative z-10">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.15] transition-all shadow-sm"
        >
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#ea6f2a] via-[#ffd166] to-[#20efe0] p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-[#0f1642] flex items-center justify-center overflow-hidden">
              {userProfile?.profilePic ? (
                <img
                  src={userProfile.profilePic}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-[#ffd166]" />
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#111845]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate group-hover:text-[#ffd166] transition-colors">
              {displayName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {userProfile?.username ? (
                <span className="text-xs text-[#bae6fd] font-medium truncate">
                  @{userProfile.username}
                </span>
              ) : (
                <span className="text-xs text-[#bae6fd] font-medium truncate">
                  {isAdmin ? "Admin" : isCrew ? "Staff" : "Member"}
                </span>
              )}
              {(isAdmin || isCrew) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/30 leading-none">
                  {isAdmin ? "Admin" : "Staff"}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Sleek Single-Line Navigation Links */}
      <nav className="flex-1 overflow-y-auto shows-row-scroll px-3 py-3.5 space-y-1 relative z-10">
        {primaryLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                item.active
                  ? "bg-gradient-to-r from-[#ea6f2a] to-[#f07b38] text-white shadow-md shadow-[#ea6f2a]/25 font-bold"
                  : "text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    item.active ? "text-white" : "text-[#38bdf8] group-hover:text-[#20efe0]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 leading-none ${
                    item.active ? "bg-white text-[#ea6f2a]" : "bg-[#ea6f2a] text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {staffLinks.length > 0 && (
          <div className="pt-3.5 mt-3.5 border-t border-white/[0.12] space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7dd3fc]">
              Team
            </div>
            {staffLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-[#ea6f2a] to-[#f07b38] text-white shadow-md shadow-[#ea6f2a]/25 font-bold"
                      : "text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.active ? "text-white" : "text-[#ffd166] group-hover:text-white"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Minimal Sign Out Footer */}
      <div className="p-3 border-t border-white/[0.12] bg-[#0b1030]/60 relative z-10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#cbd5e1] hover:text-white hover:bg-rose-500/25 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default DesktopLeftNav
