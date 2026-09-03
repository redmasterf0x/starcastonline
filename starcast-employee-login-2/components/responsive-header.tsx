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
    { href: "/articles", label: "Articles", show: true },
    { href: "/community", label: "Community", show: true },
    { href: "/information", label: "Information", show: true },
    { href: "https://shop.starcast.online", label: "Merch", show: true, external: true },
    { href: "/production", label: "Production", show: isCrew || isAdmin },
    { href: "/staff", label: "Staff", show: isCrew || isAdmin },
    { href: "/dashboard", label: "Dashboard", show: loggedIn },
    { href: "/admin", label: "Admin", show: isAdmin },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#b35a1f]/35 bg-[#D4722B] shadow-[0_8px_30px_rgba(80,30,0,0.3)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85">
            <img
              src={brandAssets.capstone.white || "/placeholder.svg"}
              alt=""
              className="h-11 w-11 object-contain drop-shadow-lg"
            />
            <img
              src={brandAssets.logotype.horizontalWhite || "/placeholder.svg"}
              alt="Starcast Media"
              className="hidden h-6 object-contain sm:block md:h-7"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-[#8796cb]/25 bg-[#303568]/55 p-1 shadow-inner shadow-[#05052d]/25 lg:flex">
            {/* Home link */}
            <Link
              href="/"
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "/" ? "bg-[#ea6f2a] text-white" : "text-[#d4d8ee] hover:bg-[#8796cb]/15 hover:text-[#f5f7ff]"
              }`}
            >
              Home
            </Link>

            {/* Articles link */}
            <Link
              href="/articles"
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "/articles" ? "bg-[#ea6f2a] text-white" : "text-[#d4d8ee] hover:bg-[#8796cb]/15 hover:text-[#f5f7ff]"
              }`}
            >
              Articles
            </Link>

            {/* Remaining nav links - skip Home, Articles since they're hardcoded above */}
            {navLinks.slice(2).map(
              (link) =>
                link.show && (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === link.href
                        ? "bg-[#ea6f2a] text-white"
                        : link.label === "Merch"
                          ? "text-[#f08a4a] hover:bg-[#ea6f2a]/10 hover:text-[#f4a56e]"
                          : "text-[#d4d8ee] hover:bg-[#8796cb]/15 hover:text-[#f5f7ff]"
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
                className="border-[#aeb8dd]/45 bg-[#303568]/35 text-[#e4e7f5] hover:bg-[#8796cb]/20 hover:text-[#f5f7ff]"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                size="sm"
                className="bg-[#ea6f2a] hover:bg-[#f2854a] text-white"
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
