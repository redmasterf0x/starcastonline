import Link from "next/link"
import Image from "next/image"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ShowSpotlightCard } from "@/components/show-spotlight-card"
import { getPlaylistVideos } from "@/lib/youtube"
import { listPublicBands } from "@/app/actions/band-pages"
import { listArticles } from "@/app/actions/articles"
import { listCommunityPosts, listDeckPosts } from "@/app/actions/community"
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
  Mic2,
  Video,
  ExternalLink,
  Radio,
  Clock,
  Flame,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

export default async function HomePage() {
  const [showsWithLatestVideo, publicBands, recentArticles, deckData, communityPosts] = await Promise.all([
    Promise.all(
      shows.map(async (show) => {
        const videos = await getPlaylistVideos(show.playlistId)
        return { ...show, video: videos[0] ?? null }
      }),
    ),
    listPublicBands().catch(() => []),
    listArticles().catch(() => []),
    listDeckPosts().catch(() => ({ posts: [] })),
    listCommunityPosts().catch(() => []),
  ])

  // Featured bands (up to 3)
  const featuredBands = publicBands.slice(0, 3)

  // Articles breakdown: Premier story + secondary stories
  const latestArticle = recentArticles[0] ?? null
  const secondaryArticles = recentArticles.slice(1, 4)

  // Real community discussions aggregated from DECK + forum (deduplicated by ID)
  const discussionMap = new Map<string, any>()

  for (const p of (deckData?.posts || [])) {
    if (p?.id && !discussionMap.has(p.id)) {
      discussionMap.set(p.id, {
        id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
        snippet: p.content,
        author: p.employee ? `${p.employee.first_name} ${p.employee.last_name || ""}`.trim() : "Community Member",
        replies: p.comments?.length || 0,
        category: "The DECK",
        created_at: p.created_at,
        href: "/community?tab=deck",
      })
    }
  }

  for (const p of (communityPosts || [])) {
    if (p?.id && !discussionMap.has(p.id)) {
      discussionMap.set(p.id, {
        id: p.id,
        title: p.title || p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
        snippet: p.content,
        author: p.employee ? `${p.employee.first_name} ${p.employee.last_name || ""}`.trim() : "Community Member",
        replies: p.comments?.length || 0,
        category: p.category ? p.category.toUpperCase() : "Discussion",
        created_at: p.created_at,
        href: "/community?tab=feed",
      })
    }
  }

  const allDiscussions = Array.from(discussionMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const recentDiscussions = allDiscussions.slice(0, 3)

  return (
    <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f]">
      <div className="relative z-10">
        <ResponsiveHeader currentPage="/" />

        {/* ── TOP SECTION: LATEST ARTICLE & EDITORIAL SPOTLIGHT ── */}
        <section className="relative w-full border-b border-[#20205a]/60 bg-gradient-to-b from-[#080829] via-[#05051f] to-[#05051f] pt-4 sm:pt-6 pb-10 sm:pb-12">
          {/* Subtle cosmic ambient glow */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 left-10 w-[400px] h-[300px] bg-[#22b573]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* Quick-Nav Broadcast Bar */}
            <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-[#20205a]/40 flex-wrap">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold tracking-wider text-[#ffd166]">
                <Flame className="w-4 h-4 text-[#ea6f2a] animate-pulse shrink-0" />
                <span className="uppercase text-[#f5f7ff]">STARCAST LATEST // TOP STORY</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
                <Link
                  href="/articles"
                  className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#22b573]/20 border border-[#20205a] hover:border-[#22b573]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#22b573]" /> All Articles
                </Link>
                <Link
                  href="/watch"
                  className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#ea6f2a]/20 border border-[#20205a] hover:border-[#ea6f2a]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-[#ea6f2a]" /> Shows
                </Link>
                <Link
                  href="/bands"
                  className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#20efe0]/20 border border-[#20205a] hover:border-[#20efe0]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
                >
                  <Music className="w-3.5 h-3.5 text-[#20efe0]" /> Soundstage
                </Link>
                <Link
                  href="/community"
                  className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#ffd166]/20 border border-[#20205a] hover:border-[#ffd166]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#ffd166]" /> The DECK
                </Link>
              </div>
            </div>

            {/* PREMIER STORY HERO CARD */}
            {latestArticle ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                {/* Main Headline Hero (Left / 7 cols) */}
                <Link
                  href={`/articles/${latestArticle.slug || latestArticle.id}`}
                  className="lg:col-span-7 group rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/85 hover:border-[#22b573] transition-all duration-300 overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(34,181,115,0.22)] flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] bg-[#05052d] overflow-hidden">
                    {latestArticle.thumbnailUrl || (latestArticle.images as any[])?.[0]?.url ? (
                      <img
                        src={latestArticle.thumbnailUrl || (latestArticle.images as any[])?.[0]?.url}
                        alt={latestArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#050528] via-[#0d0d38] to-[#121448] flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#22b573_1px,transparent_1px)] opacity-20 [background-size:20px_20px]" />
                        <FileText className="w-16 h-16 text-[#22b573]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] via-[#0c0c3f]/40 to-transparent pointer-events-none" />
                    
                    {/* Badge on cover */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Badge className="bg-[#22b573] text-black font-black uppercase tracking-wider text-xs px-3 py-1 shadow-lg">
                        LATEST STORY
                      </Badge>
                      {latestArticle.tags?.[0] && (
                        <Badge variant="outline" className="bg-[#05051f]/80 backdrop-blur-md border-white/20 text-[#f5f7ff] text-xs px-2.5 py-1">
                          {latestArticle.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-[#9a9fc4] mb-3">
                        <span className="font-semibold text-[#22b573]">
                          {latestArticle.authorFirstName
                            ? `${latestArticle.authorFirstName} ${latestArticle.authorLastName || ""}`.trim()
                            : "StarCast Editorial"}
                        </span>
                        <span>•</span>
                        {latestArticle.createdAt && (
                          <span className="flex items-center gap-1 text-[#cbd0f2]">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(latestArticle.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#f5f7ff] group-hover:text-[#22b573] transition-colors leading-tight">
                        {latestArticle.title}
                      </h2>

                      {latestArticle.subtitle && (
                        <p className="text-base sm:text-lg font-medium text-[#ffd166] mt-2 line-clamp-2">
                          {latestArticle.subtitle}
                        </p>
                      )}

                      {latestArticle.excerpt && (
                        <p className="text-sm sm:text-base text-[#dbe0fb] mt-3 line-clamp-3 leading-relaxed">
                          {latestArticle.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#20205a]/60 flex items-center justify-between text-sm font-bold">
                      <span className="text-[#22b573] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                        Read Full Story <ArrowRight className="w-4 h-4" />
                      </span>
                      <span className="text-xs text-[#9a9fc4] font-mono">
                        STARCAST EDITORIAL
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Secondary Stories / Dispatch Column (Right / 5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-[#9a9fc4] uppercase">
                      Recent Dispatches
                    </span>
                    <Link
                      href="/articles"
                      className="text-xs text-[#22b573] hover:text-[#ffd166] transition-colors font-semibold flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {secondaryArticles.length > 0 ? (
                    secondaryArticles.map((art: any) => (
                      <Link
                        key={art.id}
                        href={`/articles/${art.slug || art.id}`}
                        className="group flex-1 rounded-2xl border border-[#20205a]/70 bg-[#0c0c3f]/60 hover:bg-[#0c0c3f]/90 hover:border-[#22b573]/60 p-4 sm:p-5 transition-all duration-200 flex gap-4 items-start shadow-md hover:shadow-lg"
                      >
                        {art.thumbnailUrl || (art.images as any[])?.[0]?.url ? (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#05052d] border border-[#20205a]">
                            <img
                              src={art.thumbnailUrl || (art.images as any[])?.[0]?.url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#05052d] border border-[#20205a] flex items-center justify-center shrink-0 text-[#22b573]">
                            <FileText className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[#9a9fc4] mb-1">
                            <span className="font-semibold text-[#22b573]">
                              {art.authorFirstName
                                ? `${art.authorFirstName} ${art.authorLastName || ""}`.trim()
                                : "StarCast"}
                            </span>
                            {art.createdAt && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {formatDistanceToNow(new Date(art.createdAt), { addSuffix: true })}
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#f5f7ff] group-hover:text-[#22b573] transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h3>

                          {art.excerpt && (
                            <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1.5 line-clamp-2 leading-relaxed">
                              {art.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-6 text-center text-xs text-[#9a9fc4]">
                      <FileText className="w-8 h-8 text-[#22b573] mx-auto mb-2 opacity-60" />
                      More editorial stories coming soon!
                    </div>
                  )}

                  {/* Quick Band / Show Callout Card */}
                  <div className="rounded-2xl border border-[#ea6f2a]/40 bg-gradient-to-r from-[#ea6f2a]/15 via-[#0c0c3f]/80 to-[#20efe0]/15 p-4 flex items-center justify-between gap-3 mt-auto">
                    <div>
                      <p className="text-xs font-bold text-[#ffd166] uppercase tracking-wider font-mono">
                        Soundstage Submissions
                      </p>
                      <p className="text-xs text-[#e8ecff] mt-0.5">
                        Are you a band or musical artist in Kansas?
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white text-xs font-bold shrink-0 rounded-lg">
                      <Link href="/bands">Join Soundstage</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback if no articles exist yet */
              <div className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/80 p-8 sm:p-12 text-center">
                <FileText className="w-12 h-12 text-[#22b573] mx-auto mb-3" />
                <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7ff]">Welcome to StarCast Online</h2>
                <p className="text-sm sm:text-base text-[#cbd0f2] max-w-xl mx-auto mt-2">
                  Topeka&apos;s premier media network for original talk shows, regional musicians, and community discussions.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                  <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl px-6 h-11">
                    <Link href="/watch">
                      <Tv className="w-4 h-4 mr-2" /> Watch Series
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/20 rounded-xl px-6 h-11">
                    <Link href="/bands">
                      <Music className="w-4 h-4 mr-2" /> Explore Bands
                    </Link>
                  </Button>
                </div>
              </div>
            )}

          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-20">

          {/* ── MODULE 2: WATCH & SHOWS PLATFORM ── */}
          <section id="shows">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#20efe0] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-1.5">
                  <Radio className="w-4 h-4 animate-pulse text-[#ea6f2a]" />
                  <span>ORIGINAL BROADCASTS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f5f7ff] tracking-tight">
                  Watch Series &amp; Shows
                </h2>
                <p className="text-base sm:text-lg text-[#e8ecff] mt-2">
                  Catch the latest uploads, full episodes, and behind-the-scenes cuts right on StarCast.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" className="border-[#ea6f2a]/50 bg-[#ea6f2a]/10 text-[#f5f7ff] hover:bg-[#ea6f2a] hover:text-white rounded-xl h-11 px-5 text-sm sm:text-base font-semibold">
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

            <div className="mt-8 p-6 rounded-3xl border border-[#20205a]/80 bg-gradient-to-r from-[#0c0c3f]/80 via-[#05052d]/90 to-[#0c0c3f]/80 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-lg">
                  <Youtube className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">StarCast Live Media on YouTube</p>
                  <p className="text-sm text-[#e8ecff] mt-0.5">Subscribe to @StarCastLiveMedia for live stream alerts and shorts.</p>
                </div>
              </div>
              <Button asChild variant="outline" className="border-white/20 text-[#f5f7ff] hover:bg-white/10 shrink-0 h-11 px-5 text-sm font-semibold rounded-xl">
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Visit YouTube Channel <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </section>

          {/* ── MODULE 3: SOUNDSTAGE BANDS & ARTISTS ── */}
          <section id="bands">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#20efe0] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-1.5">
                  <Music className="w-4 h-4" />
                  <span>STARCAST SOUNDSTAGE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f5f7ff] tracking-tight">
                  Featured Bands &amp; Artists
                </h2>
                <p className="text-base sm:text-lg text-[#e8ecff] mt-2">
                  Discover regional Kansas musicians and bands performing on the StarCast Soundstage.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl h-11 px-5 text-sm sm:text-base font-semibold">
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
                    className="group rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 overflow-hidden flex flex-col justify-between hover:border-[#20efe0]/60 transition-all hover:shadow-[0_0_35px_rgba(32,239,224,0.18)]"
                  >
                    <div className="relative w-full h-36 sm:h-44 bg-[#05052d] overflow-hidden">
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
                    <div className="p-6 pt-0 relative z-10 flex-1 flex flex-col justify-between -mt-10">
                      <div>
                        <div className="flex items-start gap-3.5 mb-3.5">
                          {band.logo_url ? (
                            <img
                              src={band.logo_url}
                              alt={band.name}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0c0c3f] bg-[#05052d] shadow-xl shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl border-2 border-[#0c0c3f] bg-[#05052d] flex items-center justify-center text-[#ea6f2a] shadow-xl shrink-0">
                              <Music className="w-8 h-8" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-8">
                            <h3 className="text-xl sm:text-2xl font-black text-[#f5f7ff] group-hover:text-[#20efe0] transition-colors truncate">
                              {band.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 text-xs py-0.5 px-2">
                                {band.type === "artist" ? "Artist" : "Band"}
                              </Badge>
                              {band.genre && (
                                <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-xs py-0.5 px-2">
                                  {band.genre}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {band.bio && (
                          <p className="text-sm sm:text-base text-[#dbe0fb] line-clamp-2 leading-relaxed mt-3">
                            {band.bio}
                          </p>
                        )}
                      </div>
                      <div className="mt-5 pt-4 border-t border-[#20205a]/60 flex items-center justify-between text-sm text-[#cbd0f2]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-4 h-4 text-[#20efe0]" />
                          {band.follower_count} followers
                        </span>
                        <span className="text-[#ea6f2a] font-bold group-hover:text-[#ffd166] group-hover:translate-x-1 transition-all">
                          View Soundstage &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/50 p-10 text-center shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/20 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto mb-4 text-[#ea6f2a]">
                    <Music className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">StarCast Live Soundstage</h3>
                  <p className="text-base text-[#dbe0fb] max-w-md mx-auto mt-2 leading-relaxed">
                    Bands and musicians can register their soundstage page, book recording time, and share tracks.
                  </p>
                  <Button asChild className="mt-6 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-xl px-6 h-12 text-sm sm:text-base font-semibold">
                    <Link href="/bands">Explore Soundstage</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ── MODULE 4: THE DECK & COMMUNITY DISCUSSIONS ── */}
          <section id="community">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#ffd166] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>COMMUNITY LOUNGE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f5f7ff] tracking-tight">
                  The DECK Discussion Board
                </h2>
                <p className="text-base sm:text-lg text-[#e8ecff] mt-2">
                  Connect live with creators, share reactions, discover music, and join Topeka talk.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" className="border-[#ffd166]/50 text-[#ffd166] hover:bg-[#ffd166]/20 hover:text-white rounded-xl h-11 px-5 text-sm sm:text-base font-semibold">
                  <Link href="/community">
                    Enter The DECK <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentDiscussions.length > 0 ? (
                recentDiscussions.map((topic, i) => (
                  <Link
                    key={topic.id || i}
                    href={topic.href}
                    className="group rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 p-6 flex flex-col justify-between hover:border-[#ffd166]/70 transition-all hover:shadow-[0_0_35px_rgba(255,209,102,0.18)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-xs sm:text-sm text-[#20efe0] font-semibold">{topic.author}</span>
                        <Badge variant="outline" className="border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10 text-xs">
                          {topic.category}
                        </Badge>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#f5f7ff] group-hover:text-[#ffd166] transition-colors leading-snug">
                        {topic.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#e8ecff] mt-3 leading-relaxed line-clamp-3">
                        {topic.snippet}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#20205a]/60 flex items-center justify-between text-sm">
                      <span className="text-[#cbd0f2] flex items-center gap-1.5 font-medium">
                        <MessageCircle className="w-4 h-4 text-[#ffd166]" />
                        {topic.replies} {topic.replies === 1 ? "post" : "posts"}
                      </span>
                      <span className="text-[#ffd166] font-bold group-hover:translate-x-1 transition-all">
                        Join thread &rarr;
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/70 to-[#070725]/90 p-8 sm:p-12 text-center shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center mx-auto mb-4 text-[#ffd166] shadow-[0_0_25px_rgba(255,209,102,0.2)]">
                    <MessageCircle className="w-8 h-8 text-[#ffd166]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">
                    There are none for now
                  </h3>
                  <p className="text-sm sm:text-base text-[#e8ecff] max-w-lg mx-auto mt-2 leading-relaxed">
                    Be the first to spark a conversation on The DECK or start a community thread.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                    <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl px-6 h-12 text-sm sm:text-base shadow-lg shadow-[#ea6f2a]/25">
                      <Link href="/community">
                        <MessageCircle className="w-4 h-4 mr-2" /> Start A Conversation
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── MODULE 5 & 6: STUDIO PRODUCTION + MERCH & SPONSORS MOSAIC ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Studio Facility Showcase (Enlarged Mobile Layout) */}
            <div className="lg:col-span-2 rounded-3xl border border-[#20205a]/70 bg-gradient-to-br from-[#0c0c3f]/90 via-[#0c0c3f]/70 to-[#1d2053]/50 p-6 sm:p-10 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center gap-2 text-[#ea6f2a] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-2.5">
                  <Mic2 className="w-4 h-4" />
                  <span>STARCAST STUDIOS // TOPEKA, KS</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                  Record &amp; Broadcast At StarCast
                </h3>
                <p className="text-base sm:text-lg text-[#dbe0fb] mt-3 leading-relaxed max-w-2xl">
                  Equipped with multi-camera 4K broadcast switching, dedicated podcast booths, audio soundstage tracking, and live streaming dispatch. Whether you have an original show or need recording space, StarCast is your launchpad.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#05052d]/90 border border-[#20205a]">
                    <Video className="w-6 h-6 text-[#20efe0] mb-2.5" />
                    <p className="text-sm sm:text-base font-bold text-[#f5f7ff]">Multi-Cam 4K Stage</p>
                    <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1">Switching, teleprompter, live graphics.</p>
                  </div>
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#05052d]/90 border border-[#20205a]">
                    <Mic2 className="w-6 h-6 text-[#ea6f2a] mb-2.5" />
                    <p className="text-sm sm:text-base font-bold text-[#f5f7ff]">Podcast Suites</p>
                    <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1">Professional Shure mics, acoustic dampening.</p>
                  </div>
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#05052d]/90 border border-[#20205a]">
                    <Music className="w-6 h-6 text-[#22b573] mb-2.5" />
                    <p className="text-sm sm:text-base font-bold text-[#f5f7ff]">Soundstage Tracking</p>
                    <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1">Live sessions, multitrack audio, artist video.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#20205a]/70 flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm sm:text-base text-[#dbe0fb]">Ready to create your next episode or soundstage session?</span>
                <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl px-6 h-12 text-sm sm:text-base shadow-lg shadow-[#ea6f2a]/25">
                  <Link href="/dashboard">Access Artist Portal</Link>
                </Button>
              </div>
            </div>

            {/* Merch & Supply Co. + Sponsorship */}
            <div className="space-y-6">
              {/* Merch Card */}
              <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10 text-xs py-0.5 px-2">
                      Official Merch
                    </Badge>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">StarCast Supply Co.</h4>
                  <p className="text-sm sm:text-base text-[#dbe0fb] mt-2.5 leading-relaxed">
                    Cop the official cosmic hoodies, snapback caps, mission patch tees, and stickers.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#20205a]/60">
                  <Button asChild className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl h-12 text-sm sm:text-base shadow-md shadow-[#ea6f2a]/20">
                    <Link href="/merch">
                      Shop Official Merch <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Sponsor Callout */}
              <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/70 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0]">
                      <Radio className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-xs py-0.5 px-2">
                      Partnerships
                    </Badge>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">Advertise With StarCast</h4>
                  <p className="text-sm sm:text-base text-[#dbe0fb] mt-2.5 leading-relaxed">
                    Connect your brand with Kansas viewers through broadcast sponsorship, segment features, and web placement.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#20205a]/60">
                  <Button asChild variant="outline" className="w-full border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl h-12 text-sm sm:text-base font-semibold">
                    <Link href="/sponsors">
                      Sponsorship Opportunities <ArrowRight className="w-4 h-4 ml-1.5" />
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
