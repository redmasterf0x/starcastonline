"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import {
  getMyBands,
  listAllBands,
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
import {
  Music,
  Plus,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Clock,
  DollarSign,
  ExternalLink,
  Share2,
  Check,
  Newspaper,
  CreditCard,
  Sparkles,
  Radio,
  ArrowRight,
  Shield,
  Layers,
  Users,
} from "lucide-react"

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

const emptyBandForm: BandInput = {
  name: "",
  type: "band",
  genre: "",
  bio: "",
  contactEmail: "",
  contactPhone: "",
  links: [],
}

export default function PortalPage() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [viewMode, setViewMode] = useState<"my" | "all">("my")

  const [bands, setBands] = useState<Band[]>([])
  const [allBandsList, setAllBandsList] = useState<Band[]>([])
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [bandDialog, setBandDialog] = useState<"new" | "edit" | null>(null)
  const [bandForm, setBandForm] = useState<BandInput>(emptyBandForm)
  const [bookingDialog, setBookingDialog] = useState(false)
  const [bookingForm, setBookingForm] = useState({ title: "", startsAt: "", endsAt: "", notes: "" })
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [portalTab, setPortalTab] = useState<"posts" | "links" | "studio" | "payments">("posts")

  const activeBandsList = (isAdmin || isStaff) && viewMode === "all" ? allBandsList : bands
  const selectedBand =
    activeBandsList.find((b) => b.id === selectedBandId) ||
    (activeBandsList.length > 0 ? activeBandsList[0] : null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (selectedBand?.id) {
      loadBandDetail(selectedBand.id)
    }
  }, [selectedBand?.id])

  async function init() {
    setError("")
    try {
      const viewer = await getPortalViewer()
      if (!viewer) {
        setIsLoggedIn(false)
        setLoading(false)
        return
      }
      setIsLoggedIn(true)
      setIsAdmin(viewer.isAdmin ?? false)
      setIsStaff(viewer.isStaff ?? false)

      const [myBandsRes, allBandsRes] = await Promise.allSettled([
        getMyBands(),
        viewer.isStaff || viewer.isAdmin ? listAllBands() : Promise.resolve([]),
      ])

      const myBands = myBandsRes.status === "fulfilled" ? (myBandsRes.value as any[]) : []
      const allBands = allBandsRes.status === "fulfilled" ? (allBandsRes.value as any[]) : []

      setBands(myBands)
      setAllBandsList(allBands)

      if (myBands.length > 0) {
        setSelectedBandId(myBands[0].id)
      } else if ((viewer.isStaff || viewer.isAdmin) && allBands.length > 0) {
        setViewMode("all")
        setSelectedBandId(allBands[0].id)
      }
    } catch (e: any) {
      console.error("Portal initialization error:", e)
      setError(e?.message || "Failed to initialize artist portal")
    } finally {
      setLoading(false)
    }
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
    try {
      const [myBands, allBands] = await Promise.all([
        getMyBands().catch(() => []),
        isAdmin || isStaff ? listAllBands().catch(() => []) : Promise.resolve([]),
      ])
      setBands(myBands as any[])
      setAllBandsList(allBands as any[])
    } catch {
      // Ignore
    }
  }

  function handleShareBand(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/bands/${slug}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/"
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

  // --- 1. Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05051f] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/40 shadow-[0_0_30px_rgba(234,111,42,0.25)] animate-pulse">
          <Music className="w-8 h-8 text-[#ea6f2a]" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[#f5f7ff] tracking-wide">Connecting to Soundstage Portal...</p>
          <p className="text-xs text-[#9a9fc4]">Synchronizing artist credentials and studio frequencies</p>
        </div>
      </div>
    )
  }

  // --- 2. Unauthenticated State: Public Welcome & Onboarding Screen ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <ResponsiveHeader isLoggedIn={false} />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden border border-[#20205a]/60 bg-gradient-to-b from-[#0c0c3f]/90 via-[#0c0c3f]/60 to-[#05051f]/90 p-8 sm:p-12 mb-12 shadow-[0_0_50px_rgba(32,239,224,0.06)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#20efe0]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 text-[#ea6f2a] text-xs font-semibold tracking-wider uppercase mb-6">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Aethelgard Soundstage · Artist Suite
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#f5f7ff] tracking-tight leading-tight mb-4">
                Broadcast Your Sound Across{" "}
                <span className="bg-gradient-to-r from-[#20efe0] via-[#38bdf8] to-[#ea6f2a] bg-clip-text text-transparent">
                  StarCast Online
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#9a9fc4] leading-relaxed mb-8">
                Join our roster of independent musicians, soundstage collectives, and producers. Claim your official
                artist page, reserve professional studio recording time, clear digital licensing, and reach thousands
                of listeners directly across the network.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white px-6 py-6 text-base font-semibold shadow-[0_0_25px_rgba(234,111,42,0.4)] rounded-xl"
                >
                  <Link href="/login?redirect=/portal">
                    Sign In to Artist Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-[#20efe0]/40 bg-[#0c0c3f]/60 text-[#c9fbf7] hover:bg-[#20efe0]/15 hover:text-white px-6 py-6 text-base font-semibold rounded-xl"
                >
                  <Link href="/bands">
                    <Music className="w-4 h-4 mr-2 text-[#20efe0]" />
                    Explore Bands Directory
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="border-[#20205a]/60 bg-[#0c0c3f]/50 hover:border-[#ea6f2a]/40 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-[#ea6f2a]" />
                </div>
                <CardTitle className="text-lg text-[#f5f7ff]">Verified Band Page</CardTitle>
                <CardDescription className="text-sm text-[#9a9fc4]">
                  Shareable public URL at <code className="text-[#20efe0]">/bands/[your-name]</code> with follower feeds,
                  custom badges, and streaming links.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#20205a]/60 bg-[#0c0c3f]/50 hover:border-[#20efe0]/40 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-[#20efe0]" />
                </div>
                <CardTitle className="text-lg text-[#f5f7ff]">Studio Time Booking</CardTitle>
                <CardDescription className="text-sm text-[#9a9fc4]">
                  Reserve tracked rehearsal hours and professional production time directly at the StarCast Soundstage.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#20205a]/60 bg-[#0c0c3f]/50 hover:border-[#ea6f2a]/40 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5 text-[#ea6f2a]" />
                </div>
                <CardTitle className="text-lg text-[#f5f7ff]">Media Rights & YouTube</CardTitle>
                <CardDescription className="text-sm text-[#9a9fc4]">
                  Execute digital agreements with 1 click to authorize official live broadcast replays and syndication.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#20205a]/60 bg-[#0c0c3f]/50 hover:border-[#20efe0]/40 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-[#20efe0]" />
                </div>
                <CardTitle className="text-lg text-[#f5f7ff]">Fan Community Sync</CardTitle>
                <CardDescription className="text-sm text-[#9a9fc4]">
                  Publish direct announcements and gig alerts straight into the StarCast Community deck and follower timelines.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Registration CTA */}
          <div className="rounded-2xl border border-[#38bdf8]/30 bg-gradient-to-r from-[#0284c7]/20 via-[#0c0c3f]/60 to-[#ea6f2a]/15 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-[#f5f7ff] mb-1">Ready to step onto the soundstage?</h3>
              <p className="text-sm text-[#9a9fc4]">
                Create a StarCast account or sign in to register your band and claim your artist URL today.
              </p>
            </div>
            <Button
              asChild
              className="bg-[#38bdf8] hover:bg-[#0284c7] text-[#05051f] font-bold px-6 py-5 rounded-xl shrink-0"
            >
              <Link href="/login?redirect=/portal">Get Started Free</Link>
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // --- 3. Authenticated State: Full Artist Portal Console ---
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader isLoggedIn={true} isAdmin={isAdmin} isCrew={isStaff} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30">
              <Music className="w-5 h-5 text-[#ea6f2a]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#f5f7ff]">Artist Portal &amp; Soundstage</h1>
              <p className="text-sm text-[#9a9fc4]">Manage your band profile, book studio time, and track sessions.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#20efe0]/40 bg-[#0c0c3f]/60 text-[#c9fbf7] hover:bg-[#20efe0]/15"
            >
              <Link href="/bands">
                <Music className="w-4 h-4 mr-1.5 text-[#20efe0]" />
                Public Directory
              </Link>
            </Button>
            <Button
              onClick={() => {
                setBandForm(emptyBandForm)
                setBandDialog("new")
              }}
              size="sm"
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Register Band
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-300 text-sm">{error}</div>
        )}

        {/* Staff/Admin Console Switcher */}
        {(isAdmin || isStaff) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 mb-6 rounded-xl bg-[#0c0c3f]/80 border border-[#20efe0]/30 shadow-[0_0_20px_rgba(32,239,224,0.08)] gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#20efe0] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#f5f7ff]">Studio Console Privileges</p>
                <p className="text-xs text-[#9a9fc4]">Staff/admin access to manage, book, and inspect all soundstage acts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === "my" ? "default" : "outline"}
                onClick={() => {
                  setViewMode("my")
                  if (bands.length > 0) setSelectedBandId(bands[0].id)
                }}
                className={
                  viewMode === "my"
                    ? "bg-[#ea6f2a] text-white"
                    : "border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                }
              >
                My Bands ({bands.length})
              </Button>
              <Button
                size="sm"
                variant={viewMode === "all" ? "default" : "outline"}
                onClick={() => {
                  setViewMode("all")
                  if (allBandsList.length > 0) setSelectedBandId(allBandsList[0].id)
                }}
                className={
                  viewMode === "all"
                    ? "bg-[#20efe0] text-[#05051f] font-semibold hover:bg-[#20efe0]/90"
                    : "border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                }
              >
                All Studio Bands ({allBandsList.length})
              </Button>
            </div>
          </div>
        )}

        {activeBandsList.length === 0 ? (
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
                onClick={() => {
                  setBandForm(emptyBandForm)
                  setBandDialog("new")
                }}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
              >
                <Plus className="w-4 h-4 mr-1" /> Create Band or Artist Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Band selector */}
            {activeBandsList.length > 1 && (
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#9a9fc4] mr-1">Select Act:</span>
                {activeBandsList.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBandId(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedBand?.id === b.id
                        ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                        : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setBandForm(emptyBandForm)
                    setBandDialog("new")
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-[#20205a] text-[#9a9fc4] hover:border-[#ea6f2a]/50 hover:text-white transition-colors"
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
                          <Badge variant="outline" className="border-[#20205a] text-[#9a9fc4]">
                            {selectedBand.genre}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            selectedBand.is_public
                              ? "border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10"
                              : "border-yellow-700/40 text-yellow-400 bg-yellow-900/20"
                          }
                        >
                          {selectedBand.is_public ? "Public" : "Draft / Private"}
                        </Badge>
                      </CardTitle>
                      {selectedBand.bio && (
                        <CardDescription className="text-[#9a9fc4] mt-1">{selectedBand.bio}</CardDescription>
                      )}
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
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-1.5 text-green-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 mr-1.5" /> Share
                              </>
                            )}
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
                            type: selectedBand.type,
                            genre: selectedBand.genre || "",
                            bio: selectedBand.bio || "",
                            contactEmail: selectedBand.contact_email || "",
                            contactPhone: selectedBand.contact_phone || "",
                            links: [],
                          })
                          setBandDialog("edit")
                        }}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                        onClick={() => setBookingDialog(true)}
                      >
                        <Calendar className="w-4 h-4 mr-1.5" /> Request Studio Time
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40">
                        <div className="text-xs text-[#9a9fc4]">Band Pass Status</div>
                        <div className="font-semibold text-[#f5f7ff] mt-1 flex items-center gap-1.5">
                          {selectedBand.has_active_pass ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-400" /> Active Pass
                            </>
                          ) : (
                            <span className="text-[#9a9fc4]">No active pass</span>
                          )}
                        </div>
                        {selectedBand.pass_expires_at && (
                          <div className="text-xs text-[#9a9fc4] mt-0.5">
                            Expires {new Date(selectedBand.pass_expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40">
                        <div className="text-xs text-[#9a9fc4]">YouTube Content Agreement</div>
                        <div className="font-semibold text-[#f5f7ff] mt-1 flex items-center gap-1.5">
                          {selectedBand.youtube_agreement_signed ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-green-400" /> Signed
                            </>
                          ) : (
                            <span className="text-yellow-400">Not signed</span>
                          )}
                        </div>
                        {!selectedBand.youtube_agreement_signed && (
                          <button
                            onClick={handleSignAgreement}
                            className="text-xs text-[#ea6f2a] hover:underline mt-1 block"
                          >
                            Sign agreement now
                          </button>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40">
                        <div className="text-xs text-[#9a9fc4]">Total Sessions</div>
                        <div className="font-semibold text-[#f5f7ff] mt-1">{bookings.length}</div>
                        <div className="text-xs text-[#9a9fc4] mt-0.5">
                          {bookings.filter((b) => b.status === "completed").length} completed
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40">
                        <div className="text-xs text-[#9a9fc4]">Total Invoiced</div>
                        <div className="font-semibold text-[#f5f7ff] mt-1">
                          $
                          {(
                            payments.reduce((sum, p) => (p.status === "paid" ? sum + p.amount : sum), 0) / 100
                          ).toFixed(2)}
                        </div>
                        <div className="text-xs text-[#9a9fc4] mt-0.5">
                          {payments.filter((p) => p.status === "pending").length > 0 && (
                            <span className="text-yellow-400">Pending balance</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex border-b border-[#20205a]/50 gap-4">
                  <button
                    onClick={() => setPortalTab("posts")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      portalTab === "posts"
                        ? "border-[#ea6f2a] text-[#ea6f2a]"
                        : "border-transparent text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                  >
                    <Newspaper className="w-4 h-4" />
                    Posts &amp; Updates
                  </button>
                  <button
                    onClick={() => setPortalTab("links")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      portalTab === "links"
                        ? "border-[#ea6f2a] text-[#ea6f2a]"
                        : "border-transparent text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    Music &amp; Social Links
                  </button>
                  <button
                    onClick={() => setPortalTab("studio")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      portalTab === "studio"
                        ? "border-[#ea6f2a] text-[#ea6f2a]"
                        : "border-transparent text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Studio Sessions
                  </button>
                  <button
                    onClick={() => setPortalTab("payments")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      portalTab === "payments"
                        ? "border-[#ea6f2a] text-[#ea6f2a]"
                        : "border-transparent text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing &amp; Invoices
                  </button>
                </div>

                {/* Tab Content */}
                {portalTab === "posts" && (
                  <BandPostsPanel
                    bandId={selectedBand.id}
                    bandName={selectedBand.name}
                    slug={selectedBand.slug}
                  />
                )}

                {portalTab === "links" && (
                  <BandLinksPanel
                    bandId={selectedBand.id}
                    slug={selectedBand.slug}
                    initialLinks={(selectedBand as any).links ?? []}
                  />
                )}

                {portalTab === "studio" && (
                  <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-[#f5f7ff] text-base">Studio Sessions</CardTitle>
                        <CardDescription className="text-[#9a9fc4]">
                          Track your rehearsal and recording bookings
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                        onClick={() => setBookingDialog(true)}
                      >
                        <Calendar className="w-4 h-4 mr-1.5" /> Request Time
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {bookings.length === 0 ? (
                        <div className="text-center py-10 text-[#9a9fc4] text-sm">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          No studio sessions booked yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bookings.map((b) => (
                            <div
                              key={b.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40 gap-2"
                            >
                              <div>
                                <div className="font-medium text-[#f5f7ff]">{b.title || "Studio Session"}</div>
                                <div className="text-xs text-[#9a9fc4] mt-0.5">
                                  {new Date(b.starts_at).toLocaleString()} – {new Date(b.ends_at).toLocaleTimeString()}
                                  {b.hours && ` · ${b.hours} hrs`}
                                </div>
                                {b.notes && <div className="text-xs text-[#9a9fc4] mt-1 italic">{b.notes}</div>}
                              </div>
                              <div className="flex items-center gap-3 self-end sm:self-center">
                                {b.total_amount > 0 && (
                                  <span className="text-sm font-semibold text-[#f5f7ff]">
                                    ${(b.total_amount / 100).toFixed(2)}
                                  </span>
                                )}
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[b.status] || ""}`}
                                >
                                  {b.status.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {portalTab === "payments" && (
                  <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                    <CardHeader>
                      <CardTitle className="text-[#f5f7ff] text-base">Payment History</CardTitle>
                      <CardDescription className="text-[#9a9fc4]">
                        Invoices and receipts for studio time and services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {payments.length === 0 ? (
                        <div className="text-center py-10 text-[#9a9fc4] text-sm">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          No payment records found.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-3.5 rounded-lg bg-[#05052d]/60 border border-[#20205a]/40 text-sm"
                            >
                              <div>
                                <div className="font-medium text-[#f5f7ff]">
                                  {p.kind.replace("_", " ").toUpperCase()} · ${(p.amount / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-[#9a9fc4]">
                                  {new Date(p.created_at).toLocaleDateString()} · via {p.method}
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border ${
                                  PAYMENT_STATUS_STYLES[p.status] || ""
                                }`}
                              >
                                {p.status}
                              </span>
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

      {/* Band create/edit dialog */}
      <Dialog open={bandDialog !== null} onOpenChange={(open) => !open && setBandDialog(null)}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">
              {bandDialog === "new" ? "Register Band or Artist Page" : "Edit Profile"}
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              {bandDialog === "new"
                ? "Create a public page for your band or solo project."
                : "Update your public profile details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[#f5f7ff]">Name</Label>
              <Input
                value={bandForm.name}
                onChange={(e) => setBandForm({ ...bandForm, name: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="Band or artist name"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Type</Label>
              <select
                value={bandForm.type}
                onChange={(e) => setBandForm({ ...bandForm, type: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#05052d] border border-[#20205a] text-[#f5f7ff] text-sm"
              >
                <option value="band">Band / Group</option>
                <option value="artist">Solo Artist / Musician</option>
                <option value="producer">Producer / Beatmaker</option>
                <option value="dj">DJ / Electronic</option>
                <option value="podcast">Podcast / Audio Show</option>
              </select>
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Genre</Label>
              <Input
                value={bandForm.genre}
                onChange={(e) => setBandForm({ ...bandForm, genre: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="Rock, Hip-Hop, Electronic, etc."
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Bio</Label>
              <Textarea
                value={bandForm.bio}
                onChange={(e) => setBandForm({ ...bandForm, bio: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="Tell fans and listeners about your sound..."
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Contact Email</Label>
              <Input
                value={bandForm.contactEmail}
                onChange={(e) => setBandForm({ ...bandForm, contactEmail: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="booking@yourband.com"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Contact Phone</Label>
              <Input
                value={bandForm.contactPhone}
                onChange={(e) => setBandForm({ ...bandForm, contactPhone: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="(optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#20205a] text-[#f5f7ff] bg-transparent"
              onClick={() => setBandDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBand}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
              disabled={!bandForm.name?.trim()}
            >
              Save Profile
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
                placeholder="Rehearsal, tracking session, live stream..."
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Start Time</Label>
              <Input
                type="datetime-local"
                value={bookingForm.startsAt}
                onChange={(e) => setBookingForm({ ...bookingForm, startsAt: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">End Time</Label>
              <Input
                type="datetime-local"
                value={bookingForm.endsAt}
                onChange={(e) => setBookingForm({ ...bookingForm, endsAt: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label className="text-[#f5f7ff]">Session Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                placeholder="Instruments brought, gear needed, engineer requests..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#20205a] text-[#f5f7ff] bg-transparent"
              onClick={() => setBookingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
              disabled={!bookingForm.startsAt || !bookingForm.endsAt}
            >
              <Calendar className="w-4 h-4 mr-1" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
