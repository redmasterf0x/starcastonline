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

export type TransitPhase = "idle" | "fading-out" | "warping" | "fading-in"

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
  transitPhase: TransitPhase
  audioEnabled: boolean
  toggleAudio: () => void
  transitTo: (path: string) => void
}

const SpaceflightContext = createContext<SpaceflightContextType>({
  currentPlanet: PLANETS["/"],
  targetPlanet: null,
  isWarping: false,
  transitPhase: "idle",
  audioEnabled: false,
  toggleAudio: () => {},
  transitTo: () => {},
})

export function useSpaceflight() {
  return useContext(SpaceflightContext)
}

function playSpaceshipTransitionAudio(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // 1. Sub-bass hyperdrive jump sweep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = "sawtooth"
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(70, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.18)
    filter.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.6)

    // 2. Spaceship airlock pneumatic pressure hiss
    const bufferSize = Math.floor(ctx.sampleRate * 0.2)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = "bandpass"
    noiseFilter.frequency.setValueAtTime(1600, ctx.currentTime)
    noiseFilter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2)
    noiseFilter.Q.setValueAtTime(2.5, ctx.currentTime)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.035, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noise.start()
    noise.stop(ctx.currentTime + 0.21)
  } catch {
    // Audio autoplay blocked or not permitted
  }
}

export function SpaceflightTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [currentPlanet, setCurrentPlanet] = useState<PlanetInfo>(() => resolvePlanet(pathname))
  const [targetPlanet, setTargetPlanet] = useState<PlanetInfo | null>(null)
  const [transitPhase, setTransitPhase] = useState<TransitPhase>("idle")
  const [warpProgress, setWarpProgress] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const isWarping = transitPhase !== "idle"

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

  // Spaceship transit: quick push-away of modules, airlock doors seal & open, no text
  const transitTo = useCallback(
    (targetPath: string) => {
      if (isNavigatingRef.current) return
      const target = resolvePlanet(targetPath)

      // If already on same target, just navigate normally
      if (targetPath === pathname) return

      // Reduced motion preference
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(targetPath)
        return
      }

      isNavigatingRef.current = true
      setTargetPlanet(target)
      setTransitPhase("fading-out")
      setWarpProgress(0)

      playSpaceshipTransitionAudio(audioEnabled)

      // Snappy spaceship flight timeline
      const startTime = performance.now()
      const DURATION = 640 // ms total flight

      const updateProgress = (now: number) => {
        const elapsed = now - startTime
        const p = Math.min(1, elapsed / DURATION)
        setWarpProgress(p)

        if (p < 1) {
          requestAnimationFrame(updateProgress)
        }
      }
      requestAnimationFrame(updateProgress)

      // Stage 1: Quick push-away & doors sealed at 180ms. Push route into hyperspace.
      setTimeout(() => {
        setTransitPhase("warping")
        router.push(targetPath)
      }, 180)

      // Stage 2: Arrived! Doors slide open and new page modules push forward at 380ms.
      setTimeout(() => {
        setTransitPhase("fading-in")
      }, 380)

      // Stage 3: Return to idle at 660ms once doors have completely cleared the screen.
      setTimeout(() => {
        setTransitPhase("idle")
        setTargetPlanet(null)
        isNavigatingRef.current = false
      }, 660)
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

      {/* Atmospheric Entry Shockwave Burst (behind doors) */}
      {transitPhase !== "idle" && (
        <div
          className={`fixed inset-0 z-[9985] pointer-events-none flex items-center justify-center transition-opacity duration-300 ${
            transitPhase === "fading-in" ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        >
          <div
            className="rounded-full pointer-events-none transition-transform duration-500"
            style={{
              width: "160vmax",
              height: "160vmax",
              background: `radial-gradient(circle, ${destination.glowColor} 0%, transparent 65%)`,
              opacity: warpProgress > 0.4 ? (1 - warpProgress) * 1.5 : warpProgress * 2,
              transform: `scale(${0.3 + warpProgress * 1.4})`,
            }}
          />
        </div>
      )}

      {/* Left Spaceship Bulkhead Airlock Door */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[calc(50%+1px)] z-[9990] pointer-events-none transition-transform ease-out ${
          transitPhase === "fading-out" || transitPhase === "warping"
            ? "translate-x-0 duration-180"
            : "-translate-x-full duration-260"
        }`}
        style={{
          background: "linear-gradient(135deg, #050518 0%, #080825 50%, #0d0d38 100%)",
          borderRight: "2px solid #20205a",
          boxShadow: "inset -12px 0 30px rgba(0,0,0,0.8), 10px 0 40px rgba(0,0,0,0.7)",
        }}
        aria-hidden="true"
      >
        {/* Hull carbon grid texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Vertical power reactor strip */}
        <div
          className="absolute top-0 bottom-0 right-4 w-1"
          style={{
            backgroundColor: destination.color,
            boxShadow: `0 0 16px ${destination.color}`,
          }}
        />

        {/* Hazard warning stripe on seam */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2.5 opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${destination.color} 0, ${destination.color} 6px, #050518 6px, #050518 12px)`,
          }}
        />

        {/* Airlock mechanical bolts */}
        <div className="absolute right-2 top-1/4 w-3 h-3 rounded-full bg-[#20205a] border border-[#f5f7ff]/30 shadow-md" />
        <div className="absolute right-2 top-3/4 w-3 h-3 rounded-full bg-[#20205a] border border-[#f5f7ff]/30 shadow-md" />

        {/* Left half of center airlock clamp */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 sm:w-14 sm:h-28 rounded-l-full border-2 border-r-0 border-[#20205a] bg-[#070722] flex items-center justify-end pr-1 shadow-[-4px_0_15px_rgba(0,0,0,0.8)]">
          <div
            className="w-4 h-8 sm:w-5 sm:h-10 rounded-l-full border border-r-0 border-white/80 shadow-md animate-pulse"
            style={{
              backgroundColor: destination.color,
              boxShadow: `0 0 14px ${destination.color}`,
            }}
          />
        </div>
      </div>

      {/* Right Spaceship Bulkhead Airlock Door */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-[calc(50%+1px)] z-[9990] pointer-events-none transition-transform ease-out ${
          transitPhase === "fading-out" || transitPhase === "warping"
            ? "translate-x-0 duration-180"
            : "translate-x-full duration-260"
        }`}
        style={{
          background: "linear-gradient(225deg, #050518 0%, #080825 50%, #0d0d38 100%)",
          borderLeft: "2px solid #20205a",
          boxShadow: "inset 12px 0 30px rgba(0,0,0,0.8), -10px 0 40px rgba(0,0,0,0.7)",
        }}
        aria-hidden="true"
      >
        {/* Hull carbon grid texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Vertical power reactor strip */}
        <div
          className="absolute top-0 bottom-0 left-4 w-1"
          style={{
            backgroundColor: destination.color,
            boxShadow: `0 0 16px ${destination.color}`,
          }}
        />

        {/* Hazard warning stripe on seam */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2.5 opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, ${destination.color} 0, ${destination.color} 6px, #050518 6px, #050518 12px)`,
          }}
        />

        {/* Airlock mechanical bolts */}
        <div className="absolute left-2 top-1/4 w-3 h-3 rounded-full bg-[#20205a] border border-[#f5f7ff]/30 shadow-md" />
        <div className="absolute left-2 top-3/4 w-3 h-3 rounded-full bg-[#20205a] border border-[#f5f7ff]/30 shadow-md" />

        {/* Right half of center airlock clamp */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-24 sm:w-14 sm:h-28 rounded-r-full border-2 border-l-0 border-[#20205a] bg-[#070722] flex items-center justify-start pl-1 shadow-[4px_0_15px_rgba(0,0,0,0.8)]">
          <div
            className="w-4 h-8 sm:w-5 sm:h-10 rounded-r-full border border-l-0 border-white/80 shadow-md animate-pulse"
            style={{
              backgroundColor: destination.color,
              boxShadow: `0 0 14px ${destination.color}`,
            }}
          />
        </div>
      </div>

      {/* Content wrapper: modules quickly push away & fade out on exit, then cleanly push in on enter */}
      <div
        className={`relative z-10 transition-all ${
          transitPhase === "fading-out" || transitPhase === "warping"
            ? "opacity-0 scale-[0.88] blur-[3px] pointer-events-none duration-180 ease-in"
            : "opacity-100 scale-100 blur-0 pointer-events-auto duration-300 ease-out"
        }`}
      >
        {children}
      </div>
    </SpaceflightContext.Provider>
  )
}
