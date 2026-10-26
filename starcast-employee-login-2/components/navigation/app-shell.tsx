"use client"

import React, { createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { DesktopLeftNav } from "@/components/navigation/desktop-left-nav"
import { Footer } from "@/components/footer"

// Context to notify child pages that the global AppShell is already rendering the header and footer
const AppShellContext = createContext(false)
export const useInsideAppShell = () => useContext(AppShellContext)

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  // Full-screen minimal view for auth routes
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/check-email")

  if (isAuthPage) {
    return (
      <div className="min-h-screen text-[#f5f7ff] bg-[#05051f]">
        {children}
      </div>
    )
  }

  return (
    <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Sticky Global Responsive Header */}
        <ResponsiveHeader currentPage={pathname} isTopLevel={true} />

        {/* Desktop 2-Column Framework: Persistent Left Navigation Rail + Animated Right Panel */}
        <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8 flex-1 flex flex-col">
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start flex-1 w-full">
            {/* Desktop Persistent Left Nav Rail (Does NOT reload or unmount between routes) */}
            <DesktopLeftNav currentPage={pathname} />

            {/* Right Panel: Content Area that smoothly animates on page change */}
            <main
              key={pathname}
              className="flex-1 min-w-0 w-full right-panel-animate fill-mode-both"
            >
              <AppShellContext.Provider value={true}>
                {children}
              </AppShellContext.Provider>
            </main>
          </div>
        </div>

        {/* Global Footer */}
        <Footer isTopLevel={true} />
      </div>
    </div>
  )
}

export default AppShell
