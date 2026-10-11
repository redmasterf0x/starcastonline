import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ArrowLeft, ShieldCheck, FileText, Music2 } from "lucide-react"
import { MusicAgreementClient } from "./agreement-client"

export const metadata: Metadata = {
  title: "Music Distribution, Copyright & Artist Rights Agreement | StarCast Online",
  description:
    "Official StarCast Music Agreement: Artists retain 100% master and publishing copyright ownership. Free ad-free streaming, strict anti-theft and anti-sampling protections, and digital chain of custody certificates.",
  openGraph: {
    title: "StarCast Music Distribution & Artist Rights Agreement",
    description:
      "Artists retain 100% master rights. Ad-free streaming, strict copyright protections against unauthorized sampling or recording over tracks, and verifiable proof of upload records.",
    url: "https://starcast.online/music/agreement",
    siteName: "StarCast Online",
  },
}

export default function MusicAgreementPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <div className="print:hidden">
        <ResponsiveHeader currentPage="/music" />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation Breadcrumb (Hidden in print) */}
        <div className="mb-6 print:hidden flex items-center justify-between">
          <Link
            href="/music"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ffd166] hover:text-[#ea6f2a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Music Hub
          </Link>

          <Link
            href="/terms"
            className="text-xs text-[#9a9fc4] hover:text-white transition-colors"
          >
            General Terms of Service &rarr;
          </Link>
        </div>

        <MusicAgreementClient />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
