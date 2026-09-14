import Link from "next/link"
import Image from "next/image"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ShowSpotlightCard } from "@/components/show-spotlight-card"
import { getPlaylistVideos } from "@/lib/youtube"
import { listPublicBands } from "@/app/actions/band-pages"
import { listArticles } from "@/app/actions/articles"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Youtube,
  Tv,
  Music,
  FileText,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  Mic2,
  Video,
  ExternalLink,
  Flame,
  Radio,
  Share2,
} from "lucide-react"

const CHANNEL_URL = "https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`

const shows = [
  {
    id: "theobservationdeck",
    title: "The Observation Deck",
    genre: "Talk Show",
    playlistId: "PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp",
    color: "#ea6f2a",
    description: "StarCast flagship talk show featuring live interviews, cultural commentary, and community leaders.",
  },
  {
    id: "hollywood-after-babylon",
    title: "Hollywood After Babylon",
    genre: "Documentary",
    playlistId: "PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB",
    color: "#22b573",
    description: "Deep dive documentary journalism uncovering forgotten cinema history, media scandals, and lore.",
  },
  {
    id: "star-talk",
    title: "Star Talk",
    genre: "Interviews",
    playlistId: "PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM",
    color: "#20efe0",
    description: "One-on-one spotlight conversations with artists, musicians, athletes, and Midwest innovators.",
  },
  {
    id: "psyco-g-spot",
    title: "StarCast Presents: The Psyco G Spot",
    genre: "Commentary",
    playlistId: "PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci",
    color: "#f4a53c",
    description: "Unfiltered pop culture critique, underground sounds, and spontaneous creative debate.",
  },
]

// Fallback editorial categories when database has few articles
const EDITORIAL_TOPICS = [
  {
    title: "Topeka High School Sports Central",
    category: "Sports",
    tagColor: "#ea6f2a",
    snippet: "Live coverage, game schedules, player spotlights, and tournament recaps across Shawnee County.",
    icon: Flame,
  },
  {
    title: "Midwest Independent Music Scene",
    category: "Culture",
    tagColor: "#20efe0",
    snippet: "Soundstage profiles, album releases, festival announcements, and studio recording diaries.",
    icon: Music,
  },
  {
    title: "Broadcasting & Digital Production",
    category: "Media",
    tagColor: "#22b573",
    snippet: "Behind the curtain of 4K multi-cam production, live streaming tech, and community storytelling.",
    icon: Video,
  },
]

// Interactive community conversation topics on The DECK
const DECK_TOPICS = [
  {
    title: "The Observation Deck // Ep. 25 Reactions",
    author: "StarCast Crew",
    replies: 18,
    category: "Show Talk",
    snippet: "What was your favorite moment from this week's sit-down? Drop your thoughts for the next live Q&A.",
  },
  {
    title: "Local Kansas Bands You Need On Your Radar",
    author: "Soundstage Fan",
    replies: 34,
    category: "Bands & Music",
    snippet: "Shout out local acts gigging around Topeka, Lawrence, and Kansas City this upcoming weekend.",
  },
  {
    title: "Friday Night Lights: Upcoming Matchup Predictions",
    author: "Topeka Sports Desk",
    replies: 27,
    category: "Game Day",
    snippet: "Who's taking the rivalry trophy this week? Post your score predictions and key players to watch.",
  },
]

export default async function HomePage() {
  const [showsWithLatestVideo, publicBands, recentArticles] = await Promise.all([
    Promise.all(
      shows.map(async (show) => {
        const videos = await getPlaylistVideos(show.playlistId)
        return { ...show, video: videos[0] ?? null }
      }),
    ),
    listPublicBands().catch(() => []),
    listArticles().catch(() => []),
  ])

  // Featured bands (up to 3)
  const featuredBands = publicBands.slice(0, 3)

  return (
    <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f]">
      <div className="relative z-10">
        <ResponsiveHeader currentPage="/" />

        {/* ── MODULE 1: STARCAST HERO ── */}
        <section className="relative w-full overflow-hidden border-b border-[#20205a]/60">
          <Image
            src="/images/starcast-online-hero.png"
            alt="StarCast Online"
            fill
            priority
            className="object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05051f] via-[#05051f]/80 to-[#05052d]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05051f] via-transparent to-[#05051f]/80" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0284c7]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-xs font-mono font-bold tracking-widest uppercase mb-5 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea6f2a] animate-ping" />
              <span>STARCAST ONLINE // CENTRAL BROADCAST HUB</span>
            </div>

            <h1 className="font-black text-[#f5f7ff] leading-none tracking-tight text-left">
              <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
                STARCAST
              </span>
              <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] bg-clip-text text-transparent font-black drop-shadow-xl">
                ONLINE
              </span>
            </h1>

            <p className="text-[#d4d8ee] text-base md:text-xl max-w-2xl mt-5 leading-relaxed">
              Every show, live soundstage, local article, and community discussion from Topeka&apos;s premier independent media network.
            </p>

            {/* Quick-Jump Section Pills */}
            <div className="flex items-center gap-2.5 mt-8 flex-wrap">
              <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-full shadow-lg shadow-[#ea6f2a]/25 px-5">
                <Link href="/watch">
                  <Tv className="w-4 h-4 mr-2" /> Watch Shows
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#0c0c3f]/70 hover:bg-[#20efe0]/15 hover:text-white rounded-full">
                <Link href="/bands">
                  <Music className="w-4 h-4 mr-2" /> Soundstage Bands
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/50 hover:bg-white/10 rounded-full">
                <Link href="/community">
                  <MessageCircle className="w-4 h-4 mr-2 text-[#ea6f2a]" /> The DECK
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/50 hover:bg-white/10 rounded-full">
                <Link href="/articles">
                  <FileText className="w-4 h-4 mr-2 text-[#22b573]" /> Articles
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative h-1 w-full bg-gradient-to-r from-[#ea6f2a] via-[#22b573] to-[#20efe0]" />
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">

          {/* ── MODULE 2: WATCH & SHOWS PLATFORM ── */}
          <section id="shows">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#ea6f2a] text-xs font-mono font-bold tracking-widest uppercase mb-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>ORIGINAL BROADCASTS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                  Watch Series &amp; Shows
                </h2>
                <p className="text-sm text-[#9a9fc4] mt-1">
                  Catch the latest uploads, full episodes, and behind-the-scenes cuts right on StarCast.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-[#ea6f2a]/40 bg-[#ea6f2a]/10 text-[#f5f7ff] hover:bg-[#ea6f2a] hover:text-white rounded-xl">
                  <Link href="/watch">
                    Full Watch Experience <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            <div className="mt-8 p-4 rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f5f7ff]">StarCast Live Media on YouTube</p>
                  <p className="text-xs text-[#9a9fc4]">Subscribe to @StarCastLiveMedia for live stream alerts and shorts.</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-white/20 text-[#f5f7ff] hover:bg-white/10 shrink-0">
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Visit YouTube Channel <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            </div>
          </section>

          {/* ── MODULE 3: SOUNDSTAGE BANDS & ARTISTS ── */}
          <section id="bands">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#20efe0] text-xs font-mono font-bold tracking-widest uppercase mb-1">
                  <Music className="w-3.5 h-3.5" />
                  <span>STARCAST SOUNDSTAGE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                  Featured Bands &amp; Artists
                </h2>
                <p className="text-sm text-[#9a9fc4] mt-1">
                  Discover regional Kansas musicians and bands performing on the StarCast Soundstage.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 hover:text-white rounded-xl">
                  <Link href="/bands">
                    All Bands &amp; Artists <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBands.length > 0 ? (
                featuredBands.map((band) => (
                  <Link
                    key={band.id}
                    href={`/bands/${band.slug}`}
                    className="group rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 overflow-hidden flex flex-col justify-between hover:border-[#ea6f2a]/60 transition-all hover:shadow-[0_0_30px_rgba(234,111,42,0.15)]"
                  >
                    <div className="relative w-full h-32 bg-[#05052d] overflow-hidden">
                      {band.banner_url ? (
                        <img
                          src={band.banner_url}
                          alt={`${band.name} banner`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#ea6f2a]/25 via-[#10104a] to-[#20efe0]/25" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] via-[#0c0c3f]/40 to-transparent pointer-events-none" />
                    </div>
                    <div className="p-5 pt-0 relative z-10 flex-1 flex flex-col justify-between -mt-8">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          {band.logo_url ? (
                            <img
                              src={band.logo_url}
                              alt={band.name}
                              className="w-14 h-14 rounded-xl object-cover border-2 border-[#0c0c3f] bg-[#05052d] shadow-lg shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl border-2 border-[#0c0c3f] bg-[#05052d] flex items-center justify-center text-[#ea6f2a] shadow-lg shrink-0">
                              <Music className="w-7 h-7" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-7">
                            <h3 className="font-bold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors truncate">
                              {band.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30 text-[10px] py-0 px-1.5">
                                {band.type === "artist" ? "Artist" : "Band"}
                              </Badge>
                              {band.genre && (
                                <Badge variant="outline" className="border-[#20205a] text-[#9a9fc4] text-[10px] py-0 px-1.5">
                                  {band.genre}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {band.bio && (
                          <p className="text-xs text-[#9a9fc4] line-clamp-2 leading-relaxed mt-2">
                            {band.bio}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#20205a]/50 flex items-center justify-between text-xs text-[#9a9fc4]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {band.follower_count} followers
                        </span>
                        <span className="text-[#ea6f2a] font-medium group-hover:translate-x-0.5 transition-transform">
                          View Soundstage &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-8 text-center">
                  <Music className="w-10 h-10 text-[#ea6f2a] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-[#f5f7ff]">StarCast Live Soundstage</h3>
                  <p className="text-sm text-[#9a9fc4] max-w-md mx-auto mt-1">
                    Bands and musicians can register their soundstage page, book recording time, and share tracks.
                  </p>
                  <Button asChild className="mt-4 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white">
                    <Link href="/bands">Explore Soundstage</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ── MODULE 4: ARTICLES & JOURNALISM ── */}
          <section id="articles">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#22b573] text-xs font-mono font-bold tracking-widest uppercase mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>STARCAST EDITORIAL</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                  Articles, News &amp; Culture
                </h2>
                <p className="text-sm text-[#9a9fc4] mt-1">
                  Independent reporting, sports breakdowns, and community voices from Topeka and the Midwest.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-[#22b573]/40 text-[#22b573] hover:bg-[#22b573]/15 hover:text-white rounded-xl">
                  <Link href="/articles">
                    Read All Articles <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentArticles.length > 0 ? (
                recentArticles.slice(0, 3).map((art: any) => (
                  <Link
                    key={art.id}
                    href={`/articles/${art.slug || art.id}`}
                    className="group rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-5 flex flex-col justify-between hover:border-[#22b573]/60 transition-all hover:shadow-[0_0_30px_rgba(34,181,115,0.15)]"
                  >
                    <div>
                      {art.category && (
                        <Badge className="bg-[#22b573]/15 text-[#22b573] border border-[#22b573]/30 text-xs mb-3">
                          {art.category}
                        </Badge>
                      )}
                      <h3 className="text-lg font-bold text-[#f5f7ff] group-hover:text-[#22b573] transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      {art.excerpt && (
                        <p className="text-sm text-[#9a9fc4] mt-2 line-clamp-3 leading-relaxed">
                          {art.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#20205a]/50 flex items-center justify-between text-xs text-[#9a9fc4]">
                      <span>{art.authorName || "StarCast Writer"}</span>
                      <span className="text-[#22b573] group-hover:translate-x-0.5 transition-transform font-medium">
                        Read story &rarr;
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                EDITORIAL_TOPICS.map((topic, idx) => {
                  const Icon = topic.icon
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-6 flex flex-col justify-between hover:border-[#22b573]/50 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#22b573]">
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge variant="outline" className="border-[#22b573]/40 text-[#22b573] bg-[#22b573]/10 text-xs">
                            {topic.category}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-[#f5f7ff] mt-2">
                          {topic.title}
                        </h3>
                        <p className="text-sm text-[#9a9fc4] mt-2 leading-relaxed">
                          {topic.snippet}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-[#20205a]/50">
                        <Link
                          href="/articles"
                          className="inline-flex items-center text-xs font-semibold text-[#22b573] hover:underline"
                        >
                          Explore stories <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* ── MODULE 5: THE DECK COMMUNITY ── */}
          <section id="community">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#ffd166] text-xs font-mono font-bold tracking-widest uppercase mb-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>COMMUNITY LOUNGE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                  The DECK Discussion Board
                </h2>
                <p className="text-sm text-[#9a9fc4] mt-1">
                  Connect live with creators, share game reactions, discover music, and join Topeka talk.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-[#ffd166]/40 text-[#ffd166] hover:bg-[#ffd166]/15 hover:text-white rounded-xl">
                  <Link href="/community">
                    Enter The DECK <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DECK_TOPICS.map((topic, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-5 flex flex-col justify-between hover:border-[#ffd166]/60 transition-all hover:shadow-[0_0_30px_rgba(255,209,102,0.12)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#9a9fc4] font-medium">{topic.author}</span>
                      <Badge variant="outline" className="border-[#ffd166]/30 text-[#ffd166] bg-[#ffd166]/10 text-[10px]">
                        {topic.category}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-[#f5f7ff] leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-[#9a9fc4] mt-2 leading-relaxed">
                      {topic.snippet}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#20205a]/50 flex items-center justify-between text-xs">
                    <span className="text-[#9a9fc4] flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-[#ffd166]" />
                      {topic.replies} posts
                    </span>
                    <Link href="/community" className="text-[#ffd166] font-semibold hover:underline">
                      Join thread &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── MODULE 6 & 7: STUDIO PRODUCTION + MERCH & SPONSORS MOSAIC ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Studio Facility Showcase */}
            <div className="lg:col-span-2 rounded-2xl border border-[#20205a]/60 bg-gradient-to-br from-[#0c0c3f]/80 via-[#0c0c3f]/60 to-[#1d2053]/40 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-[#ea6f2a] text-xs font-mono font-bold tracking-widest uppercase mb-2">
                  <Mic2 className="w-3.5 h-3.5" />
                  <span>STARCAST STUDIOS // TOPEKA, KS</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] tracking-tight">
                  Record &amp; Broadcast At StarCast
                </h3>
                <p className="text-sm text-[#9a9fc4] mt-2 leading-relaxed max-w-xl">
                  Equipped with multi-camera 4K broadcast switching, dedicated podcast booths, audio soundstage tracking, and live streaming dispatch. Whether you have an original show or need recording space, StarCast is your launchpad.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="p-3.5 rounded-xl bg-[#05052d]/80 border border-[#20205a]">
                    <Video className="w-5 h-5 text-[#20efe0] mb-2" />
                    <p className="text-xs font-bold text-[#f5f7ff]">Multi-Cam 4K Stage</p>
                    <p className="text-[11px] text-[#9a9fc4] mt-0.5">Switching, teleprompter, live graphics.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#05052d]/80 border border-[#20205a]">
                    <Mic2 className="w-5 h-5 text-[#ea6f2a] mb-2" />
                    <p className="text-xs font-bold text-[#f5f7ff]">Podcast Suites</p>
                    <p className="text-[11px] text-[#9a9fc4] mt-0.5">Professional Shure mics, acoustic dampening.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#05052d]/80 border border-[#20205a]">
                    <Music className="w-5 h-5 text-[#22b573] mb-2" />
                    <p className="text-xs font-bold text-[#f5f7ff]">Soundstage Tracking</p>
                    <p className="text-[11px] text-[#9a9fc4] mt-0.5">Live sessions, multitrack audio, artist video.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#20205a]/60 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-[#9a9fc4]">Ready to create your next episode or soundstage session?</span>
                <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold">
                  <Link href="/dashboard">Access Artist Portal</Link>
                </Button>
              </div>
            </div>

            {/* Merch & Supply Co. + Sponsorship */}
            <div className="space-y-6">
              {/* Merch Card */}
              <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/60 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <Badge variant="outline" className="border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10 text-[10px]">
                      Official Merch
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-[#f5f7ff]">StarCast Supply Co.</h4>
                  <p className="text-xs text-[#9a9fc4] mt-1.5 leading-relaxed">
                    Cop the official cosmic hoodies, snapback caps, mission patch tees, and stickers.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#20205a]/50">
                  <Button asChild size="sm" variant="outline" className="w-full border-[#ffd166]/40 text-[#ffd166] hover:bg-[#ffd166]/15 hover:text-white">
                    <a href="https://shop.starcast.online" target="_blank" rel="noopener noreferrer">
                      Visit Store <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Sponsor Callout */}
              <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/60 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0]">
                      <Radio className="w-4 h-4" />
                    </div>
                    <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-[10px]">
                      Partnerships
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-[#f5f7ff]">Advertise With StarCast</h4>
                  <p className="text-xs text-[#9a9fc4] mt-1.5 leading-relaxed">
                    Connect your brand with Kansas viewers through broadcast sponsorship, segment features, and web placement.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#20205a]/50">
                  <Button asChild size="sm" variant="outline" className="w-full border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 hover:text-white">
                    <Link href="/sponsors">
                      Sponsorship Opportunities <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

          </section>

        </div>

        <Footer />
      </div>
    </div>
  )
}
