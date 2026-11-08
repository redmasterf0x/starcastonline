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
      className={`hidden lg:flex lg:w-56 xl:w-60 flex-col shrink-0 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-r border-white/[0.07] bg-[#06071b]/95 backdrop-blur-xl z-30 select-none ${className}`}
      aria-label="Member Navigation"
    >
      {/* Prominent User Profile Header at the Top */}
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90"
        >
          <div className="relative w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden">
            {userProfile?.profilePic ? (
              <img
                src={userProfile.profilePic}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-[#9a9fc4]" />
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#06071b]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate group-hover:text-[#20efe0] transition-colors">
              {displayName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {userProfile?.username ? (
                <span className="text-xs text-[#7f84ad] truncate">@{userProfile.username}</span>
              ) : (
                <span className="text-xs text-[#7f84ad] truncate">
                  {isAdmin ? "Admin" : isCrew ? "Staff" : "Member"}
                </span>
              )}
              {(isAdmin || isCrew) && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-[#20efe0]">
                  {isAdmin ? "Admin" : "Staff"}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Sleek Single-Line Navigation Links */}
      <nav className="flex-1 overflow-y-auto shows-row-scroll px-3 py-4 space-y-0.5">
        {primaryLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                item.active
                  ? "bg-white/[0.08] text-white font-semibold"
                  : "text-[#9a9fc4] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    item.active ? "text-[#ea6f2a]" : "text-[#6e7399] group-hover:text-[#cbd0f2]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ea6f2a] text-white shrink-0 leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {staffLinks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-0.5">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#5e6388]">
              Team
            </div>
            {staffLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    item.active
                      ? "bg-white/[0.08] text-white font-semibold"
                      : "text-[#9a9fc4] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.active ? "text-[#20efe0]" : "text-[#6e7399] group-hover:text-[#cbd0f2]"
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
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#7f84ad] hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default DesktopLeftNav
