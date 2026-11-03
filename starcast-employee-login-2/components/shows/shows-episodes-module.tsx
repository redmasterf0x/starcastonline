"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Play,
  Tv,
  Radio,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Youtube,
  Sparkles,
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
  const [activeVideo, setActiveVideo] = useState<{
    video: ShowEpisode
    show: ShowModuleData
  } | null>(null)

  return (
    <section id="shows" className="space-y-10 scroll-mt-20">
      {/* ── SECTION HEADER ── */}
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
            Stream uncut episodes, interviews, documentaries, and live studio sets from our Topeka studios.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            asChild
            variant="outline"
            className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/15 hover:text-white rounded-xl h-11 px-5 text-xs sm:text-sm font-bold"
          >
            <Link href="/watch">
              Full Watch Platform <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── ONE ROW FOR EACH SHOW ── */}
      <div className="space-y-12">
        {shows.map((show) => (
          <ShowRow
            key={show.id}
            show={show}
            onPlayEpisode={(ep) => setActiveVideo({ video: ep, show })}
          />
        ))}
      </div>

      {/* ── VIDEO PLAYER MODAL ── */}
      <Dialog
        open={Boolean(activeVideo)}
        onOpenChange={(open) => {
          if (!open) setActiveVideo(null)
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[94dvh] p-0 overflow-hidden bg-black border-[#20205a] rounded-2xl gap-0 flex flex-col shadow-2xl">
          <DialogTitle className="sr-only">
            {activeVideo?.video.title || "StarCast Broadcast Player"}
          </DialogTitle>

          {activeVideo && (
            <>
              {/* Modal Top Bar */}
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#20205a] shrink-0 pr-12"
                style={{ backgroundColor: "#080829" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${activeVideo.show.color}25`,
                      color: activeVideo.show.color,
                      border: `1px solid ${activeVideo.show.color}50`,
                    }}
                  >
                    {activeVideo.show.title}
                  </span>
                  <span className="text-[#3d3f7a] hidden sm:inline">/</span>
                  <p className="text-xs sm:text-sm font-semibold text-[#f5f7ff] truncate">
                    {activeVideo.video.title}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-3 shrink-0 text-xs font-mono text-[#9a9fc4]">
                  {activeVideo.video.duration && <span>{activeVideo.video.duration}</span>}
                  {activeVideo.video.views && <span>• {activeVideo.video.views}</span>}
                </div>
              </div>

              {/* Responsive Video Embed */}
              <div className="relative w-full aspect-video max-h-[calc(90dvh-4rem)] bg-black flex items-center justify-center">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.video.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeVideo.video.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 bg-[#080829] border-t border-[#20205a] flex items-center justify-between text-xs">
                <Link
                  href={`/watch?v=${activeVideo.video.id}`}
                  className="text-[#20efe0] hover:underline font-semibold flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5" /> Full Watch Experience Page
                </Link>

                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9a9fc4] hover:text-white flex items-center gap-1 font-mono"
                >
                  Watch on YouTube <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

function ShowRow({
  show,
  onPlayEpisode,
}: {
  show: ShowModuleData
  onPlayEpisode: (ep: ShowEpisode) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBy = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 640, behavior: "smooth" })
  }

  return (
    <div
      className="group/show rounded-3xl border p-5 sm:p-6 lg:p-7 space-y-5 transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: `${show.color}50`,
        background: `radial-gradient(ellipse at top left, ${show.color}12 0%, rgba(12, 12, 63, 0.75) 40%, rgba(5, 5, 31, 0.95) 100%)`,
        boxShadow: `0 10px 30px -10px ${show.color}20`,
      }}
    >
      {/* Ambient color blur */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: show.color }}
      />

      {/* Row Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#20205a]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: show.color,
                boxShadow: `0 0 8px ${show.color}`,
              }}
            />
            <Badge
              style={{
                backgroundColor: `${show.color}25`,
                color: show.color,
                borderColor: `${show.color}50`,
              }}
              className="border font-black uppercase tracking-wider text-[11px] px-2.5 py-0.5"
            >
              {show.genre}
            </Badge>

            {show.host && (
              <span className="text-xs font-mono text-[#ffd166] font-semibold">
                Hosted by {show.host}
              </span>
            )}

            <span className="text-xs text-[#9a9fc4] font-mono">
              • {show.episodes.length} Episodes
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] tracking-tight">
            {show.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#cbd0f2] max-w-3xl leading-relaxed">
            {show.description}
          </p>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {show.showPageHref && (
            <Link
              href={show.showPageHref}
              className="text-xs font-semibold hover:underline flex items-center gap-1 transition-colors"
              style={{ color: show.color }}
            >
              Show Page <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {show.playlistUrl && (
            <a
              href={show.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-white/10 transition-colors"
              style={{
                borderColor: `${show.color}60`,
                color: show.color,
              }}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Playlist</span>
            </a>
          )}

          <Link
            href={`/watch?show=${encodeURIComponent(show.title)}`}
            className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff] font-semibold flex items-center gap-1 transition-colors"
          >
            Watch Series &rarr;
          </Link>
        </div>
      </div>

      {/* Episodes Horizontal Carousel */}
      {show.episodes.length > 0 ? (
        <div className="relative group/carousel">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${show.title} left`}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-[#0c0c3f]/90 border border-[#20205a] text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:border-[#ffd166] shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {show.episodes.map((ep, idx) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => onPlayEpisode(ep)}
                className="group/card text-left shrink-0 w-[240px] sm:w-[280px] md:w-[320px] snap-start rounded-2xl border border-[#20205a]/80 bg-[#0c0c3f]/70 hover:bg-[#0c0c3f] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20efe0]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = show.color
                  e.currentTarget.style.boxShadow = `0 10px 25px ${show.color}25`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(32, 32, 90, 0.8)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-[#050528] overflow-hidden">
                  <img
                    src={ep.thumbnail}
                    alt={ep.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    loading={idx < 5 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-2xl transform scale-90 group-hover/card:scale-100 transition-transform"
                      style={{ backgroundColor: show.color }}
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

                  {/* Episode Index */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md shadow-md"
                      style={{
                        backgroundColor: `${show.color}ee`,
                        color: "#05051f",
                      }}
                    >
                      EP {show.episodes.length - idx}
                    </span>
                  </div>
                </div>

                {/* Card Meta */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9a9fc4] mb-1 font-mono">
                      {ep.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {ep.views}
                        </span>
                      )}
                      {ep.views && ep.timeAgo && <span>•</span>}
                      {ep.timeAgo && <span>{ep.timeAgo}</span>}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#f5f7ff] group-hover/card:text-white transition-colors line-clamp-2 leading-snug">
                      {ep.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#20205a]/60 flex items-center justify-between text-xs font-semibold">
                    <span
                      className="flex items-center gap-1 transition-transform group-hover/card:translate-x-1"
                      style={{ color: show.color }}
                    >
                      <Play className="w-3 h-3 fill-current" /> Play Episode
                    </span>
                    <span className="text-[10px] text-[#9a9fc4] font-mono">
                      STARCAST
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${show.title} right`}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-[#0c0c3f]/90 border border-[#20205a] text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:border-[#ffd166] shadow-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-6 text-center text-xs text-[#9a9fc4]">
          <Tv className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: show.color }} />
          <p className="font-bold text-[#f5f7ff]">New episodes dropping soon!</p>
          <p className="text-[11px] mt-0.5">Subscribe on YouTube for updates.</p>
        </div>
      )}
    </div>
  )
}
