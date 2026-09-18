"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTicketCheckoutSession } from "@/app/actions/ticket-purchase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react"

export interface BandEventItem {
  id: string
  title: string
  description: string | null
  venueName: string
  venueAddress: string | null
  eventDate: string | Date
  doorsOpenTime: string | null
  startTime: string | null
  priceCents: number
  totalInventory: number
  remainingInventory: number
  ageRestriction: string | null
  flyerUrl: string | null
  status: string
  bandName?: string
  bandSlug?: string | null
}

export function BandTicketsWidget({
  events,
  bandName,
  bandId,
}: {
  events: BandEventItem[]
  bandName: string
  bandId: string
}) {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<BandEventItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!events || events.length === 0) {
    return null
  }

  function handleOpenBuy(ev: BandEventItem) {
    setSelectedEvent(ev)
    setQuantity(1)
    setError("")
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEvent) return

    if (!buyerName.trim()) {
      setError("Please enter your name.")
      return
    }
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setBusy(true)
    setError("")

    try {
      const res = await createTicketCheckoutSession({
        eventId: selectedEvent.id,
        quantity,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
      })

      if (!res.success) {
        setError(res.error || "Failed to start checkout")
        setBusy(false)
        return
      }

      if (res.free && res.redirectUrl) {
        router.push(res.redirectUrl)
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err?.message || "An unexpected error occurred.")
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#ea6f2a]" />
          <h2 className="text-xl font-bold tracking-tight text-[#f5f7ff]">Upcoming Shows & Tickets</h2>
        </div>
        <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30">
          Official Live Entry
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((ev) => {
          const date = new Date(ev.eventDate)
          const isSoldOut = ev.remainingInventory <= 0 || ev.status === "sold_out"
          const isLowInventory = ev.remainingInventory > 0 && ev.remainingInventory <= 5

          return (
            <div
              key={ev.id}
              className="rounded-xl border border-[#20205a]/50 bg-[#0c0c3f]/60 p-5 transition-all duration-200 hover:border-[#ea6f2a]/40 hover:bg-[#0c0c3f]/80 flex flex-col justify-between gap-4"
            >
              <div>
                {/* Date & Status badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#20efe0] font-medium font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {isSoldOut ? (
                    <Badge variant="destructive" className="bg-red-900/40 text-red-300 border-red-700/50">
                      SOLD OUT
                    </Badge>
                  ) : isLowInventory ? (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                      Only {ev.remainingInventory} left!
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-[#9a9fc4]">
                      {ev.remainingInventory} tickets left
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#f5f7ff] leading-snug">{ev.title}</h3>

                <div className="mt-2 space-y-1 text-xs text-[#9a9fc4]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9a9fc4] shrink-0" />
                    <span className="truncate">{ev.venueName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9a9fc4] shrink-0" />
                    <span>{ev.startTime || "8:00 PM"} (Doors: {ev.doorsOpenTime || "7:00 PM"})</span>
                  </div>
                </div>

                {ev.description && (
                  <p className="mt-2.5 text-xs text-[#9a9fc4] line-clamp-2">{ev.description}</p>
                )}
              </div>

              {/* Price & Buy CTA */}
              <div className="pt-3 border-t border-[#20205a]/50 flex items-center justify-between gap-3">
                <div>
                  <span className="text-lg font-extrabold text-[#f5f7ff]">
                    {ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : "FREE"}
                  </span>
                  {ev.priceCents > 0 && <span className="text-[11px] text-[#9a9fc4] ml-1">/ ticket</span>}
                </div>

                <Button
                  onClick={() => handleOpenBuy(ev)}
                  disabled={isSoldOut}
                  size="sm"
                  className={
                    isSoldOut
                      ? "bg-[#20205a] text-[#9a9fc4] cursor-not-allowed"
                      : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-md shadow-[#ea6f2a]/20"
                  }
                >
                  <Ticket className="w-4 h-4 mr-1.5" />
                  {isSoldOut ? "Sold Out" : "Get Tickets"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              {selectedEvent?.venueName} • {selectedEvent && new Date(selectedEvent.eventDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <form onSubmit={handleCheckout} className="space-y-4 py-2">
              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <Label className="text-xs text-[#9a9fc4]">Quantity</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-24 rounded-md border border-[#20205a] bg-[#05052d] px-3 py-2 text-sm text-[#f5f7ff] focus:outline-none focus:ring-1 focus:ring-[#ea6f2a]"
                  >
                    {Array.from(
                      { length: Math.min(10, selectedEvent.remainingInventory) },
                      (_, i) => i + 1
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "ticket" : "tickets"}
                      </option>
                    ))}
                  </select>

                  <div className="text-sm font-semibold text-[#f5f7ff]">
                    Total:{" "}
                    <span className="text-[#ea6f2a]">
                      {selectedEvent.priceCents > 0
                        ? `$${((selectedEvent.priceCents * quantity) / 100).toFixed(2)}`
                        : "FREE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendee Name */}
              <div>
                <Label htmlFor="buyer-name" className="text-xs text-[#9a9fc4]">
                  Full Name (Ticket Holder)
                </Label>
                <Input
                  id="buyer-name"
                  placeholder="e.g. Alex Taylor"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                  required
                />
              </div>

              {/* Attendee Email */}
              <div>
                <Label htmlFor="buyer-email" className="text-xs text-[#9a9fc4]">
                  Email (for digital ticket delivery)
                </Label>
                <Input
                  id="buyer-email"
                  type="email"
                  placeholder="you@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a] text-[11px] text-[#9a9fc4] space-y-1">
                <p className="font-semibold text-[#f5f7ff]">Digital & Printable Delivery</p>
                <p>
                  You will receive a scannable QR ticket that can be printed or displayed on your phone at the venue.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                  disabled={busy}
                  className="border-[#20205a] bg-[#05052d] text-[#9a9fc4] hover:bg-[#20205a]"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-md shadow-[#ea6f2a]/20"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : selectedEvent.priceCents > 0 ? (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" /> Pay with Stripe
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Reserve Free Ticket
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
