"use client"

import React, { createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { DesktopLeftNav } from "@/components/navigation/desktop-left-nav"
import { Footer } from "@/components/footer"
import { useSpaceflight } from "@/components/spaceflight/spaceflight-transition-provider"

// Context to notify child pages that the global AppShell is already rendering the header and footer
const AppShellContext = createContext(false)
export const useInsideAppShell = () => useContext(AppShellContext)

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { transitPhase, transitPath } = useSpaceflight()
  const effectivePage = transitPath || pathname

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
        {/* Sticky Global Responsive Header (z-50, stays crisp & highlighted in front of stinger) */}
        <ResponsiveHeader currentPage={effectivePage} isTopLevel={true} />

        {/* Desktop 2-Column Framework: Full-Height Left Navigation Rail + Animated Right Panel */}
        <div className="flex-1 flex flex-col lg:flex-row w-full items-stretch">
          {/* Desktop Persistent Left Nav Rail (z-40, stays crisp & highlighted in front of stinger) */}
          <DesktopLeftNav currentPage={effectivePage} />

          {/* Right Column: Main Content Area + Footer */}
          <div className="flex-1 min-w-0 flex flex-col w-full relative">
            <main
              key={pathname}
              className={`flex-1 min-w-0 w-full right-panel-animate fill-mode-both transition-all ${
                transitPhase === "fading-out" || transitPhase === "warping"
                  ? "opacity-0 scale-[0.97] blur-[2px] pointer-events-none duration-180 ease-in"
                  : transitPhase === "fading-in"
                  ? "opacity-100 scale-100 blur-0 pointer-events-auto duration-260 ease-out"
                  : "opacity-100 pointer-events-auto"
              }`}
            >
              <AppShellContext.Provider value={true}>
                {children}
              </AppShellContext.Provider>
            </main>

            {/* Global Footer */}
            <Footer isTopLevel={true} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppShell
