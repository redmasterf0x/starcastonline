"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { getViewerContext } from "@/app/actions/articles"
import { useEffect, useState } from "react"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  Printer,
  Video,
  Radio,
  Music,
  ShieldCheck,
  Ticket,
  Users,
  ShoppingBag,
  Sparkles,
  Tv,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  Mail,
  ExternalLink,
  MapPin,
  HelpCircle,
  FileText,
} from "lucide-react"
import { brandAssets } from "@/lib/brand-assets"

export default function InformationPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)

  useEffect(() => {
    if (session?.user) {
      getViewerContext()
        .then((viewer) => {
          if (viewer) {
            setCurrentUserId(viewer.profileId)
            setIsAdmin(viewer.isAdmin)
            setIsCrew(viewer.isEmployee)
          }
        })
        .catch(() => {})
    } else if (session === null) {
      setCurrentUserId(null)
      setIsAdmin(false)
      setIsCrew(false)
    }
  }, [session])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  const handlePrintPage = () => {
    window.print()
  }

  return (
    <div className="public-shell flex flex-col print:bg-white print:min-h-0 min-h-screen bg-[#05052d] text-[#f5f7ff]">
      <div className="print:hidden">
        <ResponsiveHeader
          currentPage="/information"
          isAdmin={isAdmin}
          isCrew={isCrew}
          isLoggedIn={!!currentUserId}
          onSignOut={handleSignOut}
          onLogin={() => router.push("/login")}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 print:max-w-none print:px-12 print:py-0 print:mx-0">
        {/* Print-only letterhead */}
        <div className="hidden print:block print:text-center print:mb-8 print:pt-8 print:border-b-2 print:border-black print:pb-6">
          <img
            src="/images/spacemanlogo.png"
            alt="StarCast Media"
            className="w-16 h-16 mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold text-black mb-1">StarCast Media</h1>
          <p className="text-base text-gray-600 italic">To media and beyond &middot; Building Worlds</p>
          <p className="text-sm text-gray-500 mt-2">starcastlivemedia@gmail.com &middot; starcast.online</p>
        </div>

        {/* Screen-only header */}
        <div className="text-center mb-12 print:hidden">
          <img
            src={brandAssets.full.verticalWhiteBlackStroke || "/placeholder.svg"}
            alt="StarCast Media"
            className="mx-auto mb-6 h-36 sm:h-48 object-contain drop-shadow-2xl"
          />
          <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 font-mono text-xs uppercase px-3 py-1 mb-3">
            Official Platform Capabilities &amp; Media Guide
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ffd166]">Ecosystem</span>
          </h1>
          <p className="text-lg text-[#20efe0] font-mono italic">
            &ldquo;Building Worlds &middot; To media and beyond&rdquo;
          </p>

          <div className="flex gap-3 justify-center mt-6">
            <Button
              onClick={handlePrintPage}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent text-xs"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Platform Information
            </Button>
          </div>
        </div>

        <div className="space-y-6 print:space-y-4">
          {/* 1. Who We Are */}
          <Card className="public-panel rounded-2xl border-[#20205a]/80 bg-[#0c0c3f]/80 print:border-0 print:bg-transparent print:shadow-none shadow-xl">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-xl font-bold text-[#f5f7ff] print:text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ffd166]" /> About StarCast Media
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed text-sm">
              <p>
                Founded by <strong>Ray Starnes</strong> in 2025 in Topeka, Kansas, StarCast Media is built on one core mantra: <span className="text-[#ffd166] font-semibold print:text-black">Building Worlds</span>.
              </p>
              <p>
                StarCast is not just a website; it is an integrated media engine combining original video broadcast universes, independent music soundstages, pro-artist copyright protection, live event ticketing, community discussion, and physical studio rehearsal spaces into a single seamless digital galaxy.
              </p>
            </CardContent>
          </Card>

          {/* 2. Platform Capabilities Grid */}
          <Card className="public-panel rounded-2xl border-[#20205a]/80 bg-[#0c0c3f]/80 print:border-0 print:bg-transparent print:shadow-none shadow-xl">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-xl font-bold text-[#f5f7ff] print:text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#20efe0]" /> Everything Our Platform Can Do
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 print:space-y-4 print:text-gray-800 print:px-0 text-sm">
              {/* Feature 1: Shows & Broadcast */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <Tv className="w-4 h-4 text-[#ea6f2a]" />
                    <h3>1. Original Video Broadcasts &amp; Live Shows</h3>
                  </div>
                  <Link href="/shows" className="text-xs text-[#ffd166] hover:underline font-mono print:hidden">
                    Explore Shows &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  StarCast produces original episodic content programmed like a modern broadcast network. Flagship shows include <em>Star Talk</em>, <em>Psyco G Spot</em>, <em>Hollywood After Babylon</em>, and <em>The Observation Deck</em>, with synchronized live streaming, full episode archives, and live spaceflight tracking.
                </p>
              </div>

              {/* Feature 2: Band Soundstage & Music Streaming */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <Music className="w-4 h-4 text-[#20efe0]" />
                    <h3>2. Soundstage &amp; 100% Artist-Owned Music Streaming</h3>
                  </div>
                  <Link href="/music" className="text-xs text-[#20efe0] hover:underline font-mono print:hidden">
                    Listen to Music &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Artists and bands get dedicated soundstage profiles (<code>/bands/[slug]</code>) with custom music catalogs, play tracking, fan follows, lyrics, and free lossless/MP3 streaming. Artists retain <strong>100% exclusive master and publishing copyrights</strong> with zero cuts taken by StarCast.
                </p>
              </div>

              {/* Feature 3: StarCast Audio Shield */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20efe0]/30 space-y-2 bg-[#20efe0]/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#20efe0] print:text-black">
                    <ShieldCheck className="w-4 h-4 text-[#20efe0]" />
                    <h3>3. StarCast Audio Shield (Acoustic Magic Engine)</h3>
                  </div>
                  <Link href="/music/agreement" className="text-xs text-[#ffd166] hover:underline font-mono print:hidden">
                    Rights Agreement &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Every uploaded sound recording is scanned in real time:
                </p>
                <ul className="list-disc pl-5 text-xs text-[#c4c7da] space-y-1">
                  <li><strong>Cryptographic SHA-256 Checksums:</strong> Exact binary hashing establishing indisputable master ownership.</li>
                  <li><strong>Perceptual Spectral Fingerprints:</strong> Detects matches even across transcoded formats and differing bitrates.</li>
                  <li><strong>Catalog Collision Shield:</strong> Quarantines and blocks unauthorized duplicate uploads of another artist&apos;s audio.</li>
                  <li><strong>Commercial Catalog Verification:</strong> AcoustID and MusicBrainz queries over 30M+ commercial masters to protect against copyright infringement.</li>
                  <li><strong>Printable Certificates:</strong> Official Certificate of Musical Work Upload for prior-art DMCA enforcement.</li>
                </ul>
              </div>

              {/* Feature 4: Live Event Ticketing */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <Ticket className="w-4 h-4 text-[#ea6f2a]" />
                    <h3>4. Live Event Ticketing &amp; Escrow Payouts</h3>
                  </div>
                  <Link href="/portal" className="text-xs text-[#ea6f2a] hover:underline font-mono print:hidden">
                    Artist Portal &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Bands can publish ticketed concerts, sell tickets with instant Stripe Checkout, issue tamper-proof cryptographically signed QR tickets (<code>/tickets/[token]</code>), and scan attendees at the door. Proceeds are held in secure escrow and disbursed via Stripe Connect 24 hours after the show.
                </p>
              </div>

              {/* Feature 5: Member Community */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <Users className="w-4 h-4 text-[#ffd166]" />
                    <h3>5. Cosmic Member Community &amp; Direct Messaging</h3>
                  </div>
                  <Link href="/community" className="text-xs text-[#ffd166] hover:underline font-mono print:hidden">
                    Join Community &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  A modern social hub with persistent navigation: The Deck 24h Public Wall (1 post per day per member), StarVote interactive polls, threaded discussions with rich media embeds (YouTube, Spotify, SoundCloud, StarCast audio), cosmic emoji reactions, friend requests, and private Direct Messaging (DMs).
                </p>
              </div>

              {/* Feature 6: Observation Deck Quizzes */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <HelpCircle className="w-4 h-4 text-[#20efe0]" />
                    <h3>6. StarCast Trivia &amp; Observation Deck Quizzes</h3>
                  </div>
                  <Link href="/quiz" className="text-xs text-[#20efe0] hover:underline font-mono print:hidden">
                    Take Quiz &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Interactive trivia testing audience show knowledge with cosmic scoring badges and one-click social sharing links with custom Open Graph visual cards for Facebook, X/Twitter, and mobile messaging.
                </p>
              </div>

              {/* Feature 7: Official Merch Shop */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <ShoppingBag className="w-4 h-4 text-[#ea6f2a]" />
                    <h3>7. Merchandise Storefront (Powered by Shopify)</h3>
                  </div>
                  <Link href="/merch" className="text-xs text-[#ea6f2a] hover:underline font-mono print:hidden">
                    Shop Merch &rarr;
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Live Shopify Storefront API integration offering high-quality apparel, hoodies, tees, and accessories with real-time inventory, size/color variant selection, slide-out cart drawers, and encrypted Shopify checkout.
                </p>
              </div>

              {/* Feature 8: Studio & Live Production */}
              <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff] print:text-black">
                    <Calendar className="w-4 h-4 text-[#ffd166]" />
                    <h3>8. Rehearsal Studio &amp; Multi-Cam Production Soundstage</h3>
                  </div>
                  <span className="text-xs text-[#7f84ad] font-mono">Topeka, KS</span>
                </div>
                <p className="text-xs sm:text-sm text-[#9a9fc4] print:text-gray-700">
                  Physical rehearsal facilities and production soundstages offering multi-camera 4K switching, live streaming, promo edits, tracking sessions, and monthly band soundstage passes. Staff console features automated SMS crew callout reminders via cron.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. The Vision */}
          <Card className="public-panel rounded-2xl border-[#20205a]/80 bg-[#0c0c3f]/80 print:border-0 print:bg-transparent print:shadow-none shadow-xl">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-xl font-bold text-[#f5f7ff] print:text-black flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#ea6f2a]" /> The Vision: A Complete Creator Network
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed text-sm">
              <p>
                We are building an independent alternative to fragmented social media and music giants:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>All-In-One Soundstage:</strong> Bands no longer need separate sites for music streaming, ticketing, fan updates, and merch.</li>
                <li><strong>Creator Protection First:</strong> Artists own their art. Acoustic fingerprints establish prior-art against AI scrapers and theft.</li>
                <li><strong>24/7 Digital Broadcast:</strong> Live programming that treats online video like a genuine television network.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Business & Sponsorship Opportunities */}
          <Card className="public-panel rounded-2xl border-[#20205a]/80 bg-[#0c0c3f]/80 print:border-0 print:bg-transparent print:shadow-none shadow-xl">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-xl font-bold text-[#f5f7ff] print:text-black flex items-center gap-2">
                <Award className="w-5 h-5 text-[#ffd166]" /> Business &amp; Sponsorship Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed text-sm">
              <p>
                Whether you are a brand looking for authentic host-read sponsorships, a band seeking studio tracking and ticketing, or a filmmaker wanting co-production, StarCast Media offers turnkey opportunities.
              </p>
              <Link
                href="/sponsors"
                className="flex items-center justify-between p-4 bg-[#ea6f2a]/10 border border-[#ea6f2a]/40 rounded-xl hover:bg-[#ea6f2a]/20 transition-colors group print:hidden"
              >
                <div>
                  <p className="text-[#f5f7ff] font-semibold">View Official Sponsorship Packages</p>
                  <p className="text-xs text-[#9a9fc4] mt-0.5">From $50 &mdash; single host reads to full-season broadcast integration</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#ea6f2a] group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="p-4 bg-[#05052d] border border-[#20205a] rounded-xl print:bg-transparent print:border print:border-gray-300 print:p-3 space-y-2 text-xs sm:text-sm">
                <p className="text-[#f5f7ff] font-semibold print:text-black flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ea6f2a]" /> Headquarters &amp; Soundstage:
                </p>
                <p className="text-[#c4c7da] print:text-black">
                  StarCast Live Media LLC &middot; Topeka, Kansas, USA
                </p>
                <p className="text-[#ffd166] print:text-black flex items-center gap-2 pt-1">
                  <Mail className="w-4 h-4" />
                  Email: <a href="mailto:starcastlivemedia@gmail.com" className="underline hover:text-[#ea6f2a]">starcastlivemedia@gmail.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
