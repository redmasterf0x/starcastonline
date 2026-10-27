import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  FileText,
  ArrowLeft,
  Mail,
  ExternalLink,
  ShieldCheck,
  Music,
  Ticket,
  Users,
  ShoppingBag,
  Video,
  Radio,
  Lock,
  Calendar,
  AlertTriangle,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Terms and Conditions | StarCast Online",
  description:
    "Comprehensive Terms of Service, soundstage rules, 100% artist music rights, acoustic fingerprinting compliance, live ticketing, community standards, and SMS terms for StarCast Online.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/terms" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ffd166] hover:text-[#ea6f2a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to StarCast Home
          </Link>
        </div>

        {/* Header Hero */}
        <header className="mb-10 pb-8 border-b border-[#20205a]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/15 border border-[#20efe0]/40 text-[#20efe0] text-xs font-mono uppercase mb-4">
            <FileText className="w-4 h-4" />
            Terms of Service &amp; Platform Guidelines
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ffd166]">Terms &amp; Conditions</span>
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            Effective Date: January 1, 2026 &middot; Last Revised: October 26, 2026 &middot; StarCast Live Media LLC
          </p>
        </header>

        {/* Highlight Callout Box */}
        <div className="p-5 rounded-2xl border border-[#20efe0]/30 bg-[#20efe0]/10 mb-8 space-y-2 text-xs sm:text-sm text-[#dbe0fb]">
          <div className="flex items-center gap-2 font-bold text-[#20efe0]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            Welcome to the StarCast Media Ecosystem
          </div>
          <p className="leading-relaxed">
            StarCast Online (<strong>starcast.online</strong>) is a unified multimedia network: a broadcast network for original shows and live programming, an artist soundstage with 100% artist-owned music streaming and acoustic fingerprint protections, a live event ticketing exchange, an interactive member community, an official merchandise storefront, and a production studio. These Terms define rights, obligations, and safety across all platform features.
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-10 text-sm leading-relaxed text-[#c4c7da]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#ffd166]" /> 1. Agreement to Terms
            </h2>
            <p>
              By accessing, browsing, creating an account, streaming music or video, purchasing tickets or merchandise, booking studio time, or posting content on{" "}
              <Link href="https://starcast.online" className="text-[#ffd166] underline">
                starcast.online
              </Link>{" "}
              (the &quot;Site&quot; or &quot;Service&quot;), operated by StarCast Live Media LLC (&quot;StarCast&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be legally bound by these Terms and Conditions and our{" "}
              <Link href="/privacy" className="text-[#ea6f2a] underline">
                Privacy Policy
              </Link>
              . If you do not agree to these terms, do not use our services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#20efe0]" /> 2. User Accounts, Identity &amp; Security
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Eligibility:</strong> You must be at least 13 years of age to register an account. By registering, you warrant that all information provided is accurate and truthful.
              </li>
              <li>
                <strong>Authentication Methods:</strong> StarCast supports Google OAuth social authentication and Firebase Phone Auth (SMS OTP verification). Passwords are not used to maximize security against credential stuffing.
              </li>
              <li>
                <strong>Account Responsibility:</strong> You are responsible for all actions conducted under your account, username, and profile. Do not share your one-time SMS passcodes or session tokens with anyone.
              </li>
              <li>
                <strong>Profile &amp; Username Standards:</strong> Usernames must not be impersonating, defamatory, abusive, sexually explicit, or infringing on trademarks. StarCast reserves the right to reclaim or reassign violating usernames.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#ea6f2a]" /> 3. SMS Messaging &amp; Authentication Terms
            </h2>
            <p>
              StarCast Online utilizes enterprise carrier routing and Firebase / Twilio SMS gateways to transmit transactional verification codes and production crew callout alerts. By entering your phone number, you agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Message Purpose:</strong> Transmitting single-use 6-digit authentication passcodes (OTP) for login, signup, phone linking, and production crew shift reminders for registered staff.
              </li>
              <li>
                <strong>Frequency:</strong> Transactional only. One SMS per user-initiated verification request or production crew assignment. No automated marketing texts are sent.
              </li>
              <li>
                <strong>Opt-In Method:</strong> You explicitly opt in by providing your mobile phone number on our login, signup, or profile settings page and pressing &quot;Send Verification Code&quot;.
              </li>
              <li>
                <strong>Opt-Out / STOP:</strong> Reply <strong>STOP</strong> to any SMS message to cancel SMS communications at any time.
              </li>
              <li>
                <strong>Help / Support:</strong> Reply <strong>HELP</strong> to any SMS message or email{" "}
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] underline">
                  starcastlivemedia@gmail.com
                </a>.
              </li>
              <li>
                <strong>Carrier Rates &amp; Disclaimers:</strong> Message and data rates may apply. Wireless carriers are not liable for delayed or undelivered messages.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Music className="w-5 h-5 text-[#ffd166]" /> 4. Artist, Band &amp; Music Rights (100% Artist Ownership)
            </h2>
            <p>
              StarCast Online is designed from the ground up as a pro-artist soundstage and music portal:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>100% Master &amp; Publishing Rights Retention:</strong> Artists, bands, songwriters, and producers retain 100% exclusive copyright ownership, title, master rights, and publishing royalties in all sound recordings and musical compositions uploaded to StarCast Online. StarCast Media takes ZERO equity, master cuts, or publishing shares.
              </li>
              <li>
                <strong>Ad-Free Non-Exclusive Streaming License:</strong> Uploading music grants StarCast Media a revocable, non-exclusive license solely to stream and host your tracks ad-free on StarCast Online for public listeners. You remain completely free to monetize, sell, or distribute your music on Spotify, Apple Music, Bandcamp, or any other platform.
              </li>
              <li>
                <strong>Anti-Theft, Anti-Sampling &amp; Anti-AI Scraping:</strong> All audio hosted on StarCast Online is strictly protected under U.S. and international copyright law. Visitors, automated bots, scrapers, and third parties are expressly prohibited from downloading (unless explicitly permitted by the artist), sampling, chopping, syncing, re-recording, isolating stems, or utilizing artist audio for AI/machine-learning model training without the artist&apos;s written commercial license.
              </li>
              <li>
                <strong>Digital Proof of Ownership &amp; Ingestion Certificates:</strong> Every uploaded track generates an immutable, date-stamped digital ledger record in our database establishing prior-art and chain of custody. Artists can view and print their official Certificate of Musical Work Upload at any time via the Artist Portal to substantiate DMCA takedowns and federal court copyright claims.
              </li>
              <li>
                <strong>Official Music Agreement:</strong> Review the complete legal terms at our{" "}
                <Link href="/music/agreement" className="text-[#ffd166] underline font-bold">
                  StarCast Music Distribution &amp; Rights Agreement (SC-MRA-2026-V1)
                </Link>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#20efe0]" /> 5. StarCast Audio Shield &amp; Acoustic Fingerprinting Engine
            </h2>
            <p>
              To protect independent creators against catalog theft, unauthorized re-uploads, and commercial piracy, StarCast Online deploys an automated acoustic verification engine:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cryptographic Master Checksums (SHA-256):</strong> Every uploaded audio file is processed through binary cryptographic hashing to generate an immutable master checksum.
              </li>
              <li>
                <strong>Perceptual Spectral Fingerprinting:</strong> Our algorithms analyze harmonic structure, frequency distribution, and energy gradients across temporal frames to recognize a track even if transcoded, exported at different bitrates, or converted between formats (e.g. WAV to MP3).
              </li>
              <li>
                <strong>Anti-Theft Catalog Collision Quarantine:</strong> If a user attempts to upload a sound recording that acoustically matches an existing master registered by another artist on StarCast Online, the upload is quarantined and rejected with an immediate collision notice.
              </li>
              <li>
                <strong>Commercial Catalog Verification:</strong> Uploads are verified against AcoustID and MusicBrainz commercial registries (indexing over 30 million commercial master recordings) to flag unauthorized commercial major-label releases before they go live.
              </li>
              <li>
                <strong>Sanctions for Copyright Infringement:</strong> Users who upload music they do not own or possess legal rights to license will have their tracks removed, risk permanent social banning, and may be reported to rights holders for DMCA enforcement.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#ea6f2a]" /> 6. Live Event Ticketing &amp; Stripe Connect Escrow
            </h2>
            <p>
              Registered acts and bands can apply for ticketing privileges to sell event tickets directly to fans through StarCast Online:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Ticket Purchases &amp; Delivery:</strong> Event tickets are purchased via Stripe Checkout. Upon verified payment, buyers receive digital tickets with unique, cryptographically signed QR tokens accessible at <code>/tickets/[token]</code> and sent via confirmation email.
              </li>
              <li>
                <strong>Escrow &amp; Stripe Connect Payouts:</strong> Ticket sales proceeds are deposited into an escrow account and disbursed to the band&apos;s verified Stripe Connect account 24 hours after the scheduled event date, ensuring attendee protection against cancellations or fraud.
              </li>
              <li>
                <strong>Event Cancellations &amp; Refunds:</strong> If an event is cancelled by the band or venue, ticket buyers are entitled to full refunds processed through Stripe. In the case of rescheduled events, tickets remain valid for the new date unless refund requests are submitted.
              </li>
              <li>
                <strong>Scalping &amp; Unauthorized Resale:</strong> Reselling StarCast tickets above face value, counterfeiting QR codes, or exploiting ticketing bots is strictly prohibited and results in immediate ticket voidance without refund.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ffd166]" /> 7. Member Community Standards &amp; Social Code of Conduct
            </h2>
            <p>
              The StarCast Community (<code>/community</code>) is a vibrant social stream for fans, creators, and artists. All users agree to adhere to our Community Code of Conduct:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>The Deck 24h Public Wall:</strong> Members can broadcast one post every 24 hours to The Deck. Content must be respectful and free from automated spam or advertising bots.
              </li>
              <li>
                <strong>StarVote Polls &amp; Discussions:</strong> Polls and discussions must not promote violence, hate speech, illegal activities, or deliberate disinformation.
              </li>
              <li>
                <strong>Direct Messaging &amp; Friendships:</strong> Direct messages (DMs) and friend requests must not be used to harass, intimidate, stalk, or send unsolicited commercial advertisements.
              </li>
              <li>
                <strong>Social Bans &amp; Content Moderation:</strong> Users who violate community guidelines may have their social privileges revoked (blocking posts, comments, likes, friend requests, and DMs) or face permanent account termination.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#20efe0]" /> 8. Merchandise Storefront &amp; Shopify Orders
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Shopify Storefront Integration:</strong> Official StarCast merchandise (tees, hoodies, hats, stickers, and accessories) available at <code>/merch</code> is processed securely via the Shopify Storefront API.
              </li>
              <li>
                <strong>Pricing &amp; Availability:</strong> All prices are displayed in USD. While we strive for accuracy, StarCast reserves the right to correct pricing errors or cancel orders for items that become discontinued or out of stock.
              </li>
              <li>
                <strong>Shipping &amp; Fulfillment:</strong> Orders are fulfilled and shipped through authorized manufacturing and fulfillment partners. Shipping timelines and tracking links are provided upon dispatch.
              </li>
              <li>
                <strong>Returns &amp; Exchanges:</strong> Damaged, misprinted, or defective merchandise must be reported within 14 days of delivery for a free replacement or full refund.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Video className="w-5 h-5 text-[#ea6f2a]" /> 9. Broadcast Content, Shows &amp; Interactive Trivia
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Original Shows:</strong> Video content, show episodes, and livestreams produced under the StarCast Media banner (including <em>Star Talk</em>, <em>Psyco G Spot</em>, <em>Hollywood After Babylon</em>, and <em>The Observation Deck</em>) are protected by copyright. Unauthorized rebroadcasting or mirror streaming is prohibited.
              </li>
              <li>
                <strong>Observation Deck Quiz:</strong> Interactive quizzes and trivia games provided on the site (<code>/quiz</code>) are for entertainment. Score cards and badges may be shared socially, but attempting to tamper with quiz scoring endpoints via scripts or automation is prohibited.
              </li>
              <li>
                <strong>Public Articles &amp; Journalism:</strong> Editorial articles authored by StarCast staff and approved community writers represent the viewpoints of the authors. Plagiarizing or republishing full articles without attribution is forbidden.
              </li>
            </ul>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ffd166]" /> 10. Studio Rehearsal Bookings &amp; Soundstage Passes
            </h2>
            <p>
              Rehearsal studio slots, equipment rentals, soundstage tracking sessions, and monthly passes at StarCast Soundstage in Topeka, Kansas, are subject to booking confirmation and venue house rules:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Scheduling:</strong> Bookings must be requested and approved in advance through the booking portal.
              </li>
              <li>
                <strong>Equipment Care:</strong> Bands and clients are responsible for reasonable care of studio equipment, microphones, amplifiers, and facilities. Willful or negligent damage will be billed to the booking client.
              </li>
              <li>
                <strong>Cancellation Policy:</strong> Cancellations made at least 48 hours prior to scheduled studio time are eligible for rescheduling or refund.
              </li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> 11. Disclaimers &amp; Limitation of Liability
            </h2>
            <p>
              The Service, including all streaming video, audio playback, ticketing engines, community streams, and tools, is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, either express or implied.
            </p>
            <p>
              In no event shall StarCast Live Media LLC, its founder, officers, crew, or affiliates be liable for any indirect, incidental, punitive, or consequential damages resulting from your access to or inability to use the platform, data loss, unauthorized access, or third-party conduct.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">12. DMCA Takedown Notices &amp; Copyright Agent</h2>
            <p>
              If you are a copyright owner or authorized representative and believe content hosted on StarCast Online infringes your copyright, submit a formal DMCA takedown notification to our Designated Copyright Agent with:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the infringing material with URL or track slug.</li>
              <li>Your contact information (name, mailing address, telephone number, and email).</li>
              <li>A statement of good-faith belief that the disputed use is unauthorized.</li>
              <li>A statement made under penalty of perjury that the notification is accurate.</li>
            </ol>
            <div className="p-4 rounded-xl bg-[#0c0c3f] border border-[#20205a] mt-3 space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-[#f5f7ff]">StarCast Live Media LLC &middot; Legal Department</p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ea6f2a]" />
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] hover:underline">
                  starcastlivemedia@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#20efe0]" />
                <Link href="https://starcast.online" className="text-[#20efe0] hover:underline">
                  https://starcast.online
                </Link>
              </p>
              <p className="text-[#7f84ad] text-xs font-mono pt-1">Topeka, KS &middot; United States</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
