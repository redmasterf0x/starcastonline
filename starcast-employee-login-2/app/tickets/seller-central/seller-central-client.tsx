"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  applyForUserTicketing,
  createBandEvent,
  deleteBandEvent,
  adminReviewTicketEvent,
  type EventCustomLink,
} from "@/app/actions/band-tickets"
import {
  startSellerStripeOnboarding,
  openSellerStripeDashboard,
  type SellerStripeStatus,
} from "@/app/actions/seller-stripe-connect"
import { SellerSalesChart } from "./sales-chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Download,
  Ticket,
  DollarSign,
  Banknote,
  CreditCard,
  QrCode,
  ExternalLink,
  Calendar,
  MapPin,
  Search,
  ShieldCheck,
  Plus,
  Loader2,
  Upload,
  ImageIcon,
  Repeat,
  Link2,
  X,
  Trash2,
  Printer,
  Crown,
  Wine,
  Utensils,
  Clock,
  CheckCircle2,
  Lock,
  Send,
  AlertCircle,
} from "lucide-react"

interface SellerCentralProps {
  isApprovedSeller: boolean
  isAdmin?: boolean
  sellerApplicationStatus?: "none" | "applied" | "rejected" | "approved"
  sellerApplicationNotes?: string
  defaultOrganizerName?: string
  stripeStatus: SellerStripeStatus
  events: Array<{
    id: string
    bandId: string
    bandName: string
    title: string
    venueName: string
    eventDate: string
    escrowReleaseDate?: string
    onlineGrossCents?: number
    onlineNetCents?: number
    priceCents: number
    totalInventory: number
    remainingInventory: number
    vipEnabled?: boolean
    vipPriceCents?: number
    vipTotalInventory?: number
    vipRemainingInventory?: number
    vipTableBarService?: boolean
    vipFoodService?: boolean
    status: string
    escrowStatus: string
  }>
  orders: Array<{
    id: string
    eventId: string
    eventTitle: string
    venueName: string
    eventDate: string | null
    bandId: string
    bandName: string
    buyerName: string
    buyerEmail: string
    ticketTier?: "general" | "vip"
    quantity: number
    unitPriceCents: number
    totalCents: number
    platformFeeCents: number
    netCents: number
    paymentMethod: "stripe" | "cash"
    stripeRef: string
    createdAt: string
  }>
}

function csvEscape(val: string | number | null | undefined): string {
  const str = String(val ?? "")
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function SellerCentralClient({
  isApprovedSeller,
  isAdmin = false,
  sellerApplicationStatus = "none",
  sellerApplicationNotes = "",
  defaultOrganizerName = "",
  stripeStatus,
  events,
  orders,
}: SellerCentralProps) {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "stripe" | "cash">("all")
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  // Unapproved Seller Application Form state
  const [localAppStatus, setLocalAppStatus] = useState(sellerApplicationStatus)
  const [applyOrgName, setApplyOrgName] = useState(defaultOrganizerName)
  const [applyNotes, setApplyNotes] = useState(sellerApplicationNotes)
  const [submittingApp, setSubmittingApp] = useState(false)
  const [applyError, setApplyError] = useState("")
  const [applySuccessMsg, setApplySuccessMsg] = useState("")

  // Stripe Connect Express state
  const [stripeBusy, setStripeBusy] = useState(false)
  const [stripeError, setStripeError] = useState("")

  // Event Creation modal (neutral standalone Seller Central flow — no band page needed)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [createdPhysicalCount, setCreatedPhysicalCount] = useState<number>(0)
  const [form, setForm] = useState({
    title: "",
    organizerName: defaultOrganizerName,
    description: "",
    venueName: "",
    venueAddress: "",
    eventDate: "",
    doorsOpenTime: "7:00 PM",
    startTime: "8:00 PM",
    priceCents: 1500,
    totalInventory: 50,
    physicalPrintQuantity: 0,
    vipEnabled: false,
    vipPriceCents: 5000,
    vipTotalInventory: 10,
    vipPhysicalPrintQuantity: 0,
    vipTableBarService: true,
    vipFoodService: true,
    vipPerksNote: "Reserved VIP table seating with dedicated table bar service & food service",
    ageRestriction: "All Ages",
    flyerUrl: "",
    recurrenceFrequency: "one_time" as "one_time" | "weekly" | "monthly" | "yearly",
    customLinks: [] as EventCustomLink[],
  })

  const isStripeActive = stripeStatus.status === "active"
  const canCreateEvents = isStripeActive || isAdmin

  async function handleSubmitSellerApplication(e: React.FormEvent) {
    e.preventDefault()
    if (submittingApp) return
    setSubmittingApp(true)
    setApplyError("")
    setApplySuccessMsg("")
    try {
      const res = await applyForUserTicketing({
        organizerName: applyOrgName,
        notes: applyNotes,
      })
      if (!res.success) {
        setApplyError(res.error || "Failed to submit application.")
      } else {
        setLocalAppStatus("applied")
        setApplySuccessMsg(
          "Application submitted! Once StarCast Admin approves your seller account, come right back here to link your Stripe account and create tickets."
        )
        router.refresh()
      }
    } catch (err: any) {
      setApplyError(err?.message || "Failed to submit application.")
    } finally {
      setSubmittingApp(false)
    }
  }

  async function handleConnectStripe() {
    if (stripeBusy) return
    setStripeBusy(true)
    setStripeError("")
    try {
      const res = await startSellerStripeOnboarding()
      if (res.success && res.url) {
        window.location.href = res.url
        return
      }
      setStripeError(res.error || "Could not start Stripe onboarding.")
      setStripeBusy(false)
    } catch (err: any) {
      setStripeError(err?.message || "Could not start Stripe onboarding.")
      setStripeBusy(false)
    }
  }

  async function handleOpenStripeDashboard() {
    if (stripeBusy) return
    setStripeBusy(true)
    setStripeError("")
    try {
      const res = await openSellerStripeDashboard()
      if (res.success && res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer")
      } else {
        setStripeError(res.error || "Could not open Stripe dashboard.")
      }
    } catch (err: any) {
      setStripeError(err?.message || "Could not open Stripe dashboard.")
    } finally {
      setStripeBusy(false)
    }
  }

  async function handleUploadFlyer(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setCreateError("Event image exceeds 10MB limit.")
      return
    }
    setUploadingFlyer(true)
    setCreateError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "events/flyers")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setForm((prev) => ({ ...prev, flyerUrl: data.url }))
    } catch (err: any) {
      setCreateError(err?.message || "Failed to upload event image")
    } finally {
      setUploadingFlyer(false)
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateError("")
    try {
      const res = await createBandEvent(null, {
        title: form.title,
        organizerName: form.organizerName,
        description: form.description,
        venueName: form.venueName,
        venueAddress: form.venueAddress,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : "",
        doorsOpenTime: form.doorsOpenTime,
        startTime: form.startTime,
        priceCents: form.priceCents,
        totalInventory: form.totalInventory,
        physicalPrintQuantity: form.physicalPrintQuantity,
        ...(isAdmin
          ? {
              vipEnabled: form.vipEnabled,
              vipPriceCents: form.vipPriceCents,
              vipTotalInventory: form.vipTotalInventory,
              vipPhysicalPrintQuantity: form.vipPhysicalPrintQuantity,
              vipTableBarService: form.vipTableBarService,
              vipFoodService: form.vipFoodService,
              vipPerksNote: form.vipPerksNote,
            }
          : {}),
        ageRestriction: form.ageRestriction,
        flyerUrl: form.flyerUrl,
        recurrenceFrequency: form.recurrenceFrequency,
        customLinks: form.customLinks,
      })

      if (!res.success || !res.event) {
        setCreateError(res.error || "Failed to create event.")
        setCreating(false)
        return
      }

      setCreatedEventId(res.event.id)
      setCreatedPhysicalCount(res.physicalTicketsCount || 0)
      setCreateOpen(false)
      setForm({
        title: "",
        organizerName: defaultOrganizerName,
        description: "",
        venueName: "",
        venueAddress: "",
        eventDate: "",
        doorsOpenTime: "7:00 PM",
        startTime: "8:00 PM",
        priceCents: 1500,
        totalInventory: 50,
        physicalPrintQuantity: 0,
        vipEnabled: false,
        vipPriceCents: 5000,
        vipTotalInventory: 10,
        vipPhysicalPrintQuantity: 0,
        vipTableBarService: true,
        vipFoodService: true,
        vipPerksNote: "Reserved VIP table seating with dedicated table bar service & food service",
        ageRestriction: "All Ages",
        flyerUrl: "",
        recurrenceFrequency: "one_time",
        customLinks: [],
      })
      router.refresh()
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create event.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteEvent(ev: { id: string; title: string }, soldCount: number) {
    if (deletingId) return
    const confirmMsg =
      soldCount > 0
        ? `Permanently delete "${ev.title}"?\n\nAll paid online ticket buyers (${soldCount} ticket${soldCount === 1 ? "" : "s"} issued) will automatically be refunded their full purchase amount via Stripe and notified by email. This cannot be undone.`
        : `Permanently delete "${ev.title}"? This cannot be undone.`
    if (!window.confirm(confirmMsg)) return
    setDeletingId(ev.id)
    setDeleteNotice(null)
    try {
      const res = await deleteBandEvent(ev.id)
      if (!res.success) {
        window.alert(res.error || "Failed to delete event.")
      } else {
        setDeleteNotice(res.message || `Deleted "${ev.title}".`)
        router.refresh()
      }
    } catch (err: any) {
      window.alert(err?.message || "Failed to delete event.")
    } finally {
      setDeletingId(null)
    }
  }

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    orders.forEach((o) => {
      years.add(String(new Date(o.createdAt).getFullYear()))
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [orders])

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter((o) => {
      if (selectedYear !== "all" && String(new Date(o.createdAt).getFullYear()) !== selectedYear) {
        return false
      }
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) return false
      if (
        q &&
        !o.eventTitle.toLowerCase().includes(q) &&
        !o.buyerName.toLowerCase().includes(q) &&
        !o.buyerEmail.toLowerCase().includes(q) &&
        !o.bandName.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [orders, selectedYear, paymentFilter, search])

  const totals = useMemo(() => {
    let tickets = 0
    let grossCents = 0
    let stripeCents = 0
    let cashCents = 0
    let feeCents = 0
    let netCents = 0
    for (const o of filteredOrders) {
      tickets += o.quantity
      grossCents += o.totalCents
      feeCents += o.platformFeeCents
      netCents += o.netCents
      if (o.paymentMethod === "cash") cashCents += o.totalCents
      else stripeCents += o.totalCents
    }
    return { tickets, grossCents, stripeCents, cashCents, feeCents, netCents }
  }, [filteredOrders])

  function handleExportTaxCsv() {
    const headers = [
      "Order Date (ISO)",
      "Order ID",
      "Organizer / Presenter",
      "Event Title",
      "Venue",
      "Event Date",
      "Ticket Tier",
      "Payment Method",
      "Quantity",
      "Unit Price ($)",
      "Gross Sales ($)",
      "Platform Fee ($)",
      "Net Payout ($)",
      "Buyer Name",
      "Buyer Email",
      "Stripe / Door Reference",
    ]

    const rows = filteredOrders.map((o) => [
      csvEscape(o.createdAt),
      csvEscape(o.id),
      csvEscape(o.bandName),
      csvEscape(o.eventTitle),
      csvEscape(o.venueName),
      csvEscape(o.eventDate ? new Date(o.eventDate).toISOString().slice(0, 10) : ""),
      csvEscape(o.ticketTier === "vip" ? "VIP (Table Bar & Food)" : "General Admission"),
      csvEscape(o.paymentMethod === "cash" ? "Door Cash / Physical" : "Stripe Online"),
      csvEscape(o.quantity),
      csvEscape((o.unitPriceCents / 100).toFixed(2)),
      csvEscape((o.totalCents / 100).toFixed(2)),
      csvEscape((o.platformFeeCents / 100).toFixed(2)),
      csvEscape((o.netCents / 100).toFixed(2)),
      csvEscape(o.buyerName),
      csvEscape(o.buyerEmail),
      csvEscape(o.stripeRef),
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `starcast-ticket-sales-tax-${selectedYear === "all" ? "all-years" : selectedYear}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNAPPROVED VIEW: Direct "Apply to Sell Tickets" Page on Seller Central
  // ─────────────────────────────────────────────────────────────────────────
  if (!isApprovedSeller) {
    const isPending = localAppStatus === "applied"
    const isRejected = localAppStatus === "rejected"

    return (
      <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-10 sm:py-14 flex items-center justify-center">
        <div className="max-w-xl w-full rounded-3xl border border-[#20205a] bg-[#0c0c3f]/95 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/40 flex items-center justify-center mx-auto text-[#ffd166]">
              <Ticket className="w-7 h-7" />
            </div>
            <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/40 text-[11px]">
              Ticket Seller Central
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isPending ? "Seller Application Pending Review" : "Apply to Sell Tickets"}
            </h1>
            <p className="text-sm text-[#9a9fc4] max-w-md mx-auto leading-relaxed">
              {isPending
                ? "Your Ticket Seller Central application has been sent to StarCast Admin. Once approved, you'll link your Stripe payout account right here and start creating event tickets."
                : "Sell QR event tickets directly on StarCast Online — no band page required. Once approved, link your Stripe account for automatic 24-hour post-event payouts."}
            </p>
          </div>

          {applySuccessMsg && (
            <div className="rounded-2xl border border-[#22b573]/40 bg-[#22b573]/15 p-4 text-xs sm:text-sm text-[#22b573] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{applySuccessMsg}</span>
            </div>
          )}

          {isRejected && !applySuccessMsg && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/35 p-4 text-xs sm:text-sm text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>
                Your previous application was not approved. You can update your event details below and re-apply.
              </span>
            </div>
          )}

          {applyError && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/35 p-3.5 text-xs text-red-200">
              {applyError}
            </div>
          )}

          {isPending ? (
            <div className="rounded-2xl border border-[#ffd166]/35 bg-[#05052d]/80 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffd166] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Awaiting Admin Approval
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                  Pending
                </Badge>
              </div>
              {applyOrgName && (
                <p className="text-xs text-[#cbd0f2]">
                  <span className="text-[#9a9fc4]">Organizer / Presenter:</span>{" "}
                  <strong className="text-white">{applyOrgName}</strong>
                </p>
              )}
              {applyNotes && (
                <p className="text-xs text-[#9a9fc4] italic border-t border-[#20205a] pt-2.5">
                  &ldquo;{applyNotes}&rdquo;
                </p>
              )}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-[#9a9fc4]">
                  Next step after approval: Link Stripe Express &rarr; Post Tickets
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[#20205a] bg-[#0c0c3f] text-[#dbe0fb] rounded-xl text-xs"
                >
                  <Link href="/tickets">Back to Tickets</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitSellerApplication} className="space-y-4">
              <div>
                <Label htmlFor="apply-org" className="text-xs text-[#cbd0f2]">
                  Organizer / Promoter / Presenter Name *
                </Label>
                <Input
                  id="apply-org"
                  required
                  placeholder="e.g. Top City Live, Venue Name, or Your Name"
                  value={applyOrgName}
                  onChange={(e) => setApplyOrgName(e.target.value)}
                  className="mt-1.5 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="apply-notes" className="text-xs text-[#cbd0f2]">
                  What events will you be selling tickets for? *
                </Label>
                <Textarea
                  id="apply-notes"
                  required
                  rows={4}
                  placeholder="Tell us briefly about your upcoming shows, events, or venue..."
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  className="mt-1.5 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div className="rounded-2xl border border-[#20205a] bg-[#05052d]/70 p-3.5 text-[11px] text-[#9a9fc4] space-y-1">
                <p className="text-[#dbe0fb] font-semibold">How Ticket Seller Central works:</p>
                <p>&bull; 10% platform fee on online ticket sales (0% fee on door cash &amp; physical print passes).</p>
                <p>&bull; Once approved, link your Stripe account inside Seller Central to receive payouts 24h post-event.</p>
                <p>&bull; Every posted event goes live after quick StarCast Admin verification.</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl h-10 px-4 text-xs"
                >
                  <Link href="/tickets">Back to Tickets</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submittingApp}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-extrabold rounded-xl h-10 px-6 text-xs shadow-lg"
                >
                  {submittingApp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Application to Sell Tickets
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APPROVED SELLER CENTRAL DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#20205a] pb-6">
          <div className="space-y-1.5">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1.5 text-xs text-[#9a9fc4] hover:text-white mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Ticket className="w-7 h-7 text-[#ffd166]" />
              Ticket Seller Central
            </h1>
            <p className="text-sm text-[#9a9fc4]">
              Create event tickets, manage live sales &amp; 24h Stripe payouts, scan QR passes, and export tax reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canCreateEvents ? (
              <Button
                type="button"
                onClick={() => {
                  setCreateError("")
                  setCreateOpen(true)
                }}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-extrabold rounded-xl h-10 px-4 text-xs shadow-md"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Event / Sell Tickets
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleConnectStripe}
                disabled={stripeBusy}
                className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-extrabold rounded-xl h-10 px-4 text-xs shadow-md"
              >
                {stripeBusy ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-1.5" />
                )}
                Link Stripe to Sell Tickets
              </Button>
            )}

            <Button
              type="button"
              onClick={handleExportTaxCsv}
              disabled={filteredOrders.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-[#05051f] font-extrabold rounded-xl h-10 px-4 text-xs shadow-md"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export Tax CSV ({filteredOrders.length})
            </Button>
          </div>
        </div>

        {/* Mandatory Stripe Connect Payout Account Gate / Status Banner */}
        {isStripeActive ? (
          <div className="rounded-2xl border border-[#22b573]/40 bg-[#0c0c3f]/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#22b573]/15 border border-[#22b573]/40 flex items-center justify-center text-[#22b573] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white flex items-center gap-2">
                  Stripe Payout Account Linked
                  <Badge className="bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40 text-[10px]">
                    Active
                  </Badge>
                </p>
                <p className="text-xs text-[#9a9fc4]">
                  Online ticket proceeds (90% net) automatically release from escrow to your Stripe account 24 hours after each event.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={stripeBusy}
              onClick={handleOpenStripeDashboard}
              className="border-[#20205a] bg-[#05052d] text-[#20efe0] hover:bg-[#20205a]/60 rounded-xl h-9 px-3.5 text-xs font-bold shrink-0"
            >
              {stripeBusy ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              )}
              Stripe Payout Dashboard
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#ffd166]/55 bg-gradient-to-r from-[#281b05]/90 via-[#0c0c3f]/95 to-[#05052d] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/45 text-[10px] uppercase font-extrabold">
                  {stripeStatus.status === "onboarding" ? "Action Needed" : "Required Step"}
                </Badge>
                <span className="text-xs text-[#cbd0f2] font-semibold">Stripe Connect Express</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {stripeStatus.status === "onboarding"
                  ? "Finish Linking Your Stripe Payout Account"
                  : "Link Your Stripe Account to Create & Sell Tickets"}
              </h2>
              <p className="text-xs sm:text-sm text-[#cbd0f2] max-w-2xl leading-relaxed">
                You&apos;re approved for Ticket Seller Central! Connect your Stripe payout account so your event revenue can be transferred directly to you 24 hours after each event ends.
              </p>
              {stripeError && <p className="text-xs text-red-300 font-semibold pt-1">{stripeError}</p>}
            </div>

            <Button
              type="button"
              disabled={stripeBusy}
              onClick={handleConnectStripe}
              className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-black rounded-xl h-11 px-6 text-xs sm:text-sm shrink-0 shadow-lg"
            >
              {stripeBusy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {stripeStatus.status === "onboarding" ? "Complete Stripe Setup →" : "Connect Stripe Account →"}
            </Button>
          </div>
        )}

        {deleteNotice && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/35 p-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-200">
            <span>{deleteNotice}</span>
            <button
              type="button"
              onClick={() => setDeleteNotice(null)}
              className="text-amber-300 hover:text-white"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {createdEventId && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/35 p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-amber-200">
            <span>
              Event submitted! Waiting for <strong>StarCast Admin approval</strong> before tickets become available for purchase
              {createdPhysicalCount > 0
                ? ` (${createdPhysicalCount} physical pre-sale ticket${createdPhysicalCount === 1 ? "" : "s"} ready to print).`
                : "."}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const res = await adminReviewTicketEvent(createdEventId, true)
                    if (res.success) {
                      setCreatedEventId(null)
                      router.refresh()
                    }
                  }}
                  className="bg-[#22b573] hover:bg-[#1ca266] text-[#05051f] font-extrabold rounded-lg h-8 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Admin: Approve &amp; Open Sales Now
                </Button>
              )}
              {createdPhysicalCount > 0 && (
                <Button asChild size="sm" className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-extrabold rounded-lg h-8 text-xs">
                  <Link href={`/portal/events/${createdEventId}/print`}>
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print {createdPhysicalCount} Physical Ticket{createdPhysicalCount === 1 ? "" : "s"}
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="bg-[#20efe0] text-[#05051f] font-bold rounded-lg h-8 text-xs">
                <Link href={`/events/${createdEventId}`}>Preview Event Page</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-200 rounded-lg h-8 text-xs">
                <Link href={`/portal/events/${createdEventId}`}>Open Door Scanner</Link>
              </Button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <KpiCard icon={<Ticket className="w-4 h-4 text-[#ea6f2a]" />} label="Tickets Sold" value={String(totals.tickets)} />
          <KpiCard icon={<DollarSign className="w-4 h-4 text-[#ffd166]" />} label="Gross Sales" value={`$${(totals.grossCents / 100).toFixed(2)}`} />
          <KpiCard icon={<CreditCard className="w-4 h-4 text-[#20efe0]" />} label="Stripe Online" value={`$${(totals.stripeCents / 100).toFixed(2)}`} />
          <KpiCard icon={<Banknote className="w-4 h-4 text-emerald-400" />} label="Door Cash" value={`$${(totals.cashCents / 100).toFixed(2)}`} />
          <KpiCard icon={<ShieldCheck className="w-4 h-4 text-emerald-300" />} label="Net Revenue" value={`$${(totals.netCents / 100).toFixed(2)}`} />
        </div>

        {/* Sales Chart */}
        <SellerSalesChart orders={filteredOrders} />

        {/* Your Events */}
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[#f5f7ff]">Your Events ({events.length})</h2>
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 text-center text-sm text-[#9a9fc4]">
              {canCreateEvents ? (
                <>
                  You haven&apos;t posted any events yet. Click <strong>Create Event / Sell Tickets</strong> above to post your first ticketed event.
                </>
              ) : (
                <>
                  Link your <strong>Stripe Payout Account</strong> above to unlock event creation and start selling tickets.
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const sold = Math.max(0, ev.totalInventory - ev.remainingInventory)
                const releaseTimestamp = ev.escrowReleaseDate
                  ? new Date(ev.escrowReleaseDate)
                  : new Date(new Date(ev.eventDate).getTime() + 24 * 60 * 60 * 1000)
                const exactReleaseStr = `${releaseTimestamp.toLocaleDateString("en-US", {
                  timeZone: "America/Chicago",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })} at ${releaseTimestamp.toLocaleTimeString("en-US", {
                  timeZone: "America/Chicago",
                  hour: "numeric",
                  minute: "2-digit",
                })} CT`
                const netOnline = ev.onlineNetCents || 0
                const isReleased = ev.escrowStatus === "released"

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#ffd166] uppercase tracking-wider">
                          {ev.bandName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={
                              ev.status === "pending_approval"
                                ? "border-amber-500/45 bg-amber-500/15 text-amber-300 text-[10px] font-bold"
                                : ev.status === "active"
                                ? "border-[#22b573]/45 bg-[#22b573]/15 text-[#22b573] text-[10px] font-bold"
                                : ev.status === "rejected"
                                ? "border-red-500/45 bg-red-950/40 text-red-300 text-[10px] font-bold"
                                : "border-[#20efe0]/40 bg-[#20efe0]/10 text-[#20efe0] text-[10px] font-bold"
                            }
                          >
                            {ev.status === "pending_approval"
                              ? "Pending Admin Approval"
                              : ev.status === "active"
                              ? "Live & On Sale"
                              : ev.status === "rejected"
                              ? "Not Approved"
                              : ev.status}
                          </Badge>
                          <Badge variant="outline" className="border-[#20205a] text-[#cbd0f2] text-[10px] font-mono">
                            {ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : "FREE"}
                          </Badge>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">{ev.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#9a9fc4]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#ffd166]" />
                          {new Date(ev.eventDate).toLocaleDateString("en-US", { timeZone: "America/Chicago" })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#20efe0]" />
                          {ev.venueName}
                        </span>
                        <span className="font-mono text-[#20efe0]">
                          {sold}/{ev.totalInventory} GA sold
                        </span>
                        {ev.vipEnabled && (
                          <span className="inline-flex items-center gap-1 font-mono text-[#ffd166] bg-[#ffd166]/10 border border-[#ffd166]/35 px-2 py-0.5 rounded-md">
                            <Crown className="w-3 h-3" />
                            VIP ${((ev.vipPriceCents || 0) / 100).toFixed(2)} (
                            {Math.max(0, (ev.vipTotalInventory || 0) - (ev.vipRemainingInventory || 0))}/
                            {ev.vipTotalInventory || 0})
                          </span>
                        )}
                      </div>

                      {/* Seller Escrow Hold & Stripe Payout Timeline Banner */}
                      {netOnline > 0 ? (
                        isReleased ? (
                          <div className="mt-2 rounded-xl border border-[#22b573]/40 bg-[#22b573]/10 p-3 space-y-1">
                            <p className="text-xs font-extrabold text-[#22b573] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              Payout Sent to Your Stripe (${(netOnline / 100).toFixed(2)} net)
                            </p>
                            <p className="text-[11px] text-[#cbd0f2] leading-relaxed">
                              Released from escrow on <span className="font-mono text-white">{exactReleaseStr}</span>. Once sent to your Stripe Connect account, arrival in your Stripe balance is near-instant.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 rounded-xl border border-[#20efe0]/40 bg-gradient-to-r from-[#052638]/80 via-[#081b36]/80 to-[#05052d] p-3 space-y-1">
                            <p className="text-xs font-extrabold text-[#20efe0] flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-[#ffd166] shrink-0" />
                              Your money (${(netOnline / 100).toFixed(2)} net) is on the way!
                            </p>
                            <p className="text-[11px] text-[#dbe0fb] leading-relaxed">
                              Releases from the 24h escrow hold &amp; sends to your Stripe on{" "}
                              <strong className="text-[#ffd166] font-mono">{exactReleaseStr}</strong>. After sending to your Stripe account, arrival is near-instant.
                            </p>
                          </div>
                        )
                      ) : (
                        (ev.priceCents > 0 || (ev.vipEnabled && (ev.vipPriceCents || 0) > 0)) && (
                          <div className="mt-2 rounded-xl border border-[#20205a] bg-[#05052d]/60 px-3 py-2 text-[11px] text-[#9a9fc4]">
                            <span className="text-[#cbd0f2] font-semibold">Payout Schedule:</span> Online sales release from escrow &amp; send to your Stripe on{" "}
                            <span className="font-mono text-[#ffd166]">{exactReleaseStr}</span> (near-instant once sent).
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#20205a]/60">
                      {isAdmin && ev.status === "pending_approval" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            const res = await adminReviewTicketEvent(ev.id, true)
                            if (res.success) router.refresh()
                          }}
                          className="bg-[#22b573] hover:bg-[#1ca266] text-[#05051f] font-extrabold rounded-xl h-8 px-3 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      )}
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] font-extrabold rounded-xl h-8 px-3 text-xs flex-1"
                      >
                        <Link href={`/portal/events/${ev.id}`}>
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          Scan &amp; Cash Sales
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-[#20205a] bg-[#05052d] text-[#ffd166] hover:bg-[#20205a]/60 rounded-xl h-8 px-3 text-xs"
                        title="Generate & print physical pre-sale QR tickets"
                      >
                        <Link href={`/portal/events/${ev.id}/print`}>
                          <Printer className="w-3.5 h-3.5 mr-1.5" />
                          Print
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl h-8 px-3 text-xs"
                      >
                        <Link href={`/events/${ev.id}`}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Ticket Page
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={deletingId === ev.id}
                        onClick={() => handleDeleteEvent(ev, sold)}
                        className="border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-950/60 hover:text-red-200 rounded-xl h-8 px-2.5 text-xs"
                        title={sold > 0 ? "Delete event & refund all ticket buyers" : "Delete event"}
                      >
                        {deletingId === ev.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Sales Ledger & Tax Export Filters */}
        <section className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/80 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[#f5f7ff]">
              Ticket Sales Ledger ({filteredOrders.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9a9fc4] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search event, buyer..."
                  className="pl-8 h-9 w-48 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl text-xs"
                />
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 rounded-xl border border-[#20205a] bg-[#05052d] px-3 text-xs text-[#f5f7ff]"
              >
                <option value="all">All Years (Tax)</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-xl bg-[#05052d] border border-[#20205a] p-0.5 text-xs">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "stripe", label: "Stripe" },
                    { id: "cash", label: "Cash" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPaymentFilter(t.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      paymentFilter === t.id ? "bg-[#ea6f2a] text-white" : "text-[#9a9fc4] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#9a9fc4] border border-dashed border-[#20205a] rounded-2xl">
              No paid or cash ticket orders match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#20205a] bg-[#05052d]/60">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#20205a] text-[#9a9fc4] uppercase tracking-wider bg-[#080936]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Event / Presenter</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Gross</th>
                    <th className="py-3 px-4 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20205a]/60">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#0c0c3f]/50">
                      <td className="py-3 px-4 font-mono text-[#cbd0f2] whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("en-US", { timeZone: "America/Chicago" })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white">{o.eventTitle}</p>
                          {o.ticketTier === "vip" && (
                            <Badge className="bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/40 text-[10px] px-1.5 py-0">
                              ★ VIP
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9a9fc4]">{o.bandName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#f5f7ff]">{o.buyerName}</p>
                        <p className="text-[11px] text-[#9a9fc4]">{o.buyerEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            o.paymentMethod === "cash"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : "border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-[10px]"
                          }
                        >
                          {o.paymentMethod === "cash" ? "Door Cash" : "Stripe Online"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white">{o.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#ffd166]">
                        ${(o.totalCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ${(o.netCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Create Event / Sell Tickets Modal (Direct Seller Central — No Band Selection Needed) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[95vw] max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" />
              Create Event &amp; Sell Tickets
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Create a dedicated public ticket page with QR passes directly from Ticket Seller Central.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
            {createError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sc-title" className="text-xs text-[#9a9fc4]">
                  Event Title *
                </Label>
                <Input
                  id="sc-title"
                  required
                  placeholder="e.g. Topeka Winter Showcase"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="sc-org" className="text-xs text-[#9a9fc4]">
                  Host / Presenter / Artist Name
                </Label>
                <Input
                  id="sc-org"
                  placeholder="e.g. Top City Live Events"
                  value={form.organizerName}
                  onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sc-venue" className="text-xs text-[#9a9fc4]">
                  Venue Name *
                </Label>
                <Input
                  id="sc-venue"
                  required
                  placeholder="e.g. The Jayhawk Theatre"
                  value={form.venueName}
                  onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="sc-addr" className="text-xs text-[#9a9fc4]">
                  Address / City
                </Label>
                <Input
                  id="sc-addr"
                  placeholder="720 SW Jackson St, Topeka KS"
                  value={form.venueAddress}
                  onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="sc-date" className="text-xs text-[#9a9fc4]">
                  Event Date &amp; Time *
                </Label>
                <Input
                  id="sc-date"
                  type="datetime-local"
                  required
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="sc-doors" className="text-xs text-[#9a9fc4]">
                  Doors Open
                </Label>
                <Input
                  id="sc-doors"
                  value={form.doorsOpenTime}
                  onChange={(e) => setForm({ ...form, doorsOpenTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="sc-start" className="text-xs text-[#9a9fc4]">
                  Show Start
                </Label>
                <Input
                  id="sc-start"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            {/* Optional Physical Pre-Sale Tickets to Print */}
            <div className="rounded-xl border border-[#20efe0]/30 bg-[#05052d]/70 p-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label htmlFor="sc-phys" className="text-xs font-bold text-[#ffd166] flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-[#20efe0]" />
                    Physical Pre-Sale Tickets to Print (Optional)
                  </Label>
                  <p className="text-[11px] text-[#9a9fc4]">
                    Reserve tickets from your total inventory with unique scannable QR codes ready to print &amp; sell in person beforehand (0% online fee).
                  </p>
                </div>
                <Input
                  id="sc-phys"
                  type="number"
                  min="0"
                  max={Math.min(200, Math.max(0, form.totalInventory))}
                  value={String(form.physicalPrintQuantity)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      physicalPrintQuantity: Math.max(
                        0,
                        Math.min(200, Math.min(form.totalInventory, parseInt(e.target.value || "0", 10)))
                      ),
                    })
                  }
                  className="w-24 h-9 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] font-mono text-sm shrink-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="sc-price" className="text-xs text-[#9a9fc4]">
                  Price ($ USD, 0 = Free)
                </Label>
                <Input
                  id="sc-price"
                  type="number"
                  min="0"
                  step="0.50"
                  value={(form.priceCents / 100).toString()}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priceCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)),
                    })
                  }
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="sc-inv" className="text-xs text-[#9a9fc4]">
                  Total Inventory *
                </Label>
                <Input
                  id="sc-inv"
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={String(form.totalInventory)}
                  onChange={(e) =>
                    setForm({ ...form, totalInventory: parseInt(e.target.value || "20", 10) })
                  }
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="sc-age" className="text-xs text-[#9a9fc4]">
                  Age Policy
                </Label>
                <select
                  id="sc-age"
                  value={form.ageRestriction}
                  onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })}
                  className="mt-1 w-full h-9 rounded-md border border-[#20205a] bg-[#05052d] px-3 text-sm text-[#f5f7ff]"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>
            </div>

            {/* Admin-Only VIP Tier: Table Bar Service & Food Service */}
            {isAdmin && (
              <div className="rounded-2xl border border-[#ffd166]/45 bg-gradient-to-br from-[#231a05]/80 via-[#0c0c3f] to-[#05052d] p-4 space-y-3.5 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[#ffd166] shrink-0" />
                      <span className="text-xs sm:text-sm font-extrabold text-[#ffd166]">
                        Admin Exclusive: Sell VIP Table Tickets (Bar &amp; Food Service)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#cbd0f2]">
                      Offer a second VIP ticket tier alongside General Admission featuring table bar service and food service.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={form.vipEnabled}
                      onChange={(e) => setForm({ ...form, vipEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#ffd166] rounded"
                    />
                    <span className="text-xs font-bold text-white">Enable VIP</span>
                  </label>
                </div>

                {form.vipEnabled && (
                  <div className="space-y-3 pt-2 border-t border-[#ffd166]/25 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="sc-vip-price" className="text-xs text-[#ffd166]">
                          VIP Price ($ USD) *
                        </Label>
                        <Input
                          id="sc-vip-price"
                          type="number"
                          min="0"
                          step="0.50"
                          value={(form.vipPriceCents / 100).toString()}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              vipPriceCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)),
                            })
                          }
                          className="mt-1 border-[#ffd166]/40 bg-[#05052d] text-[#f5f7ff]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sc-vip-inv" className="text-xs text-[#ffd166]">
                          VIP Inventory (Seats/Passes) *
                        </Label>
                        <Input
                          id="sc-vip-inv"
                          type="number"
                          min="1"
                          max="5000"
                          value={String(form.vipTotalInventory)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              vipTotalInventory: Math.max(1, parseInt(e.target.value || "10", 10)),
                            })
                          }
                          className="mt-1 border-[#ffd166]/40 bg-[#05052d] text-[#f5f7ff]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sc-vip-phys" className="text-xs text-[#ffd166]">
                          Print Physical VIP (Opt.)
                        </Label>
                        <Input
                          id="sc-vip-phys"
                          type="number"
                          min="0"
                          max={Math.min(200, form.vipTotalInventory)}
                          value={String(form.vipPhysicalPrintQuantity)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              vipPhysicalPrintQuantity: Math.max(
                                0,
                                Math.min(200, Math.min(form.vipTotalInventory, parseInt(e.target.value || "0", 10)))
                              ),
                            })
                          }
                          className="mt-1 border-[#ffd166]/40 bg-[#05052d] text-[#f5f7ff] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-0.5">
                      <label className="inline-flex items-center gap-2 text-xs text-[#f5f7ff] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.vipTableBarService}
                          onChange={(e) => setForm({ ...form, vipTableBarService: e.target.checked })}
                          className="accent-[#ffd166] rounded"
                        />
                        <Wine className="w-3.5 h-3.5 text-[#20efe0]" />
                        <span>Table Bar Service Included</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs text-[#f5f7ff] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.vipFoodService}
                          onChange={(e) => setForm({ ...form, vipFoodService: e.target.checked })}
                          className="accent-[#ffd166] rounded"
                        />
                        <Utensils className="w-3.5 h-3.5 text-[#ea6f2a]" />
                        <span>Food Service Included</span>
                      </label>
                    </div>

                    <div>
                      <Label htmlFor="sc-vip-note" className="text-xs text-[#9a9fc4]">
                        VIP Hospitality Details (shown on event page &amp; VIP pass)
                      </Label>
                      <Input
                        id="sc-vip-note"
                        placeholder="e.g. Reserved front-row table seating, dedicated bartender & priority food menu"
                        value={form.vipPerksNote}
                        onChange={(e) => setForm({ ...form, vipPerksNote: e.target.value })}
                        className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sc-repeat" className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#20efe0]" /> Repeat Schedule
                </Label>
                <select
                  id="sc-repeat"
                  value={form.recurrenceFrequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
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
                    {form.flyerUrl ? "Change Image" : "Upload Image"}
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
                  {form.flyerUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, flyerUrl: "" })}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                {form.flyerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.flyerUrl}
                    alt="Event flyer preview"
                    className="mt-2 h-24 w-full object-cover rounded-lg border border-[#20205a]"
                  />
                )}
              </div>
            </div>

            {/* Titled Custom Links */}
            <div className="space-y-2 rounded-2xl border border-[#20205a] bg-[#05052d]/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-[#f5f7ff] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#20efe0]" /> Event Links (Optional)
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      customLinks: [...prev.customLinks, { title: "", url: "" }],
                    }))
                  }
                  className="h-7 px-2.5 text-[11px] border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20205a]/50"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Link
                </Button>
              </div>
              {form.customLinks.length === 0 ? (
                <p className="text-[11px] text-[#9a9fc4]">
                  Add titled links for venue parking, artist pages, merch, or sponsor sites.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.customLinks.map((lnk, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Link Title (e.g. Parking Info)"
                        value={lnk.title}
                        onChange={(e) => {
                          const next = [...form.customLinks]
                          next[idx] = { ...next[idx], title: e.target.value }
                          setForm({ ...form, customLinks: next })
                        }}
                        className="sm:col-span-5 h-8 text-xs bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                      />
                      <Input
                        placeholder="https://..."
                        value={lnk.url}
                        onChange={(e) => {
                          const next = [...form.customLinks]
                          next[idx] = { ...next[idx], url: e.target.value }
                          setForm({ ...form, customLinks: next })
                        }}
                        className="sm:col-span-6 h-8 text-xs bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            ...form,
                            customLinks: form.customLinks.filter((_, i) => i !== idx),
                          })
                        }
                        className="sm:col-span-1 h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="sc-desc" className="text-xs text-[#9a9fc4]">
                Event Description
              </Label>
              <Textarea
                id="sc-desc"
                rows={3}
                placeholder="Lineup, details, parking, special notes..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                className="border-[#20205a] bg-[#05052d] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold"
              >
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Post {form.totalInventory} GA{form.vipEnabled ? ` + ${form.vipTotalInventory} VIP` : ""} Tickets
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 p-4 space-y-1 shadow-md">
      <div className="flex items-center gap-1.5 text-xs text-[#9a9fc4]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-black text-white font-mono">{value}</div>
    </div>
  )
}
