"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  getMyBands,
  createBand,
  updateBand,
  signYoutubeAgreement,
  getPortalViewer,
  type BandInput,
} from "@/app/actions/bands"
import { getBookingsForBand, createBooking } from "@/app/actions/bookings"
import { getPaymentsForBand } from "@/app/actions/payments"
import { ResponsiveHeader } from "@/components/responsive-header"
import { BandPostsPanel } from "@/components/portal/band-posts-panel"
import { BandLinksPanel } from "@/components/portal/band-links-panel"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Music, Plus, Calendar, CheckCircle2, ShieldCheck, FileText, Clock, DollarSign, ExternalLink, Share2, Check, Newspaper, CreditCard } from "lucide-react"

interface Band {
  id: string
  name: string
  type: string
  slug: string
  is_public: boolean
  genre: string
  bio: string
  contact_email: string
  contact_phone: string
  has_active_pass: boolean
  pass_expires_at: string | null
  youtube_agreement_signed: boolean
  youtube_agreement_signed_at: string | null
}

interface Booking {
  id: string
  title: string
  starts_at: string
  ends_at: string
  status: string
  hourly_rate_charged: number
  hours: number
  total_amount: number
  notes: string
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  kind: string
  paid_at: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-yellow-900/30 text-yellow-400 border-yellow-700/40",
  confirmed: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  checked_in: "bg-green-900/30 text-green-400 border-green-700/40",
  completed: "bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]",
  cancelled: "bg-red-900/30 text-red-400 border-red-700/40",
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-900/30 text-green-400 border-green-700/40",
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-700/40",
  refunded: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  void: "bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]",
}

  const emptyBandForm: BandInput = { name: "", type: "band", genre: "", bio: "", contactEmail: "", contactPhone: "", links: [] }

export default function PortalPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)

  const [bands, setBands] = useState<Band[]>([])
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [bandDialog, setBandDialog] = useState<"new" | "edit" | null>(null)
  const [bandForm, setBandForm] = useState<BandInput>(emptyBandForm)
  const [bookingDialog, setBookingDialog] = useState(false)
  const [bookingForm, setBookingForm] = useState({ title: "", startsAt: "", endsAt: "", notes: "" })
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  function handleShareBand(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/bands/${slug}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const selectedBand = bands.find((b) => b.id === selectedBandId) || null
const [portalTab, setPortalTab] = useState<"posts" | "links" | "studio" | "payments">("posts")

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (selectedBandId) loadBandDetail(selectedBandId)
  }, [selectedBandId])

  async function init() {
    const viewer = await getPortalViewer()
    setIsAdmin(viewer?.isAdmin ?? false)
    setIsStaff(viewer?.isStaff ?? false)
    const myBands = await getMyBands()
    setBands(myBands as any[])
    if (myBands.length > 0) setSelectedBandId(myBands[0].id)
    setLoading(false)
  }

  async function loadBandDetail(bandId: string) {
    try {
      const [b, p] = await Promise.all([getBookingsForBand(bandId), getPaymentsForBand(bandId)])
      setBookings(b as any[])
      setPayments(p as any[])
    } catch {
      setBookings([])
      setPayments([])
    }
  }

  async function refreshBands() {
    const myBands = await getMyBands()
    setBands(myBands as any[])
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  async function handleSaveBand() {
    setError("")
    try {
      if (bandDialog === "new") {
        const band = await createBand(bandForm)
        await refreshBands()
        setSelectedBandId(band.id)
      } else if (bandDialog === "edit" && selectedBand) {
        await updateBand(selectedBand.id, bandForm)
        await refreshBands()
      }
      setBandDialog(null)
      setBandForm(emptyBandForm)
    } catch (e: any) {
      setError(e?.message || "Failed to save band")
    }
  }

  async function handleSignAgreement() {
    if (!selectedBand) return
    setError("")
    try {
      await signYoutubeAgreement(selectedBand.id)
      await refreshBands()
    } catch (e: any) {
      setError(e?.message || "Failed to sign agreement")
    }
  }

  async function handleCreateBooking() {
    if (!selectedBand) return
    setError("")
    try {
      await createBooking({
        bandId: selectedBand.id,
        title: bookingForm.title || undefined,
        startsAt: bookingForm.startsAt,
        endsAt: bookingForm.endsAt,
        notes: bookingForm.notes || undefined,
      })
      await loadBandDetail(selectedBand.id)
      setBookingDialog(false)
      setBookingForm({ title: "", startsAt: "", endsAt: "", notes: "" })
    } catch (e: any) {
      setError(e?.message || "Failed to request booking")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-[#9a9fc4]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader isLoggedIn={true} isAdmin={isAdmin} isCrew={isStaff} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30">
            <Music className="w-5 h-5 text-[#ea6f2a]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#f5f7ff]">Artist Portal</h1>
            <p className="text-sm text-[#9a9fc4]">Manage your band, book studio time, and track your sessions.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-300 text-sm">{error}</div>
        )}

        {bands.length === 0 ? (
          <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
            <CardHeader>
              <CardTitle className="text-[#f5f7ff]">Create Your Band or Artist Page</CardTitle>
              <CardDescription className="text-[#9a9fc4]">
                Set up your band or solo artist profile to get a shareable public page, book studio time, get a pass,
                and sign content agreements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => { setBandForm(emptyBandForm); setBandDialog("new") }}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
              >
                <Plus className="w-4 h-4 mr-1" /> Create Band or Artist Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Band selector */}
            {bands.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {bands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBandId(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedBandId === b.id
                        ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                        : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
                <button
                  onClick={() => { setBandForm(emptyBandForm); setBandDialog("new") }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-[#20205a] text-[#9a9fc4] hover:border-[#ea6f2a]/50"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> New Band
                </button>
              </div>
            )}

            {selectedBand && (
              <>
                {/* Band profile card */}
                <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-[#f5f7ff] flex items-center gap-2">
                        {selectedBand.name}
                        {selectedBand.genre && (
                          <Badge variant="outline" className="border-[#20205a] text-[#9a9fc4]">{selectedBand.genre}</Badge>
                        )}
                      </CardTitle>
                      {selectedBand.bio && <CardDescription className="text-[#9a9fc4] mt-1">{selectedBand.bio}</CardDescription>}
                      {selectedBand.slug && (
                        <p className="text-xs text-[#9a9fc4] mt-2">
                          Public page:{" "}
                          <a
                            href={`/bands/${selectedBand.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ea6f2a] hover:underline"
                          >
                            /bands/{selectedBand.slug}
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {selectedBand.slug && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                            asChild
                          >
                            <a href={`/bands/${selectedBand.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1.5" /> View Page
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                            onClick={() => handleShareBand(selectedBand.slug)}
                          >
                            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Share2 className="w-4 h-4 mr-1.5" />}
                            {copied ? "Copied" : "Share"}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                        onClick={() => {
                        setBandForm({
                          name: selectedBand.name,
                          type: selectedBand.type || "band",
                          genre: selectedBand.genre,
                          bio: selectedBand.bio,
                          contactEmail: selectedBand.contact_email,
                          contactPhone: selectedBand.contact_phone,
                        })
                        setBandDialog("edit")
                        }}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Badge
                      className={`border ${
                        selectedBand.has_active_pass
                          ? "bg-green-900/30 text-green-400 border-green-700/40"
                          : "bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      {selectedBand.has_active_pass
                        ? `Pass Active${selectedBand.pass_expires_at ? ` · exp ${new Date(selectedBand.pass_expires_at).toLocaleDateString()}` : ""}`
                        : "No Active Pass"}
                    </Badge>
                    <Badge
                      className={`border ${
                        selectedBand.youtube_agreement_signed
                          ? "bg-green-900/30 text-green-400 border-green-700/40"
                          : "bg-yellow-900/30 text-yellow-400 border-yellow-700/40"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      {selectedBand.youtube_agreement_signed ? "Content Agreement Signed" : "Agreement Not Signed"}
                    </Badge>
                    {!selectedBand.youtube_agreement_signed && (
                      <Button size="sm" onClick={handleSignAgreement} className="h-7 bg-[#ea6f2a] hover:bg-[#bc3f00] text-xs">
                        Sign YouTube Content Agreement
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Portal tabs */}
                <div className="flex flex-wrap gap-2 mb-2 border-b border-[#20205a]/50 pb-px">
                  <button
                    onClick={() => setPortalTab("posts")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${portalTab === "posts"
                      ? "bg-[#0c0c3f]/70 text-[#ea6f2a] border border-b-0 border-[#20205a]/60 -mb-px shadow-inner"
                      : "text-[#9a9fc4] hover:text-[#f5f7ff] border border-transparent"}`}
                  >
                    <Newspaper className="w-4 h-4" /> Posts
                  </button>
                  <button
                    onClick={() => setPortalTab("studio")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${portalTab === "studio"
                      ? "bg-[#0c0c3f]/70 text-[#ea6f2a] border border-b-0 border-[#20205a]/60 -mb-px shadow-inner"
                      : "text-[#9a9fc4] hover:text-[#f5f7ff] border border-transparent"}`}
                  >
                    <Calendar className="w-4 h-4" /> Studio Sessions
                  </button>
                  <button
                    onClick={() => setPortalTab("payments")}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${portalTab === "payments"
                      ? "bg-[#0c0c3f]/70 text-[#ea6f2a] border border-b-0 border-[#20205a]/60 -mb-px shadow-inner"
                      : "text-[#9a9fc4] hover:text-[#f5f7ff] border border-transparent"}`}
                  >
                    <CreditCard className="w-4 h-4" /> Payments
                  </button>
                </div>

                {/* Posts tab content (default) */}
                {portalTab === "posts" && (
                  <div className="pt-2">
                    <BandPostsPanel bandId={selectedBand.id} bandName={selectedBand.name} />
                  </div>
                )}
                {portalTab === "links" && (
                  <div className="pt-2">
                    <BandLinksPanel band={selectedBand} onUpdated={() => refreshBands()} />
                  </div>
                )}


{portalTab === "studio" && (
                {/* Bookings */}
                <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-[#f5f7ff]">Studio Sessions</CardTitle>
                      <CardDescription className="text-[#9a9fc4]">Request and track your booked time slots.</CardDescription>
                    </div>
                    <Button
                      onClick={() => setBookingDialog(true)}
                      disabled={!selectedBand.youtube_agreement_signed}
                      className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Request Slot
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!selectedBand.youtube_agreement_signed && (
                      <p className="text-xs text-yellow-400 mb-3">Sign the content agreement above before requesting studio time.</p>
                    )}
                    {bookings.length === 0 ? (
                      <p className="text-[#9a9fc4] text-center py-8">No sessions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((bk) => (
                          <div key={bk.id} className="p-4 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="font-semibold text-[#f5f7ff]">{bk.title || "Studio Session"}</p>
                                <p className="text-sm text-[#9a9fc4] flex items-center gap-1.5 mt-0.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(bk.starts_at).toLocaleString()} — {new Date(bk.ends_at).toLocaleTimeString()}
                                </p>
                                <p className="text-sm text-[#ea6f2a] font-medium mt-1 flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5" /> {bk.total_amount.toFixed(2)} ({bk.hours.toFixed(1)}h @ ${bk.hourly_rate_charged.toFixed(2)}/hr)
                                </p>
                              </div>
                              <Badge className={`border ${STATUS_STYLES[bk.status] || STATUS_STYLES.completed}`}>
                                {bk.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                )}
{portalTab === "payments" && (
                {/* Payment history */}
                <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                  <CardHeader>
                    <CardTitle className="text-[#f5f7ff]">Payment History</CardTitle>
                    <CardDescription className="text-[#9a9fc4]">Logged by studio staff.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <p className="text-[#9a9fc4] text-center py-8">No payments logged yet</p>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                            <div>
                              <p className="text-[#f5f7ff] font-medium">${p.amount.toFixed(2)} <span className="text-[#9a9fc4] text-xs uppercase">{p.method}</span></p>
                              <p className="text-xs text-[#9a9fc4]">
                                {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={`border ${PAYMENT_STATUS_STYLES[p.status] || PAYMENT_STATUS_STYLES.pending}`}>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Create/Edit band dialog */}
      <Dialog open={bandDialog !== null} onOpenChange={(open) => !open && setBandDialog(null)}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">
              {bandDialog === "new"
                ? bandForm.type === "artist"
                  ? "Create Artist Page"
                  : "Create Band Page"
                : "Edit Page"}
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Tell us about your {bandForm.type === "artist" ? "artist project" : "band"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[#f5f7ff]">Page Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setBandForm({ ...bandForm, type: "band" })}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    bandForm.type !== "artist"
                      ? "border-[#ea6f2a] bg-[#ea6f2a]/10 text-[#ea6f2a]"
                      : "border-[#20205a] text-[#9a9fc4] hover:border-[#9a9fc4]/50"
                  }`}
                >
                  Band
                </button>
                <button
                  type="button"
                  onClick={() => setBandForm({ ...bandForm, type: "artist" })}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    bandForm.type === "artist"
                      ? "border-[#ea6f2a] bg-[#ea6f2a]/10 text-[#ea6f2a]"
                      : "border-[#20205a] text-[#9a9fc4] hover:border-[#9a9fc4]/50"
                  }`}
                >
                  Solo Artist
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[#f5f7ff]">{bandForm.type === "artist" ? "Artist Name" : "Band Name"}</Label>
              <Input
                value={bandForm.name}
                onChange={(e) => setBandForm({ ...bandForm, name: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Genre</Label>
              <Input
                value={bandForm.genre}
                onChange={(e) => setBandForm({ ...bandForm, genre: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Bio</Label>
              <Textarea
                value={bandForm.bio}
                onChange={(e) => setBandForm({ ...bandForm, bio: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Contact Email</Label>
              <Input
                value={bandForm.contactEmail}
                onChange={(e) => setBandForm({ ...bandForm, contactEmail: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Contact Phone</Label>
              <Input
                value={bandForm.contactPhone}
                onChange={(e) => setBandForm({ ...bandForm, contactPhone: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#20205a] text-[#f5f7ff] bg-transparent" onClick={() => setBandDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBand} className="bg-[#ea6f2a] hover:bg-[#bc3f00]" disabled={!bandForm.name?.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request booking dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Request Studio Time</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">Pick a time slot for your session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[#f5f7ff]">Title (optional)</Label>
              <Input
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="Rehearsal, recording session..."
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Start</Label>
              <Input
                type="datetime-local"
                value={bookingForm.startsAt}
                onChange={(e) => setBookingForm({ ...bookingForm, startsAt: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">End</Label>
              <Input
                type="datetime-local"
                value={bookingForm.endsAt}
                onChange={(e) => setBookingForm({ ...bookingForm, endsAt: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#20205a] text-[#f5f7ff] bg-transparent" onClick={() => setBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
              disabled={!bookingForm.startsAt || !bookingForm.endsAt}
            >
              <Calendar className="w-4 h-4 mr-1" /> Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
