"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BandQrModal } from "@/components/bands/band-qr-modal"
import { LinkTree } from "@/components/LinkTree"
import { BandTicketsWidget, type BandEventItem } from "@/components/bands/band-tickets-widget"
import { BandMusicPlayer } from "@/components/bands/band-music-player"
import { PostAudioPlayer } from "@/components/bands/post-audio-player"
import type { BandTrackItem } from "@/app/actions/band-tracks"
import {
  Music,
  Share2,
  Check,
  Send,
  Trash2,
  MessageCircle,
  Globe,
  Lock,
  ImageIcon,
  X,
  Users,
  UserPlus,
  UserMinus,
  ArrowLeft,
  QrCode,
  Sparkles,
  Radio,
  Settings,
  Disc3,
  FileText,
  Upload,
  Plus,
  Headphones,
  Sliders,
  Layers,
  Loader2,
  Filter,
} from "lucide-react"
import {
  type PublicBand,
  type BandPost,
  type BandPostAudioTrack,
  createBandPost,
  deleteBandPost,
  addBandComment,
  deleteBandComment,
  getBandPosts,
  followBand,
  unfollowBand,
} from "@/app/actions/band-pages"
import { setBandPublic } from "@/app/actions/bands"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const [hasError, setHasError] = useState(false)
  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className="w-10 h-10 rounded-full object-cover border border-[#20205a] shrink-0"
      />
    )
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/30 text-[#ea6f2a] font-semibold text-sm shrink-0">
      {name ? name.charAt(0).toUpperCase() : "★"}
    </div>
  )
}

export function BandPageClient({
  band,
  initialPosts,
  initialEvents = [],
  initialTracks = [],
}: {
  band: PublicBand
  initialPosts: BandPost[]
  initialEvents?: BandEventItem[]
  initialTracks?: BandTrackItem[]
}) {
  const [posts, setPosts] = useState<BandPost[]>(initialPosts)
  const [events, setEvents] = useState<BandEventItem[]>(initialEvents)
  const [tracks, setTracks] = useState<BandTrackItem[]>(initialTracks)
  const [isPublic, setIsPublic] = useState(band.is_public)
  const [bannerError, setBannerError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [isFollowing, setIsFollowing] = useState(band.is_following)
  const [followerCount, setFollowerCount] = useState(band.follower_count)
  const [followBusy, setFollowBusy] = useState(false)

  // Feed Filter Tabs: "all" | "audio" | "image" | "text"
  const [activeFilter, setActiveFilter] = useState<"all" | "audio" | "image" | "text">("all")

  // Composer Post Type: "text" | "image" | "audio" | "album"
  const [postType, setPostType] = useState<"text" | "image" | "audio" | "album">("text")
  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)

  // Image Upload state
  const [draftImages, setDraftImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Single Song Upload state
  const [songTitle, setSongTitle] = useState("")
  const [songProducer, setSongProducer] = useState("")
  const [songAudioUrl, setSongAudioUrl] = useState("")
  const [songCoverUrl, setSongCoverUrl] = useState("")
  const [songDuration, setSongDuration] = useState(0)
  const [uploadingSongAudio, setUploadingSongAudio] = useState(false)
  const [uploadingSongCover, setUploadingSongCover] = useState(false)
  const songAudioInputRef = useRef<HTMLInputElement>(null)
  const songCoverInputRef = useRef<HTMLInputElement>(null)

  // Album / Multi-Track Upload state
  const [albumTitle, setAlbumTitle] = useState("")
  const [albumProducer, setAlbumProducer] = useState("")
  const [albumCoverUrl, setAlbumCoverUrl] = useState("")
  const [albumTracks, setAlbumTracks] = useState<
    Array<{ id: string; title: string; audioUrl: string; durationSeconds: number; producer?: string; fileName?: string }>
  >([])
  const [uploadingAlbumProgress, setUploadingAlbumProgress] = useState<string | null>(null)
  const albumMultiInputRef = useRef<HTMLInputElement>(null)
  const albumCoverInputRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setPosts(await getBandPosts(band.id))
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/bands/${band.slug}` : `https://starcast.online/bands/${band.slug}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  async function handleToggleFollow() {
    if (followBusy) return
    setFollowBusy(true)
    setError("")
    const next = !isFollowing
    setIsFollowing(next)
    setFollowerCount((c) => c + (next ? 1 : -1))
    try {
      if (next) await followBand(band.id)
      else await unfollowBand(band.id)
    } catch (e: any) {
      setIsFollowing(!next)
      setFollowerCount((c) => c + (next ? -1 : 1))
      setError(e?.message || "Failed to update follow status")
    } finally {
      setFollowBusy(false)
    }
  }

  async function handleTogglePublic() {
    const next = !isPublic
    setIsPublic(next)
    try {
      const res = await setBandPublic(band.id, next)
      if (res && !res.success) {
        throw new Error(res.error || "Failed to update visibility")
      }
    } catch (e: any) {
      setIsPublic(!next)
      setError(e?.message || "Failed to update visibility")
    }
  }

  // ── Image Handlers ──
  const MAX_IMAGE_MB = 10
  const MAX_AUDIO_MB = 50
  const MAX_IMAGES_PER_POST = 10
  const MAX_TRACKS_PER_ALBUM = 25

  const handlePickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (draftImages.length + files.length > MAX_IMAGES_PER_POST) {
      setError(`Maximum ${MAX_IMAGES_PER_POST} photos allowed per post.`)
      return
    }

    setUploadingImage(true)
    setError("")
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          throw new Error(`Photo "${file.name}" exceeds ${MAX_IMAGE_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
        }
        const fd = new FormData()
        fd.append("file", file)
        fd.append("folder", `bands/${band.id}/posts`)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload image")
        uploaded.push(data.url)
      }
      setDraftImages((prev) => [...prev, ...uploaded])
    } catch (e: any) {
      setError(e?.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  // ── Single Song Handlers ──
  const handleSongAudioFile = async (file: File) => {
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`Audio file exceeds ${MAX_AUDIO_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setUploadingSongAudio(true)
    setError("")

    if (!songTitle.trim()) {
      const clean = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s._-]+/, "")
        .replace(/[_-]+/g, " ")
        .trim()
      setSongTitle(clean)
    }

    try {
      const objUrl = URL.createObjectURL(file)
      const audio = new Audio(objUrl)
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setSongDuration(Math.round(audio.duration))
        }
        URL.revokeObjectURL(objUrl)
      }
    } catch {
      // Non-blocking
    }

    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", `bands/${band.id}/audio`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Audio upload failed")
      setSongAudioUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload audio file")
    } finally {
      setUploadingSongAudio(false)
    }
  }

  const handleSongCoverFile = async (file: File) => {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Cover art exceeds ${MAX_IMAGE_MB}MB limit.`)
      return
    }
    setUploadingSongCover(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", `bands/${band.id}/covers`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Cover upload failed")
      setSongCoverUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload cover art")
    } finally {
      setUploadingSongCover(false)
    }
  }

  // ── Album / Multi-Track Handlers ──
  const handleAlbumMultiFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (albumTracks.length + files.length > MAX_TRACKS_PER_ALBUM) {
      setError(`Maximum ${MAX_TRACKS_PER_ALBUM} tracks allowed per album release.`)
      return
    }
    setError("")
    const fileArr = Array.from(files)
    setUploadingAlbumProgress(`Uploading 0 / ${fileArr.length} tracks...`)

    try {
      const newTracks: Array<{ id: string; title: string; audioUrl: string; durationSeconds: number; producer?: string; fileName?: string }> = []
      let count = 0

      for (const file of fileArr) {
        if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
          throw new Error(`Track "${file.name}" exceeds ${MAX_AUDIO_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
        }
        count++
        setUploadingAlbumProgress(`Uploading track ${count} of ${fileArr.length}: ${file.name}...`)

        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/^\d+[\s._-]+/, "")
          .replace(/[_-]+/g, " ")
          .trim()

        let duration = 180
        try {
          const objUrl = URL.createObjectURL(file)
          const audio = new Audio(objUrl)
          await new Promise<void>((resolve) => {
            audio.onloadedmetadata = () => {
              if (audio.duration && !isNaN(audio.duration)) {
                duration = Math.round(audio.duration)
              }
              URL.revokeObjectURL(objUrl)
              resolve()
            }
            audio.onerror = () => {
              URL.revokeObjectURL(objUrl)
              resolve()
            }
            setTimeout(resolve, 1500)
          })
        } catch {
          // Non-blocking
        }

        const fd = new FormData()
        fd.append("file", file)
        fd.append("folder", `bands/${band.id}/audio`)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error || `Failed to upload ${file.name}`)

        newTracks.push({
          id: `trk_${Date.now()}_${count}`,
          title: cleanTitle || `Track ${count}`,
          audioUrl: data.url,
          durationSeconds: duration,
          fileName: file.name,
          producer: albumProducer.trim() || undefined,
        })
      }

      setAlbumTracks((prev) => [...prev, ...newTracks])
    } catch (e: any) {
      setError(e?.message || "Failed to batch upload album tracks")
    } finally {
      setUploadingAlbumProgress(null)
    }
  }

  const handleAlbumCoverFile = async (file: File) => {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Album cover art exceeds ${MAX_IMAGE_MB}MB limit.`)
      return
    }
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", `bands/${band.id}/covers`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Album cover upload failed")
      setAlbumCoverUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload album cover art")
    }
  }

  // ── Submit Post ──
  async function handlePost() {
    setPosting(true)
    setError("")

    let finalPostType = postType
    let audioTracksPayload: BandPostAudioTrack[] = []

    if (postType === "audio") {
      if (!songAudioUrl) {
        setError("Please upload an MP3 audio file for your song post.")
        setPosting(false)
        return
      }
      audioTracksPayload = [
        {
          id: `trk_${Date.now()}`,
          title: songTitle.trim() || "Untitled Release",
          audio_url: songAudioUrl,
          duration_seconds: songDuration || 180,
          artist_name: band.name,
          producer: songProducer.trim() || undefined,
          cover_art_url: songCoverUrl || band.logo_url || undefined,
          allow_download: true,
        },
      ]
    } else if (postType === "album") {
      if (albumTracks.length === 0) {
        setError("Please upload at least one track for your album / EP release.")
        setPosting(false)
        return
      }
      audioTracksPayload = albumTracks.map((t, idx) => ({
        id: t.id || `trk_${Date.now()}_${idx}`,
        title: t.title.trim() || `Track ${idx + 1}`,
        audio_url: t.audioUrl,
        duration_seconds: t.durationSeconds || 180,
        artist_name: band.name,
        producer: (t.producer || albumProducer || "").trim() || undefined,
        cover_art_url: albumCoverUrl || band.logo_url || undefined,
        allow_download: true,
      }))
    } else if (postType === "image" && draftImages.length === 0 && !draft.trim()) {
      setError("Please attach at least one photo or write a description.")
      setPosting(false)
      return
    } else if (postType === "text" && !draft.trim()) {
      setError("Please write something for your update.")
      setPosting(false)
      return
    }

    try {
      await createBandPost(band.id, draft, draftImages, finalPostType, audioTracksPayload)

      // Reset form
      setDraft("")
      setDraftImages([])
      setSongTitle("")
      setSongProducer("")
      setSongAudioUrl("")
      setSongCoverUrl("")
      setSongDuration(0)
      setAlbumTitle("")
      setAlbumProducer("")
      setAlbumCoverUrl("")
      setAlbumTracks([])
      setPostType("text")

      await refresh()
    } catch (e: any) {
      setError(e?.message || "Failed to post")
    } finally {
      setPosting(false)
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      await deleteBandPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (e: any) {
      setError(e?.message || "Failed to delete post")
    }
  }

  // Feed Filter Calculations
  const musicPosts = posts.filter(
    (p) => p.post_type === "audio" || p.post_type === "album" || (p.audio_tracks && p.audio_tracks.length > 0)
  )
  const photoPosts = posts.filter((p) => p.post_type === "image" || (p.images && p.images.length > 0))
  const textPosts = posts.filter(
    (p) => p.post_type === "text" || (!p.audio_tracks?.length && !p.images?.length)
  )

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === "audio") {
      return p.post_type === "audio" || p.post_type === "album" || (p.audio_tracks && p.audio_tracks.length > 0)
    }
    if (activeFilter === "image") {
      return p.post_type === "image" || (p.images && p.images.length > 0)
    }
    if (activeFilter === "text") {
      return p.post_type === "text" || (!p.audio_tracks?.length && !p.images?.length)
    }
    return true
  })

  return (
    <div className="public-shell flex flex-col min-h-screen text-[#f5f7ff]">
      <ResponsiveHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Button
            asChild
            variant="outline"
            className="border-[#20efe0]/35 bg-[#0c0c3f]/55 text-[#c9fbf7] shadow-[0_0_20px_rgba(32,239,224,0.08)] hover:border-[#20efe0]/60 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff] rounded-xl h-10 sm:h-11 px-4 text-xs sm:text-sm font-semibold"
          >
            <Link href="/bands">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Soundstage Directory
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setQrModalOpen(true)}
              variant="outline"
              className="border-[#20efe0]/40 bg-[#0c0c3f]/80 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl text-xs sm:text-sm font-semibold h-10 sm:h-11 px-4 shadow-md shadow-[#20efe0]/10"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-[#20efe0]" />
              Get QR Code
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              className="border-[#20205a] bg-[#0c0c3f]/80 text-[#dbe0fb] hover:text-[#f5f7ff] hover:bg-[#20205a]/40 rounded-xl text-xs sm:text-sm font-semibold h-10 sm:h-11 px-4"
            >
              {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-1.5" />}
              {copied ? "Link Copied!" : "Share"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-800/80 bg-red-950/40 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Soundstage Grand Hero */}
        <section className="relative rounded-3xl border border-[#20205a]/80 bg-gradient-to-b from-[#0c0c3f]/80 via-[#070725]/90 to-[#05051f] overflow-hidden mb-8 shadow-2xl shadow-black/60">
          {/* Banner Image Stage Rig */}
          {band.banner_url && !bannerError ? (
            <div className="relative h-44 sm:h-72 w-full overflow-hidden bg-[#05052d]">
              <img
                src={band.banner_url}
                alt={`${band.name} banner`}
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] via-[#05051f]/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            </div>
          ) : (
            <div className="relative h-36 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-[#ea6f2a]/25 via-[#121248] to-[#20efe0]/20">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] to-transparent pointer-events-none" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            </div>
          )}

          {/* Soundstage Verified Beacon */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05051f]/80 border border-[#20efe0]/40 backdrop-blur-md text-[11px] font-mono text-[#20efe0]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#38ef7d]" />
            <span>SOUNDSTAGE LIVE // TOPEKA</span>
          </div>

          <div className="relative z-10 px-4 sm:px-8 pb-6 sm:pb-8 pt-2 sm:pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              {/* Overlapping Avatar with Glow */}
              <div className="-mt-12 sm:-mt-24 shrink-0 relative z-20">
                <div className="relative p-1 rounded-2xl bg-gradient-to-tr from-[#ea6f2a] via-[#ffd166] to-[#20efe0] shadow-2xl shadow-[#ea6f2a]/20">
                  {band.logo_url && !logoError ? (
                    <img
                      src={band.logo_url}
                      alt={band.name}
                      onError={() => setLogoError(true)}
                      className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl object-cover bg-[#05052d] border-2 border-[#0c0c3f]"
                      loading="eager"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 sm:w-36 sm:h-36 rounded-xl bg-[#0c0c3f] border-2 border-[#0c0c3f]">
                      <Music className="w-10 h-10 sm:w-14 sm:h-14 text-[#ea6f2a]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Band Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                    {band.name}
                  </h1>
                  <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 font-mono text-xs uppercase px-2.5 py-0.5">
                    {band.type === "artist"
                      ? "Solo Artist"
                      : band.type === "producer"
                      ? "Producer"
                      : band.type === "dj"
                      ? "DJ / Electronic"
                      : "Band"}
                  </Badge>
                  {band.genre && (
                    <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 font-mono text-xs">
                      {band.genre}
                    </Badge>
                  )}
                  {band.is_owner && !isPublic && (
                    <Badge className="bg-yellow-900/40 text-yellow-300 border border-yellow-700/50">
                      <Lock className="w-3 h-3 mr-1" /> Private Act
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-[#dbe0fb] mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-[#20efe0]" />
                    <strong className="text-[#f5f7ff] font-bold">{followerCount}</strong> {followerCount === 1 ? "follower" : "followers"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
                    StarCast Resident Act
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Description */}
            {band.bio && (
              <div className="mt-6 pt-6 border-t border-[#20205a]/50">
                <p className="text-base sm:text-lg text-[#dbe0fb] leading-relaxed text-pretty max-w-3xl">
                  {band.bio}
                </p>
              </div>
            )}

            {/* Interactive Action Ribbon */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#20205a]/50 flex-wrap">
              {!band.is_owner && band.is_authenticated && (
                <Button
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  className={
                    isFollowing
                      ? "border border-[#20205a] bg-transparent text-[#f5f7ff] hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-6 text-sm font-semibold"
                      : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-xl h-11 sm:h-12 px-6 text-sm font-semibold shadow-lg shadow-[#ea6f2a]/25"
                  }
                >
                  {isFollowing ? (
                    <UserMinus className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {isFollowing ? "Following Act" : "Follow Act"}
                </Button>
              )}

              <Button
                onClick={() => setQrModalOpen(true)}
                className="bg-gradient-to-r from-[#20efe0]/20 to-[#0c0c3f] border border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/30 hover:text-white rounded-xl font-semibold shadow-md h-11 sm:h-12 px-5 text-sm"
              >
                <QrCode className="w-4 h-4 mr-2 text-[#20efe0]" />
                Get QR Code
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/60 hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-5 text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-2" />}
                {copied ? "Link Copied" : "Share Page"}
              </Button>

              {band.is_owner && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleTogglePublic}
                    className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/60 hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-5 text-sm font-medium"
                  >
                    {isPublic ? <Globe className="w-4 h-4 mr-2 text-emerald-400" /> : <Lock className="w-4 h-4 mr-2 text-yellow-400" />}
                    {isPublic ? "Public Page" : "Private Page"}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="border-[#ea6f2a]/50 text-[#ea6f2a] hover:bg-[#ea6f2a]/15 rounded-xl ml-auto h-11 sm:h-12 px-5 text-sm font-semibold"
                  >
                    <Link href="/portal">
                      <Settings className="w-4 h-4 mr-2" />
                      Artist Portal Studio
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Custom Links (Cosmic Linktree style) */}
        {band.links && band.links.length > 0 && (
          <LinkTree links={band.links.map((link: any) => ({ label: link.title, url: link.url }))} />
        )}

        {/* Music Catalog & Audio Streaming Showcase */}
        {((band.music_catalog_enabled && tracks.length > 0) || (band.is_owner && tracks.length > 0)) && (
          <section className="mb-10">
            <BandMusicPlayer
              bandName={band.name}
              bandLogo={band.logo_url}
              catalogTitle={band.music_catalog_title}
              tracks={tracks}
            />
          </section>
        )}

        {/* Live Event Ticketing Section */}
        {events && events.length > 0 && (
          <section className="mb-10">
            <BandTicketsWidget events={events} bandName={band.name} bandId={band.id} />
          </section>
        )}

        {/* Discussion Board Section Header & Feed Filter Tabs */}
        <section className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 text-[#ea6f2a]" />
              <h2 className="text-lg sm:text-xl font-black text-[#f5f7ff] tracking-tight">
                Posts, Music &amp; Fan Discussions
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-mono text-[#20efe0] font-semibold">
              {posts.length} {posts.length === 1 ? "update" : "updates"}
            </span>
          </div>

          {/* Tab Filters: All, Music & Songs Only, Photos, Text Notes */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-b border-[#20205a]/60">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeFilter === "all"
                  ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/20"
                  : "bg-[#0c0c3f]/50 text-[#dbe0fb] hover:bg-[#20205a]/50 hover:text-white"
              }`}
            >
              <span>All Updates</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-xs font-mono">
                {posts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("audio")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeFilter === "audio"
                  ? "bg-[#20efe0] text-[#05051f] font-bold shadow-md shadow-[#20efe0]/20"
                  : "bg-[#0c0c3f]/50 text-[#dbe0fb] hover:bg-[#20205a]/50 hover:text-white"
              }`}
            >
              <Music className="w-4 h-4 text-[#20efe0]" />
              <span>🎵 Music &amp; Songs Only</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${activeFilter === "audio" ? "bg-black/20" : "bg-black/30"}`}>
                {musicPosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("image")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeFilter === "image"
                  ? "bg-[#ffd166] text-[#05051f] font-bold shadow-md shadow-[#ffd166]/20"
                  : "bg-[#0c0c3f]/50 text-[#dbe0fb] hover:bg-[#20205a]/50 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#ffd166]" />
              <span>Photos</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${activeFilter === "image" ? "bg-black/20" : "bg-black/30"}`}>
                {photoPosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("text")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeFilter === "text"
                  ? "bg-[#dbe0fb] text-[#05051f] font-bold shadow-md"
                  : "bg-[#0c0c3f]/50 text-[#dbe0fb] hover:bg-[#20205a]/50 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 text-[#9a9fc4]" />
              <span>Text Notes</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${activeFilter === "text" ? "bg-black/20" : "bg-black/30"}`}>
                {textPosts.length}
              </span>
            </button>
          </div>
        </section>

        {/* Composer for signed-in users with selectable Post Types */}
        {band.is_authenticated && (
          <section className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/70 p-5 sm:p-6 mb-8 shadow-xl">
            {/* Post Type Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#05052d] border border-[#20205a]/60 mb-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPostType("text")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  postType === "text"
                    ? "bg-[#ea6f2a] text-white shadow-md"
                    : "text-[#9a9fc4] hover:text-white hover:bg-[#20205a]/30"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Text Post</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType("image")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  postType === "image"
                    ? "bg-[#ea6f2a] text-white shadow-md"
                    : "text-[#9a9fc4] hover:text-white hover:bg-[#20205a]/30"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#ffd166]" />
                <span>Picture / Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType("audio")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  postType === "audio"
                    ? "bg-[#20efe0] text-[#05051f] shadow-md font-bold"
                    : "text-[#20efe0] hover:text-white hover:bg-[#20efe0]/10"
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Song (MP3)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType("album")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  postType === "album"
                    ? "bg-gradient-to-r from-[#20efe0] to-[#ffd166] text-[#05051f] shadow-md font-bold"
                    : "text-[#ffd166] hover:text-white hover:bg-[#ffd166]/10"
                }`}
              >
                <Disc3 className="w-4 h-4" />
                <span>Multiple Songs / Album</span>
              </button>
            </div>

            {/* Main Content / Description Input */}
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                postType === "audio"
                  ? "Describe your new song, inspiration, or drop announcement..."
                  : postType === "album"
                  ? "Announce your new EP/Album, tracklist backstory, and credits..."
                  : postType === "image"
                  ? "Write a caption for your photos..."
                  : band.is_owner
                  ? `Broadcast an official announcement to your ${followerCount} followers...`
                  : `Start a conversation or shout out ${band.name}...`
              }
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 min-h-[90px] resize-none rounded-2xl text-base p-4"
            />

            {/* ── Type: Picture/Photos ── */}
            {postType === "image" && (
              <div className="mt-4 p-4 rounded-2xl border border-dashed border-[#ffd166]/40 bg-[#05052d]/80 space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePickImages(e.target.files)}
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#ffd166]" />
                    <span className="text-xs sm:text-sm font-bold text-[#f5f7ff]">Photo Gallery Attachments</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="bg-[#ffd166] text-[#05051f] hover:bg-[#e5bc5c] font-bold text-xs rounded-xl"
                  >
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                    Upload Photos
                  </Button>
                </div>

                {draftImages.length > 0 && (
                  <div className="flex gap-2.5 flex-wrap pt-2">
                    {draftImages.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt="Attachment preview"
                          className="w-20 h-20 rounded-xl object-cover border border-[#20205a]"
                        />
                        <button
                          type="button"
                          onClick={() => setDraftImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#bc3f00] text-white flex items-center justify-center shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Type: Song (Single MP3) ── */}
            {postType === "audio" && (
              <div className="mt-4 p-4 rounded-2xl border border-[#20efe0]/30 bg-[#05052d]/90 space-y-4">
                <div className="flex items-center gap-2 text-[#20efe0] text-xs font-mono font-bold uppercase">
                  <Music className="w-4 h-4" />
                  <span>Single Song / Track Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#dbe0fb]">Song Title *</Label>
                    <Input
                      placeholder="e.g. Midnight Horizon"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#dbe0fb]">Producer / Studio Credit</Label>
                    <Input
                      placeholder="e.g. StarCast Sound Labs"
                      value={songProducer}
                      onChange={(e) => setSongProducer(e.target.value)}
                      className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm rounded-xl h-10"
                    />
                  </div>
                </div>

                {/* Upload MP3 File */}
                <div className="p-3.5 rounded-xl border border-dashed border-[#20efe0]/40 bg-[#0c0c3f]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    ref={songAudioInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.flac"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleSongAudioFile(f)
                    }}
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#20efe0]/15 text-[#20efe0] flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#f5f7ff] truncate">
                        {songAudioUrl ? "Audio File Attached & Ready" : "Upload Audio Track (MP3/WAV)"}
                      </p>
                      <p className="text-[11px] text-[#9a9fc4]">
                        {songAudioUrl ? (songDuration ? `Duration: ${Math.floor(songDuration/60)}:${songDuration%60 < 10 ? '0' : ''}${songDuration%60}` : "Audio attached") : "Max 100MB — free streaming in feed"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => songAudioInputRef.current?.click()}
                    disabled={uploadingSongAudio}
                    className="bg-[#20efe0] text-[#05051f] hover:bg-[#18d0c3] font-bold text-xs rounded-xl shrink-0"
                  >
                    {uploadingSongAudio ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                    {songAudioUrl ? "Replace MP3" : "Choose MP3 File"}
                  </Button>
                </div>

                {/* Optional Song Cover Art */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <input
                    ref={songCoverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleSongCoverFile(f)
                    }}
                  />
                  <div className="flex items-center gap-2">
                    {songCoverUrl ? (
                      <img src={songCoverUrl} alt="Cover" className="w-8 h-8 rounded-lg object-cover border border-[#20205a]" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#20205a]/50 flex items-center justify-center text-[#9a9fc4]">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-xs text-[#dbe0fb]">
                      {songCoverUrl ? "Custom Single Cover Art Set" : "Optional Single Cover Art (uses band logo by default)"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => songCoverInputRef.current?.click()}
                    disabled={uploadingSongCover}
                    className="border-[#20205a] text-[#dbe0fb] hover:text-white text-xs rounded-xl"
                  >
                    {uploadingSongCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload Art"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Type: Album / Multiple Songs ── */}
            {postType === "album" && (
              <div className="mt-4 p-4 rounded-2xl border border-[#ffd166]/30 bg-[#05052d]/90 space-y-4">
                <div className="flex items-center gap-2 text-[#ffd166] text-xs font-mono font-bold uppercase">
                  <Disc3 className="w-4 h-4" />
                  <span>Album / Multi-Track Release</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#dbe0fb]">Album / EP Title *</Label>
                    <Input
                      placeholder="e.g. Echoes of the Nebula (EP)"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#dbe0fb]">Album Producer / Sound Engineer</Label>
                    <Input
                      placeholder="e.g. StarCast Sound Labs"
                      value={albumProducer}
                      onChange={(e) => setAlbumProducer(e.target.value)}
                      className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm rounded-xl h-10"
                    />
                  </div>
                </div>

                {/* Batch Audio File Upload */}
                <div className="p-3.5 rounded-xl border border-dashed border-[#ffd166]/40 bg-[#0c0c3f]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    ref={albumMultiInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.flac"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAlbumMultiFiles(e.target.files)}
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ffd166]/15 text-[#ffd166] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#f5f7ff]">
                        {albumTracks.length > 0 ? `${albumTracks.length} Tracks In Tracklist` : "Upload Multiple MP3 Songs"}
                      </p>
                      <p className="text-[11px] text-[#9a9fc4]">
                        {uploadingAlbumProgress || "Select multiple MP3 files at once"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => albumMultiInputRef.current?.click()}
                    disabled={uploadingAlbumProgress !== null}
                    className="bg-[#ffd166] text-[#05051f] hover:bg-[#e5bc5c] font-bold text-xs rounded-xl shrink-0"
                  >
                    {uploadingAlbumProgress ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                    Add Songs (MP3s)
                  </Button>
                </div>

                {/* Tracklist Editor List */}
                {albumTracks.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {albumTracks.map((trk, idx) => (
                      <div key={trk.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0c0c3f]/70 border border-[#20205a]">
                        <span className="w-6 text-center font-mono text-xs text-[#20efe0] font-bold">{idx + 1}</span>
                        <Input
                          value={trk.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setAlbumTracks((prev) => prev.map((t, i) => (i === idx ? { ...t, title: val } : t)))
                          }}
                          placeholder="Song Title"
                          className="bg-[#05052d] border-[#20205a] text-xs h-8 rounded-lg flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setAlbumTracks((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-[#9a9fc4] hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#20205a]/50 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9a9fc4]">
                  Posting as <strong className="text-[#f5f7ff]">{band.is_owner ? band.name : "Member"}</strong>
                </span>
              </div>

              <Button
                onClick={handlePost}
                disabled={
                  posting ||
                  uploadingImage ||
                  uploadingSongAudio ||
                  uploadingAlbumProgress !== null ||
                  (postType === "text" && !draft.trim()) ||
                  (postType === "image" && draftImages.length === 0 && !draft.trim()) ||
                  (postType === "audio" && !songAudioUrl) ||
                  (postType === "album" && albumTracks.length === 0)
                }
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl px-6 h-11 sm:h-12 shadow-md shadow-[#ea6f2a]/20 text-xs sm:text-sm"
              >
                {posting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {postType === "audio" ? "Publish Song" : postType === "album" ? "Publish Album Release" : "Publish Update"}
                  </>
                )}
              </Button>
            </div>
          </section>
        )}

        {/* Posts Feed */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-8 sm:p-14 text-center">
            {activeFilter === "audio" ? (
              <>
                <Music className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#20efe0]" />
                <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">No music songs posted yet</p>
                <p className="text-sm sm:text-base text-[#dbe0fb] mt-2 max-w-md mx-auto leading-relaxed">
                  {band.is_owner
                    ? "Select 'Song (MP3)' or 'Multiple Songs / Album' in the composer above to post free streaming music for your fans!"
                    : "The artist has not posted any audio tracks to this feed yet."}
                </p>
              </>
            ) : activeFilter === "image" ? (
              <>
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#ffd166]" />
                <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">No photos posted yet</p>
                <p className="text-sm sm:text-base text-[#dbe0fb] mt-2 max-w-md mx-auto leading-relaxed">
                  Select 'Picture / Photo' above to share photo updates with fans.
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#ea6f2a]" />
                <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">No updates in this view</p>
                <p className="text-sm sm:text-base text-[#dbe0fb] mt-2 max-w-md mx-auto leading-relaxed">
                  {band.is_authenticated ? "Be the first to share an update, announce a gig, or drop a song above!" : "Sign in to join the conversation and support the band."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                band={band}
                onDeletePost={handleDeletePost}
                onRefresh={refresh}
                setError={setError}
              />
            ))}
          </div>
        )}

        {!band.is_authenticated && (
          <div className="mt-8 p-6 sm:p-8 rounded-3xl border border-[#20205a]/60 bg-[#0c0c3f]/40 text-center">
            <p className="text-sm sm:text-base text-[#dbe0fb]">
              Want to join the conversation and post updates?{" "}
              <Link href="/login" className="text-[#ea6f2a] hover:text-[#ffd166] hover:underline font-bold ml-1">
                Sign in to your StarCast account
              </Link>
            </p>
          </div>
        )}
      </main>

      <Footer />

      {/* QR Code Modal */}
      <BandQrModal
        isOpen={qrModalOpen}
        onOpenChange={setQrModalOpen}
        band={{
          name: band.name,
          slug: band.slug,
          logo_url: band.logo_url,
          genre: band.genre,
          type: band.type,
        }}
      />
    </div>
  )
}

function PostCard({
  post,
  band,
  onDeletePost,
  onRefresh,
  setError,
}: {
  post: BandPost
  band: PublicBand
  onDeletePost: (id: string) => void
  onRefresh: () => Promise<void>
  setError: (m: string) => void
}) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleComment() {
    if (!comment.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await addBandComment(post.id, comment)
      setComment("")
      await onRefresh()
    } catch (e: any) {
      setError(e?.message || "Failed to comment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      await deleteBandComment(id)
      await onRefresh()
    } catch (e: any) {
      setError(e?.message || "Failed to delete comment")
    }
  }

  const isAudioPost = post.post_type === "audio" || post.post_type === "album" || (post.audio_tracks && post.audio_tracks.length > 0)

  return (
    <article className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/70 to-[#070725]/80 p-6 sm:p-7 shadow-xl hover:border-[#ea6f2a]/40 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar name={post.author_name} src={post.author_avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-base sm:text-lg text-[#f5f7ff] leading-tight">
                  {post.author_name}
                </p>
                {post.author_is_owner && (
                  <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 text-[10px] px-2 py-0.5 uppercase font-mono font-bold">
                    {band.type === "artist" ? "Artist" : "Band"}
                  </Badge>
                )}
                {post.post_type === "audio" && (
                  <Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30 text-[10px] px-2 py-0.5 uppercase font-mono font-bold flex items-center gap-1">
                    <Music className="w-3 h-3" /> Music Single
                  </Badge>
                )}
                {post.post_type === "album" && (
                  <Badge className="bg-[#ffd166]/15 text-[#ffd166] border border-[#ffd166]/30 text-[10px] px-2 py-0.5 uppercase font-mono font-bold flex items-center gap-1">
                    <Disc3 className="w-3 h-3" /> Album Release
                  </Badge>
                )}
                {post.post_type === "image" && (
                  <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30 text-[10px] px-2 py-0.5 uppercase font-mono font-bold flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Photo Drop
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#20efe0] font-mono mt-1">{timeAgo(post.created_at)}</p>
            </div>
            {post.can_delete && (
              <button
                onClick={() => onDeletePost(post.id)}
                className="text-[#9a9fc4] hover:text-red-400 p-1.5 rounded-lg hover:bg-[#20205a]/40 transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {post.content && (
            <p className="text-[#f5f7ff] mt-3.5 whitespace-pre-wrap leading-relaxed text-pretty text-base sm:text-lg">
              {post.content}
            </p>
          )}

          {/* Embedded Custom Cosmic MP3 Player for Audio and Album Posts */}
          {post.audio_tracks && post.audio_tracks.length > 0 && (
            <div className="mt-4">
              <PostAudioPlayer
                tracks={post.audio_tracks}
                postType={post.post_type}
                bandName={band.name}
                bandLogo={band.logo_url}
              />
            </div>
          )}

          {post.images.length > 0 && (
            <div className={`grid gap-2.5 mt-4 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {post.images.map((src, idx) => (
                <img
                  key={idx}
                  src={src || "/placeholder.svg"}
                  alt={`Post attachment ${idx + 1}`}
                  className="w-full rounded-2xl object-cover border border-[#20205a] max-h-96 shadow-md"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6 pl-4 border-l-2 border-[#20205a]/60 space-y-3.5">
        {post.comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 group">
            <Avatar name={c.author_name} src={c.author_avatar} />
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl bg-[#05052d]/95 border border-[#20205a]/60 px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-[#f5f7ff]">{c.author_name}</p>
                  {c.can_delete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-[#9a9fc4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#dbe0fb] mt-1.5 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
              <p className="text-[11px] text-[#20efe0]/90 font-mono mt-1 ml-1">{timeAgo(c.created_at)}</p>
            </div>
          </div>
        ))}

        {band.is_authenticated ? (
          <div className="flex items-center gap-2 pt-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  handleComment()
                }
              }}
              placeholder="Write a reply..."
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 min-h-[44px] max-h-24 resize-none py-2.5 px-3.5 text-xs sm:text-sm rounded-xl"
              rows={1}
            />
            <Button
              onClick={handleComment}
              disabled={submitting || !comment.trim()}
              size="icon"
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white shrink-0 rounded-xl h-11 w-11 shadow-md shadow-[#ea6f2a]/20"
              aria-label="Send reply"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
