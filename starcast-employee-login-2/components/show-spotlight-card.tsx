"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Play, Youtube } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { YouTubeVideo } from "@/lib/youtube"

interface ShowSpotlightCardProps {
  title: string
  genre: string
  color: string
  showPageHref: string
  playlistUrl: string
  video: YouTubeVideo | null
}

export function ShowSpotlightCard({ title, genre, color, showPageHref, playlistUrl, video }: ShowSpotlightCardProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1 gap-3">
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] mb-1" style={{ color }}>
            {genre}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#f5f7ff] truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href={showPageHref}
            className="text-xs font-semibold text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
          >
            Show page
          </Link>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color }}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All episodes</span>
          </a>
        </div>
      </div>

      {video ? (
        <button
          onClick={() => setPlaying(true)}
          className="media-card group relative block w-full overflow-hidden rounded-2xl bg-black text-left hover:border-[color:var(--show-accent)]"
          style={{ "--show-accent": `${color}66` } as React.CSSProperties}
        >
          <div className="aspect-video w-full relative bg-[#0c0c3f]">
            <span className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ backgroundColor: color }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail || "/placeholder.svg"}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white/90 scale-90 opacity-90 transition-all group-hover:scale-100 group-hover:opacity-100">
                <Play className="w-6 h-6 text-black" fill="currentColor" />
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
                Latest Upload
              </span>
              <p className="text-sm md:text-base font-semibold text-white line-clamp-2 mt-1">{video.title}</p>
            </div>
          </div>
        </button>
      ) : (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-video w-full items-center justify-center gap-2 rounded-xl border border-[#20205a] bg-[#0c0c3f] text-[#9a9fc4] transition-colors hover:text-[#f5f7ff]"
        >
          <Youtube className="w-5 h-5" />
          <span className="text-sm font-medium">Watch on YouTube</span>
        </a>
      )}

      <Dialog open={playing} onOpenChange={setPlaying}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black border-[#20205a] rounded-2xl gap-0">
          <DialogTitle className="sr-only">{video?.title ?? title}</DialogTitle>
          {video && (
            <>
              <div
                className="flex items-center gap-2 px-4 py-3 border-b border-[#20205a]"
                style={{ backgroundColor: "#0a0a3d" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] shrink-0" style={{ color }}>
                  {title}
                </span>
                <span className="text-[#3d3f7a]">/</span>
                <p className="text-sm text-[#e4e6fa] truncate">{video.title}</p>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={video.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
