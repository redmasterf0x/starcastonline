"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type BandTrackItem,
  type BandAlbumItem,
  toggleLikeTrack,
  toggleLikeAlbum,
  incrementTrackPlay,
} from "@/app/actions/band-tracks"
import {
  type BandDirectoryEntry,
  followBand,
  unfollowBand,
} from "@/app/actions/band-pages"
import { createBand } from "@/app/actions/bands"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditTrackModal } from "@/components/music/edit-track-modal"
import { EditAlbumModal } from "@/components/music/edit-album-modal"
import { UploadSongModal } from "@/components/music/upload-song-modal"
import { EditBandModal } from "@/components/bands/edit-band-modal"
import { BandShareModal } from "@/components/bands/band-share-modal"
import { toast } from "sonner"
import {
  Music,
  Play,
  Pause,
  Search,
  Headphones,
  Sliders,
  Radio,
  Disc3,
  ExternalLink,
  Flame,
  ArrowRight,
  Heart,
  Users,
  ChevronRight,
  ShieldCheck,
  Pencil,
  Upload,
  Plus,
  Bell,
  BellRing,
  Share2,
  User,
  Loader2,
} from "lucide-react"

import { useGlobalAudio, type GlobalTrack } from "@/components/music/global-audio-context"

const GENRES = ["All", "Rock", "Indie", "Metal", "Hip Hop", "Electronic", "Pop", "Country", "Acoustic", "Jazz"]

const TABS = [
  { id: "all", label: "Songs & Singles", icon: Music },
  { id: "artists", label: "Artists, Bands, Producers & DJs", icon: Users },
  { id: "albums", label: "Albums & EPs", icon: Disc3 },
  { id: "producers", label: "Producer Beats", icon: Sliders },
]

const ACT_TYPE_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "artist", label: "Artist Pages" },
  { value: "band", label: "Band Pages" },
  { value: "producer", label: "Producer Pages" },
  { value: "dj", label: "DJ Pages" },
]

export function getActPageLabel(type?: string) {
  switch ((type || "").toLowerCase()) {
    case "artist":
      return "Artist Page"
    case "producer":
      return "Producer Page"
    case "dj":
      return "DJ Page"
    default:
      return "Band Page"
  }
}

interface MusicHubClientProps {
  initialTracks: BandTrackItem[]
  initialAlbums: BandAlbumItem[]
  initialBands?: BandDirectoryEntry[]
  myBands?: any[]
  currentUser?: { id: string; name?: string; image?: string } | null
  isAdmin?: boolean
  initialTab?: "all" | "artists" | "albums" | "producers"
  initialActType?: string
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
  initialBands = [],
  myBands = [],
  currentUser,
  isAdmin = false,
  initialTab = "all",
  initialActType = "all",
}: MusicHubClientProps) {
  const router = useRouter()
  const [tracks, setTracks] = useState<BandTrackItem[]>(initialTracks)
  const [albums, setAlbums] = useState<BandAlbumItem[]>(initialAlbums)
  const [bands, setBands] = useState<BandDirectoryEntry[]>(initialBands)
  const [activeTab, setActiveTab] = useState<"all" | "artists" | "albums" | "producers">(initialTab)
  const [selectedGenre, setSelectedGenre] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Artists / Bands / Producers / DJs filters
  const [actTypeFilter, setActTypeFilter] = useState<string>(initialActType)
  const [actSortBy, setActSortBy] = useState<"followers" | "name" | "newest">("followers")
  const [shareBand, setShareBand] = useState<BandDirectoryEntry | null>(null)

  // Modals for Editing & Uploading
  const [editingTrack, setEditingTrack] = useState<BandTrackItem | null>(null)
  const [editingAlbum, setEditingAlbum] = useState<BandAlbumItem | null>(null)
  const [editingBand, setEditingBand] = useState<BandDirectoryEntry | null>(null)
  const [uploadSongOpen, setUploadSongOpen] = useState(false)

  // Create New Artist / Band / Producer / DJ Page Modal
  const [createPageOpen, setCreatePageOpen] = useState(false)
  const [creatingPage, setCreatingPage] = useState(false)
  const [newPageType, setNewPageType] = useState<"artist" | "band" | "producer" | "dj">("artist")
  const [newPageName, setNewPageName] = useState("")
  const [newPageGenre, setNewPageGenre] = useState("")
  const [newPageBio, setNewPageBio] = useState("")
  const [newPageLogo, setNewPageLogo] = useState("")
  const [newPageBanner, setNewPageBanner] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const { currentTrack, isPlaying, playTrack, togglePlay } = useGlobalAudio()

  const userOwnedBand = myBands && myBands.length > 0 ? myBands[0] : bands.find((b) => b.is_owner && !isAdmin)

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

    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, isLiked: nextLiked, likeCount: nextCount } : t))
    )

    try {
      const res = await toggleLikeTrack(track.id)
      if (!res.success) {
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, isLiked: wasLiked, likeCount: track.likeCount } : t))
        )
        toast.error(res.error || "Failed to like song.")
      } else if (nextLiked) {
        toast.success(`Liked "${track.title}"!`)
      }
    } catch {
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isLiked: wasLiked, likeCount: track.likeCount } : t))
      )
      toast.error("Failed to like song.")
    }
  }

  // Like Album Handler - AUTOMATICALLY likes all songs in that album
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

    setAlbums((prev) =>
      prev.map((a) =>
        a.bandId === album.bandId && a.albumName === album.albumName
          ? { ...a, isLiked: nextLiked, likeCount: nextAlbumCount }
          : a
      )
    )

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

  // Follow / Unfollow Artist, Band, Producer, or DJ
  const handleToggleFollowBand = async (band: BandDirectoryEntry) => {
    if (!currentUser) {
      toast.error("Please sign in to follow artists & bands.")
      return
    }

    const next = !band.is_following
    setBands((prev) =>
      prev.map((b) =>
        b.id === band.id
          ? {
              ...b,
              is_following: next,
              follower_count: Math.max(0, b.follower_count + (next ? 1 : -1)),
            }
          : b
      )
    )

    try {
      if (next) {
        await followBand(band.id)
        toast.success(`Following ${band.name}!`, {
          description: "You'll get notified whenever they drop new music or updates.",
        })
      } else {
        await unfollowBand(band.id)
        toast.info(`Unfollowed ${band.name}`)
      }
    } catch (e: any) {
      setBands((prev) =>
        prev.map((b) =>
          b.id === band.id
            ? {
                ...b,
                is_following: !next,
                follower_count: Math.max(0, b.follower_count + (!next ? 1 : -1)),
              }
            : b
        )
      )
      toast.error(e?.message || "Failed to update follow status.")
    }
  }

  // Upload image helper for Create Page modal
  const handleUploadImage = async (file: File, kind: "logo" | "banner") => {
    if (kind === "logo") setUploadingLogo(true)
    else setUploadingBanner(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", kind === "logo" ? "bands/logos" : "bands/banners")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      if (kind === "logo") setNewPageLogo(data.url)
      else setNewPageBanner(data.url)
      toast.success(`${kind === "logo" ? "Avatar" : "Banner"} uploaded!`)
    } catch (e: any) {
      toast.error(e?.message || "Image upload failed")
    } finally {
      if (kind === "logo") setUploadingLogo(false)
      else setUploadingBanner(false)
    }
  }

  const handleCreatePage = async () => {
    if (!newPageName.trim()) {
      toast.error("Please enter a name for your page.")
      return
    }
    setCreatingPage(true)
    try {
      const res: any = await createBand({
        name: newPageName.trim(),
        type: newPageType,
        genre: newPageGenre.trim() || undefined,
        bio: newPageBio.trim() || undefined,
        logoUrl: newPageLogo || undefined,
        bannerUrl: newPageBanner || undefined,
      })
      if (!res?.success) {
        toast.error(res?.error || "Could not create page")
        return
      }
      toast.success(`Your ${getActPageLabel(newPageType)} is live!`)
      setCreatePageOpen(false)
      const slug = res.band?.slug || res.slug
      if (slug) {
        router.push(`/bands/${slug}`)
      } else {
        router.refresh()
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to create page")
    } finally {
      setCreatingPage(false)
    }
  }

  // Play full album
  const handlePlayAlbum = (album: BandAlbumItem) => {
    if (!album.tracks || album.tracks.length === 0) return
    handleTogglePlayTrack(album.tracks[0], album.tracks)
  }

  // Filtering Tracks
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

  // Filtering Albums
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

  // Filtering Artists, Bands, Producers & DJs
  const filteredBands = useMemo(() => {
    let result = [...bands]

    if (actTypeFilter !== "all") {
      result = result.filter((b) => (b.type || "band").toLowerCase() === actTypeFilter.toLowerCase())
    }

    if (selectedGenre !== "All") {
      result = result.filter(
        (b) => b.genre && b.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.genre && b.genre.toLowerCase().includes(q)) ||
          (b.bio && b.bio.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      if (actSortBy === "followers") return b.follower_count - a.follower_count
      if (actSortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [bands, actTypeFilter, selectedGenre, searchQuery, actSortBy])

  const trendingTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 4)

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white pb-24">
      <ResponsiveHeader currentPage="/music" />

      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden border-b border-[#20205a]/60 bg-gradient-to-b from-[#0c0c3f] via-[#080829] to-[#05051f] py-10 sm:py-14 px-4 sm:px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/10 border border-[#20efe0]/30 text-xs font-mono text-[#20efe0]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>STARCAST MUSIC // ARTISTS, BANDS, PRODUCERS &amp; DJS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#f5f7ff] tracking-tight leading-tight">
              Songs, Albums &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0]">
                Artist Pages
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#9a9fc4] leading-relaxed">
              Stream original tracks, beats, and albums in one place. Follow Artist Pages, Band Pages, Producer Pages, and DJ Pages — liking an album automatically likes all songs inside it.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <Button
                onClick={() => {
                  if (!currentUser) {
                    router.push("/login?redirect=/music")
                    return
                  }
                  setUploadSongOpen(true)
                }}
                className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold h-11 px-5 rounded-2xl shadow-xl shadow-[#ea6f2a]/25 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Song / Track
              </Button>

              {userOwnedBand?.slug ? (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#20efe0]/40 bg-[#0c0c3f]/60 text-[#20efe0] hover:bg-[#20efe0]/15 h-11 px-5 rounded-2xl font-semibold"
                >
                  <Link href={`/bands/${userOwnedBand.slug}`}>
                    <User className="w-4 h-4 mr-2" /> My {getActPageLabel(userOwnedBand.type)} ({userOwnedBand.name})
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!currentUser) {
                      router.push("/login?redirect=/music")
                      return
                    }
                    setCreatePageOpen(true)
                  }}
                  className="border-[#20efe0]/40 bg-[#0c0c3f]/60 text-[#20efe0] hover:bg-[#20efe0]/15 h-11 px-5 rounded-2xl font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Artist / Band / Producer / DJ Page
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setActiveTab("artists")}
                className="text-xs font-bold text-[#ffd166] hover:text-white hover:bg-white/10 h-11 px-4 rounded-2xl cursor-pointer"
              >
                <Users className="w-4 h-4 mr-1.5" /> Browse All {bands.length} Pages →
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
                <div className="flex items-center gap-2">
                  {(isAdmin || trendingTracks[0].canEdit) && (
                    <button
                      onClick={() => setEditingTrack(trendingTracks[0])}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-[#ffd166]/20 text-[#ffd166] text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Master
                  </span>
                </div>
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
                  Open Song Page <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Unified Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#20205a] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white shadow-lg shadow-[#ea6f2a]/20"
                      : "bg-[#0c0c3f] text-[#9a9fc4] border border-[#20205a] hover:text-[#f5f7ff] hover:border-[#20efe0]/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === "all" && <Badge className="ml-1 bg-black/40 text-[10px]">{tracks.length}</Badge>}
                  {tab.id === "artists" && <Badge className="ml-1 bg-black/40 text-[10px]">{bands.length}</Badge>}
                  {tab.id === "albums" && <Badge className="ml-1 bg-black/40 text-[10px]">{albums.length}</Badge>}
                  {tab.id === "producers" && (
                    <Badge className="ml-1 bg-black/40 text-[10px]">
                      {tracks.filter((t) => Boolean(t.producer)).length}
                    </Badge>
                  )}
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
              placeholder="Search songs, artists, bands, producers, DJs..."
              className="pl-10 h-10 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] rounded-xl text-xs placeholder:text-[#7f84ad]"
            />
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                selectedGenre === g
                  ? "bg-[#20efe0] text-[#05051f] border-[#20efe0] shadow-md shadow-[#20efe0]/20"
                  : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50 hover:text-[#f5f7ff]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* ── QUICK SPOTLIGHT ROW OF ARTISTS, BANDS, PRODUCERS & DJS (when on 'all' tab) ── */}
        {activeTab === "all" && bands.length > 0 && !searchQuery && selectedGenre === "All" && (
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#20efe0]" />
                Featured Artists, Bands, Producers &amp; DJs
              </h2>
              <button
                onClick={() => setActiveTab("artists")}
                className="text-xs font-semibold text-[#20efe0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All {bands.length} Pages</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {bands.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="group relative rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 hover:border-[#20efe0]/50 p-3.5 flex flex-col items-center text-center transition-all hover:shadow-[0_0_20px_rgba(32,239,224,0.1)]"
                >
                  {(isAdmin || act.is_owner) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingBand(act)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#05051f]/80 border border-[#ffd166]/40 text-[#ffd166] hover:bg-[#ffd166] hover:text-[#05051f] transition-colors z-10"
                      title="Edit Page"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}

                  <Link href={`/bands/${act.slug}`} className="flex flex-col items-center w-full">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#05052d] border border-[#20205a] mb-2.5 group-hover:scale-105 transition-transform">
                      {act.logo_url ? (
                        <img src={act.logo_url} alt={act.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#ea6f2a]">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-white truncate w-full group-hover:text-[#20efe0] transition-colors">
                      {act.name}
                    </h3>
                    <span className="text-[10px] font-mono text-[#ffd166] mt-0.5">
                      {getActPageLabel(act.type)}
                    </span>
                  </Link>

                  <button
                    onClick={() => handleToggleFollowBand(act)}
                    className={`mt-2.5 w-full py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      act.is_following
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30 hover:bg-[#ea6f2a] hover:text-white"
                    }`}
                  >
                    {act.is_following ? "Following" : "+ Follow"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 1 & 4: TRACKS (ALL TRACKS / PRODUCER BEATS) ── */}
        {(activeTab === "all" || activeTab === "producers") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                <Music className="w-5 h-5 text-[#ea6f2a]" />
                {activeTab === "producers" ? "Producer Beats & Instrumentals" : "Songs & Singles"}
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

                        {/* Edit Song Button (Owner or Admin) */}
                        {(isAdmin || track.canEdit) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setEditingTrack(track)
                            }}
                            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-lg bg-[#05051f]/90 border border-[#ffd166]/50 text-[#ffd166] hover:bg-[#ffd166] hover:text-[#05051f] text-[10px] font-bold flex items-center gap-1 shadow-lg transition-colors cursor-pointer"
                            title="Edit song thumbnail, title, or info"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        )}

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
                                {track.artistName || track.bandName || "Artist"}
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
                            <button
                              onClick={(e) => handleLikeTrack(e, track)}
                              className={`flex items-center gap-1 text-xs transition-colors hover:text-rose-400 cursor-pointer ${
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

                            <span className="flex items-center gap-1 text-[#20efe0]">
                              <Headphones className="w-3 h-3" /> {track.playCount || 0}
                            </span>
                          </div>

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
          </div>
        )}

        {/* ── TAB 2: ARTISTS, BANDS, PRODUCERS & DJS ── */}
        {activeTab === "artists" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#20efe0]" /> Artists, Bands, Producers &amp; DJs
                  <span className="text-xs text-[#9a9fc4] font-normal">({filteredBands.length})</span>
                </h2>
                <p className="text-xs text-[#9a9fc4] mt-0.5">
                  Follow your favorite Artist Pages, Band Pages, Producer Pages, and DJ Pages to get notified when they drop new tracks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ACT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActTypeFilter(opt.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      actTypeFilter === opt.value
                        ? "bg-[#ffd166] text-[#05051f] shadow-md shadow-[#ffd166]/20"
                        : "bg-[#0c0c3f] text-[#9a9fc4] border border-[#20205a] hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <select
                  value={actSortBy}
                  onChange={(e) => setActSortBy(e.target.value as any)}
                  className="h-8 px-3 rounded-xl bg-[#0c0c3f] border border-[#20205a] text-xs font-semibold text-[#9a9fc4] hover:text-white"
                >
                  <option value="followers">Most Followed</option>
                  <option value="name">Alphabetical</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>

            {filteredBands.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#20efe0]/10 border border-[#20efe0]/30 flex items-center justify-center mx-auto text-[#20efe0]">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f7ff]">No Pages Match Your Filter</h3>
                <p className="text-xs text-[#9a9fc4] max-w-md mx-auto">
                  Try switching the filter to &quot;All Pages&quot; or create your own Artist, Band, Producer, or DJ page!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBands.map((band) => (
                  <div
                    key={band.id}
                    className="group relative rounded-3xl border border-[#20205a]/80 bg-gradient-to-b from-[#0c0c3f]/90 to-[#060624]/95 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#20efe0]/50 hover:shadow-[0_10px_40px_rgba(32,239,224,0.1)]"
                  >
                    <div>
                      {/* Banner */}
                      <div className="relative h-28 w-full bg-gradient-to-r from-[#ea6f2a]/25 via-[#12124a] to-[#20efe0]/25 overflow-hidden">
                        {band.banner_url && (
                          <img
                            src={band.banner_url}
                            alt={`${band.name} banner`}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] via-transparent to-transparent" />

                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {(isAdmin || band.is_owner) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingBand(band)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#05051f]/90 border border-[#ffd166]/50 text-[#ffd166] hover:bg-[#ffd166] hover:text-[#05051f] text-[10px] font-bold flex items-center gap-1 shadow-lg transition-colors cursor-pointer"
                              title="Edit Page"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          )}
                          <Badge className="bg-[#05051f]/85 backdrop-blur-md text-[#20efe0] border border-[#20efe0]/30 text-[10px] uppercase tracking-wider">
                            {getActPageLabel(band.type)}
                          </Badge>
                        </div>
                      </div>

                      {/* Avatar + Title */}
                      <div className="px-6 -mt-10 relative z-10 flex items-end justify-between gap-3 mb-3">
                        <Link
                          href={`/bands/${band.slug}`}
                          className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#20efe0]/50 bg-[#05051f] shadow-xl shrink-0 block"
                        >
                          {band.logo_url ? (
                            <img
                              src={band.logo_url}
                              alt={band.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#ea6f2a]/15 text-[#ea6f2a]">
                              <Music className="w-8 h-8" />
                            </div>
                          )}
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-[#9a9fc4] pb-1">
                          <Users className="w-3.5 h-3.5 text-[#20efe0]" />
                          <span className="font-semibold text-[#f5f7ff]">{band.follower_count}</span>
                          <span>{band.follower_count === 1 ? "follower" : "followers"}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="px-6 pb-4">
                        <Link href={`/bands/${band.slug}`}>
                          <h3 className="text-xl font-bold text-[#f5f7ff] group-hover:text-[#20efe0] transition-colors truncate">
                            {band.name}
                          </h3>
                        </Link>

                        {band.genre && (
                          <p className="text-xs font-medium text-[#ea6f2a] mt-0.5 mb-2 truncate">
                            {band.genre}
                          </p>
                        )}

                        <p className="text-sm text-[#9a9fc4] line-clamp-2 leading-relaxed min-h-[2.5rem]">
                          {band.bio || `Check out music, albums, and updates on ${band.name}'s ${getActPageLabel(band.type).toLowerCase()}.`}
                        </p>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-6 py-4 border-t border-[#20205a]/50 bg-[#05051f]/40 flex items-center justify-between gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        className="text-[#c9fbf7] hover:text-white hover:bg-[#20efe0]/15 text-xs font-semibold px-3 h-9 rounded-xl"
                      >
                        <Link href={`/bands/${band.slug}`}>
                          Open {getActPageLabel(band.type)}
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShareBand(band)}
                          className="h-9 w-9 p-0 rounded-xl text-[#9a9fc4] hover:text-[#20efe0] hover:bg-[#20efe0]/10"
                          title={`Share ${band.name}`}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleToggleFollowBand(band)}
                          className={`rounded-xl text-xs font-semibold h-9 px-3.5 transition-all cursor-pointer ${
                            band.is_following
                              ? "bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                              : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white shadow-[0_0_15px_rgba(234,111,42,0.25)]"
                          }`}
                        >
                          {band.is_following ? (
                            <>
                              <BellRing className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                              Following
                            </>
                          ) : (
                            <>
                              <Bell className="w-3.5 h-3.5 mr-1.5" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ALBUMS & EPS ── */}
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
                  Artists, bands, producers, and DJs can release multi-track albums and EPs directly from their page.
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

                        {/* Edit Album Button (Owner or Admin) */}
                        {(isAdmin || album.canEdit) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setEditingAlbum(album)
                            }}
                            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-lg bg-[#05051f]/90 border border-[#ffd166]/50 text-[#ffd166] hover:bg-[#ffd166] hover:text-[#05051f] text-[10px] font-bold flex items-center gap-1 shadow-lg transition-colors cursor-pointer"
                            title="Edit album thumbnail or title"
                          >
                            <Pencil className="w-3 h-3" /> Edit Album
                          </button>
                        )}

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
                          <button
                            onClick={(e) => handleLikeAlbum(e, album)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
      </main>

      {/* ── EDIT TRACK MODAL ── */}
      <EditTrackModal
        track={editingTrack}
        isOpen={Boolean(editingTrack)}
        onClose={() => setEditingTrack(null)}
        onSaved={(updated) => {
          setTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
          setEditingTrack(null)
        }}
      />

      {/* ── EDIT ALBUM MODAL ── */}
      <EditAlbumModal
        album={editingAlbum}
        isOpen={Boolean(editingAlbum)}
        onClose={() => setEditingAlbum(null)}
        onSaved={(updatedName, updatedCover) => {
          if (editingAlbum) {
            setAlbums((prev) =>
              prev.map((a) =>
                a.bandId === editingAlbum.bandId && a.albumName === editingAlbum.albumName
                  ? { ...a, albumName: updatedName, coverArtUrl: updatedCover || a.coverArtUrl }
                  : a
              )
            )
            setTracks((prev) =>
              prev.map((t) =>
                t.bandId === editingAlbum.bandId && t.albumName === editingAlbum.albumName
                  ? { ...t, albumName: updatedName, coverArtUrl: updatedCover || t.coverArtUrl }
                  : t
              )
            )
          }
          setEditingAlbum(null)
        }}
      />

      {/* ── EDIT ARTIST / BAND / PRODUCER / DJ PAGE MODAL ── */}
      <EditBandModal
        band={editingBand}
        isOpen={Boolean(editingBand)}
        onClose={() => setEditingBand(null)}
        onSaved={(updated) => {
          setBands((prev) =>
            prev.map((b) =>
              b.id === updated.id
                ? {
                    ...b,
                    name: updated.name ?? b.name,
                    slug: updated.slug ?? b.slug,
                    type: updated.type ?? b.type,
                    genre: updated.genre ?? b.genre,
                    bio: updated.bio ?? b.bio,
                    logo_url: updated.logo_url ?? b.logo_url,
                    banner_url: updated.banner_url ?? b.banner_url,
                  }
                : b
            )
          )
          setEditingBand(null)
        }}
      />

      {/* ── UPLOAD SONG MODAL ── */}
      <UploadSongModal
        open={uploadSongOpen}
        onOpenChange={setUploadSongOpen}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* ── SHARE PAGE MODAL ── */}
      {shareBand && (
        <BandShareModal
          open={!!shareBand}
          onOpenChange={(open) => !open && setShareBand(null)}
          title={shareBand.name}
          subtitle={`${shareBand.genre || getActPageLabel(shareBand.type)} on StarCast Online`}
          url={
            typeof window !== "undefined"
              ? `${window.location.origin}/bands/${shareBand.slug}`
              : `https://starcast.online/bands/${shareBand.slug}`
          }
        />
      )}

      {/* ── CREATE ARTIST / BAND / PRODUCER / DJ PAGE MODAL ── */}
      <Dialog open={createPageOpen} onOpenChange={setCreatePageOpen}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">
              Create Your Music Page
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9a9fc4]">
              Choose your page type below — Artist Page, Band Page, Producer Page, or DJ Page. You can upload tracks, albums, and customize your page anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#cbd0f2]">
                Page Type
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "artist", label: "Artist Page" },
                  { id: "band", label: "Band Page" },
                  { id: "producer", label: "Producer Page" },
                  { id: "dj", label: "DJ Page" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewPageType(t.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newPageType === t.id
                        ? "bg-[#ea6f2a] text-white border-[#ea6f2a] shadow-md"
                        : "bg-[#05052d] text-[#9a9fc4] border-[#20205a] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#cbd0f2]">Name *</Label>
              <Input
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="e.g., DJ Nova, Neon Horizon, Prod. Lex..."
                className="bg-[#05052d] border-[#20205a] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#cbd0f2]">Genre / Style</Label>
              <Input
                value={newPageGenre}
                onChange={(e) => setNewPageGenre(e.target.value)}
                placeholder="e.g., Hip Hop, Rock, Electronic, House, Indie..."
                className="bg-[#05052d] border-[#20205a] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#cbd0f2]">Bio</Label>
              <Textarea
                value={newPageBio}
                onChange={(e) => setNewPageBio(e.target.value)}
                placeholder="Tell fans about your music, sound, and releases..."
                rows={3}
                className="bg-[#05052d] border-[#20205a] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUploadImage(f, "logo")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full border-[#20205a] bg-[#05052d] text-xs text-[#cbd0f2]"
                >
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {newPageLogo ? "Avatar Uploaded ✓" : "Upload Avatar"}
                </Button>
              </div>

              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUploadImage(f, "banner")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="w-full border-[#20205a] bg-[#05052d] text-xs text-[#cbd0f2]"
                >
                  {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {newPageBanner ? "Banner Uploaded ✓" : "Upload Banner"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreatePageOpen(false)}
              className="text-[#9a9fc4] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePage}
              disabled={creatingPage}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold"
            >
              {creatingPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create {getActPageLabel(newPageType)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
