"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { createTicketCheckoutSession } from "@/app/actions/ticket-purchase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Check,
  Loader2,
  Repeat,
  Music,
} from "lucide-react"

interface EventBuyClientProps {
  event: any
  band: {
    id: string
    name: string
    slug: string | null
    logoUrl: string | null
  }
}

export function EventBuyClient({ event, band }: EventBuyClientProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (session?.user) {
      if (!buyerName && session.user.name) setBuyerName(session.user.name)
      if (!buyerEmail && session.user.email) setBuyerEmail(session.user.email)
    }
  }, [session, buyerName, buyerEmail])

  const isFree = (event.priceCents || 0) === 0
  const isSoldOut = event.status === "sold_out" || (event.remainingInventory ?? 0) <= 0
  const isInactive = event.status !== "active" && event.status !== "sold_out"
  const maxQty = Math.min(10, Math.max(1, event.remainingInventory || 1))
  const totalCents = (event.priceCents || 0) * quantity

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
                <Link
                  href={`/bands/${band.slug || band.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffd166] hover:underline"
                >
                  <Music className="w-3.5 h-3.5 text-[#ea6f2a]" />
                  {band.name}
                </Link>

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
    </div>
  )
}
