import type { Metadata } from "next"
import Link from "next/link"
import { Ticket, Sparkles, ArrowLeft, Music } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Tickets — Coming Soon",
  description:
    "StarCast Online live event ticketing is coming soon. Stay tuned for upcoming Topeka & Midwest live shows, concerts, and passes.",
}

export default function TicketsComingSoonPage() {
  return (
    <div className="public-shell min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full rounded-3xl border border-[#20205a] bg-gradient-to-b from-[#0c0c3f]/95 to-[#05052d]/95 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-[#ea6f2a]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-[#20efe0]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#ffd166]/40 bg-[#ffd166]/10 text-[#ffd166] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Coming Soon
          </div>

          <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center mx-auto text-[#ea6f2a] shadow-lg shadow-[#ea6f2a]/15">
            <Ticket className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
              StarCast Tickets
            </h1>
            <p className="text-sm sm:text-base text-[#dbe0fb] leading-relaxed max-w-md mx-auto">
              Live event ticketing, artist passes, and QR door check-in are launching soon.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-11 px-6"
            >
              <Link href="/bands">
                <Music className="w-4 h-4 mr-2" />
                Explore Bands
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#20205a] bg-[#05052d]/70 text-[#f5f7ff] hover:bg-[#20205a]/50 rounded-xl h-11 px-6"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
