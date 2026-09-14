"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { Compass, Volume2, VolumeX, Radio, Sparkles } from "lucide-react"

export type PlanetInfo = {
  id: string
  name: string
  designation: string
  sector: string
  color: string
  secondaryColor: string
  glowColor: string
  description: string
  distanceAu: string
}

export const PLANETS: Record<string, PlanetInfo> = {
  "/": {
    id: "solaria",
    name: "Solaria Prime",
    designation: "SECTOR 0 // SOLAR CORE",
    sector: "StarCast Main Broadcast",
    color: "#ea6f2a",
    secondaryColor: "#ffd166",
    glowColor: "rgba(234, 111, 42, 0.45)",
    description: "The thermonuclear broadcast heart of the StarCast system.",
    distanceAu: "0.00 AU",
  },
  "/watch": {
    id: "chronos",
    name: "Chronos",
    designation: "ORBIT-I // CYAN GIANT",
    sector: "Live Stream & Video Player",
    color: "#20efe0",
    secondaryColor: "#0984e3",
    glowColor: "rgba(32, 239, 224, 0.45)",
    description: "Gas giant radiating high-bandwidth video frequencies.",
    distanceAu: "0.38 AU",
  },
  "/shows": {
    id: "spectra",
    name: "Spectra",
    designation: "ORBIT-II // BINARY ARCHIVE",
    sector: "Original Series & Shows",
    color: "#e056fd",
    secondaryColor: "#686de0",
    glowColor: "rgba(224, 86, 253, 0.45)",
    description: "Twin planets storing the complete network episode library.",
    distanceAu: "0.72 AU",
  },
  "/community": {
    id: "agora",
    name: "Agora",
    designation: "ORBIT-III // RINGED COMMONS",
    sector: "Community & Message Boards",
    color: "#38ef7d",
    secondaryColor: "#11998e",
    glowColor: "rgba(56, 239, 125, 0.45)",
    description: "A ringed world echoing with discussions, stars, and chatter.",
    distanceAu: "1.00 AU",
  },
  "/portal": {
    id: "siren",
    name: "Siren",
    designation: "ORBIT-IV // RESONANT HAVEN",
    sector: "Artist & Studio Portal",
    color: "#22b573",
    secondaryColor: "#05c46b",
    glowColor: "rgba(34, 181, 115, 0.45)",
    description: "Harmonic world tuned for musicians, bands, and studio sessions.",
    distanceAu: "1.52 AU",
  },
  "/bands": {
    id: "siren",
    name: "Siren",
    designation: "ORBIT-IV // RESONANT HAVEN",
    sector: "Artist & Band Pages",
    color: "#22b573",
    secondaryColor: "#05c46b",
    glowColor: "rgba(34, 181, 115, 0.45)",
    description: "Harmonic world tuned for musicians, bands, and studio sessions.",
    distanceAu: "1.52 AU",
  },
  "/articles": {
    id: "chronicler",
    name: "The Chronicler",
    designation: "LUNAR ARCHIVE // CRYSTAL MOON",
    sector: "Editorial & Network News",
    color: "#a29bfe",
    secondaryColor: "#6c5ce7",
    glowColor: "rgba(162, 155, 254, 0.45)",
    description: "Crystalline satellite recording network dispatches and articles.",
    distanceAu: "2.77 AU",
  },
  "/sponsors": {
    id: "helios",
    name: "Helios Citadel",
    designation: "ORBITAL STATION // CITADEL",
    sector: "Sponsors & Commerce",
    color: "#f1c40f",
    secondaryColor: "#e67e22",
    glowColor: "rgba(241, 196, 15, 0.45)",
    description: "Golden superstructure powering network operations and sponsors.",
    distanceAu: "5.20 AU",
  },
  "/production": {
    id: "command",
    name: "Fleet Command",
    designation: "DEEP SPACE // MOTHERSHIP",
    sector: "Production & Crew Call",
    color: "#ff4757",
    secondaryColor: "#c0392b",
    glowColor: "rgba(255, 71, 87, 0.45)",
    description: "Flagship coordinating film crews, camera operators, and shoot calls.",
    distanceAu: "9.58 AU",
  },
  "/staff": {
    id: "command",
    name: "Fleet Command",
    designation: "STUDIO OPS // BRIDGE",
    sector: "Staff & Studio Bookings",
    color: "#ff4757",
    secondaryColor: "#c0392b",
    glowColor: "rgba(255, 71, 87, 0.45)",
    description: "Operations deck overseeing calendar sessions and payments.",
    distanceAu: "9.58 AU",
  },
  "/admin": {
    id: "command",
    name: "Fleet Command",
    designation: "RESTRICTED // CORE OVERRIDE",
    sector: "System Administration",
    color: "#ff4757",
    secondaryColor: "#c0392b",
    glowColor: "rgba(255, 71, 87, 0.45)",
    description: "Central command administering users, wages, and operations.",
    distanceAu: "9.58 AU",
  },
  "/dashboard": {
    id: "nexus",
    name: "Navigator Hub",
    designation: "ORBITAL DOCK // PERSONAL",
    sector: "Member Dashboard",
    color: "#74b9ff",
    secondaryColor: "#0984e3",
    glowColor: "rgba(116, 185, 255, 0.45)",
    description: "Private member quarters, timesheets, and messages.",
    distanceAu: "1.10 AU",
  },
}

export function resolvePlanet(pathname: string): PlanetInfo {
  if (PLANETS[pathname]) return PLANETS[pathname]

  const clean = pathname.replace(/\/$/, "")
  if (clean.startsWith("/bands")) return PLANETS["/bands"]
  if (clean.startsWith("/shows")) return PLANETS["/shows"]
  if (clean.startsWith("/articles")) return PLANETS["/articles"]
  if (clean.startsWith("/u/")) return PLANETS["/dashboard"]
  if (clean.startsWith("/profile")) return PLANETS["/dashboard"]

  return PLANETS["/"]
}

type SpaceflightContextType = {
  currentPlanet: PlanetInfo
  targetPlanet: PlanetInfo | null
  isWarping: boolean
  audioEnabled: boolean
  toggleAudio: () => void
  transitTo: (path: string) => void
}

const SpaceflightContext = createContext<SpaceflightContextType>({
  currentPlanet: PLANETS["/"],
  targetPlanet: null,
  isWarping: false,
  audioEnabled: false,
  toggleAudio: () => {},
  transitTo: () => {},
})

export function useSpaceflight() {
  return useContext(SpaceflightContext)
}

function playCosmicWarpAudio(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Sub-bass sweep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = "sawtooth"
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(80, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.3)
    filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.65)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.22)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.75)
  } catch {
    // Audio autoplay blocked or not permitted
  }
}

export function SpaceflightTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [currentPlanet, setCurrentPlanet] = useState<PlanetInfo>(() => resolvePlanet(pathname))
  const [targetPlanet, setTargetPlanet] = useState<PlanetInfo | null>(null)
  const [isWarping, setIsWarping] = useState(false)
  const [warpProgress, setWarpProgress] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const isNavigatingRef = useRef(false)

  // Starfield simulation data
  const starsRef = useRef<Array<{ x: number; y: number; z: number; pz: number }>>([])

  // Load audio preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("starcast_cosmic_audio")
      if (saved === "true") setAudioEnabled(true)
    } catch {}
  }, [])

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem("starcast_cosmic_audio", String(next))
      } catch {}
      return next
    })
  }, [])

  // Sync current planet when pathname updates
  useEffect(() => {
    const planet = resolvePlanet(pathname)
    setCurrentPlanet(planet)
  }, [pathname])

  // Core transit function
  const transitTo = useCallback(
    (targetPath: string) => {
      if (isNavigatingRef.current) return
      const target = resolvePlanet(targetPath)

      // If already on same target, just navigate normally
      if (targetPath === pathname) return

      isNavigatingRef.current = true
      setTargetPlanet(target)
      setIsWarping(true)
      setWarpProgress(0)

      playCosmicWarpAudio(audioEnabled)

      // Progression phases
      const startTime = performance.now()
      const DURATION = 680 // ms total flight

      const updateProgress = (now: number) => {
        const elapsed = now - startTime
        const p = Math.min(1, elapsed / DURATION)
        setWarpProgress(p)

        if (p < 1) {
          requestAnimationFrame(updateProgress)
        }
      }
      requestAnimationFrame(updateProgress)

      // Jump to route at peak warp (360ms)
      setTimeout(() => {
        router.push(targetPath)
      }, 360)

      // End transit effect
      setTimeout(() => {
        setIsWarping(false)
        setTargetPlanet(null)
        isNavigatingRef.current = false
      }, DURATION)
    },
    [pathname, router, audioEnabled]
  )

  // Global link interception
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Don't intercept if reduced motion is preferred
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return

      // Skip external, hash, javascript, new tabs
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return
      }

      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
        if (url.pathname === pathname) return

        e.preventDefault()
        transitTo(url.pathname + url.search + url.hash)
      } catch {
        // Not a standard URL
      }
    }

    document.addEventListener("click", handleDocumentClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true })
    }
  }, [pathname, transitTo])

  // Canvas starfield simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    // Generate stars
    const STAR_COUNT = 420
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      pz: Math.random() * width,
    }))
    starsRef.current = stars

    let currentSpeed = 1.0

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Target warp speed
      const targetSpeed = isWarping ? 38.0 : 1.1
      currentSpeed += (targetSpeed - currentSpeed) * 0.12

      const cx = width / 2
      const cy = height / 2

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        star.pz = star.z
        star.z -= currentSpeed

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2
          star.y = (Math.random() - 0.5) * height * 2
          star.z = width
          star.pz = width
        }

        const k = 250 / star.z
        const px = star.x * k + cx
        const py = star.y * k + cy

        const pk = 250 / star.pz
        const ppx = star.x * pk + cx
        const ppy = star.y * pk + cy

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, (1 - star.z / width) * 1.5)

          if (isWarping && currentSpeed > 5) {
            // Draw hyperspace streak lines
            ctx.beginPath()
            ctx.moveTo(ppx, ppy)
            ctx.lineTo(px, py)
            ctx.strokeStyle =
              targetPlanet?.color && Math.random() > 0.65
                ? targetPlanet.color
                : `rgba(245, 247, 255, ${depthAlpha * 0.9})`
            ctx.lineWidth = Math.min(3.5, (1 - star.z / width) * 4)
            ctx.stroke()
          } else {
            // Gentle ambient stars
            ctx.beginPath()
            const radius = Math.max(0.6, (1 - star.z / width) * 1.8)
            ctx.arc(px, py, radius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(245, 247, 255, ${depthAlpha * 0.75})`
            ctx.fill()
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isWarping, targetPlanet])

  const destination = targetPlanet || currentPlanet

  return (
    <SpaceflightContext.Provider
      value={{
        currentPlanet,
        targetPlanet,
        isWarping,
        audioEnabled,
        toggleAudio,
        transitTo,
      }}
    >
      {/* Background Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{ mixBlendMode: "screen" }}
        aria-hidden="true"
      />

      {/* Warp Speed Transit HUD Overlay */}
      {isWarping && (
        <div
          className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, rgba(5, 5, 31, 0.85) 90%)`,
          }}
        >
          {/* Atmospheric Entry Shockwave */}
          <div
            className="absolute rounded-full pointer-events-none transition-transform"
            style={{
              width: "200vmax",
              height: "200vmax",
              background: `radial-gradient(circle, ${destination.glowColor} 0%, transparent 60%)`,
              opacity: warpProgress > 0.4 ? (1 - warpProgress) * 1.2 : warpProgress * 2,
              transform: `scale(${0.3 + warpProgress * 1.6})`,
            }}
          />

          {/* Central Flight Computer Reticle */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
            {/* Spinning reticle ring */}
            <div className="relative mb-6 flex items-center justify-center">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-dashed animate-spin"
                style={{
                  borderColor: destination.color,
                  animationDuration: "3s",
                }}
              />
              <div
                className="absolute w-16 h-16 rounded-full border border-[#f5f7ff]/40 flex items-center justify-center"
              >
                <Sparkles
                  className="w-7 h-7 animate-pulse"
                  style={{ color: destination.color }}
                />
              </div>
            </div>

            {/* Telemetry data banner */}
            <div className="rounded-full border border-[#20205a] bg-[#0c0c3f]/90 px-3.5 py-1 text-[11px] font-mono uppercase tracking-widest text-[#9a9fc4] shadow-lg mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#ea6f2a]" />
              <span>ORBITAL TRANSIT LOCK // VELOCITY: {(0.92 + warpProgress * 0.07).toFixed(3)}c</span>
            </div>

            <h2
              className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-1 drop-shadow-md text-[#f5f7ff]"
            >
              APPROACHING {destination.name}
            </h2>

            <p
              className="text-xs sm:text-sm font-mono tracking-widest uppercase mb-4"
              style={{ color: destination.color }}
            >
              {destination.designation} • {destination.distanceAu}
            </p>

            <p className="text-xs text-[#9a9fc4] max-w-xs sm:max-w-sm line-clamp-1 italic">
              &ldquo;{destination.description}&rdquo;
            </p>

            {/* Progress flight bar */}
            <div className="w-64 h-1 bg-[#20205a] rounded-full overflow-hidden mt-6">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${Math.round(warpProgress * 100)}%`,
                  backgroundColor: destination.color,
                  boxShadow: `0 0 12px ${destination.color}`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content wrapper with subtle smooth scale-in */}
      <div
        className={`relative z-10 transition-all duration-500 ease-out ${
          isWarping ? "scale-[0.985] opacity-60 blur-[1px]" : "scale-100 opacity-100 blur-0"
        }`}
      >
        {children}
      </div>
    </SpaceflightContext.Provider>
  )
}
