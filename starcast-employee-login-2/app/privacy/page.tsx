import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ShieldCheck, Lock, Mail, Phone, ArrowLeft, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | StarCast Online",
  description:
    "Privacy Policy and mobile SMS data handling practices for StarCast Online and StarCast Live Media.",
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
            Official Privacy Policy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ea6f2a]">Privacy Policy</span>
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            Effective Date: January 1, 2026 &middot; Last Updated: September 17, 2026
          </p>
        </header>

        {/* Policy Content */}
        <div className="space-y-8 text-sm leading-relaxed text-[#c4c7da]">
          {/* Important SMS Notice */}
          <div className="p-5 rounded-2xl border-2 border-[#ea6f2a]/40 bg-[#ea6f2a]/10 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#ea6f2a] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-[#f5f7ff] mb-1">
                  Mobile &amp; SMS Privacy Guarantee
                </h2>
                <p className="text-xs sm:text-sm text-[#e2e8f0]">
                  <strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> All information gathered through SMS opt-in, phone verification, and two-factor authentication (2FA) is used solely to authenticate your account and will remain strictly confidential.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">1. Overview &amp; Introduction</h2>
            <p>
              StarCast Live Media ("StarCast", "we", "us", or "our") operates the website{" "}
              <Link href="https://starcast.online" className="text-[#ffd166] underline">
                starcast.online
              </Link>{" "}
              and associated broadcast, soundstage, and community services. We are dedicated to respecting and protecting the personal privacy of our users, artists, bands, crew, and audience members.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">2. Information We Collect</h2>
            <p>We may collect information you provide directly to us when using our services:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Information:</strong> Name, email address, password hash, profile avatar, username, and biography.
              </li>
              <li>
                <strong>Phone Numbers:</strong> Mobile numbers entered voluntarily for one-time verification passcodes (OTP), account sign-in, and account security.
              </li>
              <li>
                <strong>Artist &amp; Band Details:</strong> Band name, genre, soundstage bios, audio links, and booking requests.
              </li>
              <li>
                <strong>Third-Party Authentication:</strong> When you choose to sign in with Google, we receive basic profile info (email address, full name, and avatar) authorized by your OAuth consent.
              </li>
              <li>
                <strong>Payment Information:</strong> Sponsorship payments and studio booking charges are processed securely via Stripe. We do not store complete credit card numbers on our servers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">3. How We Use Your Information</h2>
            <p>We use the collected information for specific, limited purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To authenticate your identity, log you in, and maintain your active session.</li>
              <li>To transmit single-use transactional 6-digit SMS verification passcodes via Twilio.</li>
              <li>To host, publish, and display your public artist or band profile and soundstage posts with your consent.</li>
              <li>To manage studio rehearsal bookings, soundstage passes, and billing receipts.</li>
              <li>To prevent unauthorized account access, fraud, spam, or abusive behavior.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">4. SMS Communications &amp; Carrier Compliance</h2>
            <p>
              When you opt in to receive text messages from StarCast Online by entering your mobile number on our login, registration, or profile settings page:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Purpose:</strong> Single-purpose one-time passcodes (OTP) for account verification and sign-in.
              </li>
              <li>
                <strong>Frequency:</strong> One-time message per login or verification request (transactional only).
              </li>
              <li>
                <strong>Opt-Out / STOP:</strong> You may cancel or opt out at any time by replying <strong>STOP</strong> to any message received.
              </li>
              <li>
                <strong>Help / Support:</strong> Reply <strong>HELP</strong> for assistance or email us at{" "}
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] underline">
                  starcastlivemedia@gmail.com
                </a>.
              </li>
              <li>
                <strong>Rates:</strong> Standard message and data rates may apply from your wireless carrier.
              </li>
              <li>
                <strong>Non-Sharing Clause:</strong> Mobile phone numbers collected for SMS consent will never be sold, rented, leased, or shared with third parties or marketing affiliates.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">5. Data Security &amp; Storage</h2>
            <p>
              We implement industry-standard administrative, physical, and technical safeguards to protect your personal data against unauthorized access, loss, or alteration. Authentication sessions use secure, encrypted cookies, and all API communications are encrypted via TLS/HTTPS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">6. Your Privacy Rights &amp; Choices</h2>
            <p>
              You have the right to access, update, or delete your account information at any time through your{" "}
              <Link href="/dashboard" className="text-[#ffd166] underline">
                Account Dashboard
              </Link>
              . To request complete deletion of your account and associated profile data, contact our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">7. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to:
            </p>
            <div className="p-4 rounded-xl bg-[#0c0c3f] border border-[#20205a] space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-[#f5f7ff]">StarCast Live Media</p>
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
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
