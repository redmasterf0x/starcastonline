"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { checkInTicket, getEventScannerData } from "@/app/actions/band-tickets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  Search,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  MapPin,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react"

interface EventScannerClientProps {
  event: any
  band: any
  initialInstances: any[]
}

function playScanSound(ok: boolean) {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = ok ? "sine" : "sawtooth"
    osc.frequency.setValueAtTime(ok ? 880 : 220, ctx.currentTime)
    if (ok) {
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08)
    }
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.26)
  } catch {
    // Ignore audio permission errors
  }
}

export function EventScannerClient({
  event: initialEvent,
  band,
  initialInstances,
}: EventScannerClientProps) {
  const [event, setEvent] = useState(initialEvent)
  const [instances, setInstances] = useState(initialInstances)
  const [refreshing, setRefreshing] = useState(false)

  const [manualInput, setManualInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    type: "valid" | "used" | "error"
    message: string
  } | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "valid" | "checked_in">("all")

  // Camera QR Scanner state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [supportsBarcodeDetector, setSupportsBarcodeDetector] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastScannedRef = useRef<{ token: string; at: number } | null>(null)

  useEffect(() => {
    setSupportsBarcodeDetector(typeof window !== "undefined" && "BarcodeDetector" in window)
  }, [])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await getEventScannerData(event.id)
      if (res.success && res.event) {
        setEvent(res.event)
        setInstances(res.instances || [])
      }
    } finally {
      setRefreshing(false)
    }
  }, [event.id])

  const handleCheckIn = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim()
      if (!token || scanning) return

      setScanning(true)
      try {
        const res = await checkInTicket(token, event.id)
        if (res.success) {
          playScanSound(true)
          setScanResult({
            type: "valid",
            message: `CHECKED IN: Ticket #${res.ticketNumber} (${res.holderName})`,
          })
          setManualInput("")
          await refreshData()
        } else if (res.alreadyCheckedIn) {
          playScanSound(false)
          setScanResult({
            type: "used",
            message: res.error || "Ticket already scanned and checked in!",
          })
        } else {
          playScanSound(false)
          setScanResult({
            type: "error",
            message: res.error || "Invalid ticket QR code",
          })
        }
      } catch (err: any) {
        playScanSound(false)
        setScanResult({
          type: "error",
          message: err?.message || "Failed to check in ticket",
        })
      } finally {
        setScanning(false)
      }
    },
    [event.id, refreshData, scanning]
  )

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  async function startCamera() {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser. Use manual entry or a USB scanner.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      setCameraActive(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)

      if ("BarcodeDetector" in window) {
        const Detector = (window as any).BarcodeDetector
        const detector = new Detector({ formats: ["qr_code"] })

        const scanLoop = async () => {
          if (!streamRef.current || !videoRef.current) return
          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes && barcodes.length > 0) {
                const rawValue = String(barcodes[0].rawValue || "").trim()
                const now = Date.now()
                if (
                  rawValue &&
                  (!lastScannedRef.current ||
                    lastScannedRef.current.token !== rawValue ||
                    now - lastScannedRef.current.at > 3000)
                ) {
                  lastScannedRef.current = { token: rawValue, at: now }
                  handleCheckIn(rawValue)
                }
              }
            } catch {
              // Ignore per-frame detection errors
            }
          }
          rafRef.current = requestAnimationFrame(scanLoop)
        }
        rafRef.current = requestAnimationFrame(scanLoop)
      }
    } catch (err: any) {
      setCameraError(err?.message || "Unable to access camera. Check browser permissions.")
      stopCamera()
    }
  }

  const totalInventory = event.totalInventory || 0
  const remaining = event.remainingInventory ?? 0
  const soldCount = Math.max(0, totalInventory - remaining)
  const checkedInCount = instances.filter((i) => i.status === "checked_in").length
  const grossCents = soldCount * (event.priceCents || 0)

  const filteredInstances = instances.filter((inst) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (inst.holderName || "").toLowerCase().includes(q) ||
      (inst.holderEmail || "").toLowerCase().includes(q) ||
      String(inst.ticketNumber).includes(q) ||
      (inst.qrToken || "").toLowerCase().includes(q)

    const matchesFilter =
      filter === "all" ||
      (filter === "valid" && inst.status === "valid") ||
      (filter === "checked_in" && inst.status === "checked_in")

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] px-4 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-sm text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Artist Portal
          </Link>

          <div className="flex items-center gap-2">
            {band.slug && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-[#20205a] bg-[#0c0c3f]/70 text-[#dbe0fb] hover:bg-[#20205a]/50 rounded-xl h-9 text-xs"
              >
                <Link href={`/bands/${band.slug}`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Public Event Page
                </Link>
              </Button>
            )}
            <Button
              onClick={refreshData}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="border-[#20205a] bg-[#0c0c3f]/70 text-[#f5f7ff] hover:bg-[#20205a]/50 rounded-xl h-9 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-[#ea6f2a]" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Event Header Card */}
        <div className="rounded-3xl border border-[#20205a] bg-gradient-to-r from-[#0c0c3f] via-[#10104a] to-[#0c0c3f] p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border-[#ea6f2a]/40 text-xs">
                  Door Check-In &amp; Event Hub
                </Badge>
                <span className="text-xs text-[#9a9fc4] font-semibold">{band.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#cbd0f2] pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#ffd166]" />
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  &bull; {event.startTime || "8:00 PM"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#20efe0]" />
                  {event.venueName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <StatTile icon={<Ticket className="w-4 h-4 text-[#ea6f2a]" />} label="Sold" value={`${soldCount}/${totalInventory}`} />
              <StatTile icon={<Users className="w-4 h-4 text-[#20efe0]" />} label="Checked In" value={`${checkedInCount}/${soldCount}`} />
              <StatTile icon={<QrCode className="w-4 h-4 text-[#ffd166]" />} label="Remaining" value={String(remaining)} />
              <StatTile
                icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                label="Gross"
                value={event.priceCents > 0 ? `$${(grossCents / 100).toFixed(0)}` : "Free"}
              />
            </div>
          </div>
        </div>

        {/* Scanner Panel */}
        <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f] p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#20efe0]" />
                Scan Tickets at the Door
              </h2>
              <p className="text-xs text-[#9a9fc4]">
                Use your phone/laptop camera, a USB barcode scanner, or enter a Ticket # / QR token below.
              </p>
            </div>

            <Button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className={
                cameraActive
                  ? "bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 px-4 text-xs font-bold"
                  : "bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] rounded-xl h-10 px-4 text-xs font-extrabold"
              }
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-4 h-4 mr-1.5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-1.5" />
                  Open Camera Scanner
                </>
              )}
            </Button>
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#20efe0]/60 bg-black max-w-md mx-auto aspect-video">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-[#20efe0]/50 m-6 rounded-xl pointer-events-none" />
              </div>
              {!supportsBarcodeDetector && (
                <p className="text-center text-[11px] text-amber-300">
                  Live browser QR auto-detect requires Chrome/Edge/Android. You can still type or paste the Ticket # or token below.
                </p>
              )}
            </div>
          )}

          {/* Manual / USB Scanner Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCheckIn(manualInput)
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Scan QR URL, paste token UUID, or enter Ticket # (e.g. 4)..."
              className="h-11 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-sm flex-1 font-mono"
            />
            <Button
              type="submit"
              disabled={scanning || !manualInput.trim()}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-11 px-6"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Check In Ticket
            </Button>
          </form>

          {/* Scan Status Feedback Banner */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold ${
                scanResult.type === "valid"
                  ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                  : scanResult.type === "used"
                  ? "bg-amber-950/50 border-amber-500 text-amber-200"
                  : "bg-red-950/50 border-red-500 text-red-200"
              }`}
            >
              {scanResult.type === "valid" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : scanResult.type === "used" ? (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              )}
              <span>{scanResult.message}</span>
            </div>
          )}
        </div>

        {/* Guestlist & Issued Tickets Ledger */}
        <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#f5f7ff]">
              Guestlist &amp; Issued Tickets ({instances.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9a9fc4] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, #..."
                  className="pl-8 h-9 w-56 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-xs"
                />
              </div>

              <div className="inline-flex rounded-xl bg-[#05052d] border border-[#20205a] p-0.5 text-xs">
                {(["all", "valid", "checked_in"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                      filter === tab ? "bg-[#ea6f2a] text-white" : "text-[#9a9fc4] hover:text-white"
                    }`}
                  >
                    {tab === "checked_in" ? "Checked In" : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredInstances.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#9a9fc4] border border-dashed border-[#20205a] rounded-2xl">
              {instances.length === 0
                ? "No tickets have been purchased or reserved for this event yet."
                : "No tickets match your current search or filter."}
            </div>
          ) : (
            <div className="divide-y divide-[#20205a]/70 rounded-2xl border border-[#20205a] bg-[#05052d]/60 overflow-hidden">
              {filteredInstances.map((inst) => {
                const isUsed = inst.status === "checked_in"
                return (
                  <div
                    key={inst.id}
                    className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#ffd166]">
                          #{inst.ticketNumber}
                        </span>
                        <span className="font-bold text-sm text-[#f5f7ff] truncate">
                          {inst.holderName}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isUsed
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : "border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-[10px]"
                          }
                        >
                          {isUsed ? "Checked In" : "Valid"}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#9a9fc4] truncate">{inst.holderEmail}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUsed && inst.checkedInAt ? (
                        <span className="text-[11px] font-mono text-emerald-400">
                          Scanned {new Date(inst.checkedInAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={scanning}
                          onClick={() => handleCheckIn(inst.qrToken)}
                          className="h-8 px-3 rounded-lg bg-[#20efe0]/20 hover:bg-[#20efe0]/30 text-[#20efe0] border border-[#20efe0]/40 text-xs font-bold"
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#20205a] bg-[#05052d]/80 px-3.5 py-2.5 flex flex-col gap-0.5 min-w-[92px]">
      <div className="flex items-center gap-1.5 text-[11px] text-[#9a9fc4]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-black text-white font-mono">{value}</div>
    </div>
  )
}
