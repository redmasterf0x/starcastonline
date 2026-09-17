import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { FileText, ArrowLeft, Mail, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms and Conditions | StarCast Online",
  description:
    "Terms of Service, community rules, soundstage broadcast terms, and SMS messaging terms for StarCast Online.",
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
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            StarCast Media <span className="text-[#ffd166]">Terms &amp; Conditions</span>
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            Effective Date: January 1, 2026 &middot; Last Updated: September 17, 2026
          </p>
        </header>

        {/* Terms Content */}
        <div className="space-y-8 text-sm leading-relaxed text-[#c4c7da]">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">1. Agreement to Terms</h2>
            <p>
              By accessing, browsing, or creating an account on{" "}
              <Link href="https://starcast.online" className="text-[#ffd166] underline">
                starcast.online
              </Link>{" "}
              (the &quot;Site&quot; or &quot;Service&quot;), operated by StarCast Live Media (&quot;StarCast&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms and Conditions and our{" "}
              <Link href="/privacy" className="text-[#ea6f2a] underline">
                Privacy Policy
              </Link>
              . If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">2. User Accounts &amp; Security</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You must provide accurate and complete information when registering an account.
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your account credentials, passwords, and verification codes.
              </li>
              <li>
                You agree to notify us immediately of any unauthorized use of your account.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">3. SMS Messaging &amp; Authentication Terms</h2>
            <p>
              StarCast Online provides SMS-based two-factor authentication and one-time sign-in passcodes (OTP). By providing your mobile phone number on our site, you agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Message Purpose:</strong> Sending one-time passcodes to verify account ownership during login or phone linking.
              </li>
              <li>
                <strong>Message Frequency:</strong> Transactional only. One message is sent per user-initiated verification request.
              </li>
              <li>
                <strong>Opt-In Method:</strong> You explicitly opt in by typing your mobile number into our login, signup, or profile page and clicking &quot;Send SMS Code&quot;.
              </li>
              <li>
                <strong>Opt-Out / Cancellation:</strong> You can opt out of SMS messaging at any time by replying <strong>STOP</strong> to any message from StarCast.
              </li>
              <li>
                <strong>Customer Care:</strong> For help, reply <strong>HELP</strong> to any SMS message or contact us at{" "}
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] underline">
                  starcastlivemedia@gmail.com
                </a>.
              </li>
              <li>
                <strong>Carrier Disclaimers:</strong> Message and data rates may apply. Carriers are not liable for delayed or undelivered messages.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">4. Artist, Band &amp; Content Rights</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Ownership:</strong> Artists, musicians, and creators retain all copyright and proprietary rights to their original musical compositions, recordings, and media.
              </li>
              <li>
                <strong>Soundstage Broadcast License:</strong> By creating an artist page, uploading music links, or participating in StarCast Live broadcasts, you grant StarCast Media a non-exclusive, revocable license to feature, promote, and broadcast your performance across StarCast platforms.
              </li>
              <li>
                <strong>Conduct:</strong> You agree not to upload defamatory, infringing, unlawful, or abusive content to the StarCast community or soundstage discussion boards.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">5. Studio Bookings &amp; Passes</h2>
            <p>
              Rehearsal studio bookings, recording slots, and monthly soundstage passes are subject to scheduling availability and house rules established by StarCast Studio management in Topeka, Kansas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">6. Disclaimers &amp; Limitation of Liability</h2>
            <p>
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied. In no event shall StarCast Media, its founders, directors, or employees be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff]">8. Contact &amp; Legal Notices</h2>
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
