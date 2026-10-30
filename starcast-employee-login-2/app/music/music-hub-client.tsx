"use client"

import { useState } from "react"
import Link from "next/link"
import {
  type BandTrackItem,
  type BandAlbumItem,
  toggleLikeTrack,
  toggleLikeAlbum,
  incrementTrackPlay,
} from "@/app/actions/band-tracks"
import { followBand, unfollowBand, type BandDirectoryEntry } from "@/app/actions/band-pages"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Music,
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
  Heart,
  Pencil,
  Users,
  UserPlus,
  UserCheck,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

import { useGlobalAudio, type GlobalTrack } from "@/components/music/global-audio-context"
import { EditTrackModal } from "@/components/music/edit-track-modal"
import { EditAlbumModal } from "@/components/music/edit-album-modal"
import { EditBandModal } from "@/components/bands/edit-band-modal"

const GENRES = ["All", "Rock", "Indie", "Metal", "Hip Hop", "Electronic", "Pop", "Country", "Acoustic", "Jazz"]
const TABS = [
  { id: "all", label: "All Tracks", icon: Music },
  { id: "albums", label: "Albums & EPs", icon: Disc3 },
  { id: "bands", label: "Bands & Artists", icon: Users },
  { id: "producers", label: "Producers & Beats", icon: Sliders },
]

interface MusicHubClientProps {
  initialTracks: BandTrackItem[]
  initialAlbums: BandAlbumItem[]
  initialBands: BandDirectoryEntry[]
  currentUser?: { id: string; name?: string; image?: string } | null
}

function formatDuration(secs: number) {
  if (!secs || isNaN(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export function MusicHubClient({
  initialTracks,
  initialAlbums,
  initialBands,
  currentUser,
}: MusicHubClientProps) {
  const [tracks, setTracks] = useState<BandTrackItem[]>(initialTracks)
  const [albums, setAlbums] = useState<BandAlbumItem[]>(initialAlbums)
  const [bands, setBands] = useState<BandDirectoryEntry[]>(initialBands)
  const [activeTab, setActiveTab] = useState<"all" | "albums" | "bands" | "producers">("all")
  const [selectedGenre, setSelectedGenre] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Edit Modals state
  const [editingTrack, setEditingTrack] = useState<BandTrackItem | null>(null)
  const [editingAlbum, setEditingAlbum] = useState<BandAlbumItem | null>(null)
  const [editingBand, setEditingBand] = useState<BandDirectoryEntry | null>(null)

  // Follow busy state per band
  const [followBusyMap, setFollowBusyMap] = useState<Record<string, boolean>>({})

  const { currentTrack, isPlaying, playTrack, togglePlay } = useGlobalAudio()

  // Track playback helper
  const handleTogglePlayTrack = (track: BandTrackItem, queueOverride?: BandTrackItem[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      incrementTrackPlay(track.id).catch(() => {})
      const gTrack: GlobalTrack = {
        id: track.id,
        title: track.title,
        audioUrl: track.audioUrl,
        artistName: track.artistName,
        bandName: track.bandName,
        bandLogo: track.bandLogo,
        coverArtUrl: track.coverArtUrl,
        slug: track.slug,
        bandSlug: track.bandSlug,
        albumName: track.albumName,
        producer: track.producer,
        durationSeconds: track.durationSeconds,
        allowDownload: track.allowDownload,
        genre: track.genre,
      }
      const queueSource = queueOverride || filteredTracks
      const queueList: GlobalTrack[] = queueSource.map((t) => ({
        id: t.id,
        title: t.title,
        audioUrl: t.audioUrl,
        artistName: t.artistName,
        bandName: t.bandName,
        bandLogo: t.bandLogo,
        coverArtUrl: t.coverArtUrl,
        slug: t.slug,
        bandSlug: t.bandSlug,
        albumName: t.albumName,
        producer: t.producer,
        durationSeconds: t.durationSeconds,
        allowDownload: t.allowDownload,
        genre: t.genre,
      }))
      playTrack(gTrack, queueList)
    }
  }

  // Like Track Handler
  const handleLikeTrack = async (e: React.MouseEvent, track: BandTrackItem) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      toast.error("Please sign in to like songs.")
      return
    }

    const wasLiked = Boolean(track.isLiked)
    const nextLiked = !wasLiked
    const nextCount = wasLiked ? Math.max(0, (track.likeCount || 1) - 1) : (track.likeCount || 0) + 1

    // Optimistic UI update
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, isLiked: nextLiked, likeCount: nextCount } : t))
    )

    try {
      const res = await toggleLikeTrack(track.id)
      if (!res.success) {
        // Rollback
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, isLiked: wasLiked, likeCount: track.likeCount } : t))
        )
        toast.error(res.error || "Failed to like song.")
      } else {
        if (nextLiked) {
          toast.success(`Liked "${track.title}"!`)
        }
      }
    } catch {
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isLiked: wasLiked, likeCount: track.likeCount } : t))
      )
      toast.error("Failed to like song.")
    }
  }

  // Like Album Handler - CRITICAL: Automatically likes all songs in that album!
  const handleLikeAlbum = async (e: React.MouseEvent, album: BandAlbumItem) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      toast.error("Please sign in to like albums.")
      return
    }

    const wasLiked = Boolean(album.isLiked)
    const nextLiked = !wasLiked
    const nextAlbumCount = wasLiked ? Math.max(0, album.likeCount - 1) : album.likeCount + 1

    // Optimistic UI update for album
    setAlbums((prev) =>
      prev.map((a) =>
        a.bandId === album.bandId && a.albumName === album.albumName
          ? { ...a, isLiked: nextLiked, likeCount: nextAlbumCount }
          : a
      )
    )

    // When liking an album, AUTOMATICALLY like all tracks in that album optimistically!
    if (nextLiked) {
      const albumTrackIdSet = new Set(album.tracks.map((t) => t.id))
      setTracks((prev) =>
        prev.map((t) => {
          if (albumTrackIdSet.has(t.id) || (t.bandId === album.bandId && t.albumName === album.albumName)) {
            return {
              ...t,
              isLiked: true,
              likeCount: t.isLiked ? t.likeCount : (t.likeCount || 0) + 1,
            }
          }
          return t
        })
      )
      toast.success(
        `Album "${album.albumName}" liked! All ${album.tracks.length} songs have been saved to your liked songs.`
      )
    }

    try {
      const res = await toggleLikeAlbum(album.bandId, album.albumName)
      if (!res.success) {
        // Rollback
        setAlbums((prev) =>
          prev.map((a) =>
            a.bandId === album.bandId && a.albumName === album.albumName
              ? { ...a, isLiked: wasLiked, likeCount: album.likeCount }
              : a
          )
        )
        toast.error(res.error || "Failed to like album.")
      }
    } catch {
      setAlbums((prev) =>
        prev.map((a) =>
          a.bandId === album.bandId && a.albumName === album.albumName
            ? { ...a, isLiked: wasLiked, likeCount: album.likeCount }
            : a
        )
      )
      toast.error("Failed to like album.")
    }
  }

  // Follow Band Handler
  const handleToggleFollowBand = async (e: React.MouseEvent, bandItem: BandDirectoryEntry) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      toast.error("Please sign in to follow acts.")
      return
    }

    if (bandItem.is_owner) {
      toast.error("You own this band page!")
      return
    }

    setFollowBusyMap((prev) => ({ ...prev, [bandItem.id]: true }))
    const wasFollowing = Boolean(bandItem.is_following)
    const nextFollowing = !wasFollowing
    const nextCount = wasFollowing
      ? Math.max(0, bandItem.follower_count - 1)
      : bandItem.follower_count + 1

    // Optimistic UI update
    setBands((prev) =>
      prev.map((b) =>
        b.id === bandItem.id ? { ...b, is_following: nextFollowing, follower_count: nextCount } : b
      )
    )

    try {
      if (wasFollowing) {
        await unfollowBand(bandItem.id)
        toast.success(`Unfollowed ${bandItem.name}`)
      } else {
        await followBand(bandItem.id)
        toast.success(`Following ${bandItem.name}! You will receive new release updates.`)
      }
    } catch (err: any) {
      // Rollback
      setBands((prev) =>
        prev.map((b) =>
          b.id === bandItem.id ? { ...b, is_following: wasFollowing, follower_count: bandItem.follower_count } : b
        )
      )
      toast.error(err?.message || "Failed to update follow status.")
    } finally {
      setFollowBusyMap((prev) => ({ ...prev, [bandItem.id]: false }))
    }
  }

  // Play full album
  const handlePlayAlbum = (album: BandAlbumItem) => {
    if (!album.tracks || album.tracks.length === 0) return
    handleTogglePlayTrack(album.tracks[0], album.tracks)
  }

  // Filtering
  const filteredTracks = tracks.filter((t) => {
    if (activeTab === "producers" && !t.producer) return false

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

  const filteredAlbums = albums.filter((a) => {
    const matchesGenre =
      selectedGenre === "All" || (a.genre && a.genre.toLowerCase().includes(selectedGenre.toLowerCase()))
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery =
      !q ||
      a.albumName.toLowerCase().includes(q) ||
      a.artistName?.toLowerCase().includes(q) ||
      a.bandName?.toLowerCase().includes(q) ||
      a.producer?.toLowerCase().includes(q)

    return matchesGenre && matchesQuery
  })

  const filteredBands = bands.filter((b) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.genre?.toLowerCase().includes(q) ||
      b.bio?.toLowerCase().includes(q)
    return matchesQuery
  })

  const trendingTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 4)

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white pb-24">
      <ResponsiveHeader currentPage="/music" />

      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden border-b border-[#20205a]/60 bg-gradient-to-b from-[#0c0c3f] via-[#080829] to-[#05051f] py-12 sm:py-16 px-4 sm:px-6">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/10 border border-[#20efe0]/30 text-xs font-mono text-[#20efe0]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>STARCAST MUSIC &amp; BEATS // FREE STREAMING</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#f5f7ff] tracking-tight leading-tight">
              Discover &amp; Stream{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0]">
                Original Music
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#9a9fc4] leading-relaxed">
              Stream free original tracks, producer beats, and full albums from bands and solo artists. Follow your favorite acts, like tracks to build your library, and support local music.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Button
                asChild
                className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold h-12 px-6 rounded-2xl shadow-xl shadow-[#ea6f2a]/25 w-full sm:w-auto"
              >
                <Link href="/bands">
                  <Users className="w-5 h-5 mr-2" /> Explore Bands &amp; Artists
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 h-12 px-6 rounded-2xl w-full sm:w-auto font-semibold"
              >
                <Link href="/portal">
                  <Sliders className="w-4 h-4 mr-2" /> Artist Studio Portal
                </Link>
              </Button>
            </div>
          </div>

          {/* Featured Track Promo Card */}
          {trendingTracks[0] && (
            <div className="w-full max-w-sm rounded-3xl p-5 border border-[#20205a] bg-[#0c0c3f]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between gap-2 mb-3 text-xs font-mono font-bold text-[#ffd166]">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#ea6f2a]" /> FEATURED TRACK
                </span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Certified Master
                </span>
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#05052d] border border-[#20205a] mb-4">
                <img
                  src={trendingTracks[0].coverArtUrl || trendingTracks[0].bandLogo || "/placeholder.svg"}
                  alt={trendingTracks[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => handleTogglePlayTrack(trendingTracks[0])}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 hover:scale-110"
                >
                  {currentTrack?.id === trendingTracks[0].id && isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/music/${trendingTracks[0].slug || trendingTracks[0].id}`}
                    className="font-bold text-base text-[#f5f7ff] hover:text-[#20efe0] transition-colors line-clamp-1"
                  >
                    {trendingTracks[0].title}
                  </Link>

                  <button
                    onClick={(e) => handleLikeTrack(e, trendingTracks[0])}
                    className="p-1 rounded-lg text-[#9a9fc4] hover:text-rose-400 transition-colors shrink-0"
                    title={trendingTracks[0].isLiked ? "Unlike song" : "Like song"}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        trendingTracks[0].isLiked ? "text-rose-500 fill-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-[#9a9fc4] truncate">
                  {trendingTracks[0].artistName || trendingTracks[0].bandName}
                </p>
                {trendingTracks[0].producer && (
                  <p className="text-[11px] text-[#ffd166] flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> Prod. {trendingTracks[0].producer}
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

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#20205a] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white shadow-lg shadow-[#ea6f2a]/20"
                      : "bg-[#0c0c3f] text-[#9a9fc4] border border-[#20205a] hover:text-[#f5f7ff] hover:border-[#20efe0]/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === "all" && <Badge className="ml-1 bg-black/40 text-[10px]">{tracks.length}</Badge>}
                  {tab.id === "albums" && <Badge className="ml-1 bg-black/40 text-[10px]">{albums.length}</Badge>}
                  {tab.id === "bands" && <Badge className="ml-1 bg-black/40 text-[10px]">{bands.length}</Badge>}
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#9a9fc4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, producers, albums..."
              className="pl-10 h-10 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] rounded-xl text-xs placeholder:text-[#7f84ad]"
            />
          </div>
        </div>

        {/* Genre Filter Pills (visible on tracks and albums tabs) */}
        {activeTab !== "bands" && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedGenre === g
                    ? "bg-[#20efe0] text-[#05051f] border-[#20efe0] shadow-md shadow-[#20efe0]/20"
                    : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50 hover:text-[#f5f7ff]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* ── TAB 1: ALL TRACKS / PRODUCER BEATS ── */}
        {(activeTab === "all" || activeTab === "producers") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                <Music className="w-5 h-5 text-[#ea6f2a]" />
                {activeTab === "producers" ? "Producer Beats & Instrumentals" : "Individual Tracks & Singles"}
                <span className="text-xs text-[#9a9fc4] font-normal">({filteredTracks.length})</span>
              </h2>
            </div>

            {filteredTracks.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
                  <Music className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f7ff]">No Songs Found</h3>
                <p className="text-xs text-[#9a9fc4] max-w-md mx-auto">
                  Try searching for a different track title, or clear your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredTracks.map((track) => {
                  const isThisPlaying = currentTrack?.id === track.id && isPlaying
                  const cover = track.coverArtUrl || track.bandLogo || "/placeholder.svg"

                  return (
                    <div
                      key={track.id}
                      className={`rounded-2xl border bg-[#0c0c3f]/70 overflow-hidden flex flex-col justify-between transition-all group hover:border-[#20efe0]/50 hover:shadow-[0_0_25px_rgba(32,239,224,0.12)] ${
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        {/* Play button overlay */}
                        <button
                          onClick={() => handleTogglePlayTrack(track)}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 group-hover:scale-110"
                          aria-label="Play track"
                        >
                          {isThisPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Duration badge */}
                        {track.durationSeconds > 0 && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/85 backdrop-blur-md text-[10px] font-mono font-semibold text-[#f5f7ff]">
                            {formatDuration(track.durationSeconds)}
                          </span>
                        )}

                        {/* Genre tag */}
                        {track.genre && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/85 backdrop-blur-md border border-[#20efe0]/30 text-[10px] font-mono text-[#20efe0]">
                            {track.genre}
                          </span>
                        )}

                        {/* Owner / Admin Quick Edit button */}
                        {track.canEdit && (
                          <button
                            onClick={() => setEditingTrack(track)}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#05051f]/85 backdrop-blur-md border border-[#20205a] text-[#ffd166] hover:text-white hover:border-[#ffd166] transition-colors"
                            title="Edit Song Info (Owner / Admin)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <Link
                            href={`/music/${track.slug || track.id}`}
                            className="font-bold text-sm sm:text-base text-[#f5f7ff] hover:text-[#20efe0] transition-colors line-clamp-1 block"
                          >
                            {track.title}
                          </Link>

                          <div className="flex items-center justify-between text-xs text-[#ffd166] font-semibold">
                            {track.bandSlug ? (
                              <Link
                                href={`/bands/${track.bandSlug}`}
                                className="hover:underline truncate max-w-[180px]"
                              >
                                {track.artistName || track.bandName || "StarCast Artist"}
                              </Link>
                            ) : (
                              <span className="truncate">{track.artistName || track.bandName || "Artist"}</span>
                            )}
                          </div>

                          {track.producer && (
                            <p className="text-[11px] text-[#9a9fc4] truncate flex items-center gap-1">
                              <Sliders className="w-3 h-3 text-[#ffd166]" /> Prod. {track.producer}
                            </p>
                          )}

                          {track.albumName && (
                            <p className="text-[11px] text-[#20efe0] truncate flex items-center gap-1">
                              <Disc3 className="w-3 h-3" /> {track.albumName}
                            </p>
                          )}
                        </div>

                        {/* Social rail: Likes, Plays, Song Page */}
                        <div className="pt-2.5 border-t border-[#20205a]/60 flex items-center justify-between text-xs text-[#9a9fc4]">
                          <div className="flex items-center gap-3">
                            {/* Like button */}
                            <button
                              onClick={(e) => handleLikeTrack(e, track)}
                              className={`flex items-center gap-1 text-xs transition-colors hover:text-rose-400 ${
                                track.isLiked ? "text-rose-500 font-bold" : "text-[#9a9fc4]"
                              }`}
                              title={track.isLiked ? "Unlike song" : "Like song"}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  track.isLiked ? "fill-rose-500 text-rose-500" : ""
                                }`}
                              />
                              <span>{track.likeCount || 0}</span>
                            </button>

                            {/* Play count */}
                            <span className="flex items-center gap-1 text-[#20efe0]">
                              <Headphones className="w-3 h-3" /> {track.playCount || 0}
                            </span>
                          </div>

                          <Link
                            href={`/music/${track.slug || track.id}`}
                            className="text-[#ea6f2a] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                          >
                            Details <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ALBUMS & EPS (WITH ALBUM LIKING) ── */}
        {activeTab === "albums" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-[#20efe0]" /> Albums &amp; EPs
                  <span className="text-xs text-[#9a9fc4] font-normal">({filteredAlbums.length})</span>
                </h2>
                <p className="text-xs text-[#9a9fc4] mt-0.5">
                  Liking an album automatically likes and saves all songs in that album to your collection!
                </p>
              </div>
            </div>

            {filteredAlbums.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#20efe0]/10 border border-[#20efe0]/30 flex items-center justify-center mx-auto text-[#20efe0]">
                  <Disc3 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f7ff]">No Albums Found</h3>
                <p className="text-xs text-[#9a9fc4] max-w-md mx-auto">
                  Acts can publish multi-track albums and collections directly from their portal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAlbums.map((album) => {
                  const cover = album.coverArtUrl || album.bandLogo || "/placeholder.svg"

                  return (
                    <div
                      key={`${album.bandId}:::${album.albumName}`}
                      className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 overflow-hidden flex flex-col justify-between group hover:border-[#20efe0]/50 transition-all shadow-lg"
                    >
                      {/* Album Artwork */}
                      <div className="relative aspect-square w-full bg-[#05052d] overflow-hidden">
                        <img
                          src={cover}
                          alt={album.albumName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                        {/* Play full album button */}
                        <button
                          onClick={() => handlePlayAlbum(album)}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#20efe0] text-[#05051f] flex items-center justify-center shadow-2xl transition-transform active:scale-95 group-hover:scale-110 font-bold"
                          title="Play entire album"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>

                        {/* Track Count Badge */}
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/85 backdrop-blur-md text-[10px] font-mono font-bold text-[#ffd166]">
                          {album.tracks.length} {album.tracks.length === 1 ? "Track" : "Tracks"}
                        </span>

                        {/* Release Year */}
                        {album.releaseYear && (
                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#05051f]/85 backdrop-blur-md text-[10px] font-mono text-[#9a9fc4]">
                            {album.releaseYear}
                          </span>
                        )}

                        {/* Owner / Admin Edit Album button */}
                        {album.canEdit && (
                          <button
                            onClick={() => setEditingAlbum(album)}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#05051f]/85 backdrop-blur-md border border-[#20205a] text-[#ffd166] hover:text-white hover:border-[#ffd166] transition-colors"
                            title="Edit Album (Owner / Admin)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Info & Action rail */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-[#f5f7ff] truncate">{album.albumName}</h3>
                          <div className="text-xs text-[#ffd166] font-semibold truncate">
                            {album.bandSlug ? (
                              <Link href={`/bands/${album.bandSlug}`} className="hover:underline">
                                {album.artistName || album.bandName || "Artist"}
                              </Link>
                            ) : (
                              album.artistName || album.bandName || "Artist"
                            )}
                          </div>
                          {album.genre && <p className="text-[11px] text-[#9a9fc4]">{album.genre}</p>}
                        </div>

                        {/* Album Action Buttons */}
                        <div className="pt-3 border-t border-[#20205a]/60 flex items-center justify-between">
                          {/* Like Album button */}
                          <button
                            onClick={(e) => handleLikeAlbum(e, album)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                              album.isLiked
                                ? "bg-rose-500/15 border-rose-500/50 text-rose-400"
                                : "bg-[#05051f] border-[#20205a] text-[#9a9fc4] hover:text-rose-400 hover:border-rose-500/40"
                            }`}
                            title="Like album (automatically likes all songs in it!)"
                          >
                            <Heart className={`w-3.5 h-3.5 ${album.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                            <span>{album.likeCount || 0} Likes</span>
                          </button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePlayAlbum(album)}
                            className="text-xs text-[#20efe0] hover:bg-[#20efe0]/15 h-8 px-2.5"
                          >
                            Listen <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: BANDS & ARTISTS DIRECTORY ── */}
        {activeTab === "bands" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#ea6f2a]" /> Bands, Solo Artists &amp; Producers
                  <span className="text-xs text-[#9a9fc4] font-normal">({filteredBands.length})</span>
                </h2>
                <p className="text-xs text-[#9a9fc4] mt-0.5">
                  Follow acts to receive automatic notifications and updates in your community feed whenever they drop new music.
                </p>
              </div>
            </div>

            {filteredBands.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f7ff]">No Bands Found</h3>
                <p className="text-xs text-[#9a9fc4] max-w-md mx-auto">
                  Try a different search query or explore the directory.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBands.map((bandItem) => {
                  const avatar = bandItem.logo_url || "/placeholder.svg"
                  const isFollowing = Boolean(bandItem.is_following)
                  const busy = followBusyMap[bandItem.id]

                  return (
                    <div
                      key={bandItem.id}
                      className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/80 overflow-hidden flex flex-col justify-between group hover:border-[#ea6f2a]/50 transition-all shadow-lg p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#05051f] border border-[#20205a] shrink-0">
                            <img src={avatar} alt={bandItem.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <Link
                              href={`/bands/${bandItem.slug}`}
                              className="font-bold text-sm sm:text-base text-[#f5f7ff] hover:text-[#20efe0] transition-colors line-clamp-1 block"
                            >
                              {bandItem.name}
                            </Link>
                            <span className="text-[11px] text-[#ffd166] capitalize">
                              {bandItem.type || "Band"} • {bandItem.genre || "Music"}
                            </span>
                          </div>
                        </div>

                        {/* Owner / Admin Edit Band button */}
                        {bandItem.is_owner && (
                          <button
                            onClick={() => setEditingBand(bandItem)}
                            className="p-1.5 rounded-lg bg-[#05051f] border border-[#20205a] text-[#ffd166] hover:text-white transition-colors"
                            title="Edit Band (Owner / Admin)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {bandItem.bio && (
                        <p className="text-xs text-[#9a9fc4] line-clamp-2 leading-relaxed">
                          {bandItem.bio}
                        </p>
                      )}

                      <div className="pt-3 border-t border-[#20205a]/60 flex items-center justify-between">
                        <span className="text-xs text-[#9a9fc4]">
                          <strong className="text-[#f5f7ff] font-bold">{bandItem.follower_count}</strong>{" "}
                          {bandItem.follower_count === 1 ? "follower" : "followers"}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Follow Button */}
                          {!bandItem.is_owner && (
                            <Button
                              size="sm"
                              variant={isFollowing ? "outline" : "default"}
                              disabled={busy}
                              onClick={(e) => handleToggleFollowBand(e, bandItem)}
                              className={`text-xs h-8 px-3 rounded-xl font-semibold transition-all ${
                                isFollowing
                                  ? "border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15"
                                  : "bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white shadow-md shadow-[#ea6f2a]/20"
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 mr-1 text-[#20efe0]" /> Following
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Follow
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 px-2 text-[#9a9fc4] hover:text-[#f5f7ff]"
                          >
                            <Link href={`/bands/${bandItem.slug}`}>Page</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODALS FOR EDITING ── */}
      {/* 1. Edit Track Modal */}
      <EditTrackModal
        track={editingTrack}
        isOpen={Boolean(editingTrack)}
        onClose={() => setEditingTrack(null)}
        onSaved={(updated) => {
          setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        }}
      />

      {/* 2. Edit Album Modal */}
      <EditAlbumModal
        album={editingAlbum}
        isOpen={Boolean(editingAlbum)}
        onClose={() => setEditingAlbum(null)}
        onSaved={(newName, newCover) => {
          if (editingAlbum) {
            setAlbums((prev) =>
              prev.map((a) =>
                a.bandId === editingAlbum.bandId && a.albumName === editingAlbum.albumName
                  ? { ...a, albumName: newName, coverArtUrl: newCover || a.coverArtUrl }
                  : a
              )
            )
            setTracks((prev) =>
              prev.map((t) =>
                t.bandId === editingAlbum.bandId && t.albumName === editingAlbum.albumName
                  ? { ...t, albumName: newName, coverArtUrl: newCover || t.coverArtUrl }
                  : t
              )
            )
          }
        }}
      />

      {/* 3. Edit Band Modal */}
      <EditBandModal
        band={editingBand}
        isOpen={Boolean(editingBand)}
        onClose={() => setEditingBand(null)}
        onSaved={(updated) => {
          setBands((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
        }}
      />

      <Footer />
    </div>
  )
}
