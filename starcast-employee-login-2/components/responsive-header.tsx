"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { brandAssets } from "@/lib/brand-assets"
import { authClient } from "@/lib/auth-client"
import { getMyProfile } from "@/app/actions/profile"

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
  const [loggedIn, setLoggedIn] = useState(isLoggedInProp ?? false)
  const [isAdmin, setIsAdmin] = useState(isAdminProp ?? false)
  const [isCrew, setIsCrew] = useState(isCrewProp ?? false)

  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session?.user) {
      setLoggedIn(true)
      // Only fetch role details if props didn't already tell us
      if (!isAdminProp && !isCrewProp) {
        getMyProfile()
          .then((profile) => {
            if (profile) {
              setIsAdmin(profile.isAdmin ?? false)
              setIsCrew(profile.isEmployee ?? false)
            }
          })
          .catch(() => {
            // Not signed in or no profile yet — leave role flags as-is
          })
      }
    } else if (session === null) {
      setLoggedIn(false)
      setIsAdmin(false)
      setIsCrew(false)
    }
  }, [session, isAdminProp, isCrewProp])

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

  const navLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/watch", label: "Watch", show: true },
    { href: "/articles", label: "Articles", show: true },
    { href: "/community", label: "Community", show: true },
    { href: "/bands", label: "Bands", show: true },
    { href: "/information", label: "Information", show: true },
    { href: "https://shop.starcast.online", label: "Merch", show: true, external: true },
    { href: "/dashboard", label: "Dashboard", show: loggedIn },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#38bdf8]/40 bg-[#0284c7] shadow-[0_8px_30px_rgba(2,132,199,0.35)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/20 bg-[#05052d]/60 p-1 shadow-inner backdrop-blur-md lg:flex">
            {navLinks.map(
              (link) =>
                link.show && (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === link.href
                        ? "bg-[#ea6f2a] text-white shadow-sm"
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
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-white/30 bg-[#05052d]/60 text-white hover:bg-[#05052d] hover:text-white"
              >
                Sign Out
              </Button>
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
            className="rounded-lg p-2 text-[#e4e7f5] transition-colors hover:bg-[#8796cb]/15 hover:text-[#f5f7ff] lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="flex flex-col gap-3 border-t border-[#6477b8]/35 bg-[#1d2053]/96 px-4 py-4 shadow-xl backdrop-blur-xl lg:hidden">
          {navLinks.map(
            (link) =>
              link.show && (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium py-2 transition-colors ${
                    currentPage === link.href
                      ? "text-[#ea6f2a]"
                      : "text-[#d4d8ee] hover:text-[#f5f7ff]"
                  }`}
                >
                  {link.label}
                </Link>
              )
          )}
          <div className="pt-2 border-t border-[#20205a]/40">
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
                className="w-full bg-[#ea6f2a] hover:bg-[#f2854a] text-white"
              >
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default ResponsiveHeader
