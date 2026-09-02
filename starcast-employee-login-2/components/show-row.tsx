"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play, Youtube } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { YouTubeVideo } from "@/lib/youtube"

export interface ShowRowData {
  id: string
  title: string
  genre: string
  color: string
  playlistId: string
  playlistUrl: string
  showPageHref?: string
  videos: YouTubeVideo[]
}

export function ShowRow({ row }: { row: ShowRowData }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState<YouTubeVideo | null>(null)

  const scrollBy = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 640, behavior: "smooth" })
  }

  // If the YouTube Data API couldn't return video data (e.g. missing/invalid
  // API key), fall back to embedding the real playlist directly so the row
  // still shows actual content instead of disappearing.
  if (row.videos.length === 0) {
    return (
      <section>
        <div className="flex items-baseline justify-between mb-3 px-1 gap-3">
          <div className="min-w-0">
            <span
              className="block text-[11px] font-semibold uppercase tracking-[0.3em] mb-1"
              style={{ color: row.color }}
            >
              {row.genre}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-[#f5f7ff] truncate">{row.title}</h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {row.showPageHref && (
              <Link
                href={row.showPageHref}
                className="hidden sm:inline text-xs font-semibold text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
              >
                Show page
              </Link>
            )}
            <a
              href={row.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: row.color }}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All episodes</span>
            </a>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden border border-[#20205a] bg-black max-w-xl">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/videoseries?list=${row.playlistId}&modestbranding=1&rel=0`}
              title={row.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="group/row">
      <div className="flex items-baseline justify-between mb-3 px-1 gap-3">
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] mb-1" style={{ color: row.color }}>
            {row.genre}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-[#f5f7ff] truncate">{row.title}</h2>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {row.showPageHref && (
            <Link
              href={row.showPageHref}
              className="hidden sm:inline text-xs font-semibold text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
            >
              Show page
            </Link>
          )}
          <a
            href={row.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: row.color }}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All episodes</span>
          </a>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label={`Scroll ${row.title} left`}
          className="hidden md:flex absolute left-0 top-0 bottom-2 z-10 w-10 items-center justify-center bg-gradient-to-r from-[#05052d] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {row.videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setPlaying(video)}
              className="group relative shrink-0 w-[210px] sm:w-[250px] md:w-[290px] snap-start rounded-lg overflow-hidden border border-[#20205a] bg-black text-left transition-transform duration-200 ease-out hover:scale-[1.06] hover:z-10 hover:shadow-2xl hover:shadow-black/60 focus-visible:scale-[1.06] focus-visible:z-10"
            >
              <div className="aspect-video w-full relative bg-[#0c0c3f]">
                {video.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white/90 opacity-0 scale-75 transition-all group-hover:opacity-100 group-hover:scale-100">
                    <Play className="w-5 h-5 text-black" fill="currentColor" />
                  </span>
                </div>
              </div>
              <p className="p-2 text-xs leading-snug text-[#c7cae8] line-clamp-2">{video.title}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollBy(1)}
          aria-label={`Scroll ${row.title} right`}
          className="hidden md:flex absolute right-0 top-0 bottom-2 z-10 w-10 items-center justify-center bg-gradient-to-l from-[#05052d] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      <Dialog open={!!playing} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black border-[#20205a] rounded-2xl gap-0">
          <DialogTitle className="sr-only">{playing?.title ?? "Video player"}</DialogTitle>
          {playing && (
            <>
              <div
                className="flex items-center gap-2 px-4 py-3 border-b border-[#20205a]"
                style={{ backgroundColor: "#0a0a3d" }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em] shrink-0"
                  style={{ color: row.color }}
                >
                  {row.title}
                </span>
                <span className="text-[#3d3f7a]">/</span>
                <p className="text-sm text-[#e4e6fa] truncate">{playing.title}</p>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${playing.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={playing.title}
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
