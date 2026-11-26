"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { createTicketCheckoutSession } from "@/app/actions/ticket-purchase"
import { updateBandEvent, type EventCustomLink } from "@/app/actions/band-tickets"
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
  Ticket,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Check,
  Loader2,
  Repeat,
  Music,
  QrCode,
  Pencil,
  Lock,
  Upload,
  ImageIcon,
  X,
  Link2,
  ExternalLink,
  Plus,
} from "lucide-react"

interface EventBuyClientProps {
  event: any
  band: {
    id: string
    name: string
    slug: string | null
    logoUrl: string | null
  }
  canScan?: boolean
  canEdit?: boolean
}

export function EventBuyClient({
  event: initialEvent,
  band,
  canScan = false,
  canEdit = false,
}: EventBuyClientProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [event, setEvent] = useState(initialEvent)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Edit modal state (for creator / admin right on the ticket page)
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState("")
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
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
    recurrenceFrequency: (initialEvent.recurrenceFrequency || "one_time") as
      | "one_time"
      | "weekly"
      | "monthly"
      | "yearly",
    customLinks: (Array.isArray(initialEvent.customLinks) ? initialEvent.customLinks : []) as EventCustomLink[],
  })

  useEffect(() => {
    setEvent(initialEvent)
  }, [initialEvent])

  useEffect(() => {
    if (session?.user) {
      if (!buyerName && session.user.name) setBuyerName(session.user.name)
      if (!buyerEmail && session.user.email) setBuyerEmail(session.user.email)
    }
  }, [session, buyerName, buyerEmail])

  const soldCount = Math.max(0, (event.totalInventory || 0) - (event.remainingInventory ?? 0))
  const isFree = (event.priceCents || 0) === 0
  const isSoldOut = event.status === "sold_out" || (event.remainingInventory ?? 0) <= 0
  const isInactive = event.status !== "active" && event.status !== "sold_out"
  const maxQty = Math.min(10, Math.max(1, event.remainingInventory || 1))
  const totalCents = (event.priceCents || 0) * quantity

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
      recurrenceFrequency: (event.recurrenceFrequency || "one_time") as
        | "one_time"
        | "weekly"
        | "monthly"
        | "yearly",
      customLinks: (Array.isArray(event.customLinks) ? event.customLinks : []) as EventCustomLink[],
    })
    setEditError("")
    setEditOpen(true)
  }

  async function handleUploadFlyer(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setEditError("Event image exceeds 10MB limit.")
      return
    }
    setUploadingFlyer(true)
    setEditError("")
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

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSavingEdit(true)
    setEditError("")
    try {
      const res = await updateBandEvent(event.id, editForm)
      if (res.success && res.event) {
        setEvent(res.event)
        setEditOpen(false)
        router.refresh()
      } else {
        setEditError(res.error || "Failed to update event")
      }
    } catch (err: any) {
      setEditError(err?.message || "Failed to update event")
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || isSoldOut || isInactive) return
    setSubmitting(true)
    setError("")

    try {
      const res = await createTicketCheckoutSession({
        eventId: event.id,
        quantity,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerUserId: session?.user?.id,
      })

      if (!res.success) {
        setError(res.error || "Unable to process ticket request.")
        setSubmitting(false)
        return
      }

      if (res.free && res.redirectUrl) {
        router.push(res.redirectUrl)
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      } else {
        setError("Checkout session could not be created.")
        setSubmitting(false)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process ticket purchase.")
      setSubmitting(false)
    }
  }

  function handleShare() {
    if (typeof window === "undefined" || !navigator.clipboard) return
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 text-sm text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tickets
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {canScan && (
              <Button
                asChild
                size="sm"
                className="bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] font-extrabold rounded-xl h-9 px-3.5 text-xs"
              >
                <Link href={`/portal/events/${event.id}`}>
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  Scan Tickets
                </Link>
              </Button>
            )}

            {canEdit && (
              <Button
                type="button"
                size="sm"
                onClick={openEditModal}
                className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-bold rounded-xl h-9 px-3.5 text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Ticket / Event
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-[#20205a] bg-[#0c0c3f]/70 text-[#dbe0fb] hover:bg-[#20205a]/50 rounded-xl h-9 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Link Copied
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share Event
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Flyer + Event Info */}
          <div className="lg:col-span-7 rounded-3xl border border-[#20205a] bg-[#0c0c3f]/85 overflow-hidden shadow-2xl">
            {event.flyerUrl ? (
              <div className="w-full max-h-[420px] bg-[#05052d] overflow-hidden border-b border-[#20205a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.flyerUrl}
                  alt={event.title}
                  className="w-full h-full max-h-[420px] object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-44 bg-gradient-to-br from-[#12124a] via-[#0c0c3f] to-[#05052d] border-b border-[#20205a] flex items-center justify-center">
                <Ticket className="w-14 h-14 text-[#ea6f2a]/40" />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {band.id ? (
                  <Link
                    href={`/bands/${band.slug || band.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffd166] hover:underline"
                  >
                    <Music className="w-3.5 h-3.5 text-[#ea6f2a]" />
                    {band.name}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffd166]">
                    <Ticket className="w-3.5 h-3.5 text-[#ea6f2a]" />
                    {band.name}
                  </span>
                )}

                {event.recurrenceFrequency && event.recurrenceFrequency !== "one_time" && (
                  <Badge className="bg-[#20efe0]/15 text-[#20efe0] border-[#20efe0]/40 text-[11px] capitalize">
                    <Repeat className="w-3 h-3 mr-1" />
                    Repeats {event.recurrenceFrequency}
                  </Badge>
                )}

                {event.ageRestriction && (
                  <Badge variant="outline" className="border-[#20205a] text-[#cbd0f2] text-[11px]">
                    {event.ageRestriction}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/80 text-xs sm:text-sm text-[#dbe0fb]">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#ffd166] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">{formattedDate}</p>
                    <p className="text-xs text-[#9a9fc4]">
                      Doors {event.doorsOpenTime || "7:00 PM"} &bull; Show {event.startTime || "8:00 PM"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#20efe0] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">{event.venueName}</p>
                    {event.venueAddress && (
                      <p className="text-xs text-[#9a9fc4]">{event.venueAddress}</p>
                    )}
                  </div>
                </div>
              </div>

              {event.description && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#9a9fc4]">
                    Event Info
                  </h2>
                  <p className="text-sm text-[#dbe0fb] leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {Array.isArray(event.customLinks) && event.customLinks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#20205a]/70">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#9a9fc4] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#20efe0]" />
                    Event Links
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {event.customLinks.map((lnk: EventCustomLink, idx: number) => (
                      <a
                        key={idx}
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#20efe0]/35 bg-[#05052d]/80 hover:border-[#20efe0] hover:bg-[#20efe0]/10 text-xs font-semibold text-[#f5f7ff] transition-colors"
                      >
                        <span>{lnk.title || lnk.url}</span>
                        <ExternalLink className="w-3 h-3 text-[#20efe0]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Ticket Checkout / Claim Card */}
          <div className="lg:col-span-5 rounded-3xl border border-[#ea6f2a]/40 bg-[#0c0c3f] p-6 sm:p-7 shadow-2xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#20205a]">
              <div>
                <p className="text-xs font-semibold text-[#9a9fc4]">Ticket Price</p>
                <p className="text-3xl font-black text-white">
                  {isFree ? "FREE" : `$${((event.priceCents || 0) / 100).toFixed(2)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#9a9fc4]">Availability</p>
                <p className="text-sm font-mono font-bold text-[#20efe0] flex items-center gap-1 justify-end">
                  <Users className="w-3.5 h-3.5" />
                  {isSoldOut ? "Sold Out" : `${event.remainingInventory} / ${event.totalInventory} left`}
                </p>
              </div>
            </div>

            {isInactive ? (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm text-center font-semibold">
                This event is currently {event.status}.
              </div>
            ) : isSoldOut ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm text-center font-semibold">
                Sorry, all tickets for this event have been claimed.
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="qty" className="text-xs text-[#9a9fc4]">
                    Number of Tickets
                  </Label>
                  <select
                    id="qty"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="mt-1 w-full h-10 rounded-xl border border-[#20205a] bg-[#05052d] px-3 text-sm text-[#f5f7ff]"
                  >
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Ticket" : "Tickets"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="buyer-name" className="text-xs text-[#9a9fc4]">
                    Full Name *
                  </Label>
                  <Input
                    id="buyer-name"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your full name (printed on ticket)"
                    className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="buyer-email" className="text-xs text-[#9a9fc4]">
                    Email Address *
                  </Label>
                  <Input
                    id="buyer-email"
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com (receives QR pass)"
                    className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-extrabold text-sm shadow-lg shadow-[#ea6f2a]/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isFree ? (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Save Free Ticket{quantity > 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Buy {quantity} Ticket{quantity > 1 ? "s" : ""} &bull; ${(totalCents / 100).toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-[#9a9fc4]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#20efe0]" />
                  <span>Instant QR email delivery &bull; Saved to My Tickets</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Edit Ticket / Event Modal (right on the ticket page itself) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] overflow-y-auto border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#ffd166]" />
              Edit Ticket &amp; Event
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Edit every detail of this event right here. Ticket price locks once the first ticket is purchased.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            {editError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {editError}
              </div>
            )}

            <div>
              <Label htmlFor="pg-edit-title" className="text-xs text-[#9a9fc4]">
                Event Title *
              </Label>
              <Input
                id="pg-edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pg-edit-venue" className="text-xs text-[#9a9fc4]">
                  Venue Name *
                </Label>
                <Input
                  id="pg-edit-venue"
                  value={editForm.venueName}
                  onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="pg-edit-addr" className="text-xs text-[#9a9fc4]">
                  Address / City
                </Label>
                <Input
                  id="pg-edit-addr"
                  value={editForm.venueAddress}
                  onChange={(e) => setEditForm({ ...editForm, venueAddress: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="pg-edit-date" className="text-xs text-[#9a9fc4]">
                  Event Date &amp; Time *
                </Label>
                <Input
                  id="pg-edit-date"
                  type="datetime-local"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="pg-edit-doors" className="text-xs text-[#9a9fc4]">
                  Doors Open
                </Label>
                <Input
                  id="pg-edit-doors"
                  value={editForm.doorsOpenTime}
                  onChange={(e) => setEditForm({ ...editForm, doorsOpenTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="pg-edit-start" className="text-xs text-[#9a9fc4]">
                  Show Start
                </Label>
                <Input
                  id="pg-edit-start"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="pg-edit-price" className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  Price ($ USD)
                  {soldCount > 0 && <Lock className="w-3 h-3 text-amber-400" />}
                </Label>
                <Input
                  id="pg-edit-price"
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
                <Label htmlFor="pg-edit-inv" className="text-xs text-[#9a9fc4]">
                  Total Inventory *
                </Label>
                <Input
                  id="pg-edit-inv"
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
                <Label htmlFor="pg-edit-age" className="text-xs text-[#9a9fc4]">
                  Age Policy
                </Label>
                <select
                  id="pg-edit-age"
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
                <Label htmlFor="pg-edit-repeat" className="text-xs text-[#9a9fc4] flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#20efe0]" /> Repeat Schedule
                </Label>
                <select
                  id="pg-edit-repeat"
                  value={editForm.recurrenceFrequency}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      recurrenceFrequency: e.target.value as
                        | "one_time"
                        | "weekly"
                        | "monthly"
                        | "yearly",
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

            {/* Event Links (Titled) */}
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
                    setEditForm((prev) => ({
                      ...prev,
                      customLinks: [...prev.customLinks, { title: "", url: "" }],
                    }))
                  }
                  className="h-7 px-2.5 text-[11px] border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20205a]/50"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Link
                </Button>
              </div>
              {editForm.customLinks.length === 0 ? (
                <p className="text-[11px] text-[#9a9fc4]">No links added yet.</p>
              ) : (
                <div className="space-y-2">
                  {editForm.customLinks.map((lnk, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Link Title (e.g. Venue Parking)"
                        value={lnk.title}
                        onChange={(e) => {
                          const next = [...editForm.customLinks]
                          next[idx] = { ...next[idx], title: e.target.value }
                          setEditForm({ ...editForm, customLinks: next })
                        }}
                        className="sm:col-span-5 h-8 text-xs bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                      />
                      <Input
                        placeholder="https://..."
                        value={lnk.url}
                        onChange={(e) => {
                          const next = [...editForm.customLinks]
                          next[idx] = { ...next[idx], url: e.target.value }
                          setEditForm({ ...editForm, customLinks: next })
                        }}
                        className="sm:col-span-6 h-8 text-xs bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            customLinks: editForm.customLinks.filter((_, i) => i !== idx),
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
              <Label htmlFor="pg-edit-desc" className="text-xs text-[#9a9fc4]">
                Event Description
              </Label>
              <Textarea
                id="pg-edit-desc"
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
