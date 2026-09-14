import { Suspense } from "react"
import type { Metadata } from "next"
import { getWatchVideos } from "@/lib/youtube"
import { WatchClient } from "./watch-client"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"

export const revalidate = 1800 // Revalidate every 30 minutes

export const metadata: Metadata = {
  title: "Watch Shows & Live Broadcasts | StarCast Online | Starcast Media Topeka",
  description:
    "Stream uncut original shows, interviews, and soundstage music performances from StarCast Media (@starcastlivemedia). Featuring The Observation Deck, The Psyco G Spot, Star Talk, Talkin' With 40, and Hollywood: After Babylon.",
  openGraph: {
    title: "Watch StarCast Online | Shows, Podcasts & Live Media",
    description:
      "Netflix-style broadcast portal pulling shows directly from @starcastlivemedia. Stream The Observation Deck, Psyco G Spot, Star Talk, and live music sessions.",
    url: "https://starcast.online/watch",
    siteName: "StarCast Online",
    images: [
      {
        url: "https://starcast.online/images/spacemanlogo.png",
        width: 1200,
        height: 630,
        alt: "StarCast Online Watch Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Watch Shows & Live Streams | StarCast Online",
    description:
      "Stream uncut podcasts, interviews, and soundstage music performances directly from @starcastlivemedia on StarCast Online.",
    images: ["https://starcast.online/images/spacemanlogo.png"],
  },
}

export default async function WatchPage() {
  const videos = await getWatchVideos()

  return (
    <div className="min-h-screen bg-[#05051a] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader />
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#05051a]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#ea6f2a] animate-spin" />
                <p className="text-sm font-mono text-[#20efe0] animate-pulse">
                  Connecting to StarCast Broadcast Stream...
                </p>
              </div>
            </div>
          }
        >
          <WatchClient initialVideos={videos} />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
