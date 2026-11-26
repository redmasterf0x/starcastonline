"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import jsQR from "jsqr"
import {
  checkInTicket,
  getEventScannerData,
  updateBandEvent,
  addEventScannerByEmail,
  removeEventScanner,
  recordDoorCashSale,
} from "@/app/actions/band-tickets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Pencil,
  Lock,
  Check,
  Upload,
  ImageIcon,
  Repeat,
  X,
  UserPlus,
  Trash2,
  Copy,
  Banknote,
  Printer,
} from "lucide-react"

interface CashSaleOrder {
  id: string
  buyerName: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  createdAt: Date | string
}

interface EventScannerClientProps {
  event: any
  band: any
  initialInstances: any[]
  canEdit?: boolean
  canManageScanners?: boolean
  isScannerOnly?: boolean
  initialScanners?: Array<{
    id: string
    userId: string
    email: string
    name: string | null
    createdAt: Date | string
  }>
  initialCashSales?: {
    ticketsCount: number
    totalCents: number
    orders: CashSaleOrder[]
  }
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
  canEdit = false,
  canManageScanners = false,
  isScannerOnly = false,
  initialScanners = [],
  initialCashSales = { ticketsCount: 0, totalCents: 0, orders: [] },
}: EventScannerClientProps) {
  const [event, setEvent] = useState(initialEvent)
  const [instances, setInstances] = useState(initialInstances)
  const [refreshing, setRefreshing] = useState(false)

  // Door Cash Sales state
  const [cashSales, setCashSales] = useState(initialCashSales)
  const [cashQty, setCashQty] = useState(1)
  const [cashGuestName, setCashGuestName] = useState("")
  const [cashCustomAmount, setCashCustomAmount] = useState("")
  const [recordingCash, setRecordingCash] = useState(false)
  const [cashMsg, setCashMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Ticket scanned confirmation popup
  const [scanPopup, setScanPopup] = useState<{
    ticketNumber: number
    holderName: string
    eventTitle: string
  } | null>(null)

  // Door Scanners management state
  const [scanners, setScanners] = useState(initialScanners)
  const [scannerEmailInput, setScannerEmailInput] = useState("")
  const [addingScanner, setAddingScanner] = useState(false)
  const [scannerMsg, setScannerMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Edit Ticket/Event modal state
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: initialEvent.title || "",
    description: initialEvent.description || "",
    venueName: initialEvent.venueName || "",
    venueAddress: initialEvent.venueAddress || "",
    eventDate: "",
    doorsOpenTime: initialEvent.doorsOpenTime || "7:00 PM",
    startTime: initialEvent.startTime || "8:00 PM",
    priceCents: initialEvent.priceCents ?? 0,
    totalInventory: initialEvent.totalInventory ?? 20,
    ageRestriction: initialEvent.ageRestriction || "All Ages",
    flyerUrl: initialEvent.flyerUrl || "",
    recurrenceFrequency: (initialEvent.recurrenceFrequency || "one_time") as "one_time" | "weekly" | "monthly" | "yearly",
  })
  const [uploadingFlyer, setUploadingFlyer] = useState(false)

  async function handleUploadFlyer(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setEditError("Event image exceeds 10MB limit.")
      return
    }
    setUploadingFlyer(true)
    setEditError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "events/flyers")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setEditForm((prev) => ({ ...prev, flyerUrl: data.url }))
    } catch (err: any) {
      setEditError(err?.message || "Failed to upload event image")
    } finally {
      setUploadingFlyer(false)
    }
  }

  function openEditModal() {
    const dt = event.eventDate ? new Date(event.eventDate) : null
    const pad = (n: number) => String(n).padStart(2, "0")
    const localDateTime = dt
      ? `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
      : ""
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      venueName: event.venueName || "",
      venueAddress: event.venueAddress || "",
      eventDate: localDateTime,
      doorsOpenTime: event.doorsOpenTime || "7:00 PM",
      startTime: event.startTime || "8:00 PM",
      priceCents: event.priceCents ?? 0,
      totalInventory: event.totalInventory ?? 20,
      ageRestriction: event.ageRestriction || "All Ages",
      flyerUrl: event.flyerUrl || "",
      recurrenceFrequency: (event.recurrenceFrequency || "one_time") as "one_time" | "weekly" | "monthly" | "yearly",
    })
    setEditError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSavingEdit(true)
    setEditError(null)
    try {
      const payload = {
        ...editForm,
        eventDate: editForm.eventDate ? new Date(editForm.eventDate).toISOString() : "",
      }
      const res = await updateBandEvent(event.id, payload)
      if (res.success && res.event) {
        setEvent(res.event)
        setEditOpen(false)
        await refreshData()
      } else {
        setEditError(res.error || "Failed to update ticket/event")
      }
    } catch (err: any) {
      setEditError(err?.message || "Failed to update ticket/event")
    } finally {
      setSavingEdit(false)
    }
  }

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastScannedRef = useRef<{ token: string; at: number } | null>(null)

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await getEventScannerData(event.id)
      if (res.success && res.event) {
        setEvent(res.event)
        setInstances(res.instances || [])
        if (res.scanners) setScanners(res.scanners)
        if (res.cashSales) setCashSales(res.cashSales)
      }
    } finally {
      setRefreshing(false)
    }
  }, [event.id])

  const handleCheckIn = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim()
      if (!token || scanning || scanPopup) return

      setScanning(true)
      try {
        const res = await checkInTicket(token, event.id)
        if (res.success) {
          playScanSound(true)
          setScanResult({
            type: "valid",
            message: `CHECKED IN: Ticket #${res.ticketNumber} (${res.holderName})`,
          })
          setScanPopup({
            ticketNumber: res.ticketNumber || 1,
            holderName: res.holderName || "Guest",
            eventTitle: res.eventTitle || event.title,
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
    [event.id, event.title, refreshData, scanning, scanPopup]
  )

  async function handleAddScanner(e: React.FormEvent) {
    e.preventDefault()
    if (!scannerEmailInput.trim() || addingScanner) return
    setAddingScanner(true)
    setScannerMsg(null)
    try {
      const res = await addEventScannerByEmail(event.id, scannerEmailInput)
      if (res.success && res.scanner) {
        setScanners((prev) => [...prev, res.scanner!])
        setScannerEmailInput("")
        setScannerMsg({ type: "ok", text: `Added ${res.scanner.email} as a door scanner.` })
      } else {
        setScannerMsg({ type: "err", text: res.error || "Could not add scanner." })
      }
    } catch (err: any) {
      setScannerMsg({ type: "err", text: err?.message || "Could not add scanner." })
    } finally {
      setAddingScanner(false)
    }
  }

  async function handleRemoveScanner(scannerId: string) {
    setScannerMsg(null)
    const res = await removeEventScanner(event.id, scannerId)
    if (res.success) {
      setScanners((prev) => prev.filter((s) => s.id !== scannerId))
    } else {
      setScannerMsg({ type: "err", text: res.error || "Failed to remove scanner." })
    }
  }

  async function handleRecordCashSale(e: React.FormEvent) {
    e.preventDefault()
    if (recordingCash) return
    setRecordingCash(true)
    setCashMsg(null)
    try {
      const customCents =
        cashCustomAmount.trim() !== ""
          ? Math.max(0, Math.round(parseFloat(cashCustomAmount) * 100))
          : undefined

      const res = await recordDoorCashSale({
        eventId: event.id,
        quantity: cashQty,
        customTotalCents: customCents,
        guestName: cashGuestName,
      })

      if (res.success) {
        playScanSound(true)
        setCashMsg({
          type: "ok",
          text: `Recorded ${res.ticketsSold} cash ticket(s) — $${((res.totalCents || 0) / 100).toFixed(2)}`,
        })
        setCashQty(1)
        setCashGuestName("")
        setCashCustomAmount("")
        await refreshData()
      } else {
        playScanSound(false)
        setCashMsg({ type: "err", text: res.error || "Failed to record cash sale." })
      }
    } catch (err: any) {
      playScanSound(false)
      setCashMsg({ type: "err", text: err?.message || "Failed to record cash sale." })
    } finally {
      setRecordingCash(false)
    }
  }

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

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return

    const video = videoRef.current
    video.srcObject = streamRef.current
    video.play().catch(() => { })

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    let cancelled = false

    const scanLoop = () => {
      if (cancelled || !streamRef.current || !videoRef.current) return
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        })
        if (code?.data) {
          const rawValue = code.data.trim()
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
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    }

    rafRef.current = requestAnimationFrame(scanLoop)
    return () => {
      cancelled = true
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [cameraActive, handleCheckIn])

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

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-[#20efe0]/40 bg-[#05052d] text-[#20efe0] hover:bg-[#20efe0]/15 font-bold rounded-xl h-9 px-3.5 text-xs"
                >
                  <Link href={`/portal/events/${event.id}/print`}>
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print Physical Tickets
                  </Link>
                </Button>
                <Button
                  onClick={openEditModal}
                  size="sm"
                  className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-bold rounded-xl h-9 px-3.5 text-xs"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Ticket / Event
                </Button>
              </>
            )}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-[#20205a] bg-[#0c0c3f]/70 text-[#dbe0fb] hover:bg-[#20205a]/50 rounded-xl h-9 text-xs"
            >
              <Link href={`/events/${event.id}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Public Event Page
              </Link>
            </Button>
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
                    timeZone: "America/Chicago",
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
              {!isScannerOnly && (
                <StatTile
                  icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                  label="Gross"
                  value={event.priceCents > 0 ? `$${(grossCents / 100).toFixed(0)}` : "Free"}
                />
              )}
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
              <p className="text-center text-[11px] text-[#9a9fc4]">
                Point your camera at any StarCast ticket QR code to check in automatically.
              </p>
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
              className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold ${scanResult.type === "valid"
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

        {/* Door Cash Sales Tracker (Creator, Admin & Assigned Door Scanners) */}
        <div className="rounded-3xl border border-emerald-500/30 bg-[#0c0c3f] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Door Cash Sales
              </h2>
              <p className="text-xs text-[#9a9fc4]">
                Record cash tickets sold at the door. Automatically deducts from remaining inventory and checks guests in.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#20205a] bg-[#05052d]/80 px-3.5 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#9a9fc4]">Cash Tickets</p>
                <p className="text-sm font-black text-white font-mono">{cashSales.ticketsCount}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3.5 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wider text-emerald-300">Cash Collected</p>
                <p className="text-sm font-black text-emerald-400 font-mono">
                  ${(cashSales.totalCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRecordCashSale} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <Label htmlFor="cash-qty" className="text-[11px] text-[#9a9fc4]">
                Tickets
              </Label>
              <Input
                id="cash-qty"
                type="number"
                min="1"
                max={Math.max(1, remaining)}
                value={String(cashQty)}
                onChange={(e) => setCashQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="cash-amt" className="text-[11px] text-[#9a9fc4]">
                Cash Amount ($ USD)
              </Label>
              <Input
                id="cash-amt"
                type="number"
                min="0"
                step="0.50"
                placeholder={(((event.priceCents || 0) * cashQty) / 100).toFixed(2)}
                value={cashCustomAmount}
                onChange={(e) => setCashCustomAmount(e.target.value)}
                className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <Label htmlFor="cash-guest" className="text-[11px] text-[#9a9fc4]">
                Guest Name / Note (Optional)
              </Label>
              <Input
                id="cash-guest"
                value={cashGuestName}
                onChange={(e) => setCashGuestName(e.target.value)}
                placeholder="Door Cash Guest"
                className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <Button
                type="submit"
                disabled={recordingCash || remaining <= 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#05051f] font-extrabold rounded-xl h-10 text-xs"
              >
                {recordingCash ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Banknote className="w-4 h-4 mr-1.5" />
                )}
                {remaining <= 0 ? "Sold Out" : "Log Cash Sale"}
              </Button>
            </div>
          </form>

          {cashMsg && (
            <div
              className={`p-3 rounded-xl text-xs border ${cashMsg.type === "ok"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-red-950/40 border-red-500/40 text-red-200"
                }`}
            >
              {cashMsg.text}
            </div>
          )}

          {cashSales.orders.length > 0 && (
            <div className="divide-y divide-[#20205a]/70 rounded-2xl border border-[#20205a] bg-[#05052d]/60 overflow-hidden max-h-48 overflow-y-auto">
              {cashSales.orders.map((ord) => (
                <div key={ord.id} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-[#f5f7ff]">{ord.buyerName}</span>
                    <span className="text-[#9a9fc4] ml-2">
                      ({ord.quantity} {ord.quantity === 1 ? "ticket" : "tickets"})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-emerald-400">
                      ${(ord.totalCents / 100).toFixed(2)}
                    </span>
                    <span className="font-mono text-[#9a9fc4]">
                      {new Date(ord.createdAt).toLocaleTimeString("en-US", { timeZone: "America/Chicago" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Door Scanners Management (Creator & Admin only) */}
        {canManageScanners && (
          <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f] p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#ffd166]" />
                  Door Scanners ({scanners.length})
                </h2>
                <p className="text-xs text-[#9a9fc4]">
                  Add registered StarCast users by email so they can scan tickets at the door for this event only (cannot edit event or prices).
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href)
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2000)
                  }
                }}
                className="border-[#20205a] bg-[#05052d]/80 text-[#20efe0] hover:bg-[#20205a]/50 rounded-xl h-9 text-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    Scanner Link Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Scanner Link
                  </>
                )}
              </Button>
            </div>

            <form onSubmit={handleAddScanner} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                type="email"
                value={scannerEmailInput}
                onChange={(e) => setScannerEmailInput(e.target.value)}
                placeholder="Enter registered user's email (e.g. door@example.com)..."
                className="h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-sm flex-1"
              />
              <Button
                type="submit"
                disabled={addingScanner || !scannerEmailInput.trim()}
                className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-bold rounded-xl h-10 px-5 text-xs"
              >
                {addingScanner ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
                Add Scanner
              </Button>
            </form>

            {scannerMsg && (
              <div
                className={`p-3 rounded-xl text-xs border ${scannerMsg.type === "ok"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-red-950/40 border-red-500/40 text-red-200"
                  }`}
              >
                {scannerMsg.text}
              </div>
            )}

            {scanners.length > 0 && (
              <div className="divide-y divide-[#20205a]/70 rounded-2xl border border-[#20205a] bg-[#05052d]/60 overflow-hidden">
                {scanners.map((sc) => (
                  <div key={sc.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#f5f7ff] truncate">
                        {sc.name || sc.email}
                      </p>
                      <p className="text-xs text-[#9a9fc4] truncate">{sc.email}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveScanner(sc.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg h-8 px-2.5 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                    className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${filter === tab ? "bg-[#ea6f2a] text-white" : "text-[#9a9fc4] hover:text-white"
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
                          Scanned {new Date(inst.checkedInAt).toLocaleTimeString("en-US", { timeZone: "America/Chicago" })}
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

      {/* Ticket Scanned Confirmation Popup */}
      <Dialog open={!!scanPopup} onOpenChange={(open) => !open && setScanPopup(null)}>
        <DialogContent className="border-emerald-500/60 bg-[#0c0c3f] text-[#f5f7ff] max-w-sm text-center p-6 sm:p-8 shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-2">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <DialogHeader className="text-center space-y-1.5">
            <DialogTitle className="text-2xl font-black text-white text-center">
              Ticket Scanned!
            </DialogTitle>
            <DialogDescription className="text-[#dbe0fb] text-sm text-center">
              {scanPopup ? (
                <>
                  <span className="block font-bold text-[#ffd166] text-base mt-1">
                    Ticket #{scanPopup.ticketNumber} &bull; {scanPopup.holderName}
                  </span>
                  <span className="block text-xs text-[#9a9fc4] mt-1">
                    Checked in for {scanPopup.eventTitle}
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 sm:justify-center">
            <Button
              type="button"
              onClick={() => setScanPopup(null)}
              className="w-full sm:w-40 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#05051f] font-extrabold text-sm"
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket / Event Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] overflow-y-auto border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#ffd166]" />
              Edit Ticket &amp; Event
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Update your event details. Ticket price locks permanently once the first ticket is purchased.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            {editError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {editError}
              </div>
            )}

            <div>
              <Label htmlFor="ev-edit-title" className="text-xs text-[#9a9fc4]">
                Event Title *
              </Label>
              <Input
                id="ev-edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-edit-venue" className="text-xs text-[#9a9fc4]">
                  Venue Name *
                </Label>
                <Input
                  id="ev-edit-venue"
                  value={editForm.venueName}
                  onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="ev-edit-addr" className="text-xs text-[#9a9fc4]">
                  Address / City
                </Label>
                <Input
                  id="ev-edit-addr"
                  value={editForm.venueAddress}
                  onChange={(e) => setEditForm({ ...editForm, venueAddress: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ev-edit-date" className="text-xs text-[#9a9fc4]">
                  Event Date &amp; Time *
                </Label>
                <Input
                  id="ev-edit-date"
                  type="datetime-local"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="ev-edit-doors" className="text-xs text-[#9a9fc4]">
                  Doors Open
                </Label>
                <Input
                  id="ev-edit-doors"
                  value={editForm.doorsOpenTime}
                  onChange={(e) => setEditForm({ ...editForm, doorsOpenTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="ev-edit-start" className="text-xs text-[#9a9fc4]">
                  Show Start
                </Label>
                <Input
                  id="ev-edit-start"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ev-edit-price" className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  Price ($ USD)
                  {soldCount > 0 && <Lock className="w-3 h-3 text-amber-400" />}
                </Label>
                <Input
                  id="ev-edit-price"
                  type="number"
                  min="0"
                  step="0.50"
                  disabled={soldCount > 0}
                  value={(editForm.priceCents / 100).toString()}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priceCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)),
                    })
                  }
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className={`text-[10px] mt-1 ${soldCount > 0 ? "text-amber-400" : "text-[#9a9fc4]"}`}>
                  {soldCount > 0
                    ? "Price locked — tickets have already been purchased."
                    : "Editable until the first ticket is bought ($0 for free)."}
                </p>
              </div>

              <div>
                <Label htmlFor="ev-edit-inv" className="text-xs text-[#9a9fc4]">
                  Total Inventory *
                </Label>
                <Input
                  id="ev-edit-inv"
                  type="number"
                  min={Math.max(1, soldCount)}
                  max="10000"
                  value={String(editForm.totalInventory)}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      totalInventory: parseInt(e.target.value || "20", 10),
                    })
                  }
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="ev-edit-age" className="text-xs text-[#9a9fc4]">
                  Age Policy
                </Label>
                <select
                  id="ev-edit-age"
                  value={editForm.ageRestriction}
                  onChange={(e) => setEditForm({ ...editForm, ageRestriction: e.target.value })}
                  className="mt-1 w-full h-9 rounded-md border border-[#20205a] bg-[#05052d] px-3 text-sm text-[#f5f7ff]"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-edit-repeat" className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#20efe0]" /> Repeat Schedule
                </Label>
                <select
                  id="ev-edit-repeat"
                  value={editForm.recurrenceFrequency}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      recurrenceFrequency: e.target.value as "one_time" | "weekly" | "monthly" | "yearly",
                    })
                  }
                  className="mt-1 w-full h-9 rounded-md border border-[#20205a] bg-[#05052d] px-3 text-sm text-[#f5f7ff]"
                >
                  <option value="one_time">One-time event (Default)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#ffd166]" /> Event Image / Flyer (Optional)
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-[#20205a] bg-[#05052d] hover:border-[#ea6f2a]/60 text-xs font-semibold text-[#f5f7ff] transition-colors">
                    {uploadingFlyer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ea6f2a]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#ea6f2a]" />
                    )}
                    {editForm.flyerUrl ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingFlyer}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadFlyer(file)
                      }}
                    />
                  </label>
                  {editForm.flyerUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, flyerUrl: "" })}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                {editForm.flyerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editForm.flyerUrl}
                    alt="Event flyer preview"
                    className="mt-2 h-24 w-full object-cover rounded-lg border border-[#20205a]"
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="ev-edit-desc" className="text-xs text-[#9a9fc4]">
                Event Description
              </Label>
              <Textarea
                id="ev-edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={savingEdit}
                className="border-[#20205a] bg-[#05052d] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
