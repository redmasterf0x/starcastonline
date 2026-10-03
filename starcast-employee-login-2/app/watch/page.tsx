import { Suspense } from "react"
import type { Metadata } from "next"
import { getWatchVideos } from "@/lib/youtube"
import { WatchClient } from "./watch-client"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"

export const revalidate = 1800 // Revalidate every 30 minutes

export const metadata: Metadata = {
  title: "Watch Topeka Shows & Live Broadcasts | StarCast Media YouTube Network",
  description:
    "Stream uncut podcasts, interviews, and soundstage music performances directly from StarCast Media (@starcastlivemedia) — Topeka's premier YouTube media company and video broadcast studio. Featuring The Observation Deck, The Psyco G Spot, Star Talk, Talkin' With 40, and Hollywood: After Babylon.",
  keywords: [
    "youtube media company topeka",
    "watch starcast media",
    "topeka media company",
    "media company topeka",
    "local media company topeka",
    "topeka youtube broadcasts",
    "the observation deck topeka",
    "star talk topeka",
    "the psyco g spot",
    "talkin with 40",
    "hollywood after babylon",
    "live soundstage topeka",
    "topeka podcast studio",
    "streaming media topeka",
    "kansas live media",
  ],
  alternates: {
    canonical: "https://starcast.online/watch",
  },
  openGraph: {
    title: "Watch Shows & Live Broadcasts | StarCast Media YouTube Network",
    description:
      "Broadcast portal streaming directly from Topeka's premier media company @starcastlivemedia. Stream The Observation Deck, Psyco G Spot, Star Talk, and live soundstage sessions.",
    url: "https://starcast.online/watch",
    siteName: "StarCast Media | Topeka Media Company",
    images: [
      {
        url: "https://starcast.online/images/spacemanlogo.png",
        width: 1200,
        height: 630,
        alt: "StarCast Media Watch Platform - Topeka Media Company",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@starcastlivemedia",
    creator: "@starcastlivemedia",
    title: "Watch Shows & Live Streams | StarCast Media Topeka",
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
