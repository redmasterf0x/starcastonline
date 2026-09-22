import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Trash2, ShieldAlert, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Delete Account & Data | StarCast Online",
  description:
    "Request complete deletion of your StarCast account, personal data, and profile information.",
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/delete-account" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
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
        <header className="mb-8 pb-6 border-b border-[#20205a]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-mono uppercase mb-4">
            <Trash2 className="w-4 h-4" />
            Account &amp; Data Deletion Request
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight mb-3">
            Delete Your <span className="text-red-400">StarCast Account</span>
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            In compliance with Google Play and privacy guidelines, StarCast users can request permanent deletion of their account and all associated personal data at any time.
          </p>
        </header>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-[#c4c7da]">
          <div className="p-5 rounded-2xl border border-[#20205a] bg-[#0c0c3f]">
            <h2 className="text-base font-bold text-[#f5f7ff] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ffd166]" />
              What data will be deleted?
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#9a9fc4]">
              <li>Your user profile, name, avatar, bio, and contact email/phone number.</li>
              <li>Your community discussion posts, comments, and replies on The DECK.</li>
              <li>Your saved preferences, watchlist history, and session tokens.</li>
              <li>Authentication records and OAuth connections.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-[#20205a] bg-[#0c0c3f] space-y-4">
            <h2 className="text-base font-bold text-[#f5f7ff]">
              How to request account deletion:
            </h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ea6f2a]/20 text-[#ea6f2a] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-[#f5f7ff]">From within the StarCast Mobile App:</strong>
                  <p className="text-xs text-[#9a9fc4] mt-0.5">
                    Navigate to the <strong>Profile</strong> tab &rarr; scroll to the bottom &rarr; tap <strong>Delete Account &amp; Data</strong> &rarr; confirm deletion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#20efe0]/20 text-[#20efe0] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-[#f5f7ff]">By Email (Direct Request):</strong>
                  <p className="text-xs text-[#9a9fc4] mt-0.5">
                    Send an email from your registered email address to{" "}
                    <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] underline font-semibold">
                      starcastlivemedia@gmail.com
                    </a>{" "}
                    with the subject line: <code>Account Deletion Request</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs sm:text-sm flex items-start gap-3 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Account deletion requests submitted via email or within the app are processed within <strong>24 to 48 hours</strong>. Once processed, all personal data is permanently wiped from our active databases and servers.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
