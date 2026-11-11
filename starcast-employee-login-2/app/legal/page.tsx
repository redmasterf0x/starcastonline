import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  Scale,
  FileText,
  ShieldCheck,
  Music,
  ShoppingBag,
  Wallet,
  ShieldAlert,
  HelpCircle,
  Mail,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Legal, Privacy & Compliance Hub | StarCast Online",
  description:
    "Official StarCast Live Media LLC legal portal: Terms of Service, Privacy Policy & SMS safeguards, 100% Artist Music Rights Agreement, Store Return Policy, Crew Payout Terms, and Account Deletion.",
  alternates: {
    canonical: "https://starcast.online/legal",
  },
}

const LEGAL_DOCUMENTS = [
  {
    title: "Terms and Conditions",
    href: "/terms",
    badge: "Master Terms",
    badgeColor: "border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10",
    icon: FileText,
    iconColor: "text-[#ffd166]",
    description:
      "Comprehensive platform terms of service governing user accounts, community standards, ticket purchases, broadcast streaming, and production studio bookings.",
    highlights: [
      "User account security & Google OAuth / SMS authentication",
      "Community code of conduct & The Deck 24h public wall",
      "Live ticketing, Stripe escrow, and anti-scalping policies",
      "Venue equipment guidelines & studio rental policies",
    ],
  },
  {
    title: "Privacy Policy & Data Safeguards",
    href: "/privacy",
    badge: "Privacy Guarantee",
    badgeColor: "border-[#ea6f2a]/40 text-[#ea6f2a] bg-[#ea6f2a]/10",
    icon: Lock,
    iconColor: "text-[#ea6f2a]",
    description:
      "Our strict privacy pledge: zero data harvesting, encrypted transit via TLS 1.3, mobile phone SMS confidentiality, and zero selling of user information.",
    highlights: [
      "No mobile phone info shared with third parties for marketing",
      "Stripe Connect tokenization (zero stored bank or SSN credentials)",
      "Strict telecom SMS carrier opt-in and STOP compliance",
      "Transparent session management and Google Cloud security",
    ],
  },
  {
    title: "Music Distribution & Rights Agreement",
    href: "/music/agreement",
    badge: "100% Artist Owned",
    badgeColor: "border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10",
    icon: Music,
    iconColor: "text-[#20efe0]",
    description:
      "Pro-artist copyright contract: artists, bands, producers, and DJs retain 100% exclusive master and publishing copyrights with zero cuts taken by StarCast.",
    highlights: [
      "100% master and publishing royalties retained by creators",
      "StarCast Audio Shield: SHA-256 binary hash & acoustic fingerprints",
      "Anti-theft, anti-sampling, and strict anti-AI scraper bans",
      "Official printable Certificate of Musical Work Upload",
    ],
  },
  {
    title: "Store Return & Refund Policy",
    href: "/return-policy",
    badge: "30-Day Guarantee",
    badgeColor: "border-emerald-400/40 text-emerald-300 bg-emerald-500/10",
    icon: ShoppingBag,
    iconColor: "text-emerald-400",
    description:
      "Official customer guarantee for StarCast Supply Co. merchandise purchased through our Shopify Storefront integration.",
    highlights: [
      "30-day return window on apparel and accessories",
      "Free prepaid return shipping labels for approved returns",
      "100% replacement or refund on damaged or misprinted goods",
      "Direct refunds to original payment method within 10 days",
    ],
  },
  {
    title: "Production Crew & Contractor Payout Terms",
    href: "/terms#crew-payouts",
    badge: "Crew Terms",
    badgeColor: "border-cyan-400/40 text-cyan-300 bg-cyan-500/10",
    icon: Wallet,
    iconColor: "text-cyan-400",
    description:
      "Engagement guidelines, independent contractor status, electronic banking disbursements, and tax accounting ledgers for production crew.",
    highlights: [
      "Independent contractor classification (IRS Form 1099)",
      "Direct bank routing via Stripe Connect (Chime / Stride Bank supported)",
      "Production accounting console with 1-click tax CSV export",
      "Timesheet logging, automated SMS shift callouts, and safety standards",
    ],
  },
  {
    title: "Google Play Account & Data Deletion",
    href: "/delete-account",
    badge: "GDPR / CCPA",
    badgeColor: "border-red-500/40 text-red-300 bg-red-500/10",
    icon: ShieldAlert,
    iconColor: "text-red-400",
    description:
      "Unrestricted self-service portal allowing users to permanently delete their account and purge personal records from StarCast Online.",
    highlights: [
      "Full compliance with Google Play Developer Data Safety policies",
      "Immediate self-service account termination option",
      "Permanent database deletion of profiles, messages, and social data",
      "Manual 48-hour email request processing option",
    ],
  },
]

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/legal" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ffd166]">
          <Link href="/" className="hover:text-[#ea6f2a] transition-colors">
            StarCast Home
          </Link>
          <span className="text-[#20205a]">/</span>
          <span className="text-[#20efe0]">Legal &amp; Compliance Hub</span>
        </div>

        {/* Hero Header */}
        <header className="mb-12 pb-8 border-b border-[#20205a]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/15 border border-[#20efe0]/40 text-[#20efe0] text-xs font-mono uppercase mb-4">
            <Scale className="w-4 h-4" />
            Official Legal, Privacy &amp; Compliance Registry
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ffd166]">Legal Portal</span>
          </h1>
          <p className="text-base text-[#9a9fc4] max-w-2xl leading-relaxed">
            StarCast Live Media LLC operates with absolute transparency, artist-first ownership rights, wireless carrier data safeguards, and strict enterprise security standards. Access all governing legal policies below.
          </p>
          <p className="text-xs text-[#7f84ad] font-mono mt-3">
            Governing Jurisdiction: State of Kansas, United States &middot; Last Revised: November 10, 2026
          </p>
        </header>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {LEGAL_DOCUMENTS.map((doc) => {
            const Icon = doc.icon
            return (
              <div
                key={doc.title}
                className="p-6 rounded-2xl bg-[#0c0c3f]/80 border border-[#20205a] hover:border-[#ffd166]/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#05052d] border border-[#20205a] flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 ${doc.iconColor}`} />
                      </div>
                      <h2 className="text-lg font-bold text-[#f5f7ff] group-hover:text-[#ffd166] transition-colors">
                        {doc.title}
                      </h2>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${doc.badgeColor}`}
                    >
                      {doc.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#9a9fc4] leading-relaxed">
                    {doc.description}
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-[#20205a]/60">
                    {doc.highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[#c4c7da] flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#20efe0] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href={doc.href}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#05052d] border border-[#20205a] text-xs font-semibold text-[#f5f7ff] hover:bg-[#ea6f2a] hover:border-[#ea6f2a] transition-all"
                  >
                    <span>Read Full Agreement</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Corporate Entity & DMCA Notice */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c0c3f] to-[#05052d] border border-[#20205a] space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#20205a] pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#ea6f2a] uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-[#ea6f2a]" />
                Official Corporate Entity &middot; Registered Headquarters
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                StarCast Live Media LLC
              </h2>
              <p className="text-xs text-[#9a9fc4] mt-1">
                An independent multimedia broadcast, recording facility, and digital creator network founded in Topeka, Kansas.
              </p>
            </div>

            <Link
              href="/information"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#20efe0]/15 border border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0] hover:text-[#05052d] text-xs font-bold transition-all shrink-0"
            >
              Explore Media Guide &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="text-xs font-mono text-[#ffd166] uppercase tracking-wider">
                Headquarters
              </p>
              <p className="font-semibold text-white">StarCast Live Media LLC</p>
              <p className="text-[#9a9fc4]">Topeka, Kansas, United States</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono text-[#20efe0] uppercase tracking-wider">
                Legal &amp; Privacy Desk
              </p>
              <p className="font-semibold text-white">Privacy Office &amp; Legal Inquiries</p>
              <p>
                <a
                  href="mailto:starcastlivemedia@gmail.com"
                  className="text-[#ffd166] underline hover:text-[#ea6f2a]"
                >
                  starcastlivemedia@gmail.com
                </a>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono text-[#ea6f2a] uppercase tracking-wider">
                DMCA Copyright Agent
              </p>
              <p className="font-semibold text-white">Designated Takedown Officer</p>
              <p className="text-[#9a9fc4]">
                Written DMCA claims:{" "}
                <a
                  href="mailto:starcastlivemedia@gmail.com"
                  className="text-[#ea6f2a] underline"
                >
                  starcastlivemedia@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
