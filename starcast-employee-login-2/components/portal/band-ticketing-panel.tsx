"use client"

import { useState, useEffect } from "react"
import {
  applyForBandTicketing,
  createBandEvent,
  updateBandEvent,
  cancelBandEvent,
  getBandEvents,
  getEventTicketGuestlist,
  checkInTicket,
  type CreateEventInput,
} from "@/app/actions/band-tickets"
import {
  getBandStripeStatus,
  startBandStripeOnboarding,
  openBandStripeDashboard,
  type BandStripeStatus,
} from "@/app/actions/band-stripe-connect"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Ticket,
  Plus,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Users,
  ExternalLink,
  Sparkles,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Check,
  Ban,
  ArrowRight,
} from "lucide-react"

interface Band {
  id: string
  name: string
  slug: string
  ticketing_status?: string
  stripe_account_id?: string | null
  stripe_account_status?: string
}

export function BandTicketingPanel({
  band,
  onRefreshBand,
}: {
  band: Band
  onRefreshBand?: () => void
}) {
  const [stripeStatus, setStripeStatus] = useState<BandStripeStatus | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Application dialog
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyNotes, setApplyNotes] = useState("")

  // Create Event dialog ("POST a ticket")
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [eventForm, setEventForm] = useState<CreateEventInput>({
    title: "",
    description: "",
    venueName: "",
    venueAddress: "",
    eventDate: "",
    doorsOpenTime: "7:00 PM",
    startTime: "8:00 PM",
    priceCents: 1500, // $15.00 default
    totalInventory: 20, // 20 tickets default
    ageRestriction: "All Ages",
    flyerUrl: "",
  })

  // Door Scanner / Guestlist dialog
  const [scannerEvent, setScannerEvent] = useState<any | null>(null)
  const [guestlist, setGuestlist] = useState<any[]>([])
  const [scanInput, setScanInput] = useState("")
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; type?: "valid" | "used" | "error" } | null>(null)
  const [guestSearch, setGuestSearch] = useState("")

  async function loadData() {
    setLoading(true)
    try {
      const [sStatus, evList] = await Promise.all([
        getBandStripeStatus(band.id),
        getBandEvents(band.id),
      ])
      setStripeStatus(sStatus)
      setEvents(evList)
    } catch (err: any) {
      console.error("loadData error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [band.id])

  // 1. Submit Ticketing Application
  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await applyForBandTicketing(band.id, applyNotes)
      if (res.success) {
        setApplyOpen(false)
        setSuccessMessage("Application submitted! StarCast admins will review your band shortly.")
        onRefreshBand?.()
      } else {
        setError(res.error || "Failed to submit application")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit application")
    } finally {
      setBusy(false)
    }
  }

  // 2. Start Stripe Onboarding
  async function handleStartStripe() {
    setBusy(true)
    setError("")
    try {
      const res = await startBandStripeOnboarding(band.id)
      if (res.success && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error || "Failed to initiate Stripe Connect")
        setBusy(false)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate Stripe Connect")
      setBusy(false)
    }
  }

  // 3. Open Stripe Express Dashboard
  async function handleOpenStripeDashboard() {
    setBusy(true)
    setError("")
    try {
      const res = await openBandStripeDashboard(band.id)
      if (res.success && res.url) {
        window.open(res.url, "_blank")
      } else {
        setError(res.error || "Failed to open Stripe dashboard")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to open Stripe dashboard")
    } finally {
      setBusy(false)
    }
  }

  // 4. Create Event ("POST a ticket")
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await createBandEvent(band.id, eventForm)
      if (res.success) {
        setCreateEventOpen(false)
        setSuccessMessage(`Show "${eventForm.title}" posted with ${eventForm.totalInventory} tickets!`)
        // Reset form
        setEventForm({
          title: "",
          description: "",
          venueName: "",
          venueAddress: "",
          eventDate: "",
          doorsOpenTime: "7:00 PM",
          startTime: "8:00 PM",
          priceCents: 1500,
          totalInventory: 20,
          ageRestriction: "All Ages",
          flyerUrl: "",
        })
        loadData()
      } else {
        setError(res.error || "Failed to post show")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to post show")
    } finally {
      setBusy(false)
    }
  }

  // 5. Open Door Scanner & Guest List
  async function handleOpenScanner(ev: any) {
    setScannerEvent(ev)
    setScanInput("")
    setScanResult(null)
    setGuestSearch("")
    try {
      const res = await getEventTicketGuestlist(ev.id)
      if (res.success && res.tickets) {
        setGuestlist(res.tickets)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 6. Check In Ticket Scan
  async function handleCheckInToken(tokenToScan?: string) {
    const token = (tokenToScan || scanInput).trim()
    if (!token || !scannerEvent) return

    setBusy(true)
    try {
      const res = await checkInTicket(token, scannerEvent.id)
      if (res.success) {
        setScanResult({
          success: true,
          type: "valid",
          message: `✓ Valid! Checked in Ticket #${res.ticketNumber} (${res.holderName})`,
        })
        setScanInput("")
        // Refresh guestlist
        const glRes = await getEventTicketGuestlist(scannerEvent.id)
        if (glRes.success && glRes.tickets) {
          setGuestlist(glRes.tickets)
        }
      } else if (res.alreadyCheckedIn) {
        setScanResult({
          success: false,
          type: "used",
          message: res.error || "Ticket was already scanned and used!",
        })
      } else {
        setScanResult({
          success: false,
          type: "error",
          message: res.error || "Invalid ticket code.",
        })
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        type: "error",
        message: err?.message || "Failed to verify ticket",
      })
    } finally {
      setBusy(false)
    }
  }

  const ticketingStatus = band.ticketing_status || "none"
  const isApproved = ticketingStatus === "approved"
  const isStripeActive = stripeStatus?.status === "active"

  return (
    <div className="space-y-6">
      {/* Top Notification Feedback */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22b573]/15 border border-[#22b573]/40 text-[#22b573] text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccessMessage("")}
            className="text-[#22b573] hover:bg-[#22b573]/20 h-7 px-2"
          >
            ✕
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError("")}
            className="text-red-300 hover:bg-red-900/40 h-7 px-2"
          >
            ✕
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. APPLICATION & STRIPE ONBOARDING BANNER */}
      {/* ========================================================================= */}
      {ticketingStatus === "none" && (
        <div className="rounded-2xl border border-[#ea6f2a]/40 bg-gradient-to-r from-[#ea6f2a]/15 via-[#0c0c3f] to-[#20efe0]/10 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-6 h-6 text-[#ea6f2a]" />
                <h3 className="text-xl font-bold text-[#f5f7ff]">
                  Unlock Live Event Ticketing &amp; Stripe Payouts
                </h3>
              </div>
              <p className="text-sm text-[#9a9fc4] max-w-2xl leading-relaxed">
                Post tickets for your upcoming shows with custom inventory (e.g. 20 tickets), accept direct credit card payments from fans, and receive automatic Stripe payouts with 24-hour post-event escrow protection.
              </p>
            </div>

            <Button
              onClick={() => setApplyOpen(true)}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/25 shrink-0 h-11 px-6 text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply for Ticketing
            </Button>
          </div>
        </div>
      )}

      {ticketingStatus === "applied" && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-amber-300">Ticketing Application Under Review</h3>
              <p className="text-xs text-[#9a9fc4]">
                Your application to sell tickets has been submitted to StarCast Media. We will approve your band shortly so you can connect Stripe and post shows!
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
            Pending Approval
          </Badge>
        </div>
      )}

      {ticketingStatus === "rejected" && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ban className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-red-300">Application Needs Attention</h3>
              <p className="text-xs text-[#9a9fc4]">
                Your ticketing application was not approved. Please reach out to StarCast support or re-apply.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setApplyOpen(true)}
            size="sm"
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
          >
            Re-Apply
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STRIPE CONNECT & PAYOUT ACCOUNT STATUS */}
      {/* ========================================================================= */}
      {isApproved && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-[#20205a]/60 bg-[#0c0c3f]/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#20efe0]" />
                  <CardTitle className="text-lg font-bold text-[#f5f7ff]">
                    Stripe Payouts &amp; Escrow
                  </CardTitle>
                </div>
                {isStripeActive ? (
                  <Badge className="bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40">
                    ✓ Stripe Active
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Onboarding Required
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-[#9a9fc4]">
                Ticket revenue is held in secure escrow on StarCast and transferred directly to your bank 24 hours after each show.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <div className="text-xs text-[#9a9fc4] space-y-1">
                <p className="text-[#f5f7ff] font-medium">
                  {isStripeActive
                    ? "Your Stripe Express account is active and receiving payouts."
                    : "Connect your bank or debit card via Stripe Express to enable ticket sales."}
                </p>
                {stripeStatus?.stripeAccountId && (
                  <p className="font-mono text-[11px] text-[#20efe0]">
                    Account: {stripeStatus.stripeAccountId}
                  </p>
                )}
              </div>

              {isStripeActive ? (
                <Button
                  onClick={handleOpenStripeDashboard}
                  disabled={busy}
                  variant="outline"
                  size="sm"
                  className="border-[#20205a] bg-[#05052d] text-[#20efe0] hover:bg-[#20205a] shrink-0"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Stripe Dashboard
                </Button>
              ) : (
                <Button
                  onClick={handleStartStripe}
                  disabled={busy}
                  size="sm"
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-md shadow-[#ea6f2a]/20 shrink-0"
                >
                  {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Connect Stripe Express
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Post a Ticket CTA Card */}
          <Card className="border-[#20efe0]/30 bg-gradient-to-br from-[#0c0c3f] to-[#05052d] flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Ticket className="w-5 h-5 text-[#ea6f2a]" />
                <h4 className="font-bold text-[#f5f7ff]">Post a Show Ticket</h4>
              </div>
              <p className="text-xs text-[#9a9fc4]">
                Create a live event with inventory (e.g. 20 tickets), pricing, and venue details.
              </p>
            </div>

            <Button
              onClick={() => setCreateEventOpen(true)}
              className="mt-4 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-md shadow-[#ea6f2a]/20 w-full"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Post a Ticket
            </Button>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. POSTED EVENTS & TICKETS MANAGER */}
      {/* ========================================================================= */}
      {isApproved && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#20efe0]" />
              Your Posted Shows &amp; Ticket Inventory
            </h3>
            <Button
              onClick={loadData}
              variant="ghost"
              size="sm"
              className="text-[#9a9fc4] hover:text-[#f5f7ff]"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#20205a] bg-[#0c0c3f]/30 p-10 text-center space-y-3">
              <Ticket className="w-10 h-10 text-[#9a9fc4]/50 mx-auto" />
              <h4 className="text-base font-semibold text-[#f5f7ff]">No shows posted yet</h4>
              <p className="text-xs text-[#9a9fc4] max-w-sm mx-auto">
                Ready to sell tickets? Click "Post a Ticket" to create your first event with inventory control.
              </p>
              <Button
                onClick={() => setCreateEventOpen(true)}
                size="sm"
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Post First Show
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const sold = ev.totalInventory - ev.remainingInventory
                const soldPct = Math.min(100, Math.round((sold / ev.totalInventory) * 100))
                const date = new Date(ev.eventDate)
                const releaseDate = ev.escrowReleaseDate ? new Date(ev.escrowReleaseDate) : null
                const isReleased = ev.escrowStatus === "released"

                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-[#20205a]/60 bg-[#0c0c3f]/60 p-5 space-y-4 hover:border-[#ea6f2a]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#20efe0] font-mono mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                          <span>•</span>
                          <span>{ev.startTime || "8:00 PM"}</span>
                        </div>
                        <h4 className="text-base font-bold text-[#f5f7ff]">{ev.title}</h4>
                        <p className="text-xs text-[#9a9fc4] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ev.venueName}</span>
                        </p>
                      </div>

                      <Badge
                        className={
                          ev.status === "active"
                            ? "bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40"
                            : ev.status === "sold_out"
                            ? "bg-red-900/30 text-red-400 border border-red-700/40"
                            : "bg-[#20205a]/50 text-[#9a9fc4]"
                        }
                      >
                        {ev.status === "active" ? "Live on Page" : ev.status}
                      </Badge>
                    </div>

                    {/* Inventory & Sales Progress Bar */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9a9fc4] font-medium">Tickets Sold</span>
                        <span className="font-mono font-bold text-[#f5f7ff]">
                          {sold} / {ev.totalInventory}{" "}
                          <span className="text-[#20efe0]">({ev.remainingInventory} left)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#20205a] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#ea6f2a] to-[#20efe0] transition-all duration-300"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#9a9fc4] pt-1">
                        <span>Price: {ev.priceCents > 0 ? `$${(ev.priceCents / 100).toFixed(2)}` : "FREE"}</span>
                        <span>
                          Escrow:{" "}
                          <strong className={isReleased ? "text-emerald-400" : "text-amber-400"}>
                            {isReleased ? "Released" : "Held (24h Post-Show)"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={() => handleOpenScanner(ev)}
                        size="sm"
                        className="bg-[#20efe0]/20 hover:bg-[#20efe0]/30 text-[#20efe0] border border-[#20efe0]/40 font-semibold text-xs flex-1"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1.5" /> Door Scanner &amp; Guestlist
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG: APPLY FOR TICKETING */}
      {/* ========================================================================= */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" />
              Apply for Ticketing Features
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Sell tickets directly to your fans with custom inventory limits and Stripe Connect payouts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApply} className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-[#9a9fc4]">Band / Act Name</Label>
              <Input
                disabled
                value={band.name}
                className="mt-1 border-[#20205a] bg-[#05052d]/60 text-[#f5f7ff]"
              />
            </div>

            <div>
              <Label htmlFor="apply-notes" className="text-xs text-[#9a9fc4]">
                Event or Venue Notes (Optional)
              </Label>
              <Textarea
                id="apply-notes"
                placeholder="Tell us about your upcoming shows, venues you play, or expected ticket volume..."
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                rows={3}
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a] text-[11px] text-[#9a9fc4] space-y-1">
              <p className="font-semibold text-[#f5f7ff]">How Ticketing Works</p>
              <p>• Once approved, you link a Stripe account for direct deposits.</p>
              <p>• You post tickets with custom inventory (e.g. 20 tickets).</p>
              <p>• Funds are held in escrow until 24 hours after the event concludes.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplyOpen(false)}
                disabled={busy}
                className="border-[#20205a] bg-[#05052d] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CREATE EVENT / POST A TICKET */}
      {/* ========================================================================= */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" />
              Post a Show Ticket
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Configure your event details and ticket inventory for {band.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
            <div>
              <Label htmlFor="event-title" className="text-xs text-[#9a9fc4]">
                Event Title *
              </Label>
              <Input
                id="event-title"
                placeholder="e.g. Summer Night Live at The Granada"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="venue-name" className="text-xs text-[#9a9fc4]">
                  Venue Name *
                </Label>
                <Input
                  id="venue-name"
                  placeholder="e.g. The Bottleneck"
                  value={eventForm.venueName}
                  onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="venue-address" className="text-xs text-[#9a9fc4]">
                  Address / City
                </Label>
                <Input
                  id="venue-address"
                  placeholder="e.g. 737 New Hampshire St, Lawrence KS"
                  value={eventForm.venueAddress}
                  onChange={(e) => setEventForm({ ...eventForm, venueAddress: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="event-date" className="text-xs text-[#9a9fc4]">
                  Event Date &amp; Time *
                </Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>

              <div>
                <Label htmlFor="doors-time" className="text-xs text-[#9a9fc4]">
                  Doors Open
                </Label>
                <Input
                  id="doors-time"
                  placeholder="7:00 PM"
                  value={eventForm.doorsOpenTime}
                  onChange={(e) => setEventForm({ ...eventForm, doorsOpenTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="start-time" className="text-xs text-[#9a9fc4]">
                  Show Start
                </Label>
                <Input
                  id="start-time"
                  placeholder="8:00 PM"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ticket-price" className="text-xs text-[#9a9fc4]">
                  Price ($ USD)
                </Label>
                <Input
                  id="ticket-price"
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="15.00"
                  value={(eventForm.priceCents / 100).toString()}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      priceCents: Math.round(parseFloat(e.target.value || "0") * 100),
                    })
                  }
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="inventory" className="text-xs text-[#9a9fc4]">
                  Total Inventory *
                </Label>
                <Input
                  id="inventory"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="20"
                  value={eventForm.totalInventory.toString()}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      totalInventory: parseInt(e.target.value || "20", 10),
                    })
                  }
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label htmlFor="age-policy" className="text-xs text-[#9a9fc4]">
                  Age Policy
                </Label>
                <select
                  id="age-policy"
                  value={eventForm.ageRestriction}
                  onChange={(e) => setEventForm({ ...eventForm, ageRestriction: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#20205a] bg-[#05052d] px-3 py-2 text-sm text-[#f5f7ff]"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="event-desc" className="text-xs text-[#9a9fc4]">
                Show Description &amp; Lineup
              </Label>
              <Textarea
                id="event-desc"
                placeholder="Support acts, set times, parking, merchandise notes..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                rows={3}
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a] text-[11px] text-[#9a9fc4]">
              <p className="font-semibold text-[#f5f7ff] flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20efe0]" />
                24-Hour Post-Event Escrow Protection
              </p>
              <p>
                Ticket funds are held in escrow until 24 hours after the scheduled event date and then automatically disbursed to your connected Stripe account.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateEventOpen(false)}
                disabled={busy}
                className="border-[#20205a] bg-[#05052d] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Post {eventForm.totalInventory} Tickets
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: DOOR CHECK-IN SCANNER & GUEST LIST */}
      {/* ========================================================================= */}
      <Dialog open={!!scannerEvent} onOpenChange={(open) => !open && setScannerEvent(null)}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#20efe0]" />
              Door Check-In &amp; Guest List
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              {scannerEvent?.title} • {scannerEvent?.venueName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick QR / Token Scanner Box */}
            <div className="p-4 rounded-xl border border-[#20205a] bg-[#05052d] space-y-3">
              <Label className="text-xs text-[#9a9fc4] font-semibold">
                Scan Ticket QR Code or Enter Token / Ticket #
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste QR Token, Ticket UUID or Ticket #..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckInToken()}
                  className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] font-mono text-xs"
                />
                <Button
                  onClick={() => handleCheckInToken()}
                  disabled={busy || !scanInput.trim()}
                  className="bg-[#20efe0] hover:bg-[#1cd2c5] text-black font-semibold shrink-0"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check In"}
                </Button>
              </div>

              {scanResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    scanResult.type === "valid"
                      ? "bg-[#22b573]/20 border border-[#22b573]/50 text-[#22b573]"
                      : scanResult.type === "used"
                      ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                      : "bg-red-900/30 border border-red-700/50 text-red-300"
                  }`}
                >
                  {scanResult.type === "valid" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{scanResult.message}</span>
                </div>
              )}
            </div>

            {/* Guest List Filter & Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-[#f5f7ff] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#ea6f2a]" />
                  Guest List ({guestlist.filter((g) => g.status === "checked_in").length} / {guestlist.length} Checked In)
                </h4>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#9a9fc4]" />
                  <Input
                    placeholder="Search attendee..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="pl-8 h-8 text-xs border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#20205a] overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#05052d] text-[#9a9fc4] border-b border-[#20205a]">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#20205a]/50">
                    {guestlist
                      .filter(
                        (g) =>
                          !guestSearch ||
                          g.holderName?.toLowerCase().includes(guestSearch.toLowerCase()) ||
                          g.holderEmail?.toLowerCase().includes(guestSearch.toLowerCase()) ||
                          String(g.ticketNumber).includes(guestSearch)
                      )
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-[#05052d]/40">
                          <td className="p-2.5 font-mono text-[#ea6f2a]">#{g.ticketNumber}</td>
                          <td className="p-2.5">
                            <p className="font-semibold text-[#f5f7ff]">{g.holderName}</p>
                            <p className="text-[10px] text-[#9a9fc4]">{g.holderEmail}</p>
                          </td>
                          <td className="p-2.5">
                            {g.status === "checked_in" ? (
                              <Badge className="bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40 text-[10px]">
                                Checked In
                              </Badge>
                            ) : (
                              <Badge className="bg-[#20205a]/60 text-[#9a9fc4] text-[10px]">
                                Valid Entry
                              </Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            {g.status !== "checked_in" && (
                              <Button
                                onClick={() => handleCheckInToken(g.qrToken)}
                                size="sm"
                                className="h-7 px-2.5 bg-[#20efe0]/20 text-[#20efe0] hover:bg-[#20efe0]/30 text-[11px]"
                              >
                                Check In
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setScannerEvent(null)}
              variant="outline"
              className="border-[#20205a] bg-[#05052d] text-[#9a9fc4]"
            >
              Close Scanner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
