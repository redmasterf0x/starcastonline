"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Play,
  Tv,
  Radio,
  ExternalLink,
  ChevronRight,
  Clock,
  Eye,
  Sparkles,
  LayoutGrid,
  Film,
} from "lucide-react"

export interface ShowEpisode {
  id: string
  title: string
  duration?: string
  views?: string
  timeAgo?: string
  thumbnail: string
}

export interface ShowModuleData {
  id: string
  title: string
  genre: string
  host?: string
  color: string
  description: string
  playlistUrl?: string
  showPageHref?: string
  episodes: ShowEpisode[]
}

interface ShowsEpisodesModuleProps {
  shows: ShowModuleData[]
  channelUrl?: string
}

export function ShowsEpisodesModule({
  shows,
  channelUrl = "https://www.youtube.com/@starcastlivemedia",
}: ShowsEpisodesModuleProps) {
  // Default to the flagship show (The Observation Deck)
  const [selectedShowId, setSelectedShowId] = useState<string>("theobservationdeck")
  const [viewMode, setViewMode] = useState<"tabbed" | "grid">("tabbed")

  const selectedShow = shows.find((s) => s.id === selectedShowId) || shows[0]

  return (
    <section id="shows" className="space-y-8 scroll-mt-20">
      {/* ── MODULE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#20205a]/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#ea6f2a] text-xs sm:text-sm font-mono font-bold tracking-widest uppercase mb-1.5">
            <Radio className="w-4 h-4 animate-pulse text-[#ea6f2a]" />
            <span>ORIGINAL BROADCASTS // STARCAST MEDIA NETWORK</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f5f7ff] tracking-tight">
            Shows &amp; Episodes
          </h2>
          <p className="text-sm sm:text-base text-[#cbd0f2] mt-2 max-w-2xl leading-relaxed">
            Stream full uncut episodes, interviews, documentaries, and live studio sets from our Topeka studios.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Toggle between tabbed view and all-shows grid */}
          <div className="flex items-center rounded-xl bg-[#0c0c3f]/80 p-1 border border-[#20205a]">
            <button
              type="button"
              onClick={() => setViewMode("tabbed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "tabbed"
                  ? "bg-[#ea6f2a] text-white shadow-md"
                  : "text-[#cbd0f2] hover:text-[#f5f7ff]"
              }`}
            >
              <Film className="w-3.5 h-3.5" /> By Show
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-[#ea6f2a] text-white shadow-md"
                  : "text-[#cbd0f2] hover:text-[#f5f7ff]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> All Shows
            </button>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/15 hover:text-white rounded-xl h-10 px-4 text-xs sm:text-sm font-bold"
          >
            <Link href="/watch">
              Full Watch Platform <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── COLOR-COORDINATED SHOW NAVIGATION TABS ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#20205a]">
        {shows.map((show) => {
          const isSelected = selectedShowId === show.id && viewMode === "tabbed"
          const episodeCount = show.episodes.length

          return (
            <button
              key={show.id}
              type="button"
              onClick={() => {
                setSelectedShowId(show.id)
                setViewMode("tabbed")
              }}
              style={{
                borderColor: isSelected ? show.color : "rgba(32, 32, 90, 0.6)",
                boxShadow: isSelected ? `0 0 25px ${show.color}40` : "none",
              }}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 shrink-0 ${
                isSelected
                  ? "bg-[#0c0c3f] text-[#f5f7ff]"
                  : "bg-[#0c0c3f]/50 hover:bg-[#0c0c3f] text-[#cbd0f2] hover:text-[#f5f7ff]"
              }`}
            >
              {/* Color dot indicator */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                style={{
                  backgroundColor: show.color,
                  boxShadow: `0 0 8px ${show.color}`,
                }}
              />
              <span>{show.title}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
                style={{
                  backgroundColor: isSelected ? `${show.color}25` : "rgba(255, 255, 255, 0.08)",
                  color: isSelected ? show.color : "#9a9fc4",
                }}
              >
                {episodeCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── VIEW MODE 1: TABBED SHOW WITH COLOR-COORDINATED EPISODE BROWSER ── */}
      {viewMode === "tabbed" && selectedShow && (
        <div
          className="rounded-3xl border p-5 sm:p-7 lg:p-8 space-y-8 transition-all duration-500 overflow-hidden relative shadow-2xl"
          style={{
            borderColor: `${selectedShow.color}70`,
            background: `radial-gradient(ellipse at top left, ${selectedShow.color}15 0%, rgba(12, 12, 63, 0.85) 45%, rgba(5, 5, 31, 0.98) 100%)`,
            boxShadow: `0 15px 45px -10px ${selectedShow.color}25`,
          }}
        >
          {/* Subtle cosmic background glow */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ backgroundColor: selectedShow.color }}
          />

          {/* Show Meta Banner */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#20205a]/60">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge
                  style={{
                    backgroundColor: `${selectedShow.color}25`,
                    color: selectedShow.color,
                    borderColor: `${selectedShow.color}50`,
                  }}
                  className="border font-black uppercase tracking-wider text-xs px-3 py-1 shadow-sm"
                >
                  {selectedShow.genre}
                </Badge>
                {selectedShow.host && (
                  <span className="text-xs font-mono text-[#ffd166] font-semibold">
                    Hosted by {selectedShow.host}
                  </span>
                )}
                <span className="text-xs text-[#9a9fc4] font-mono">
                  • {selectedShow.episodes.length} Episodes Available
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#f5f7ff] tracking-tight">
                {selectedShow.title}
              </h3>

              <p className="text-sm sm:text-base text-[#dbe0fb] leading-relaxed">
                {selectedShow.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {selectedShow.showPageHref && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  style={{
                    borderColor: `${selectedShow.color}60`,
                    color: selectedShow.color,
                  }}
                  className="hover:bg-white/10 rounded-xl h-10 px-4 text-xs font-bold"
                >
                  <Link href={selectedShow.showPageHref}>
                    Show Directory <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              )}
              {selectedShow.playlistUrl && (
                <Button
                  asChild
                  size="sm"
                  style={{ backgroundColor: selectedShow.color }}
                  className="text-black font-bold rounded-xl h-10 px-4 text-xs shadow-lg hover:brightness-110"
                >
                  <a
                    href={selectedShow.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube Playlist <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Episodes Display */}
          {selectedShow.episodes.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ffd166] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: selectedShow.color }} />
                  Latest Episodes ({selectedShow.episodes.length})
                </h4>
                <Link
                  href={`/watch?show=${encodeURIComponent(selectedShow.title)}`}
                  className="text-xs font-semibold hover:underline flex items-center gap-1"
                  style={{ color: selectedShow.color }}
                >
                  Watch in Player <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Grid of episodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {selectedShow.episodes.map((ep, idx) => (
                  <Link
                    key={ep.id}
                    href={`/watch?v=${ep.id}`}
                    className="group rounded-2xl border border-[#20205a]/80 bg-[#0c0c3f]/70 hover:bg-[#0c0c3f] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl"
                    style={{
                      borderColor: undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = selectedShow.color
                      e.currentTarget.style.boxShadow = `0 10px 30px ${selectedShow.color}30`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(32, 32, 90, 0.8)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    {/* Thumbnail container */}
                    <div className="relative aspect-video w-full bg-[#050528] overflow-hidden">
                      <img
                        src={ep.thumbnail}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading={idx < 4 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                          style={{ backgroundColor: selectedShow.color }}
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Chip */}
                      {ep.duration && (
                        <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white flex items-center gap-1 border border-white/10 shadow-lg">
                          <Clock className="w-3 h-3 text-[#cbd0f2]" />
                          {ep.duration}
                        </div>
                      )}

                      {/* Episode index badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md shadow-md"
                          style={{
                            backgroundColor: `${selectedShow.color}ee`,
                            color: "#05051f",
                          }}
                        >
                          EP {selectedShow.episodes.length - idx}
                        </span>
                      </div>
                    </div>

                    {/* Episode Meta */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-[#9a9fc4] mb-1.5 font-mono">
                          {ep.views && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {ep.views}
                            </span>
                          )}
                          {ep.views && ep.timeAgo && <span>•</span>}
                          {ep.timeAgo && <span>{ep.timeAgo}</span>}
                        </div>

                        <h5 className="text-sm font-bold text-[#f5f7ff] group-hover:text-white transition-colors line-clamp-2 leading-snug">
                          {ep.title}
                        </h5>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#20205a]/60 flex items-center justify-between text-xs font-semibold">
                        <span
                          className="flex items-center gap-1 transition-transform group-hover:translate-x-1"
                          style={{ color: selectedShow.color }}
                        >
                          <Play className="w-3 h-3 fill-current" /> Watch Episode
                        </span>
                        <span className="text-[10px] text-[#9a9fc4] font-mono">
                          STARCAST
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 p-8 text-center text-sm text-[#cbd0f2]">
              <Tv className="w-10 h-10 mx-auto mb-2 opacity-50" style={{ color: selectedShow.color }} />
              <p className="font-bold text-[#f5f7ff]">New episodes premiering soon!</p>
              <p className="text-xs text-[#9a9fc4] mt-1">Check back for the next broadcast or subscribe on YouTube.</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW MODE 2: ALL SHOWS GRID ── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {shows.map((show) => {
            const topEpisodes = show.episodes.slice(0, 3)

            return (
              <div
                key={show.id}
                className="rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl"
                style={{
                  borderColor: `${show.color}60`,
                  background: `linear-gradient(to bottom, ${show.color}15 0%, rgba(12, 12, 63, 0.8) 25%, rgba(5, 5, 31, 0.95) 100%)`,
                  boxShadow: `0 10px 30px -10px ${show.color}20`,
                }}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <Badge
                      style={{
                        backgroundColor: `${show.color}25`,
                        color: show.color,
                        borderColor: `${show.color}50`,
                      }}
                      className="border font-black uppercase tracking-wider text-xs px-2.5 py-0.5"
                    >
                      {show.genre}
                    </Badge>
                    <span className="text-xs font-mono text-[#cbd0f2]">
                      {show.episodes.length} Episodes
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
                    {show.title}
                  </h3>
                  {show.host && (
                    <p className="text-xs font-mono text-[#ffd166] mt-0.5">
                      Hosted by {show.host}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-[#dbe0fb] mt-2 line-clamp-2 leading-relaxed">
                    {show.description}
                  </p>
                </div>

                {/* Episode Mini-List */}
                <div className="mt-5 space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a9fc4] font-bold">
                    Latest Releases
                  </p>

                  {topEpisodes.length > 0 ? (
                    topEpisodes.map((ep) => (
                      <Link
                        key={ep.id}
                        href={`/watch?v=${ep.id}`}
                        className="group/ep flex items-center gap-3 p-2 rounded-xl bg-[#0c0c3f]/80 hover:bg-[#0c0c3f] border border-[#20205a]/60 hover:border-[#20efe0]/50 transition-all"
                      >
                        <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-[#050528]">
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover group-hover/ep:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                            <Play className="w-3.5 h-3.5 fill-white text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#f5f7ff] group-hover/ep:text-[#20efe0] transition-colors truncate">
                            {ep.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#9a9fc4] font-mono mt-0.5">
                            {ep.duration && <span>{ep.duration}</span>}
                            {ep.timeAgo && <span>• {ep.timeAgo}</span>}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#9a9fc4] group-hover/ep:text-[#20efe0] shrink-0" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-[#9a9fc4] italic py-2">Episodes coming soon.</p>
                  )}
                </div>

                {/* Footer link */}
                <div className="mt-6 pt-4 border-t border-[#20205a]/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShowId(show.id)
                      setViewMode("tabbed")
                    }}
                    className="text-xs font-bold flex items-center gap-1 transition-colors hover:underline"
                    style={{ color: show.color }}
                  >
                    View All {show.episodes.length} Episodes &rarr;
                  </button>
                  <Link
                    href={`/watch?show=${encodeURIComponent(show.title)}`}
                    className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff] font-semibold"
                  >
                    Watch Series
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── YOUTUBE CHANNEL CALLOUT BAR ── */}
      <div className="p-6 rounded-3xl border border-[#20205a]/80 bg-gradient-to-r from-[#0c0c3f]/80 via-[#05052d]/90 to-[#0c0c3f]/80 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-lg">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">
              StarCast Live Media on YouTube (@starcastlivemedia)
            </p>
            <p className="text-xs sm:text-sm text-[#cbd0f2] mt-0.5">
              Subscribe to the channel for weekly episode drops, uncut interviews, and live notifications.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-red-500/40 text-[#f5f7ff] hover:bg-red-500/20 shrink-0 h-11 px-5 text-sm font-semibold rounded-xl"
        >
          <a href={channelUrl} target="_blank" rel="noopener noreferrer">
            Visit YouTube Channel <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
    </section>
  )
}
