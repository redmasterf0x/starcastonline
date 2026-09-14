"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import {
  useSpaceflight,
  PLANETS,
  type PlanetInfo,
} from "./spaceflight-transition-provider"
import {
  Compass,
  Orbit,
  X,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const ORBITAL_DESTINATIONS = [
  { path: "/", planet: PLANETS["/"], label: "Home Core" },
  { path: "/watch", planet: PLANETS["/watch"], label: "Live Watch" },
  { path: "/shows", planet: PLANETS["/shows"], label: "Shows Archive" },
  { path: "/community", planet: PLANETS["/community"], label: "Community" },
  { path: "/portal", planet: PLANETS["/portal"], label: "Artist Portal" },
  { path: "/articles", planet: PLANETS["/articles"], label: "Articles" },
  { path: "/sponsors", planet: PLANETS["/sponsors"], label: "Sponsors" },
  { path: "/dashboard", planet: PLANETS["/dashboard"], label: "Navigator Deck" },
]

export function CelestialRadar() {
  const pathname = usePathname()
  const { currentPlanet, transitTo, isWarping, audioEnabled, toggleAudio } =
    useSpaceflight()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Radar Toggle Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center gap-2.5 rounded-full border border-[#20205a]/80 bg-[#0c0c3f]/90 px-3.5 py-2 text-xs font-mono text-[#f5f7ff] shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-[#ea6f2a] hover:shadow-[#ea6f2a]/20 active:scale-95"
          title="Open StarCast Solar Orrery"
          aria-label="Open StarCast Solar Orrery"
        >
          {/* Pulsing Sun Icon */}
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: currentPlanet.color }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: currentPlanet.color }}
            />
          </span>

          <span className="hidden font-semibold tracking-wider sm:inline">
            ORRERY
          </span>
          <span className="text-[11px] text-[#9a9fc4]">
            [{currentPlanet.name.split(" ")[0]}]
          </span>

          <Orbit className="h-4 w-4 text-[#ea6f2a] transition-transform duration-500 group-hover:rotate-180" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#20205a]/80 bg-[#0c0c3f]/90 text-[#9a9fc4] shadow-lg backdrop-blur-md transition-colors hover:border-[#ea6f2a] hover:text-[#f5f7ff]"
          title={audioEnabled ? "Cosmic Audio: ON" : "Cosmic Audio: OFF"}
          aria-label="Toggle Cosmic Audio"
        >
          {audioEnabled ? (
            <Volume2 className="h-4 w-4 text-[#20efe0]" />
          ) : (
            <VolumeX className="h-4 w-4 text-[#9a9fc4]" />
          )}
        </button>
      </div>

      {/* Expanded Solar System Flight Deck Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-[#05051f]/75 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-[#20205a] bg-gradient-to-b from-[#0c0c3f] to-[#05052d] p-6 text-[#f5f7ff] shadow-2xl overflow-hidden"
            style={{
              boxShadow: `0 0 50px rgba(12, 12, 63, 0.9), 0 0 30px ${currentPlanet.glowColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#20205a] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 text-[#ea6f2a]">
                  <Orbit className="h-5 w-5 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#f5f7ff] flex items-center gap-2">
                    STARCAST SOLAR NAVIGATION
                    <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border-none text-[10px] uppercase font-mono">
                      SYSTEM RADAR
                    </Badge>
                  </h3>
                  <p className="text-xs text-[#9a9fc4] font-mono">
                    Current Orbit: <span className="text-[#f5f7ff] font-semibold">{currentPlanet.name}</span> ({currentPlanet.distanceAu})
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Orbit Map / Visual Orrery */}
            <div className="relative mb-5 flex h-32 w-full items-center justify-center rounded-xl border border-[#20205a]/50 bg-[#05051f]/80 overflow-hidden">
              {/* StarCast Sun Center */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#ffd166] to-[#ea6f2a] shadow-[0_0_20px_#ea6f2a] animate-pulse" />
                <span className="mt-1 text-[9px] font-mono tracking-widest text-[#ea6f2a] uppercase">
                  STARCAST SUN
                </span>
              </div>

              {/* Concentric Orbit Rings */}
              <div className="absolute h-16 w-16 rounded-full border border-[#ea6f2a]/20" />
              <div className="absolute h-24 w-24 rounded-full border border-[#20efe0]/20" />
              <div className="absolute h-32 w-32 rounded-full border border-[#e056fd]/20" />
              <div className="absolute h-40 w-40 rounded-full border border-[#38ef7d]/20" />
              <div className="absolute h-48 w-48 rounded-full border border-[#22b573]/20" />

              {/* Decorative scanline */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#20efe0]/5 to-transparent animate-pulse" />
            </div>

            {/* Planetary Destinations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1">
              {ORBITAL_DESTINATIONS.map((dest) => {
                const isCurrent = currentPlanet.id === dest.planet.id
                return (
                  <button
                    key={dest.path}
                    onClick={() => {
                      setIsOpen(false)
                      transitTo(dest.path)
                    }}
                    disabled={isWarping || isCurrent}
                    className={`group flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isCurrent
                        ? "border-[#ea6f2a] bg-[#ea6f2a]/10 cursor-default"
                        : "border-[#20205a]/60 bg-[#0c0c3f]/50 hover:border-[#f5f7ff]/40 hover:bg-[#0c0c3f]/90 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-mono font-bold"
                        style={{
                          borderColor: `${dest.planet.color}55`,
                          backgroundColor: `${dest.planet.color}15`,
                          color: dest.planet.color,
                        }}
                      >
                        {dest.planet.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-[#f5f7ff] truncate group-hover:text-[#ea6f2a] transition-colors">
                            {dest.planet.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-mono text-[#ea6f2a] uppercase tracking-wider">
                              [CURRENT]
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9a9fc4] truncate">
                          {dest.label} • {dest.planet.distanceAu}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#9a9fc4] shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-[#f5f7ff]" />
                  </button>
                )
              })}
            </div>

            {/* Footer notice */}
            <div className="mt-4 pt-3 border-t border-[#20205a]/60 flex items-center justify-between text-xs text-[#9a9fc4] font-mono">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-[#20efe0] animate-pulse" />
                Select any planet to jump to orbital transit.
              </span>
              <span className="hidden sm:inline">WARP ENGINE: READY</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
