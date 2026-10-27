import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  ArrowLeft,
  ExternalLink,
  Music,
  Ticket,
  ShoppingBag,
  Users,
  Database,
  Smartphone,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | StarCast Online",
  description:
    "Official Privacy Policy, mobile SMS data safeguards, acoustic fingerprinting data handling, ticketing privacy, and Google Play account deletion protocols for StarCast Online.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/privacy" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/40 text-[#ea6f2a] text-xs font-mono uppercase mb-4">
            <ShieldCheck className="w-4 h-4" />
            Official Privacy Policy &amp; Data Safeguards
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ea6f2a]">Privacy Policy</span>
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            Effective Date: January 1, 2026 &middot; Last Revised: October 26, 2026 &middot; StarCast Live Media LLC
          </p>
        </header>

        {/* Policy Content */}
        <div className="space-y-10 text-sm leading-relaxed text-[#c4c7da]">
          {/* Important SMS Notice */}
          <div className="p-5 rounded-2xl border-2 border-[#ea6f2a]/40 bg-[#ea6f2a]/10 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#ea6f2a] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-[#f5f7ff] mb-1">
                  Mobile Phone &amp; SMS Privacy Guarantee
                </h2>
                <p className="text-xs sm:text-sm text-[#e2e8f0]">
                  <strong>No mobile phone information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> All mobile phone numbers collected for one-time SMS verification passcodes (OTP), account sign-in, and production crew alerts are strictly confidential and used solely for transaction execution and identity security.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">1. Overview &amp; Our Commitment</h2>
            <p>
              StarCast Live Media LLC (&quot;StarCast&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates{" "}
              <Link href="https://starcast.online" className="text-[#ffd166] underline">
                starcast.online
              </Link>{" "}
              and associated broadcast, artist soundstage, event ticketing, community discussion, and media services. We believe that privacy is a fundamental right. We do not sell, rent, monetize, or harvest user personal data. This Privacy Policy details how we collect, protect, and handle information across all site capabilities.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#20efe0]" /> 2. Information We Collect
            </h2>
            <p>We collect only the information necessary to provide and secure our platform services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account &amp; Profile Data:</strong> Display name, unique username, email address, profile avatar URL, biography, and role permissions (e.g. user, band owner, crew member, administrator).
              </li>
              <li>
                <strong>Third-Party Social Authentication:</strong> When you sign in with Google OAuth, we receive authorized profile data (email address, full name, profile picture) to establish your account without storing passwords.
              </li>
              <li>
                <strong>Phone Numbers:</strong> Mobile numbers entered voluntarily for SMS one-time verification passcodes (OTP), mobile phone sign-in, and authorized crew shift alerts.
              </li>
              <li>
                <strong>Artist &amp; Soundstage Music Data:</strong> Band titles, artist names, album art, audio master files, lyrics, producer credits, and <strong>Acoustic Fingerprints</strong> (SHA-256 master hashes and spectral perceptual fingerprints generated for copyright prior-art protection).
              </li>
              <li>
                <strong>Event Ticketing &amp; Financial Information:</strong> When you purchase tickets or sponsor packages, payments are processed directly through <strong>Stripe</strong>. StarCast does not store complete credit card or payment credential numbers on our servers. When bands or crew receive payouts, financial routing is managed via secure <strong>Stripe Connect</strong>.
              </li>
              <li>
                <strong>Merchandise Orders:</strong> Online merch transactions at <code>/merch</code> are executed via the <strong>Shopify Storefront API</strong>. Shopify securely handles payment processing, billing, and fulfillment addresses.
              </li>
              <li>
                <strong>Community Interactions:</strong> Public posts, comments, StarVote poll votes, cosmic reactions, The Deck 24h wall posts, friend connections, and private one-on-one direct messages (DMs).
              </li>
              <li>
                <strong>Technical Logs &amp; Cookies:</strong> Essential session cookies (Better Auth tokens), IP addresses, browser user-agent strings, and diagnostic telemetry to prevent fraud and protect platform stability.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ffd166]" /> 3. How We Use Your Information
            </h2>
            <p>We use your information exclusively for the following operations:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create, authenticate, and manage your StarCast member session.</li>
              <li>To transmit single-use SMS verification passcodes via Firebase Phone Auth and Twilio.</li>
              <li>To stream artist audio tracks, render band pages, and display official Certificates of Ownership.</li>
              <li>To analyze uploaded audio against our internal catalog and AcoustID registries to prevent copyright infringement and duplicate theft.</li>
              <li>To issue cryptographically signed QR tickets and disburse escrowed event payouts to bands via Stripe Connect.</li>
              <li>To facilitate social networking, fan comments, discussion threads, and direct messaging between members.</li>
              <li>To fulfill merchandise orders and deliver sponsor confirmations.</li>
              <li>To protect users against spam, bot abuse, unauthorized intrusions, and security breaches.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Music className="w-5 h-5 text-[#20efe0]" /> 4. Acoustic Fingerprinting &amp; Master Audio Shield Data
            </h2>
            <p>
              When an artist or band uploads sound recordings to StarCast Online:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cryptographic Master Hashing:</strong> We compute a binary SHA-256 hash of the master audio file. This hash is mathematically unique to the recording and acts as a digital fingerprint.
              </li>
              <li>
                <strong>Perceptual Spectral Analysis:</strong> We extract harmonic and frequency distribution profiles across temporal frames to enable duplicate collision detection even if audio files are re-encoded.
              </li>
              <li>
                <strong>Prior-Art Custody Ledger:</strong> Hashing data, band ID, and upload timestamps are combined into an immutable chain-of-custody token (`proof_of_master_hash`) displayed on official upload certificates.
              </li>
              <li>
                <strong>No Third-Party Commercial Exploitation:</strong> Audio data and fingerprints are stored solely to power ad-free streaming on StarCast and protect the artist&apos;s copyright. We never sell, license, or provide audio files to third parties for commercial AI training.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#ea6f2a]" /> 5. SMS Carrier Compliance &amp; Non-Disclosure
            </h2>
            <p>
              In accordance with telecommunications standards and wireless carrier regulations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Strict Confidentiality:</strong> Phone numbers collected for SMS verification or crew alerts are never shared with third parties or affiliates for marketing or advertising.
              </li>
              <li>
                <strong>Transactional Use Only:</strong> We send text messages solely when initiated by your action (requesting a login code or confirming crew production schedules).
              </li>
              <li>
                <strong>Unsubscribe Anytime:</strong> Reply <strong>STOP</strong> to cancel text messages at any time. Reply <strong>HELP</strong> for customer support.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#ffd166]" /> 6. Data Security, Hosting &amp; Storage Architecture
            </h2>
            <p>
              StarCast Online is engineered on enterprise-grade Google Cloud &amp; Firebase App Hosting infrastructure:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All web traffic and API routes are strictly encrypted in transit using TLS 1.3 / HTTPS.</li>
              <li>Postgres databases utilize encryption-at-rest with pooled secure connections and strict schema boundary checks.</li>
              <li>Authentication cookies are configured with <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite</code> protections.</li>
              <li>Cloud storage blobs are secured with signed upload validation and granular file-size restrictions.</li>
            </ul>
          </section>

          {/* Section 7 - Account Deletion */}
          <section id="delete-account" className="space-y-4 p-6 rounded-2xl border-2 border-red-500/40 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
              <ShieldAlert className="w-5 h-5" />
              <h2>7. Account &amp; Data Deletion Request (Google Play Compliance)</h2>
            </div>
            <p className="text-sm text-[#e2e8f0]">
              In full compliance with Google Play Developer Policies and global data protection regulations (GDPR / CCPA), StarCast users have the unrestricted right to request permanent deletion of their account and all associated personal data at any time.
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-[#c4c7da]">
              <p>
                <strong>Self-Service Account Deletion:</strong> You can delete your account instantly by visiting our dedicated deletion portal at{" "}
                <Link href="/delete-account" className="text-red-400 underline font-semibold">
                  starcast.online/delete-account
                </Link>{" "}
                or navigating to your Dashboard &rarr; Account Settings &rarr; Delete Account.
              </p>
              <p>
                <strong>What is Deleted:</strong> Your profile record, usernames, friend relationships, direct messages, phone verifications, uploaded avatars, comments, and community posts will be permanently purged from our primary database.
              </p>
              <p>
                <strong>Email Request Alternative:</strong> You may also request manual account deletion by emailing{" "}
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ffd166] underline">
                  starcastlivemedia@gmail.com
                </a>{" "}
                with the subject line &quot;Data Deletion Request&quot;. Requests are processed within 48 hours.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/delete-account"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Go to Account Deletion Page &rarr;
              </Link>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">8. Third-Party Service Providers</h2>
            <p>We work with trusted third-party cloud infrastructure providers to power specific platform functions:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Google Cloud &amp; Firebase:</strong> App Hosting, Cloud Storage, and Authentication.</li>
              <li><strong>Stripe:</strong> Payment processing, ticket checkout, and band Connect escrow payouts.</li>
              <li><strong>Shopify:</strong> Merchandise catalog, shopping cart, and fulfillment.</li>
              <li><strong>Twilio:</strong> Enterprise SMS one-time passcodes and production crew alerts.</li>
              <li><strong>Resend:</strong> Transactional order confirmations and ticket delivery emails.</li>
              <li><strong>AcoustID &amp; MusicBrainz:</strong> Open commercial audio fingerprint database queries.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">9. Contact Our Privacy Team</h2>
            <div className="p-4 rounded-xl bg-[#0c0c3f] border border-[#20205a] space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-[#f5f7ff]">StarCast Live Media LLC &middot; Privacy &amp; Compliance Office</p>
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
