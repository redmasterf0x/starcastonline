import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ShowSpotlightCard } from "@/components/show-spotlight-card"
import { HomeArticleFeed } from "@/components/home-article-feed"
import { getPlaylistVideos } from "@/lib/youtube"
import { listArticles } from "@/app/actions/articles"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Youtube } from "lucide-react"
import Image from "next/image"

const CHANNEL_URL = "https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"

const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`

// Accent rotation pulled straight from the Starcast mission-patch logo:
// burnt orange, emerald green, and the cyan orbit ring.
const shows = [
  {
    id: "theobservationdeck",
    title: "The Observation Deck",
    genre: "Talk Show",
    playlistId: "PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp",
    color: "#ea6f2a",
  },
  {
    id: "hollywood-after-babylon",
    title: "Hollywood After Babylon",
    genre: "Documentary",
    playlistId: "PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB",
    color: "#22b573",
  },
  {
    id: "star-talk",
    title: "Star Talk",
    genre: "Interviews",
    playlistId: "PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM",
    color: "#20efe0",
  },
  {
    id: "psyco-g-spot",
    title: "StarCast Presents: The Psyco G Spot",
    genre: "Commentary",
    playlistId: "PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci",
    color: "#f4a53c",
  },
]

export default async function HomePage() {
  const [showsWithLatestVideo, session] = await Promise.all([
    Promise.all(
      shows.map(async (show) => {
        const videos = await getPlaylistVideos(show.playlistId)
        return { ...show, video: videos[0] ?? null }
      }),
    ),
    auth.api.getSession({ headers: await headers() }),
  ])

  const isSignedIn = Boolean(session?.user)
  const recentArticles = isSignedIn ? (await listArticles()).slice(0, 6) : []

  return (
    <div className="public-shell">

      <div className="relative z-10">
        <ResponsiveHeader currentPage="/" />

      {isSignedIn ? (
        <HomeArticleFeed articles={recentArticles} />
      ) : (
        <>
          {/* STARCAST ONLINE — branded hero */}
          <section className="relative w-full overflow-hidden">
            {/* Graphic background */}
            <Image
              src="/images/starcast-online-hero.png"
              alt=""
              fill
              priority
              className="object-cover object-center"
            />
            {/* Overlays for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05052d] via-[#05052d]/70 to-[#05052d]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05052d]/80 via-transparent to-[#05052d]/80" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-28 text-left flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0284c7]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-xs font-mono font-bold tracking-widest uppercase mb-5 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-pulse" />
                STARCAST ONLINE // BETA BROADCAST
              </div>

              <h1 className="font-black text-[#f5f7ff] leading-none tracking-tight text-left">
                <span className="block text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black drop-shadow-2xl">
                  STARCAST
                </span>
                <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl mt-3 bg-gradient-to-r from-[#ea6f2a] via-[#f2a04a] to-[#20efe0] bg-clip-text text-transparent font-black drop-shadow-xl">
                  ONLINE
                </span>
              </h1>

              <p className="text-[#d4d8ee] text-base md:text-xl max-w-2xl mt-6 text-left leading-relaxed">
                Every Starcast Media show in one place. Watch the latest upload from each series right here.
              </p>
            </div>

            {/* Signal bar — echoes the orbit ring on the mission patch */}
            <div className="relative h-1 w-full bg-gradient-to-r from-[#ea6f2a] via-[#22b573] to-[#20efe0]" />
          </section>
        </>
      )}

      <main id="shows" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {showsWithLatestVideo.map((show) => (
            <ShowSpotlightCard
              key={show.id}
              title={show.title}
              genre={show.genre}
              color={show.color}
              showPageHref={`/shows/${show.id}`}
              playlistUrl={playlistUrl(show.playlistId)}
              video={show.video}
            />
          ))}
        </div>

        <div className="pt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-[#9a9fc4] text-sm">Want to browse every episode?</p>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#f5f7ff] font-semibold px-6 py-3 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
          >
            <Youtube className="w-5 h-5" />
            Visit the full channel
          </a>
        </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
