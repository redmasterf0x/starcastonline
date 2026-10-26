import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ObservationDeckQuiz } from "@/components/quiz/observation-deck-quiz"
import { Button } from "@/components/ui/button"
import { Tv, Music, MessageCircle, ArrowLeft, Sparkles, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "StarCast Trivia Quiz | How Well Do You Know StarCast?",
  description:
    "Test your knowledge on The Observation Deck, Hollywood: After Babylon, Star Talk, show hosts, episode guests, and Midwest soundstages. Earn cosmic ranks and share your score to The DECK.",
  alternates: {
    canonical: "https://starcast.online/quiz",
  },
}

export default function QuizPage() {
  return (
    <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f]">
      <div className="relative z-10 flex flex-col min-h-screen">
        <ResponsiveHeader currentPage="/quiz" />

        {/* Ambient Cosmic Glows */}
        <div className="absolute top-20 right-1/4 w-[500px] h-[350px] bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-10 w-[450px] h-[350px] bg-[#20efe0]/10 rounded-full blur-3xl pointer-events-none" />

        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
          {/* Breadcrumb / Back link */}
          <div className="mb-6">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#0c0c3f] -ml-2 text-xs sm:text-sm font-semibold rounded-xl"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to StarCast Home
              </Link>
            </Button>
          </div>

          {/* Dedicated Quiz Component */}
          <div className="w-full">
            <ObservationDeckQuiz />
          </div>

          {/* Bottom Explore Links */}
          <div className="mt-10 p-6 rounded-3xl border border-[#20205a]/60 bg-[#0c0c3f]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#f5f7ff]">Looking to prep before your next attempt?</p>
              <p className="text-xs text-[#cbd0f2] mt-0.5">Stream the latest shows and catch soundstage live cuts.</p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button asChild variant="outline" size="sm" className="border-[#ea6f2a]/40 text-[#ea6f2a] hover:bg-[#ea6f2a]/20 rounded-xl text-xs font-semibold">
                <Link href="/watch">
                  <Tv className="w-3.5 h-3.5 mr-1.5" /> Watch Shows
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/20 rounded-xl text-xs font-semibold">
                <Link href="/community">
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Visit The DECK
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
