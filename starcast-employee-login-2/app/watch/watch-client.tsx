"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import type { WatchVideo } from "@/lib/youtube"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Share2,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Tv,
  X,
  Radio,
  SlidersHorizontal,
  Flame,
  Volume2,
} from "lucide-react"

interface WatchClientProps {
  initialVideos: WatchVideo[]
}

const SHOW_TABS = [
  { id: "all", label: "All Broadcasts" },
  { id: "The Observation Deck", label: "The Observation Deck" },
  { id: "The Psyco G Spot", label: "The Psyco G Spot" },
  { id: "Talkin' With 40", label: "Talkin' With 40" },
  { id: "Star Talk", label: "Star Talk" },
  { id: "Hollywood: After Babylon", label: "Hollywood: After Babylon" },
  { id: "Performances", label: "Live Performances" },
]

export function WatchClient({ initialVideos }: WatchClientProps) {
  const searchParams = useSearchParams()
  const [activeVideo, setActiveVideo] = useState<WatchVideo | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedShow, setSelectedShow] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Featured billboard episode (defaults to the latest video or AK Sin / Just JP)
  const billboardVideo = useMemo(() => {
    const featured = initialVideos.find((v) => v.featured)
    return featured || initialVideos[0] || null
  }, [initialVideos])

  // Open modal if URL has ?v=videoId
  useEffect(() => {
    const videoParam = searchParams.get("v")
    if (videoParam) {
      const target = initialVideos.find((v) => v.id === videoParam)
      if (target) {
        setActiveVideo(target)
      } else {
        // Fallback for custom direct link
        setActiveVideo({
          id: videoParam,
          title: "StarCast Live Broadcast",
          show: "StarCast Original",
          duration: "",
          views: "",
          timeAgo: "",
          thumbnail: `https://i.ytimg.com/vi/${videoParam}/hqdefault.jpg`,
        })
      }
    }
  }, [searchParams, initialVideos])

  const theaterScrollRef = useRef<HTMLDivElement>(null)

  // Handle escape key to close video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeVideo) {
        handleCloseVideo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeVideo])

  // Lock background scroll when activeVideo is open
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [activeVideo])

  const handleOpenVideo = (video: WatchVideo) => {
    setActiveVideo(video)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("v", video.id)
    window.history.pushState({}, "", newUrl.toString())
    if (theaterScrollRef.current) {
      theaterScrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCloseVideo = () => {
    setActiveVideo(null)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete("v")
    window.history.pushState({}, "", newUrl.toString())
  }

  const handleShareVideo = (video: WatchVideo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const url = `${window.location.origin}/watch?v=${video.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(video.id)
      setTimeout(() => setCopiedId(null), 2200)
    })
  }

  // Filtered list when searching or filtering by show
  const filteredVideos = useMemo(() => {
    return initialVideos.filter((v) => {
      const matchesShow = selectedShow === "all" || v.show === selectedShow
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.show.toLowerCase().includes(q)
      return matchesShow && matchesQuery
    })
  }, [initialVideos, selectedShow, searchQuery])

  // Category shelves for Netflix-style home rows
  const observationDeckVideos = useMemo(
    () => initialVideos.filter((v) => v.show === "The Observation Deck"),
    [initialVideos]
  )
  const psycoGSpotVideos = useMemo(
    () => initialVideos.filter((v) => v.show === "The Psyco G Spot"),
    [initialVideos]
  )
  const interviewVideos = useMemo(
    () => initialVideos.filter((v) => v.show === "Talkin' With 40" || v.show === "Star Talk"),
    [initialVideos]
  )
  const hollywoodVideos = useMemo(
    () => initialVideos.filter((v) => v.show === "Hollywood: After Babylon"),
    [initialVideos]
  )
  const performanceVideos = useMemo(
    () => initialVideos.filter((v) => v.show === "Performances"),
    [initialVideos]
  )

  const isFiltering = searchQuery.trim().length > 0 || selectedShow !== "all"

  return (
    <div className="min-h-screen bg-[#05051a] text-[#f5f7ff] pb-20">
      {/* 1. Cinematic Billboard Hero */}
      {billboardVideo && !isFiltering && (
        <section className="relative w-full min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] flex items-end overflow-hidden border-b border-[#20205a]/60">
          {/* Billboard Image Backdrop */}
          <div className="absolute inset-0 z-0">
            <img
              src={`https://i.ytimg.com/vi/${billboardVideo.id}/maxresdefault.jpg`}
              alt={billboardVideo.title}
              onError={(e) => {
                // Fallback to hqdefault if maxres isn't available
                ;(e.target as HTMLImageElement).src = billboardVideo.thumbnail
              }}
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-1000"
            />
            {/* Multi-stage ambient gradients for Netflix atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05051a] via-[#05051a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05051a] via-[#05051a]/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(32,239,224,0.15),transparent_60%)]" />
          </div>

          {/* Billboard Info Overlay */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16 w-full">
            <div className="max-w-2xl space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-red-600/30">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Featured Broadcast
                </span>
                <Badge
                  variant="outline"
                  className="border-[#20efe0]/50 text-[#20efe0] bg-[#0c0c3f]/80 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider"
                >
                  {billboardVideo.show}
                </Badge>
                {billboardVideo.duration && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-[#9a9fc4] bg-[#0c0c3f]/60 px-2.5 py-1 rounded-md border border-[#20205a]">
                    <Clock className="w-3 h-3 text-[#ea6f2a]" /> {billboardVideo.duration}
                  </span>
                )}
                {billboardVideo.views && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-[#9a9fc4] bg-[#0c0c3f]/60 px-2.5 py-1 rounded-md border border-[#20205a]">
                    <Eye className="w-3 h-3 text-[#20efe0]" /> {billboardVideo.views}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
                {billboardVideo.title}
              </h1>

              {/* Channel Tagline */}
              <p className="text-sm sm:text-base text-[#c9fbf7]/90 max-w-xl line-clamp-2 drop-shadow-md">
                Streaming directly from StarCast Media Topeka (@starcastlivemedia). Experience uncut studio conversations,
                independent music performances, and Kansas culture.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3.5 pt-2 flex-wrap">
                <Button
                  onClick={() => handleOpenVideo(billboardVideo)}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white text-base font-bold px-7 py-6 rounded-xl shadow-[0_0_30px_rgba(234,111,42,0.45)] hover:scale-105 transition-all flex items-center gap-2.5"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Episode
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleShareVideo(billboardVideo)}
                  className="border-[#20efe0]/40 bg-[#0c0c3f]/75 hover:bg-[#20efe0]/15 text-[#f5f7ff] text-sm font-semibold px-5 py-6 rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
                >
                  {copiedId === billboardVideo.id ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Copied Link!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#20efe0]" /> Share
                    </>
                  )}
                </Button>

                <a
                  href={`https://www.youtube.com/watch?v=${billboardVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#9a9fc4] hover:text-[#ffd166] transition-colors ml-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open on YouTube
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Channel Controls & Search Bar */}
      <div className="sticky top-16 sm:top-20 z-30 bg-[#05051a]/95 backdrop-blur-xl border-b border-[#20205a]/60 py-4 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9fc4]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by episode title, guest, or show..."
                className="bg-[#0c0c3f]/70 border-[#20205a] text-sm text-[#f5f7ff] pl-10 pr-9 h-11 rounded-xl focus:border-[#20efe0] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9fc4] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Stats / Channel Link */}
            <div className="flex items-center gap-3 self-end md:self-auto text-xs text-[#9a9fc4]">
              <span className="hidden sm:inline font-mono">
                {initialVideos.length} episodes live from{" "}
                <a
                  href="https://www.youtube.com/@StarCastLiveMedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ea6f2a] hover:underline font-bold"
                >
                  @starcastlivemedia
                </a>
              </span>
              <a
                href="https://www.youtube.com/@StarCastLiveMedia?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md shadow-red-600/30"
              >
                <Tv className="w-3.5 h-3.5" />
                Subscribe on YouTube
              </a>
            </div>
          </div>

          {/* Show Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SHOW_TABS.map((tab) => {
              const active = selectedShow === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedShow(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#20efe0] text-[#05051f] shadow-[0_0_15px_rgba(32,239,224,0.35)] scale-105"
                      : "bg-[#0c0c3f]/80 text-[#9a9fc4] border border-[#20205a] hover:border-[#20efe0]/50 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Content: Search Grid or Netflix Shelves */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isFiltering ? (
          /* Filtered Results Grid */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#f5f7ff] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#20efe0]" />
                  Search &amp; Filter Results
                </h2>
                <p className="text-xs text-[#9a9fc4] mt-1">
                  Showing {filteredVideos.length} {filteredVideos.length === 1 ? "broadcast" : "broadcasts"}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {selectedShow !== "all" && ` in ${selectedShow}`}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedShow("all")
                }}
                className="border-[#20205a] text-xs text-[#9a9fc4] hover:text-white bg-transparent"
              >
                Clear All Filters
              </Button>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="p-16 text-center rounded-2xl border border-[#20205a] bg-[#0c0c3f]/40">
                <Tv className="w-12 h-12 text-[#9a9fc4]/50 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No episodes found</h3>
                <p className="text-sm text-[#9a9fc4] mb-4">
                  Try adjusting your search query or switching category tabs.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedShow("all")
                  }}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                >
                  View All Episodes
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={() => handleOpenVideo(video)}
                    onShare={(e) => handleShareVideo(video, e)}
                    copied={copiedId === video.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Netflix-Style Category Rows */
          <div className="space-y-10">
            {/* Row 1: Latest Broadcasts */}
            <VideoCarouselRow
              title="Latest Releases & Premieres"
              subtitle="Fresh drops straight from the StarCast recording studio"
              videos={initialVideos.slice(0, 12)}
              onPlay={handleOpenVideo}
              onShare={handleShareVideo}
              copiedId={copiedId}
              badgeColor="border-[#ea6f2a] text-[#ea6f2a]"
            />

            {/* Row 2: The Observation Deck */}
            {observationDeckVideos.length > 0 && (
              <VideoCarouselRow
                title="The Observation Deck"
                subtitle="Unfiltered interviews with hip-hop icons, creatives, and Kansas voices"
                videos={observationDeckVideos}
                onPlay={handleOpenVideo}
                onShare={handleShareVideo}
                copiedId={copiedId}
                badgeColor="border-[#20efe0] text-[#20efe0]"
              />
            )}

            {/* Row 3: The Psyco G Spot */}
            {psycoGSpotVideos.length > 0 && (
              <VideoCarouselRow
                title="The Psyco G Spot"
                subtitle="Late night unfiltered talk, culture, and street perspectives with Psyco G"
                videos={psycoGSpotVideos}
                onPlay={handleOpenVideo}
                onShare={handleShareVideo}
                copiedId={copiedId}
                badgeColor="border-purple-400 text-purple-400"
              />
            )}

            {/* Row 4: Talkin' With 40 & Star Talk */}
            {interviewVideos.length > 0 && (
              <VideoCarouselRow
                title="Talkin' With 40 & Star Talk"
                subtitle="In-depth studio discussions with local legends and community leaders"
                videos={interviewVideos}
                onPlay={handleOpenVideo}
                onShare={handleShareVideo}
                copiedId={copiedId}
                badgeColor="border-blue-400 text-blue-400"
              />
            )}

            {/* Row 5: Hollywood: After Babylon */}
            {hollywoodVideos.length > 0 && (
              <VideoCarouselRow
                title="Hollywood: After Babylon"
                subtitle="Deep-dive entertainment history, cinema occultism, and industry truths"
                videos={hollywoodVideos}
                onPlay={handleOpenVideo}
                onShare={handleShareVideo}
                copiedId={copiedId}
                badgeColor="border-amber-400 text-amber-400"
              />
            )}

            {/* Row 6: Live Performances */}
            {performanceVideos.length > 0 && (
              <VideoCarouselRow
                title="Soundstage Live Performances"
                subtitle="Raw acoustic sessions, full-band live takes, and studio concert recordings"
                videos={performanceVideos}
                onPlay={handleOpenVideo}
                onShare={handleShareVideo}
                copiedId={copiedId}
                badgeColor="border-emerald-400 text-emerald-400"
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Full-Space Video Theater (Takes up the whole space below the header) */}
      {activeVideo && (
        <div
          ref={theaterScrollRef}
          className="fixed top-16 sm:top-20 inset-x-0 bottom-0 z-40 bg-black flex flex-col overflow-y-auto animate-in fade-in duration-200"
        >
          {/* Main Full-Height Viewport Container (100% of the screen below the header) */}
          <div className="w-full h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] flex flex-col shrink-0 bg-black relative">
            {/* Top Control Bar */}
            <div className="h-12 sm:h-14 px-3 sm:px-6 bg-[#05051a] border-b border-[#20205a]/60 flex items-center justify-between gap-3 shrink-0">
              {/* Left: Back button + Show badge + Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <button
                  onClick={handleCloseVideo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c0c3f] hover:bg-[#ea6f2a] text-[#20efe0] hover:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Back to Browse</span>
                </button>
                <Badge
                  variant="outline"
                  className="border-[#20efe0]/50 text-[#20efe0] text-[10px] uppercase font-bold shrink-0 hidden sm:inline-flex"
                >
                  {activeVideo.show}
                </Badge>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md lg:max-w-xl">
                  {activeVideo.title}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => handleShareVideo(activeVideo)}
                  title="Share Episode"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c0c3f] hover:bg-[#20205a] text-[#9a9fc4] hover:text-white text-xs font-semibold transition-colors border border-white/10"
                >
                  {copiedId === activeVideo.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </>
                  )}
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> YouTube
                </a>
                <button
                  onClick={handleCloseVideo}
                  title="Close Player"
                  className="p-1.5 sm:p-2 rounded-lg bg-[#0c0c3f] hover:bg-red-950 text-[#9a9fc4] hover:text-red-300 transition-colors border border-white/10"
                  aria-label="Close Player"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Video Player Embed - Takes up 100% of the space */}
            <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {/* Details & Up Next Binge Tray (Accessible by scrolling down) */}
          <div className="w-full bg-gradient-to-b from-[#080825] to-[#040416] border-t border-[#20205a]/60 px-4 sm:px-8 py-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-[#20efe0] text-[#20efe0] text-xs font-bold">
                      {activeVideo.show}
                    </Badge>
                    {activeVideo.timeAgo && (
                      <span className="text-xs text-[#9a9fc4]">Published {activeVideo.timeAgo}</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-snug">
                    {activeVideo.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[#9a9fc4] mt-2 font-mono">
                    {activeVideo.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#20efe0]" /> {activeVideo.duration}
                      </span>
                    )}
                    {activeVideo.views && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#20efe0]" /> {activeVideo.views}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseVideo}
                    className="px-4 py-2 rounded-xl bg-[#0c0c3f] border border-[#20205a] hover:border-[#20efe0] text-white text-xs font-bold transition-colors"
                  >
                    Back to All Shows
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-md shadow-red-600/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
                  </a>
                </div>
              </div>

              {/* Up Next in this Show */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9a9fc4] mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#20efe0]" /> Up Next from StarCast Online
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {initialVideos
                    .filter((v) => v.id !== activeVideo.id)
                    .slice(0, 4)
                    .map((nextVid) => (
                      <div
                        key={nextVid.id}
                        onClick={() => handleOpenVideo(nextVid)}
                        className="group/mini relative rounded-xl overflow-hidden border border-[#20205a] bg-[#0c0c3f]/80 cursor-pointer hover:border-[#ea6f2a] transition-all"
                      >
                        <div className="relative aspect-video w-full overflow-hidden">
                          <img
                            src={nextVid.thumbnail}
                            alt={nextVid.title}
                            className="w-full h-full object-cover group-hover/mini:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/mini:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-7 h-7 text-[#ea6f2a] fill-current drop-shadow-md" />
                          </div>
                          {nextVid.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                              {nextVid.duration}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-white truncate group-hover/mini:text-[#ea6f2a]">
                            {nextVid.title}
                          </p>
                          <p className="text-[10px] text-[#20efe0] font-bold mt-0.5">{nextVid.show}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Horizontal Netflix-Style Carousel Row */
interface VideoCarouselRowProps {
  title: string
  subtitle?: string
  videos: WatchVideo[]
  onPlay: (v: WatchVideo) => void
  onShare: (v: WatchVideo, e: React.MouseEvent) => void
  copiedId: string | null
  badgeColor?: string
}

function VideoCarouselRow({
  title,
  subtitle,
  videos,
  onPlay,
  onShare,
  copiedId,
  badgeColor,
}: VideoCarouselRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75
      rowRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (videos.length === 0) return null

  return (
    <div className="relative group/row space-y-3">
      {/* Row Title */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {title}
            <span className="text-xs font-mono text-[#9a9fc4] font-normal">({videos.length})</span>
          </h3>
          {subtitle && <p className="text-xs text-[#9a9fc4] mt-0.5">{subtitle}</p>}
        </div>

        {/* Carousel controls */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-80 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-[#0c0c3f] border border-[#20205a] hover:border-[#20efe0] hover:text-[#20efe0] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-[#0c0c3f] border border-[#20205a] hover:border-[#20efe0] hover:text-[#20efe0] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar snap-x"
        style={{ scrollbarWidth: "none" }}
      >
        {videos.map((video) => (
          <div key={video.id} className="w-64 sm:w-72 md:w-80 shrink-0 snap-start">
            <VideoCard
              video={video}
              onPlay={() => onPlay(video)}
              onShare={(e) => onShare(video, e)}
              copied={copiedId === video.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Individual Video Card with Netflix-style hover */
interface VideoCardProps {
  video: WatchVideo
  onPlay: () => void
  onShare: (e: React.MouseEvent) => void
  copied: boolean
}

function VideoCard({ video, onPlay, onShare, copied }: VideoCardProps) {
  return (
    <div
      onClick={onPlay}
      className="group relative rounded-xl overflow-hidden border border-[#20205a]/80 bg-[#0c0c3f]/60 hover:border-[#ea6f2a] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer flex flex-col h-full"
    >
      {/* 16:9 Thumbnail Poster */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#05052d]">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-lg shadow-[#ea6f2a]/50 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Runtime Badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[11px] font-mono text-white font-semibold backdrop-blur-sm border border-white/10">
            {video.duration}
          </span>
        )}

        {/* Views badge */}
        {video.views && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#05051a]/85 text-[10px] font-mono text-[#9a9fc4] backdrop-blur-sm">
            {video.views}
          </span>
        )}

        {/* Top-Right Quick Share */}
        <button
          onClick={onShare}
          title="Share Video"
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 hover:bg-[#ea6f2a] text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#20efe0]">
              {video.show}
            </span>
            {video.timeAgo && (
              <span className="text-[10px] text-[#9a9fc4]">· {video.timeAgo}</span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#ea6f2a] transition-colors">
            {video.title}
          </h4>
        </div>
      </div>
    </div>
  )
}
