"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBandEvent, deleteBandEvent, type EventCustomLink } from "@/app/actions/band-tickets"
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
} from "lucide-react"

interface SellerCentralProps {
  isApprovedSeller: boolean
  isAdmin?: boolean
  myBands: Array<{
    id: string
    name: string
    slug: string | null
    ticketingStatus: string
  }>
  approvedBands: Array<{
    id: string
    name: string
    slug: string | null
    ticketingStatus: string
    stripeAccountStatus: string | null
  }>
  events: Array<{
    id: string
    bandId: string
    bandName: string
    title: string
    venueName: string
    eventDate: string
    priceCents: number
    totalInventory: number
    remainingInventory: number
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
  myBands,
  approvedBands,
  events,
  orders,
}: SellerCentralProps) {
  const router = useRouter()
  const [selectedBandId, setSelectedBandId] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "stripe" | "cash">("all")
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Standalone / Band Event Creation modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [eventAssociation, setEventAssociation] = useState<string>("standalone")
  const [form, setForm] = useState({
    title: "",
    organizerName: "",
    description: "",
    venueName: "",
    venueAddress: "",
    eventDate: "",
    doorsOpenTime: "7:00 PM",
    startTime: "8:00 PM",
    priceCents: 1500,
    totalInventory: 50,
    ageRestriction: "All Ages",
    flyerUrl: "",
    recurrenceFrequency: "one_time" as "one_time" | "weekly" | "monthly" | "yearly",
    customLinks: [] as EventCustomLink[],
  })

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
      const targetBandId = eventAssociation === "standalone" ? null : eventAssociation
      const res = await createBandEvent(targetBandId, {
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
      setCreateOpen(false)
      setForm({
        title: "",
        organizerName: "",
        description: "",
        venueName: "",
        venueAddress: "",
        eventDate: "",
        doorsOpenTime: "7:00 PM",
        startTime: "8:00 PM",
        priceCents: 1500,
        totalInventory: 50,
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

  async function handleDeleteEvent(ev: { id: string; title: string }) {
    if (deletingId) return
    if (!window.confirm(`Permanently delete "${ev.title}"? This cannot be undone.`)) return
    setDeletingId(ev.id)
    try {
      const res = await deleteBandEvent(ev.id)
      if (!res.success) {
        window.alert(res.error || "Failed to delete event.")
      } else {
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
      if (selectedBandId !== "all" && o.bandId !== selectedBandId) return false
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
  }, [orders, selectedBandId, selectedYear, paymentFilter, search])

  const filteredEvents = useMemo(() => {
    if (selectedBandId === "all") return events
    return events.filter((e) => e.bandId === selectedBandId)
  }, [events, selectedBandId])

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
      "Act / Band",
      "Event Title",
      "Venue",
      "Event Date",
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
      csvEscape(o.paymentMethod === "cash" ? "Door Cash" : "Stripe Online"),
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

  if (!isApprovedSeller) {
    const hasPending = myBands.some((b) => b.ticketingStatus === "applied")
    return (
      <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-12 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-3xl border border-[#20205a] bg-[#0c0c3f]/90 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/40 flex items-center justify-center mx-auto text-[#ffd166]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Ticket Seller Central</h1>
            <p className="text-sm text-[#9a9fc4]">
              {hasPending
                ? "Your ticket seller application is currently pending admin approval. Once approved, your sales dashboard and tax exports will unlock here."
                : "Ticket Seller Central is available to approved StarCast ticket sellers. Apply from your Dashboard or Artist Portal to start selling tickets."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-10 px-5 text-sm"
            >
              <Link href={myBands.length > 0 ? "/portal?tab=ticketing" : "/dashboard"}>
                {hasPending ? "Check Application Status" : "Apply to Sell Tickets"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl h-10 px-4 text-sm"
            >
              <Link href="/tickets">Back to Tickets</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
              Your own approved acts, ticket sales breakdown, door scanners, and tax-ready CSV exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

        {createdEventId && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/35 p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-emerald-200">
            <span>Event created! Your standalone ticket page is live.</span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-[#20efe0] text-[#05051f] font-bold rounded-lg h-8 text-xs">
                <Link href={`/events/${createdEventId}`}>Open Ticket Page</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-emerald-500/40 text-emerald-200 rounded-lg h-8 text-xs">
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
          <h2 className="text-lg font-extrabold text-[#f5f7ff]">Your Events ({filteredEvents.length})</h2>
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 text-center text-sm text-[#9a9fc4]">
              You haven&apos;t posted any events yet. Click <strong>Post / Manage Events</strong> above to create your first event.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((ev) => {
                const sold = Math.max(0, ev.totalInventory - ev.remainingInventory)
                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#ffd166] uppercase tracking-wider">
                          {ev.bandName}
                        </span>
                        <Badge variant="outline" className="border-[#20205a] text-[#cbd0f2] text-[10px] font-mono">
                          {ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : "FREE"}
                        </Badge>
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
                          {sold}/{ev.totalInventory} sold
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#20205a]/60">
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
                        className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl h-8 px-3 text-xs"
                      >
                        <Link href={`/events/${ev.id}`}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Ticket Page
                        </Link>
                      </Button>
                      {(sold === 0 || isAdmin) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={deletingId === ev.id}
                          onClick={() => handleDeleteEvent(ev)}
                          className="border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-950/60 hover:text-red-200 rounded-xl h-8 px-2.5 text-xs"
                          title={sold > 0 ? "Admin delete event" : "Delete event"}
                        >
                          {deletingId === ev.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
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

              {approvedBands.length > 1 && (
                <select
                  value={selectedBandId}
                  onChange={(e) => setSelectedBandId(e.target.value)}
                  className="h-9 rounded-xl border border-[#20205a] bg-[#05052d] px-3 text-xs text-[#f5f7ff]"
                >
                  <option value="all">All My Acts</option>
                  {approvedBands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

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
                    <th className="py-3 px-4">Event / Act</th>
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
                        <p className="font-bold text-white">{o.eventTitle}</p>
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

      {/* Create Event / Sell Tickets Modal (Standalone or Band-linked + Titled Links) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[95vw] max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" />
              Create Event &amp; Sell Tickets
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Post a standalone event (creates its own ticket page) or link it to one of your approved acts.
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
                <Label htmlFor="sc-assoc" className="text-xs text-[#9a9fc4]">
                  Event Type / Association
                </Label>
                <select
                  id="sc-assoc"
                  value={eventAssociation}
                  onChange={(e) => setEventAssociation(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-[#20205a] bg-[#05052d] px-3 text-sm text-[#f5f7ff]"
                >
                  <option value="standalone">Standalone Event (Not tied to a band)</option>
                  {approvedBands.map((b) => (
                    <option key={b.id} value={b.id}>
                      Band / Act: {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {eventAssociation === "standalone" && (
                <div>
                  <Label htmlFor="sc-org" className="text-xs text-[#9a9fc4]">
                    Host / Organizer Name
                  </Label>
                  <Input
                    id="sc-org"
                    placeholder="e.g. StarCast Live Events"
                    value={form.organizerName}
                    onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                    className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                  />
                </div>
              )}
            </div>

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
                Post {form.totalInventory} Tickets
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
