"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { brandAssets } from "@/lib/brand-assets"

interface AppNavProps {
  isEmployee?: boolean
  isAdmin?: boolean
  currentPage?: string
}

export function AppNav({ isEmployee = false, isAdmin = false, currentPage = "" }: AppNavProps) {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/login"
  }

  return (
    <header className="bg-[#0284c7] border-b border-[#38bdf8]/40 shadow-[0_8px_30px_rgba(2,132,199,0.35)] backdrop-blur overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src={brandAssets.capstone.white || "/placeholder.svg"} alt="Starcast Media" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow" />
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                  STARCAST <span className="text-[#ffd166]">ONLINE</span>
                </span>
                <span className="rounded-full bg-[#ea6f2a] px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-md border border-white/40">
                  BETA
                </span>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`${
                    currentPage === "admin" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                  } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className={`${
                  currentPage === "dashboard" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
              >
                Dashboard
              </Link>
              {isEmployee && (
                <Link
                  href="/production"
                  className={`${
                    currentPage === "production" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                  } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
                >
                  Production
                </Link>
              )}
              <Link
                href="/articles"
                className={`${
                  currentPage === "articles" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
              >
                Articles
              </Link>
              <Link
                href="/shows"
                className={`${
                  currentPage === "shows" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
              >
                Shows
              </Link>
              <Link
                href="/community"
                className={`${
                  currentPage === "community" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
              >
                Community
              </Link>
              <Link
                href="/watch"
                className={`${
                  currentPage === "watch" ? "text-[#f4b25c]" : "text-[#9a9fc4]"
                } hover:text-[#f4b25c] transition-colors text-sm font-medium`}
              >
                Watch
              </Link>
              <Link
                href="https://shop.starcast.online"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ea6f2a] hover:text-[#f2a04a] transition-colors text-sm font-semibold"
              >
                Merch
              </Link>
            </nav>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-[#f5f7ff] bg-[#05052d] border-[#20205a] hover:bg-[#0c0c3f] hover:text-[#f4b25c]"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
