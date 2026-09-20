"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { getBandPosts, createBandPost, deleteBandPost, type BandPost, type BandPostAudioTrack } from "@/app/actions/band-pages"
import { addBandTrack } from "@/app/actions/band-tracks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PostAudioPlayer } from "@/components/bands/post-audio-player"
import {
  Loader2,
  Music,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  ImagePlus,
  FileText,
  ImageIcon,
  Disc3,
  Sliders,
  Upload,
  Layers,
  X,
  Plus,
  Headphones,
  Filter,
} from "lucide-react"

export function BandPostsPanel({ bandId, bandName }: { bandId: string; bandName: string }) {
  const [posts, setPosts] = useState<BandPost[] | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "audio" | "image" | "text">("all")

  // Composer post type: "text" | "image" | "audio" | "album"
  const [postType, setPostType] = useState<"text" | "image" | "audio" | "album">("text")
  const [draft, setDraft] = useState("")
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const [justPosted, setJustPosted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image Upload state
  const [images, setImages] = useState<string[]>([])
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

  // Multiple Songs / Album Upload state
  const [albumTitle, setAlbumTitle] = useState("")
  const [albumProducer, setAlbumProducer] = useState("")
  const [albumCoverUrl, setAlbumCoverUrl] = useState("")
  const [uploadingAlbumCover, setUploadingAlbumCover] = useState(false)
  const [albumTracks, setAlbumTracks] = useState<
    Array<{ id: string; file?: File; title: string; audioUrl: string; durationSeconds: number }>
  >([])
  const [uploadingAlbumProgress, setUploadingAlbumProgress] = useState<string | null>(null)
  const albumMultiInputRef = useRef<HTMLInputElement>(null)
  const albumCoverInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      setPosts(await getBandPosts(bandId))
    } catch {
      setPosts([])
    }
  }, [bandId])

  useEffect(() => {
    load()
  }, [load])

  // ── Image Handlers ──
  const MAX_IMAGE_MB = 10
  const MAX_AUDIO_MB = 50
  const MAX_IMAGES_PER_POST = 10
  const MAX_TRACKS_PER_ALBUM = 25

  const handleImageFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (images.length + files.length > MAX_IMAGES_PER_POST) {
      setError(`Maximum ${MAX_IMAGES_PER_POST} photos allowed per post.`)
      return
    }

    setUploadingImage(true)
    setError(null)

    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`Photo "${file.name}" exceeds ${MAX_IMAGE_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
        setUploadingImage(false)
        return
      }

      const reader = new FileReader()
      reader.onload = async () => {
        const base64Url = reader.result as string
        setImages((prev) => [...prev, base64Url])

        try {
          const fd = new FormData()
          fd.append("file", file)
          fd.append("folder", `bands/${bandId}/posts`)
          const res = await fetch("/api/upload", { method: "POST", body: fd })
          const data = await res.json()
          if (data.url) {
            setImages((prev) => prev.map((img) => (img === base64Url ? data.url : img)))
          }
        } catch {
          // Keep base64 fallback
        }
      }
      reader.readAsDataURL(file)
    }
    setUploadingImage(false)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  // ── Single Song Handlers ──
  const handleSongAudioFile = async (file: File) => {
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`Audio file exceeds ${MAX_AUDIO_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setUploadingSongAudio(true)
    setError(null)

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
      fd.append("folder", `bands/${bandId}/audio`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Audio upload failed")
      setSongAudioUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload audio")
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
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", `bands/${bandId}/covers`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload cover art")
      setSongCoverUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload cover art")
    } finally {
      setUploadingSongCover(false)
    }
  }

  const handleAlbumCoverFile = async (file: File) => {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Cover art exceeds ${MAX_IMAGE_MB}MB limit.`)
      return
    }
    setUploadingAlbumCover(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", `bands/${bandId}/covers`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload cover art")
      setAlbumCoverUrl(data.url)
    } catch (e: any) {
      setError(e?.message || "Failed to upload cover art")
    } finally {
      setUploadingAlbumCover(false)
    }
  }

  // ── Multiple Songs Handlers ──
  const handleBatchAudioFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (albumTracks.length + files.length > MAX_TRACKS_PER_ALBUM) {
      setError(`Maximum ${MAX_TRACKS_PER_ALBUM} tracks allowed per album release.`)
      return
    }
    const fileArray = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    )

    const newItems: typeof albumTracks = []
    for (const file of fileArray) {
      const clean = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s._-]+/, "")
        .replace(/[_-]+/g, " ")
        .trim()

      const item = {
        id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        title: clean || file.name,
        audioUrl: "",
        durationSeconds: 0,
      }

      try {
        const objUrl = URL.createObjectURL(file)
        const audio = new Audio(objUrl)
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setAlbumTracks((prev) =>
              prev.map((t) => (t.id === item.id ? { ...t, durationSeconds: Math.round(audio.duration) } : t))
            )
          }
          URL.revokeObjectURL(objUrl)
        }
      } catch {
        // Non-blocking
      }

      newItems.push(item)
    }

    setAlbumTracks((prev) => [...prev, ...newItems])
  }

  // ── Submit Post ──
  const handlePost = async () => {
    if (posting) return
    setError(null)

    // Validation
    if (postType === "text" && !draft.trim()) {
      setError("Please write an update message.")
      return
    }

    if (postType === "image" && images.length === 0 && !draft.trim()) {
      setError("Please add at least one picture or text.")
      return
    }

    if (postType === "audio") {
      if (!songTitle.trim()) {
        setError("Song title is required.")
        return
      }
      if (!songAudioUrl.trim()) {
        setError("Please upload an MP3 audio track.")
        return
      }
    }

    if (postType === "album") {
      if (!albumTitle.trim()) {
        setError("Album / Release title is required.")
        return
      }
      if (albumTracks.length === 0) {
        setError("Please select at least one audio track.")
        return
      }
    }

    setPosting(true)

    try {
      let finalAudioTracks: BandPostAudioTrack[] = []

      if (postType === "audio") {
        // 1. Single Song Track
        const singleTrack: BandPostAudioTrack = {
          title: songTitle.trim(),
          audio_url: songAudioUrl.trim(),
          duration_seconds: songDuration,
          artist_name: bandName,
          producer: songProducer.trim() || undefined,
          cover_art_url: songCoverUrl || undefined,
          allow_download: true,
        }
        finalAudioTracks.push(singleTrack)

        // Also add to band tracks catalog
        try {
          await addBandTrack(bandId, {
            title: singleTrack.title,
            audioUrl: singleTrack.audio_url,
            durationSeconds: singleTrack.duration_seconds,
            producer: singleTrack.producer,
            coverArtUrl: singleTrack.cover_art_url,
            albumName: "Single",
          })
        } catch {
          // Ignore
        }
      } else if (postType === "album") {
        // 2. Batch Upload Album Tracks
        for (let i = 0; i < albumTracks.length; i++) {
          const item = albumTracks[i]
          let trackUrl = item.audioUrl

          if (item.file) {
            setUploadingAlbumProgress(`Uploading track ${i + 1} of ${albumTracks.length}: "${item.title}"...`)
            const fd = new FormData()
            fd.append("file", item.file)
            fd.append("folder", `bands/${bandId}/albums`)
            const res = await fetch("/api/upload", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(`Failed to upload audio for ${item.title}`)
            trackUrl = data.url
          }

          const trackObj: BandPostAudioTrack = {
            title: item.title.trim(),
            audio_url: trackUrl,
            duration_seconds: item.durationSeconds,
            artist_name: bandName,
            producer: albumProducer.trim() || undefined,
            cover_art_url: albumCoverUrl || undefined,
            allow_download: true,
          }
          finalAudioTracks.push(trackObj)

          // Also register in band tracks catalog
          try {
            await addBandTrack(bandId, {
              title: trackObj.title,
              audioUrl: trackObj.audio_url,
              durationSeconds: trackObj.duration_seconds,
              producer: trackObj.producer,
              coverArtUrl: trackObj.cover_art_url,
              albumName: albumTitle.trim(),
            })
          } catch {
            // Ignore
          }
        }
      }

      const postContent =
        draft.trim() ||
        (postType === "audio"
          ? `🎶 Released new single: "${songTitle}"`
          : postType === "album"
          ? `💿 Released new album: "${albumTitle}" (${finalAudioTracks.length} tracks)`
          : "")

      await createBandPost(bandId, postContent, images, postType, finalAudioTracks)

      // Reset Form
      setDraft("")
      setImages([])
      setSongTitle("")
      setSongProducer("")
      setSongAudioUrl("")
      setSongCoverUrl("")
      setSongDuration(0)
      setAlbumTitle("")
      setAlbumProducer("")
      setAlbumCoverUrl("")
      setAlbumTracks([])
      setFocused(false)
      setJustPosted(true)
      setTimeout(() => setJustPosted(false), 2000)
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Couldn't post. Please try again.")
    } finally {
      setPosting(false)
      setUploadingAlbumProgress(null)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    try {
      await deleteBandPost(postId)
      await load()
    } catch {
      /* ignore */
    }
  }

  const loading = posts === null

  // Filter posts
  const filteredPosts = (posts || []).filter((p) => {
    if (activeFilter === "all") return true
    if (activeFilter === "audio") return p.post_type === "audio" || p.post_type === "album" || (p.audio_tracks && p.audio_tracks.length > 0)
    if (activeFilter === "image") return p.post_type === "image" || (p.images && p.images.length > 0)
    if (activeFilter === "text") return p.post_type === "text" || (!p.audio_tracks?.length && !p.images?.length)
    return true
  })

  return (
    <div className="space-y-6">
      {/* ── 1. SELECTABLE POST TYPE COMPOSER ── */}
      <div
        className={`bg-[#0c0c3f]/90 border rounded-3xl p-5 sm:p-6 transition-all shadow-xl ${
          focused ? "border-[#ea6f2a]/60 shadow-lg shadow-[#ea6f2a]/10" : "border-[#20205a]/70"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#20205a]/60 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ea6f2a]" />
            <span className="text-sm font-bold text-[#f5f7ff]">Broadcast an Update, Drop a Song, or Release an Album</span>
          </div>
          <span className="text-xs font-mono text-[#20efe0]">Posting as {bandName}</span>
        </div>

        {/* Post Type Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#05052d] border border-[#20205a] mb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setPostType("text")
              setFocused(true)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              postType === "text"
                ? "bg-[#ea6f2a] text-white shadow-md"
                : "text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#0c0c3f]"
            }`}
          >
            <FileText className="w-4 h-4" /> Text Post
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType("image")
              setFocused(true)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              postType === "image"
                ? "bg-[#ea6f2a] text-white shadow-md"
                : "text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#0c0c3f]"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#ffd166]" /> Picture / Photo
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType("audio")
              setFocused(true)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              postType === "audio"
                ? "bg-[#20efe0] text-[#05051f] shadow-md shadow-[#20efe0]/20"
                : "text-[#20efe0] hover:bg-[#20efe0]/10 hover:text-white"
            }`}
          >
            <Music className="w-4 h-4" /> 🎵 Song (Single MP3)
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType("album")
              setFocused(true)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              postType === "album"
                ? "bg-gradient-to-r from-[#20efe0] to-[#ffd166] text-[#05051f] shadow-md"
                : "text-[#ffd166] hover:bg-[#ffd166]/10 hover:text-white"
            }`}
          >
            <Disc3 className="w-4 h-4" /> 💿 Multiple Songs / Album
          </button>
        </div>

        {/* Text Message Field */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] shadow-lg shadow-[#ea6f2a]/20 flex-shrink-0">
            {postType === "audio" ? (
              <Music className="w-5 h-5 text-white" />
            ) : postType === "album" ? (
              <Disc3 className="w-5 h-5 text-white" />
            ) : postType === "image" ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              rows={3}
              placeholder={
                postType === "audio"
                  ? `Describe this new song, inspiration, or drop notes as ${bandName}…`
                  : postType === "album"
                  ? `Write an album / EP announcement and backstory as ${bandName}…`
                  : postType === "image"
                  ? `Describe these photos or share an update…`
                  : `Post a message or update as ${bandName}…`
              }
              maxLength={2000}
              className="w-full resize-none bg-[#05052d] border border-[#20205a] rounded-xl p-3 text-[#f5f7ff] placeholder-[#9a9fc4]/70 outline-none focus:border-[#ea6f2a]/60 text-[15px] leading-relaxed"
            />
          </div>
        </div>

        {/* ── HIDDEN INPUTS FOR UPLOADS ── */}
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageFile(e.target.files)}
        />
        <input
          ref={songAudioInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleSongAudioFile(f)
          }}
        />
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
        <input
          ref={albumMultiInputRef}
          type="file"
          multiple
          accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
          className="hidden"
          onChange={(e) => handleBatchAudioFiles(e.target.files)}
        />
        <input
          ref={albumCoverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleAlbumCoverFile(f)
          }}
        />

        {/* ── CONDITIONAL COMPOSER FORMS ── */}

        {/* 1. Picture / Photo Upload */}
        {postType === "image" && (
          <div className="mt-4 pt-4 border-t border-[#20205a]/60 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 text-xs rounded-xl"
              >
                {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5 text-[#ea6f2a]" />}
                Add Photos
              </Button>
              <span className="text-xs text-[#9a9fc4]">{images.length} photos selected</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-[#05052d] border border-[#20205a] group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Song (Single MP3) Upload Form */}
        {postType === "audio" && (
          <div className="mt-4 pt-4 border-t border-[#20205a]/60 space-y-3.5 bg-[#05052d]/80 p-4 rounded-2xl border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9a9fc4]">Song Title *</Label>
                <Input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Midnight Highway"
                  className="mt-1 h-9 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9a9fc4]">Producer / Engineer (Optional)</Label>
                <Input
                  value={songProducer}
                  onChange={(e) => setSongProducer(e.target.value)}
                  placeholder="e.g. Ray Starnes"
                  className="mt-1 h-9 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-xs"
                />
              </div>
            </div>

            {/* Audio Dropzone */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingSongAudio}
                onClick={() => songAudioInputRef.current?.click()}
                className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/15 text-xs h-9 rounded-xl shrink-0"
              >
                {uploadingSongAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                {songAudioUrl ? "Change MP3 File" : "Select MP3 Audio File"}
              </Button>

              {songAudioUrl && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Ready ({songDuration}s)
                </span>
              )}

              {/* Cover Art Upload */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploadingSongCover}
                onClick={() => songCoverInputRef.current?.click()}
                className="text-[#9a9fc4] hover:text-[#f5f7ff] text-xs h-9 ml-auto"
              >
                {songCoverUrl ? "Artwork Added ✓" : "+ Cover Artwork"}
              </Button>
            </div>
          </div>
        )}

        {/* 3. Multiple Songs / Album Upload Form */}
        {postType === "album" && (
          <div className="mt-4 pt-4 border-t border-[#20205a]/60 space-y-3.5 bg-[#05052d]/80 p-4 rounded-2xl border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9a9fc4]">Album / EP Title *</Label>
                <Input
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="e.g. Great Plains Sessions"
                  className="mt-1 h-9 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9a9fc4]">Producer Credit</Label>
                <Input
                  value={albumProducer}
                  onChange={(e) => setAlbumProducer(e.target.value)}
                  placeholder="e.g. Studio A Production"
                  className="mt-1 h-9 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-xs"
                />
              </div>
            </div>

            {/* Batch MP3 Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => albumMultiInputRef.current?.click()}
                  className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/15 text-xs h-9 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Select Multiple MP3 Files
                </Button>
                <span className="text-xs text-[#9a9fc4]">{albumTracks.length} tracks queued</span>
              </div>

              {albumTracks.length > 0 && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 pt-1">
                  {albumTracks.map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0c0c3f] border border-[#20205a] text-xs gap-2">
                      <div className="flex items-center gap-2 truncate flex-1">
                        <span className="font-mono text-[#20efe0] text-[11px] font-bold w-4">{idx + 1}.</span>
                        <input
                          value={t.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setAlbumTracks((prev) => prev.map((item) => (item.id === t.id ? { ...item, title: val } : item)))
                          }}
                          className="bg-transparent border-none text-[#f5f7ff] text-xs outline-none flex-1 truncate"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlbumTracks((prev) => prev.filter((item) => item.id !== t.id))}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadingAlbumProgress && (
              <div className="p-2.5 rounded-xl bg-[#121248] text-[#20efe0] text-xs flex items-center gap-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{uploadingAlbumProgress}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Bar & Post Button */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#20205a]/50 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPostType("image")
                setTimeout(() => imageInputRef.current?.click(), 50)
              }}
              className="text-[#dbe0fb] hover:text-[#ffd166] text-xs h-9 px-2.5 rounded-xl hover:bg-[#20205a]/40"
            >
              <ImageIcon className="w-4 h-4 mr-1.5 text-[#ffd166]" />
              {images.length > 0 ? `${images.length} Photos Attached` : "Attach Photos"}
            </Button>

            <span className="text-xs text-[#9a9fc4] hidden sm:inline">
              Posting as <strong className="text-[#f5f7ff]">{bandName}</strong>
            </span>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePost}
              disabled={posting}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#ea6f2a]/25"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                </>
              ) : justPosted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Posted!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> {postType === "audio" ? "Post Song" : postType === "album" ? "Post Album" : "Post Update"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SEPARATE FILTER TABS FOR POSTS & MUSIC ── */}
      <div className="flex items-center justify-between border-b border-[#20205a]/60 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0c0c3f]/80 border border-[#20205a]">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "all" ? "bg-[#ea6f2a] text-white shadow-md" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            All Updates ({posts?.length || 0})
          </button>
          <button
            onClick={() => setActiveFilter("audio")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "audio" ? "bg-[#20efe0] text-[#05051f] shadow-md shadow-[#20efe0]/20 font-bold" : "text-[#20efe0] hover:bg-[#20efe0]/10"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" /> Music &amp; Songs Only
          </button>
          <button
            onClick={() => setActiveFilter("image")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "image" ? "bg-[#ea6f2a] text-white shadow-md" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveFilter("text")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "text" ? "bg-[#ea6f2a] text-white shadow-md" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
            }`}
          >
            Text Notes
          </button>
        </div>
      </div>

      {/* ── 3. POSTS FEED ── */}
      {loading ? (
        <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#ea6f2a] mx-auto" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto mb-2">
            <Music className="w-7 h-7 text-[#ea6f2a]" />
          </div>
          <p className="text-[#f5f7ff] text-base font-semibold">
            {activeFilter === "audio" ? "No Songs Posted Yet" : "No posts found"}
          </p>
          <p className="text-[#9a9fc4] text-xs">
            {activeFilter === "audio"
              ? `Select "Song (MP3)" or "Multiple Songs" above to post your music!`
              : `Share an update from ${bandName} above. 💫`}
          </p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-[#0c0c3f]/60 border border-[#20205a]/70 rounded-3xl p-5 sm:p-6 hover:border-[#ea6f2a]/40 transition-colors group space-y-4 shadow-xl"
          >
            {/* Author Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                  {post.author_avatar ? (
                    <AvatarImage src={post.author_avatar} alt="" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold">
                      {(post.author_name || "B")[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#f5f7ff] text-sm font-semibold">{post.author_name}</span>
                    {post.author_is_owner && (
                      <Badge className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-[10px] h-5">
                        <Sparkles className="w-3 h-3 mr-1" /> {bandName}
                      </Badge>
                    )}
                    {post.post_type === "audio" && (
                      <Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30 text-[10px] h-5">
                        <Music className="w-3 h-3 mr-1" /> Song Release
                      </Badge>
                    )}
                    {post.post_type === "album" && (
                      <Badge className="bg-[#ffd166]/15 text-[#ffd166] border border-[#ffd166]/30 text-[10px] h-5">
                        <Disc3 className="w-3 h-3 mr-1" /> Album Release
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-[#9a9fc4]/70 font-mono">
                    {new Date(post.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {post.can_delete && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#9a9fc4] hover:text-red-400 transition-all p-1"
                  aria-label="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Post Message Content */}
            {post.content && (
              <p className="text-[#d4d8ee] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {post.content}
              </p>
            )}

            {/* EMBEDDED MP3 AUDIO PLAYER (When post has audio tracks) */}
            {post.audio_tracks && post.audio_tracks.length > 0 && (
              <div className="pt-1">
                <PostAudioPlayer
                  tracks={post.audio_tracks}
                  postType={post.post_type}
                  bandName={bandName}
                />
              </div>
            )}

            {/* Photos */}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {post.images.map((img, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-[#05052d] border border-[#20205a]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Comments list */}
            {post.comments.length > 0 && (
              <div className="pt-3 border-t border-[#20205a]/40 space-y-2">
                {post.comments.map((c) => (
                  <p key={c.id} className="text-xs sm:text-sm text-[#9a9fc4]">
                    <span className="text-[#f5f7ff] font-medium">{c.author_name}:</span> {c.content}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
