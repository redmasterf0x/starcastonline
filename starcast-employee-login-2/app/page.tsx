import type { Metadata } from "next"
import Link from "next/link"
import { ShowsEpisodesModule, type ShowModuleData, type ShowEpisode } from "@/components/shows/shows-episodes-module"
import { CommunityHomeModule, type CommunityHomePost } from "@/components/community/community-home-module"
import { getPlaylistVideos, getWatchVideos, FALLBACK_WATCH_VIDEOS, type YouTubeVideo } from "@/lib/youtube"
import { listPublicBands } from "@/app/actions/band-pages"
import { listArticles } from "@/app/actions/articles"
import { listCommunityPosts, listDeckPosts } from "@/app/actions/community"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tv,
  Music,
  FileText,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  Users,
  Radio,
  Clock,
  Flame,
  ChevronRight,
  HelpCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const metadata: Metadata = {
  title: "StarCast Media | #1 Topeka Media Company & YouTube Broadcast Network",
  description:
    "StarCast Media is Topeka's premier local media company and YouTube broadcast network. Stream original podcasts, uncut shows, regional music spotlights, and discover local business advertising in Topeka, KS.",
  keywords: [
    "topeka media company",
    "media company topeka",
    "youtube media company topeka",
    "local media company topeka",
    "media company in topeka kansas",
    "topeka media production",
    "video production company topeka",
    "topeka broadcasting company",
    "podcast studio topeka",
    "topeka recording studio",
    "starcast media",
    "starcast online",
    "starcast live media",
    "@starcastlivemedia",
    "best media company in topeka",
    "kansas media company",
    "topeka studio",
    "independent media topeka",
  ],
  alternates: {
    canonical: "https://starcast.online",
  },
}

const CHANNEL_URL = "https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`

// Complete network show lineup derived from the official YouTube channel @starcastlivemedia
const SHOW_DEFINITIONS = [
  {
    id: "theobservationdeck",
    title: "The Observation Deck",
    genre: "Flagship Talk Show",
    host: "Dirty Dave",
    playlistId: "PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp",
    color: "#ea6f2a",
    description: "StarCast's premier talk broadcast featuring raw discussions, local creators, musicians, and Topeka news.",
    showPageHref: "/shows/theobservationdeck",
  },
  {
    id: "psyco-g-spot",
    title: "The Psyco G Spot",
    genre: "Culture & Debate",
    host: "Psyco G",
    playlistId: "PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci",
    color: "#f4a53c",
    description: "Unfiltered pop culture critique, underground scene debate, hot takes, and spontaneous creative debate.",
    showPageHref: "/shows/psyco-g-spot",
  },
  {
    id: "talkin-with-40",
    title: "Talkin' With 40",
    genre: "Interview Series",
    host: "40",
    playlistId: "",
    color: "#20efe0",
    description: "In-depth one-on-one sessions and stories from creators, figures, and leaders in the Midwest community.",
    showPageHref: "/watch?show=Talkin%27%20With%2040",
  },
  {
    id: "the-middle-show",
    title: "The Middle Show",
    genre: "Midwest Culture",
    host: "StarCast",
    playlistId: "",
    color: "#3b82f6",
    description: "Spotlighting Topeka's record shops, underground arts, vinyl culture, and community legends in Kansas.",
    showPageHref: "/watch?show=The%20Middle%20Show",
  },
  {
    id: "hollywood-after-babylon",
    title: "Hollywood: After Babylon",
    genre: "Documentary Series",
    host: "Nic Nassuet",
    playlistId: "PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB",
    color: "#22b573",
    description: "Deep dive documentary journalism uncovering forgotten cinema history, media scandals, and Hollywood lore.",
    showPageHref: "/shows/hollywood-after-babylon",
  },
  {
    id: "star-talk",
    title: "Star Talk",
    genre: "Spotlight Series",
    host: "Joe, Ray & Todd Price",
    playlistId: "PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM",
    color: "#a855f7",
    description: "One-on-one spotlight conversations with regional athletes, musicians, artists, and innovators.",
    showPageHref: "/shows/star-talk",
  },
  {
    id: "performances",
    title: "Live Studio Performances",
    genre: "Live Music Sessions",
    host: "StarCast Sessions",
    playlistId: "PLCpB--79-ESw",
    color: "#f43f5e",
    description: "Raw live musical sets, acoustic performances, and in-studio tracking sessions direct from Studio A.",
    showPageHref: "/watch?show=Performances",
  },
]

export default async function HomePage() {
  const [allWatchVideos, publicBands, recentArticles, deckData, communityPosts] = await Promise.all([
    getWatchVideos().catch(() => FALLBACK_WATCH_VIDEOS),
    listPublicBands().catch(() => []),
    listArticles().catch(() => []),
    listDeckPosts().catch(() => ({ posts: [] })),
    listCommunityPosts().catch(() => []),
  ])

  // Aggregate episodes for every show from real YouTube playlists + watch catalog
  const showsWithEpisodes: ShowModuleData[] = await Promise.all(
    SHOW_DEFINITIONS.map(async (def) => {
      const episodeMap = new Map<string, ShowEpisode>()

      // 1. Fetch playlist entries if available
      if (def.playlistId) {
        try {
          const playlistVideos = await getPlaylistVideos(def.playlistId)
          for (const pv of playlistVideos) {
            if (!episodeMap.has(pv.id)) {
              episodeMap.set(pv.id, {
                id: pv.id,
                title: pv.title,
                thumbnail: pv.thumbnail,
              })
            }
          }
        } catch {
          // Continue to catalog matching
        }
      }

      // 2. Keyword & show title matchers
      const searchTerms = [
        def.title.toLowerCase(),
        def.id.replace(/-/g, " ").toLowerCase(),
      ]
      if (def.id === "theobservationdeck") searchTerms.push("observation deck")
      if (def.id === "psyco-g-spot") searchTerms.push("psyco g", "the g spot")
      if (def.id === "talkin-with-40") searchTerms.push("talkin with 40", "talkin' with 40")
      if (def.id === "the-middle-show") searchTerms.push("middle show")
      if (def.id === "hollywood-after-babylon") searchTerms.push("hollywood", "babylon")
      if (def.id === "star-talk") searchTerms.push("star talk")
      if (def.id === "performances") searchTerms.push("kreepy", "tyler swain", "performance", "live")

      for (const v of allWatchVideos) {
        const isMatch =
          v.show.toLowerCase() === def.title.toLowerCase() ||
          searchTerms.some(
            (term) => v.show.toLowerCase().includes(term) || v.title.toLowerCase().includes(term)
          )

        if (isMatch) {
          if (!episodeMap.has(v.id)) {
            episodeMap.set(v.id, {
              id: v.id,
              title: v.title,
              duration: v.duration,
              views: v.views,
              timeAgo: v.timeAgo,
              thumbnail: v.thumbnail,
            })
          } else {
            const existing = episodeMap.get(v.id)!
            if (!existing.duration && v.duration) existing.duration = v.duration
            if (!existing.views && v.views) existing.views = v.views
            if (!existing.timeAgo && v.timeAgo) existing.timeAgo = v.timeAgo
          }
        }
      }

      return {
        id: def.id,
        title: def.title,
        genre: def.genre,
        host: def.host,
        color: def.color,
        description: def.description,
        playlistUrl: def.playlistId ? playlistUrl(def.playlistId) : undefined,
        showPageHref: def.showPageHref,
        episodes: Array.from(episodeMap.values()),
      }
    })
  )

  // Featured bands (up to 3)
  const featuredBands = publicBands.slice(0, 3)

  // Articles breakdown: Premier story + secondary stories
  const latestArticle = recentArticles[0] ?? null
  const secondaryArticles = recentArticles.slice(1, 4)

  // Real community discussions mapped for the right-hand community module
  const communityFeedPosts: CommunityHomePost[] = []

  for (const p of (deckData?.posts || [])) {
    if (p?.id) {
      const authorName = p.employee
        ? `${p.employee.first_name} ${p.employee.last_name || ""}`.trim()
        : "Community Member"
      communityFeedPosts.push({
        id: p.id,
        title: p.content.slice(0, 80),
        content: p.content,
        category: "THE DECK",
        authorName,
        authorUsername: p.employee?.username || null,
        authorAvatar: p.employee?.profile_pic || null,
        authorRole: p.employee?.role || (p.employee?.is_admin ? "admin" : p.employee?.is_employee ? "staff" : "user"),
        createdAt: p.created_at,
        replyCount: p.comments?.length || 0,
        starCount: p.star_count || 0,
        hasPoll: Boolean(p.poll),
        hasImage: Boolean(p.images && p.images.length > 0),
        href: "/community?tab=deck",
      })
    }
  }

  for (const p of (communityPosts || [])) {
    if (p?.id && !communityFeedPosts.some((cf) => cf.id === p.id)) {
      const authorName = p.employee
        ? `${p.employee.first_name} ${p.employee.last_name || ""}`.trim()
        : "Community Member"
      communityFeedPosts.push({
        id: p.id,
        title: p.title || p.content.slice(0, 80),
        content: p.content,
        category: p.category ? p.category.toUpperCase() : "DISCUSSION",
        authorName,
        authorUsername: p.employee?.username || null,
        authorAvatar: p.employee?.profile_pic || null,
        authorRole: p.employee?.role || (p.employee?.is_admin ? "admin" : p.employee?.is_employee ? "staff" : "user"),
        createdAt: p.created_at,
        replyCount: p.comments?.length || 0,
        starCount: p.star_count || (p.reactions?.total || 0),
        hasPoll: Boolean(p.poll),
        hasImage: Boolean(p.images && p.images.length > 0),
        href: `/community?post=${p.id}`,
      })
    }
  }

  // Sort newest first
  communityFeedPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-10 md:space-y-14">
      {/* ── TOP SECTION: ARTICLES (LEFT) & COMMUNITY POSTS (RIGHT) ── */}
      <section className="relative w-full rounded-3xl border border-[#20205a]/60 bg-gradient-to-b from-[#080829] via-[#05051f] to-[#05051f] p-4 sm:p-6 lg:p-8 overflow-hidden shadow-2xl">
        {/* Subtle cosmic ambient glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-[400px] h-[300px] bg-[#22b573]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full space-y-6">
          {/* Quick-Nav Broadcast Bar */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#20205a]/40 flex-wrap">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold tracking-wider text-[#ffd166]">
              <Flame className="w-4 h-4 text-[#ea6f2a] animate-pulse shrink-0" />
              <span className="uppercase text-[#f5f7ff]">STARCAST BROADCAST NETWORK</span>
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
                <Music className="w-3.5 h-3.5 text-[#20efe0]" /> Bands
              </Link>
              <Link
                href="/quiz"
                className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#20efe0]/20 border border-[#20205a] hover:border-[#20efe0]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#20efe0]" /> Quiz
              </Link>
              <Link
                href="/community"
                className="px-3 py-1.5 rounded-full bg-[#0c0c3f]/80 hover:bg-[#ffd166]/20 border border-[#20205a] hover:border-[#ffd166]/50 text-[#cbd0f2] hover:text-[#f5f7ff] transition-all font-medium flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#ffd166]" /> The DECK
              </Link>
            </div>
          </div>

          {/* QUIZ PROMO BANNER */}
          <div className="rounded-2xl border border-[#20efe0]/35 bg-gradient-to-r from-[#0c0c3f]/95 via-[#0e1747]/95 to-[#0c0c3f]/95 p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl hover:border-[#20efe0]/60 transition-all duration-300">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0] shrink-0 shadow-[0_0_20px_rgba(32,239,224,0.18)]">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#20efe0]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#ffd166]">
                    OFFICIAL CHALLENGE
                  </span>
                  <span className="text-xs text-[#20efe0] font-mono hidden md:inline">• 5 Questions</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#f5f7ff] tracking-tight truncate">
                  Take the StarCast Quiz
                </h3>
                <p className="text-xs text-[#cbd0f2] hidden sm:block truncate">
                  Test your show knowledge across StarCast broadcasts, hosts, and Topeka lore.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold text-xs sm:text-sm rounded-xl px-5 h-10 shrink-0 shadow-lg shadow-[#ea6f2a]/25">
              <Link href="/quiz">
                Take the Quiz Now <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* ── SPLIT GRID: ARTICLES ON LEFT (7 COLS) // COMMUNITY POSTS ON RIGHT (5 COLS) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT: ARTICLES MODULE (7 COLS) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#20205a]/60">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#22b573]">
                  <FileText className="w-4 h-4 text-[#22b573]" />
                  <span className="uppercase text-[#f5f7ff]">STARCAST EDITORIAL // LATEST ARTICLES</span>
                </div>
                <Link
                  href="/articles"
                  className="text-xs text-[#22b573] hover:text-[#ffd166] transition-colors font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestArticle ? (
                <div className="space-y-5">
                  {/* Premier Hero Story */}
                  <Link
                    href={`/articles/${latestArticle.slug || latestArticle.id}`}
                    className="group block rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/85 hover:border-[#22b573] transition-all duration-300 overflow-hidden shadow-2xl hover:shadow-[0_0_40px_rgba(34,181,115,0.22)]"
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

                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Badge className="bg-[#22b573] text-black font-black uppercase tracking-wider text-xs px-3 py-1 shadow-lg">
                          FEATURED STORY
                        </Badge>
                        {(latestArticle.tags as string[] | undefined)?.[0] && (
                          <Badge variant="outline" className="bg-[#05051f]/80 backdrop-blur-md border-white/20 text-[#f5f7ff] text-xs px-2.5 py-1">
                            {(latestArticle.tags as string[])[0]}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-[#9a9fc4]">
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

                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#f5f7ff] group-hover:text-[#22b573] transition-colors leading-tight">
                        {latestArticle.title}
                      </h2>

                      {latestArticle.subtitle && (
                        <p className="text-sm sm:text-base font-medium text-[#ffd166] line-clamp-2">
                          {latestArticle.subtitle}
                        </p>
                      )}

                      {latestArticle.excerpt && (
                        <p className="text-xs sm:text-sm text-[#cbd0f2] line-clamp-2 leading-relaxed">
                          {latestArticle.excerpt}
                        </p>
                      )}

                      <div className="pt-3 border-t border-[#20205a]/60 flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-[#22b573] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                          Read Full Story <ArrowRight className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] text-[#9a9fc4] font-mono">
                          STARCAST EDITORIAL
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Secondary Articles List */}
                  {secondaryArticles.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-mono font-bold tracking-wider text-[#9a9fc4] uppercase">
                        Recent Editorial Dispatches
                      </span>

                      {secondaryArticles.map((art: any) => (
                        <Link
                          key={art.id}
                          href={`/articles/${art.slug || art.id}`}
                          className="group rounded-2xl border border-[#20205a]/70 bg-[#0c0c3f]/60 hover:bg-[#0c0c3f]/90 hover:border-[#22b573]/60 p-3.5 sm:p-4 transition-all duration-200 flex gap-3.5 items-center shadow-md hover:shadow-lg"
                        >
                          {art.thumbnailUrl || (art.images as any[])?.[0]?.url ? (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-xl overflow-hidden shrink-0 bg-[#05052d] border border-[#20205a]">
                              <img
                                src={art.thumbnailUrl || (art.images as any[])?.[0]?.url}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-xl bg-[#05052d] border border-[#20205a] flex items-center justify-center shrink-0 text-[#22b573]">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-[#9a9fc4] mb-0.5">
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

                            <h3 className="text-sm sm:text-base font-bold text-[#f5f7ff] group-hover:text-[#22b573] transition-colors line-clamp-1 leading-snug">
                              {art.title}
                            </h3>

                            {art.excerpt && (
                              <p className="text-xs text-[#cbd0f2] mt-0.5 line-clamp-1 leading-relaxed">
                                {art.excerpt}
                              </p>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-[#9a9fc4] group-hover:text-[#22b573] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Artist / Band Callout Banner */}
                  <div className="rounded-2xl border border-[#20efe0]/30 bg-gradient-to-r from-[#20efe0]/15 via-[#0c0c3f]/80 to-[#ea6f2a]/15 p-4 flex items-center justify-between gap-3 shadow-md">
                    <div>
                      <p className="text-xs font-bold text-[#ffd166] uppercase tracking-wider font-mono">
                        Kansas Artists &amp; Bands
                      </p>
                      <p className="text-xs text-[#e8ecff] mt-0.5">
                        Stream your tracks, build a follower base, and connect with Topeka fans.
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-[#20efe0] hover:bg-[#1cd2c5] text-black text-xs font-bold shrink-0 rounded-xl">
                      <Link href="/bands">Explore Bands</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/80 p-8 text-center space-y-4">
                  <FileText className="w-12 h-12 text-[#22b573] mx-auto opacity-70" />
                  <h3 className="text-xl font-bold text-[#f5f7ff]">StarCast Editorial</h3>
                  <p className="text-sm text-[#cbd0f2]">
                    Catch deep dive articles, artist profiles, and Topeka community news.
                  </p>
                  <Button asChild className="bg-[#22b573] hover:bg-[#1ba063] text-black font-bold rounded-xl px-5">
                    <Link href="/articles">Browse Articles</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* ── RIGHT: COMMUNITY POSTS MODULE (5 COLS) ── */}
            <div className="lg:col-span-5 h-full">
              <CommunityHomeModule posts={communityFeedPosts} />
            </div>
          </div>
        </div>
      </section>

      {/* ── COLOR-COORDINATED SHOWS & EPISODES MODULE ── */}
      <ShowsEpisodesModule shows={showsWithEpisodes} channelUrl={CHANNEL_URL} />

      {/* ── FEATURED BANDS & ARTISTS ── */}
      <section id="bands">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[#20efe0] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-1.5">
              <Music className="w-4 h-4" />
              <span>STARCAST BANDS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f5f7ff] tracking-tight">
              Featured Bands &amp; Artists
            </h2>
            <p className="text-base sm:text-lg text-[#e8ecff] mt-2">
              Discover independent artists and bands broadcasting live on StarCast Online.
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
                      View Band Page &rarr;
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
              <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">StarCast Bands &amp; Artists</h3>
              <p className="text-base text-[#dbe0fb] max-w-md mx-auto mt-2 leading-relaxed">
                Bands and musicians can register their official page, book recording time, and share tracks.
              </p>
              <Button asChild className="mt-6 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-xl px-6 h-12 text-sm sm:text-base font-semibold">
                <Link href="/bands">Explore Bands</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── MERCH & SPONSORSHIPS ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Merch Card */}
        <div className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-br from-[#0c0c3f]/80 via-[#0c0c3f]/60 to-[#121245]/50 p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:border-[#ffd166]/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166] shadow-[0_0_20px_rgba(255,209,102,0.15)]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10 text-xs py-1 px-2.5 font-bold uppercase tracking-wider">
                Official Merch
              </Badge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] tracking-tight">
              StarCast Supply Co.
            </h3>
            <p className="text-sm sm:text-base text-[#dbe0fb] mt-2.5 leading-relaxed">
              Cop the official cosmic hoodies, snapback caps, mission patch tees, and stickers. Support independent Topeka broadcasting.
            </p>
          </div>
          <div className="mt-8 pt-5 border-t border-[#20205a]/60 flex items-center justify-between flex-wrap gap-3">
            <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-11 px-6 text-sm shadow-md shadow-[#ea6f2a]/20">
              <Link href="/merch">
                Shop Official Merch <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <span className="text-xs font-mono text-[#9a9fc4]">FREE LOCAL PICKUP</span>
          </div>
        </div>

        {/* Sponsor Callout */}
        <div className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-br from-[#0c0c3f]/80 via-[#0c0c3f]/60 to-[#0e2a4a]/40 p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:border-[#20efe0]/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#20efe0]/15 border border-[#20efe0]/30 flex items-center justify-center text-[#20efe0] shadow-[0_0_20px_rgba(32,239,224,0.15)]">
                <Radio className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-xs py-1 px-2.5 font-bold uppercase tracking-wider">
                Partnerships
              </Badge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] tracking-tight">
              Advertise With StarCast
            </h3>
            <p className="text-sm sm:text-base text-[#dbe0fb] mt-2.5 leading-relaxed">
              Connect your business with Kansas viewers through broadcast sponsorship, episode ad rolls, on-air mentions, and digital placement.
            </p>
          </div>
          <div className="mt-8 pt-5 border-t border-[#20205a]/60 flex items-center justify-between flex-wrap gap-3">
            <Button asChild variant="outline" className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl h-11 px-6 text-sm font-bold">
              <Link href="/sponsors">
                Sponsorship Packages <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <span className="text-xs font-mono text-[#20efe0]">REACH THOUSANDS</span>
          </div>
        </div>
      </section>
    </div>
  )
}
