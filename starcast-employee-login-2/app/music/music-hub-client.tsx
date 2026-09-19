"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { type BandTrackItem, incrementTrackPlay } from "@/app/actions/band-tracks"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UploadSongModal } from "@/components/music/upload-song-modal"
import {
  Music,
  Plus,
  Play,
  Pause,
  Search,
  Headphones,
  Sliders,
  Sparkles,
  Radio,
  Disc3,
  ExternalLink,
  Flame,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react"

const GENRES = ["All", "Rock", "Indie", "Metal", "Hip Hop", "Electronic", "Pop", "Country", "Acoustic", "Jazz"]

interface MusicHubClientProps {
  initialTracks: BandTrackItem[]
}

function formatDuration(secs: number) {
  if (!secs || isNaN(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export function MusicHubClient({ initialTracks }: MusicHubClientProps) {
  const [tracks, setTracks] = useState<BandTrackItem[]>(initialTracks)
  const [selectedGenre, setSelectedGenre] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Floating Player Preview State
  const [activeTrack, setActiveTrack] = useState<BandTrackItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredTracks = tracks.filter((t) => {
    const matchesGenre =
      selectedGenre === "All" || (t.genre && t.genre.toLowerCase().includes(selectedGenre.toLowerCase()))

    const q = searchQuery.toLowerCase().trim()
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.artistName?.toLowerCase().includes(q) ||
      t.producer?.toLowerCase().includes(q) ||
      t.bandName?.toLowerCase().includes(q) ||
      t.albumName?.toLowerCase().includes(q)

    return matchesGenre && matchesQuery
  })

  const trendingTracks = [...tracks].sort((a, b) => b.playCount - a.playCount).slice(0, 4)

  const handleTogglePreview = (track: BandTrackItem) => {
    if (activeTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setActiveTrack(track)
      setIsPlaying(true)
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl
        audioRef.current.play().then(() => {
          incrementTrackPlay(track.id)
        }).catch(() => setIsPlaying(false))
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/music" />

      {/* Hidden Global Audio Element for Quick Previews */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden border-b border-[#20205a]/60 bg-gradient-to-b from-[#0c0c3f] via-[#080829] to-[#05051f] py-12 sm:py-20 px-4 sm:px-6">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/10 border border-[#20efe0]/30 text-xs font-mono text-[#20efe0]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>STARCAST SOUNDSTAGE AUDIO // FREE STREAMING</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#f5f7ff] tracking-tight leading-tight">
              Listen &amp; Release <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0]">Original Music</span>
            </h1>

            <p className="text-sm sm:text-base text-[#9a9fc4] leading-relaxed">
              Stream free original singles, studio cuts, and demo tapes from local artists and bands. Each song gets its own dedicated standalone player page!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold h-12 px-6 rounded-2xl shadow-xl shadow-[#ea6f2a]/25 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" /> Upload Song / Release
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 h-12 px-6 rounded-2xl w-full sm:w-auto font-semibold"
              >
                <Link href="/bands">
                  <Disc3 className="w-4 h-4 mr-2" /> Explore Artist Soundstages
                </Link>
              </Button>
            </div>
          </div>

          {/* Featured Vinyl Promo Card */}
          {trendingTracks[0] && (
            <div className="w-full max-w-sm rounded-3xl p-5 border border-[#20205a] bg-[#0c0c3f]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-[#ffd166]">
                <Flame className="w-4 h-4 text-[#ea6f2a]" /> FEATURED SOUNDSTAGE RELEASE
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#05052d] border border-[#20205a] mb-4">
                <img
                  src={trendingTracks[0].coverArtUrl || trendingTracks[0].bandLogo || "/placeholder.svg"}
                  alt={trendingTracks[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => handleTogglePreview(trendingTracks[0])}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 hover:scale-110"
                >
                  {activeTrack?.id === trendingTracks[0].id && isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <Link
                  href={`/music/${trendingTracks[0].slug || trendingTracks[0].id}`}
                  className="font-bold text-base text-[#f5f7ff] hover:text-[#20efe0] transition-colors line-clamp-1"
                >
                  {trendingTracks[0].title}
                </Link>
                <p className="text-xs text-[#9a9fc4] truncate">
                  {trendingTracks[0].artistName || trendingTracks[0].bandName}
                </p>
                {trendingTracks[0].producer && (
                  <p className="text-[11px] text-[#ffd166] flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> {trendingTracks[0].producer}
                  </p>
                )}
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full mt-4 border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 text-xs rounded-xl"
              >
                <Link href={`/music/${trendingTracks[0].slug || trendingTracks[0].id}`}>
                  Open Dedicated Song Page <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT: SEARCH, FILTERS & TRACK GRID ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Search & Genre Filters Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9a9fc4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song, artist, producer, or album..."
              className="pl-10 h-11 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] rounded-2xl text-xs sm:text-sm placeholder:text-[#7f84ad]"
            />
          </div>

          {/* Quick upload button */}
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-2xl h-11 px-5 shadow-md shadow-[#ea6f2a]/20 shrink-0 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Upload Song
          </Button>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedGenre === g
                  ? "bg-[#20efe0] text-[#05051f] border-[#20efe0] shadow-md shadow-[#20efe0]/20"
                  : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50 hover:text-[#f5f7ff]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* ── TRACKS GRID ── */}
        {filteredTracks.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
              <Music className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#f5f7ff]">No Songs Found</h2>
            <p className="text-sm text-[#9a9fc4] max-w-md mx-auto">
              {searchQuery || selectedGenre !== "All"
                ? "Try searching for a different song title or clearing your genre filter."
                : "Be the first artist to upload a song on StarCast Online!"}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-11 px-5"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Upload First Song
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTracks.map((track) => {
              const isThisPlaying = activeTrack?.id === track.id && isPlaying
              const cover = track.coverArtUrl || track.bandLogo || "/placeholder.svg"

              return (
                <div
                  key={track.id}
                  className={`rounded-2xl border bg-[#0c0c3f]/70 overflow-hidden flex flex-col transition-all group hover:border-[#20efe0]/50 hover:shadow-[0_0_25px_rgba(32,239,224,0.12)] ${
                    isThisPlaying ? "border-[#20efe0] ring-1 ring-[#20efe0]" : "border-[#20205a]"
                  }`}
                >
                  {/* Artwork Container & Play Overlay */}
                  <div className="relative aspect-square w-full bg-[#05052d] overflow-hidden">
                    <img
                      src={cover}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Play / Pause button overlay */}
                    <button
                      onClick={() => handleTogglePreview(track)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 group-hover:scale-110"
                      aria-label="Play track preview"
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Duration badge */}
                    {track.durationSeconds > 0 && (
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/80 backdrop-blur-md text-[10px] font-mono font-semibold text-[#f5f7ff]">
                        {formatDuration(track.durationSeconds)}
                      </span>
                    )}

                    {/* Genre tag */}
                    {track.genre && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/80 backdrop-blur-md border border-[#20efe0]/30 text-[10px] font-mono text-[#20efe0]">
                        {track.genre}
                      </span>
                    )}
                  </div>

                  {/* Metadata & Links */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <Link
                        href={`/music/${track.slug || track.id}`}
                        className="font-bold text-sm sm:text-base text-[#f5f7ff] hover:text-[#20efe0] transition-colors line-clamp-1 block"
                      >
                        {track.title}
                      </Link>
                      <p className="text-xs text-[#ffd166] font-semibold truncate">
                        {track.artistName || track.bandName || "StarCast Artist"}
                      </p>
                      {track.producer && (
                        <p className="text-[11px] text-[#9a9fc4] truncate flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-[#ffd166]" /> Prod. {track.producer}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#20205a]/60 flex items-center justify-between text-xs text-[#9a9fc4]">
                      <span className="flex items-center gap-1 text-[#20efe0]">
                        <Headphones className="w-3 h-3" /> {track.playCount}
                      </span>
                      <Link
                        href={`/music/${track.slug || track.id}`}
                        className="text-[#ea6f2a] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        Song Page <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Upload Song Modal */}
      <UploadSongModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />

      <Footer />
    </div>
  )
}
