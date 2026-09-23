import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Trash2, ShieldAlert, ArrowLeft, CheckCircle2, FileText, Lock, Globe } from "lucide-react"
import { DeleteAccountForm } from "./delete-form"

export const metadata: Metadata = {
  title: "Delete Account & Data | StarCast Online",
  description:
    "Request permanent deletion of your StarCast account, personal data, authentication tokens, and profile information.",
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
          <p className="text-sm text-[#9a9fc4] leading-relaxed">
            In compliance with Google Play Store Developer Policies and privacy standards, StarCast users can request permanent deletion of their account and all associated personal data at any time via the form below or through our mobile application.
          </p>
        </header>

        {/* Form and Details */}
        <div className="space-y-8">
          {/* Interactive Web Form */}
          <DeleteAccountForm />

          {/* Policy & Data Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 space-y-2">
              <h2 className="text-sm font-bold text-[#f5f7ff] flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Data That Will Be Deleted:
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#9a9fc4]">
                <li>User profile, name, avatar, email, and bio.</li>
                <li>Saved articles, watchlists, and stream bookmarks.</li>
                <li>Session tokens and active device logins.</li>
                <li>Community discussion posts, comments, and replies.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 space-y-2">
              <h2 className="text-sm font-bold text-[#f5f7ff] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ffd166]" />
                Data Retention Policy:
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#9a9fc4]">
                <li>Account records are immediately deleted upon request.</li>
                <li>Transaction receipts for ticket purchases are retained solely where required for tax and financial auditing laws.</li>
                <li>No marketing data or tracking profiles are retained.</li>
              </ul>
            </div>
          </div>

          {/* Alternative Methods */}
          <div className="p-6 rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 space-y-3">
            <h2 className="text-sm font-bold text-[#f5f7ff] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#20efe0]" />
              Alternative Ways to Delete Your Account:
            </h2>
            <div className="space-y-2 text-xs text-[#9a9fc4]">
              <p>
                <strong>Inside the Mobile App:</strong> Go to <strong>Profile</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Delete Account &amp; Data</strong>.
              </p>
              <p>
                <strong>Via Direct Email:</strong> Email{" "}
                <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] underline font-medium">
                  starcastlivemedia@gmail.com
                </a>{" "}
                from your registered email address with the subject <code>Account Deletion Request</code>.
              </p>
            </div>
          </div>

          {/* SLA & Timeframe Banner */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex items-start gap-3 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Automated requests submitted on this page are processed immediately. Any manual requests submitted by email are verified and completed within <strong>24 to 48 hours</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
