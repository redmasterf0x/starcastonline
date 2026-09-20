"use client"

import { useState, useEffect, useRef } from "react"
import {
  getBandTracks,
  addBandTrack,
  updateBandTrack,
  deleteBandTrack,
  reorderBandTracks,
  toggleBandMusicCatalog,
  releaseBandAlbum,
  normalizeAudioUrl,
  type BandTrackItem,
  type TrackInput,
  type AlbumReleaseInput,
} from "@/app/actions/band-tracks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Music,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Upload,
  Link2,
  Download,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileAudio,
  Radio,
  ExternalLink,
  Disc3,
  Layers,
  FolderPlus,
  Info,
} from "lucide-react"

interface BandMusicPanelProps {
  band: {
    id: string
    name: string
    slug?: string
    logo_url?: string
    music_catalog_enabled?: boolean
    music_catalog_title?: string | null
  }
  onRefreshBand?: () => void
}

interface AlbumBatchTrackItem {
  id: string
  file?: File
  title: string
  audioUrl?: string
  durationSeconds: number
  lyrics?: string
}

export function BandMusicPanel({ band, onRefreshBand }: BandMusicPanelProps) {
  const [tracks, setTracks] = useState<BandTrackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Catalog Settings State
  const [catalogEnabled, setCatalogEnabled] = useState(Boolean(band.music_catalog_enabled))
  const [catalogTitle, setCatalogTitle] = useState(band.music_catalog_title || "Original Music & Tracks")
  const [savingSettings, setSavingSettings] = useState(false)

  // 1. Single Track Dialog (New / Edit)
  const [trackDialogOpen, setTrackDialogOpen] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [trackForm, setTrackForm] = useState<TrackInput>({
    title: "",
    audioUrl: "",
    durationSeconds: 0,
    albumName: "Single",
    coverArtUrl: "",
    releaseYear: new Date().getFullYear().toString(),
    genre: "",
    description: "",
    lyrics: "",
    allowDownload: true,
  })

  // 2. Album / EP Batch Release Dialog
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false)
  const [albumForm, setAlbumForm] = useState<{
    title: string
    releaseYear: string
    genre: string
    coverArtUrl: string
    allowDownload: boolean
  }>({
    title: "",
    releaseYear: new Date().getFullYear().toString(),
    genre: "",
    coverArtUrl: band.logo_url || "",
    allowDownload: true,
  })
  const [albumTracks, setAlbumTracks] = useState<AlbumBatchTrackItem[]>([])
  const [albumUploadProgress, setAlbumUploadProgress] = useState<string | null>(null)
  const albumMultiAudioInputRef = useRef<HTMLInputElement>(null)
  const albumCoverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAlbumCover, setUploadingAlbumCover] = useState(false)

  // Audio Upload / Source Method: "upload" | "url"
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // In-Panel Audio Preview
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadTracks()
  }, [band.id])

  async function loadTracks() {
    setLoading(true)
    setError("")
    try {
      const data = await getBandTracks(band.id)
      setTracks(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load music tracks.")
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleCatalog(enabled: boolean) {
    setSavingSettings(true)
    setError("")
    try {
      const res = await toggleBandMusicCatalog(band.id, enabled, catalogTitle)
      if (res.success) {
        setCatalogEnabled(enabled)
        setSuccessMessage(enabled ? "Music catalog enabled on your public page!" : "Music catalog disabled.")
        onRefreshBand?.()
      } else {
        setError(res.error || "Failed to update catalog status.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update catalog status.")
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleSaveCatalogTitle() {
    setSavingSettings(true)
    setError("")
    try {
      const res = await toggleBandMusicCatalog(band.id, catalogEnabled, catalogTitle)
      if (res.success) {
        setSuccessMessage("Music catalog title updated!")
        onRefreshBand?.()
      } else {
        setError(res.error || "Failed to update catalog title.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update catalog title.")
    } finally {
      setSavingSettings(false)
    }
  }

  // ── Single Track Helpers ──
  function handleOpenNewTrack() {
    setError("")
    setEditingTrackId(null)
    setTrackForm({
      title: "",
      audioUrl: "",
      durationSeconds: 0,
      albumName: "Single",
      coverArtUrl: band.logo_url || "",
      releaseYear: new Date().getFullYear().toString(),
      genre: "",
      description: "",
      lyrics: "",
      allowDownload: true,
    })
    setTrackDialogOpen(true)
  }

  function handleOpenEditTrack(t: BandTrackItem) {
    setError("")
    setEditingTrackId(t.id)
    setTrackForm({
      title: t.title,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds,
      albumName: t.albumName || "",
      coverArtUrl: t.coverArtUrl || "",
      releaseYear: t.releaseYear || "",
      genre: t.genre || "",
      description: t.description || "",
      lyrics: t.lyrics || "",
      allowDownload: t.allowDownload,
    })
    setTrackDialogOpen(true)
  }

  async function handleAudioFileUpload(file: File) {
    setUploadingAudio(true)
    setError("")

    // 1. Clean track name from filename if empty
    if (!trackForm.title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s._-]+/, "")
        .replace(/[_-]+/g, " ")
        .trim()
      setTrackForm((prev) => ({ ...prev, title: cleanName }))
    }

    // 2. Extract Duration in browser
    try {
      const objectUrl = URL.createObjectURL(file)
      const audio = new Audio(objectUrl)
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setTrackForm((prev) => ({ ...prev, durationSeconds: Math.round(audio.duration) }))
        }
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      // Non-critical
    }

    // 3. Upload File to server
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `bands/${band.id}/audio`)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload audio file.")
      }

      setTrackForm((prev) => ({ ...prev, audioUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload audio file.")
    } finally {
      setUploadingAudio(false)
    }
  }

  async function handleCoverArtUpload(file: File) {
    setUploadingCover(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `bands/${band.id}/covers`)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload cover art.")
      }

      setTrackForm((prev) => ({ ...prev, coverArtUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload cover art.")
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSaveTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!trackForm.title.trim()) {
      setError("Track title is required.")
      return
    }
    if (!trackForm.audioUrl.trim()) {
      setError("Please upload an MP3/audio file or enter a valid streaming link.")
      return
    }

    setBusy(true)
    setError("")
    try {
      if (editingTrackId) {
        const res = await updateBandTrack(editingTrackId, trackForm)
        if (!res.success) {
          setError(res.error || "Failed to update track.")
          setBusy(false)
          return
        }
      } else {
        const res = await addBandTrack(band.id, trackForm)
        if (!res.success) {
          setError(res.error || "Failed to add track.")
          setBusy(false)
          return
        }
        // If first track, make sure catalog is active
        if (!catalogEnabled) {
          await handleToggleCatalog(true)
        }
      }

      setTrackDialogOpen(false)
      setSuccessMessage(editingTrackId ? "Track updated!" : "Track added to catalog!")
      await loadTracks()
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setBusy(false)
    }
  }

  // ── Album / EP Batch Release Helpers ──
  function handleOpenAlbumDialog() {
    setError("")
    setAlbumForm({
      title: "",
      releaseYear: new Date().getFullYear().toString(),
      genre: "",
      coverArtUrl: band.logo_url || "",
      allowDownload: true,
    })
    setAlbumTracks([])
    setAlbumUploadProgress(null)
    setAlbumDialogOpen(true)
  }

  async function handleAlbumCoverUpload(file: File) {
    setUploadingAlbumCover(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `bands/${band.id}/albums`)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")

      setAlbumForm((prev) => ({ ...prev, coverArtUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload album artwork.")
    } finally {
      setUploadingAlbumCover(false)
    }
  }

  function handleBatchAudioSelect(files: FileList | null) {
    if (!files || files.length === 0) return

    const newTracks: AlbumBatchTrackItem[] = []
    const fileArray = Array.from(files)

    // Sort files naturally by filename (01 - ..., 02 - ...)
    fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))

    for (const file of fileArray) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s._-]+/, "")
        .replace(/[_-]+/g, " ")
        .trim()

      const item: AlbumBatchTrackItem = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        title: cleanName || file.name,
        durationSeconds: 0,
      }

      // Detect duration in browser
      try {
        const objectUrl = URL.createObjectURL(file)
        const audio = new Audio(objectUrl)
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setAlbumTracks((prev) =>
              prev.map((t) => (t.id === item.id ? { ...t, durationSeconds: Math.round(audio.duration) } : t))
            )
          }
          URL.revokeObjectURL(objectUrl)
        }
      } catch {
        // Non-blocking
      }

      newTracks.push(item)
    }

    setAlbumTracks((prev) => [...prev, ...newTracks])
  }

  function handleMoveAlbumTrack(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= albumTracks.length) return
    const list = [...albumTracks]
    const [moved] = list.splice(index, 1)
    list.splice(target, 0, moved)
    setAlbumTracks(list)
  }

  function handleRemoveAlbumTrack(id: string) {
    setAlbumTracks((prev) => prev.filter((t) => t.id !== id))
  }

  async function handlePublishAlbum(e: React.FormEvent) {
    e.preventDefault()
    if (!albumForm.title.trim()) {
      setError("Album / EP title is required.")
      return
    }
    if (albumTracks.length === 0) {
      setError("Please select at least 1 audio track for the album.")
      return
    }

    setBusy(true)
    setError("")

    try {
      const finalizedTracks: { title: string; audioUrl: string; durationSeconds?: number; lyrics?: string }[] = []

      // 1. Upload files sequentially with progress updates
      for (let i = 0; i < albumTracks.length; i++) {
        const item = albumTracks[i]
        setAlbumUploadProgress(`Uploading track ${i + 1} of ${albumTracks.length}: "${item.title}"...`)

        let finalAudioUrl = item.audioUrl || ""

        if (item.file) {
          const formData = new FormData()
          formData.append("file", item.file)
          formData.append("folder", `bands/${band.id}/albums`)

          const res = await fetch("/api/upload", { method: "POST", body: formData })
          const data = await res.json()
          if (!res.ok || !data.url) {
            throw new Error(`Failed to upload audio for track "${item.title}": ${data.error || "Upload failed"}`)
          }
          finalAudioUrl = data.url
        }

        finalizedTracks.push({
          title: item.title,
          audioUrl: finalAudioUrl,
          durationSeconds: item.durationSeconds,
          lyrics: item.lyrics,
        })
      }

      // 2. Batch commit album to database
      setAlbumUploadProgress("Publishing album to your soundstage...")
      const releaseInput: AlbumReleaseInput = {
        albumTitle: albumForm.title.trim(),
        releaseYear: albumForm.releaseYear.trim(),
        genre: albumForm.genre.trim(),
        coverArtUrl: albumForm.coverArtUrl.trim(),
        allowDownload: albumForm.allowDownload,
        tracks: finalizedTracks,
      }

      const res = await releaseBandAlbum(band.id, releaseInput)
      if (!res.success) {
        throw new Error(res.error || "Failed to finalize album release.")
      }

      setCatalogEnabled(true)
      setAlbumDialogOpen(false)
      setSuccessMessage(`Album "${albumForm.title}" with ${finalizedTracks.length} tracks published successfully!`)
      await loadTracks()
      onRefreshBand?.()
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while publishing the album.")
    } finally {
      setBusy(false)
      setAlbumUploadProgress(null)
    }
  }

  // ── General Track Operations ──
  async function handleDeleteTrack(trackId: string) {
    if (!confirm("Are you sure you want to remove this track from your catalog?")) return

    setBusy(true)
    try {
      const res = await deleteBandTrack(trackId)
      if (res.success) {
        setTracks((prev) => prev.filter((t) => t.id !== trackId))
        if (previewTrackId === trackId) {
          audioRef.current?.pause()
          setPreviewTrackId(null)
          setIsPlaying(false)
        }
      } else {
        setError(res.error || "Failed to delete track.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to delete track.")
    } finally {
      setBusy(false)
    }
  }

  async function handleMoveTrack(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= tracks.length) return

    const newTracks = [...tracks]
    const [moved] = newTracks.splice(index, 1)
    newTracks.splice(targetIndex, 0, moved)
    setTracks(newTracks)

    try {
      await reorderBandTracks(band.id, newTracks.map((t) => t.id))
    } catch (err) {
      console.error("Failed to persist order:", err)
      loadTracks()
    }
  }

  function handleTogglePlayPreview(track: BandTrackItem) {
    if (previewTrackId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setPreviewTrackId(track.id)
      setIsPlaying(true)
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }

  function formatDuration(secs: number) {
    if (!secs || isNaN(secs)) return "0:00"
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── 1. MUSIC CATALOG CONTROLS & RELEASE RIBBON ── */}
      <Card className="border-[#20205a]/60 bg-gradient-to-br from-[#0c0c3f]/90 via-[#0a0a2e]/80 to-[#121248]/60 shadow-xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center text-[#ea6f2a]">
                  <Music className="w-4 h-4" />
                </div>
                <CardTitle className="text-xl font-black text-[#f5f7ff] tracking-tight">
                  Music &amp; Audio Catalog
                </CardTitle>
                <Badge
                  className={
                    catalogEnabled
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs"
                      : "bg-[#20205a]/60 text-[#9a9fc4] border border-[#20205a] text-xs"
                  }
                >
                  {catalogEnabled ? "Live on Public Page" : "Catalog Disabled"}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm text-[#9a9fc4]">
                Upload MP3 singles or entire albums for free streaming on your public soundstage page.
              </CardDescription>
            </div>

            {/* Enable / Disable Master Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#05052d]/90 border border-[#20205a] shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-[#f5f7ff]">
                {catalogEnabled ? "Public Player Enabled" : "Public Player Disabled"}
              </span>
              <Switch
                checked={catalogEnabled}
                onCheckedChange={handleToggleCatalog}
                disabled={savingSettings}
                className="data-[state=checked]:bg-[#20efe0]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Quick Release Action Buttons */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ea6f2a]/15 via-[#0c0c3f] to-[#20efe0]/10 border border-[#20205a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#f5f7ff] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#ffd166]" /> Release Music
              </p>
              <p className="text-xs text-[#9a9fc4]">
                Upload high quality MP3 audio directly.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                onClick={handleOpenNewTrack}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-10 px-4 shadow-md shadow-[#ea6f2a]/20"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Release Single (MP3)
              </Button>
              <Button
                onClick={handleOpenAlbumDialog}
                className="bg-gradient-to-r from-[#20efe0] to-[#00b4d8] hover:opacity-90 text-[#05051f] font-bold rounded-xl text-xs sm:text-sm h-10 px-4 shadow-md shadow-[#20efe0]/20"
              >
                <Disc3 className="w-4 h-4 mr-1.5 text-[#05051f]" /> Release Album / EP (Batch MP3s)
              </Button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Catalog Title Configuration */}
          <div className="p-4 rounded-xl bg-[#05052d]/70 border border-[#20205a]/60 space-y-2.5">
            <Label htmlFor="catalog-title" className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
              Public Section Headline
            </Label>
            <div className="flex gap-2">
              <Input
                id="catalog-title"
                value={catalogTitle}
                onChange={(e) => setCatalogTitle(e.target.value)}
                placeholder="e.g. Original Music, Unreleased Demos, 2026 Studio Sessions..."
                className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-sm h-10"
              />
              <Button
                onClick={handleSaveCatalogTitle}
                disabled={savingSettings || !catalogTitle.trim()}
                variant="outline"
                className="border-[#ea6f2a]/50 text-[#ea6f2a] hover:bg-[#ea6f2a]/15 shrink-0 h-10 px-4 text-xs font-bold"
              >
                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. TRACKS LIST & MANAGEMENT CARD ── */}
      <Card className="border-[#20205a]/60 bg-[#0c0c3f]/60 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#20efe0]" />
              Discography &amp; Audio Tracks ({tracks.length})
            </CardTitle>
            <CardDescription className="text-xs text-[#9a9fc4]">
              Manage the songs available to fans for direct in-browser streaming and free download.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenNewTrack}
              variant="outline"
              size="sm"
              className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/40 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#ea6f2a]" /> Add Single
            </Button>
            <Button
              onClick={handleOpenAlbumDialog}
              variant="outline"
              size="sm"
              className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 text-xs h-9"
            >
              <Disc3 className="w-3.5 h-3.5 mr-1" /> Add Album / EP
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#ea6f2a] animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-[#20205a] bg-[#05052d]/40 p-6 sm:p-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
                <FileAudio className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#f5f7ff]">No Songs in Catalog Yet</h3>
              <p className="text-xs sm:text-sm text-[#9a9fc4] max-w-md mx-auto leading-relaxed">
                Release your first single or drop an entire album/EP with batch MP3 upload. Fans can stream your tracks for free!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <Button
                  onClick={handleOpenNewTrack}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-11 px-5"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Release Single (MP3)
                </Button>
                <Button
                  onClick={handleOpenAlbumDialog}
                  className="bg-[#20efe0] hover:bg-[#20efe0]/90 text-[#05051f] font-bold rounded-xl text-xs sm:text-sm h-11 px-5"
                >
                  <Disc3 className="w-4 h-4 mr-1.5" /> Release Album / EP
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track, idx) => {
                const isThisPlaying = previewTrackId === track.id && isPlaying

                return (
                  <div
                    key={track.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all gap-3 ${
                      isThisPlaying
                        ? "bg-[#121248] border-[#20efe0]/50 shadow-[0_0_20px_rgba(32,239,224,0.15)]"
                        : "bg-[#05052d]/80 border-[#20205a]/60 hover:border-[#ea6f2a]/40"
                    }`}
                  >
                    {/* Track info & Cover thumbnail */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Play Preview Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlayPreview(track)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-transform active:scale-95 ${
                          isThisPlaying
                            ? "bg-[#20efe0] text-[#05051f] border-[#20efe0] shadow-[0_0_12px_rgba(32,239,224,0.4)]"
                            : "bg-[#0c0c3f] text-[#ea6f2a] border-[#ea6f2a]/40 hover:bg-[#ea6f2a] hover:text-white"
                        }`}
                      >
                        {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      {/* Track cover or logo */}
                      <div className="w-11 h-11 rounded-lg bg-[#05051f] border border-[#20205a] overflow-hidden shrink-0">
                        {track.coverArtUrl ? (
                          <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : band.logo_url ? (
                          <img src={band.logo_url} alt={band.name} className="w-full h-full object-cover opacity-70" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ea6f2a]">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#f5f7ff] truncate">{track.title}</span>
                          {track.albumName && (
                            <Badge variant="outline" className="border-[#20205a] text-[#9a9fc4] text-[10px] py-0 px-1.5">
                              {track.albumName}
                            </Badge>
                          )}
                          {track.releaseYear && (
                            <span className="text-[11px] text-[#7f84ad] font-mono">{track.releaseYear}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#9a9fc4] mt-0.5 flex-wrap">
                          {track.durationSeconds > 0 && <span>{formatDuration(track.durationSeconds)}</span>}
                          <span>·</span>
                          <span className="flex items-center gap-1 text-[#20efe0]">
                            <Headphones className="w-3 h-3" />
                            {track.playCount} {track.playCount === 1 ? "stream" : "streams"}
                          </span>
                          {track.allowDownload && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-400 text-[11px]">Free MP3 Download Enabled</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Reordering */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0 || busy}
                        onClick={() => handleMoveTrack(idx, "up")}
                        className="h-8 w-8 p-0 text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === tracks.length - 1 || busy}
                        onClick={() => handleMoveTrack(idx, "down")}
                        className="h-8 w-8 p-0 text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditTrack(track)}
                        className="h-8 w-8 p-0 text-[#9a9fc4] hover:text-[#ea6f2a] hover:bg-[#20205a]/50"
                        title="Edit Track"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDeleteTrack(track.id)}
                        className="h-8 w-8 p-0 text-[#9a9fc4] hover:text-red-400 hover:bg-red-950/40"
                        title="Delete Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. RELEASE SINGLE DIALOG ── */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              <Music className="w-5 h-5 text-[#ea6f2a]" />
              {editingTrackId ? "Edit Track Details" : "Release a Single (MP3)"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9a9fc4]">
              {editingTrackId
                ? "Update track information, lyrics, or replacement audio file."
                : "Upload an MP3 audio file or link from cloud storage for free streaming on your soundstage."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTrack} className="space-y-4 py-2">
            {/* Song Title */}
            <div>
              <Label htmlFor="single-title" className="text-xs text-[#9a9fc4]">
                Song / Track Title *
              </Label>
              <Input
                id="single-title"
                value={trackForm.title}
                onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                placeholder="e.g. Midnight Drive, Starlight, Broken Glass..."
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>

            {/* Audio Source: Direct Upload */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#05052d]/90 border border-[#20205a]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#f5f7ff]">Audio Track File *</Label>
              </div>

              <div>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleAudioFileUpload(f)
                  }}
                />
                <div
                  onClick={() => audioInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                    trackForm.audioUrl
                      ? "border-emerald-500/50 bg-emerald-950/20"
                      : "border-[#20205a] hover:border-[#ea6f2a]/60 bg-[#0c0c3f]/50"
                  }`}
                >
                  {uploadingAudio ? (
                    <div className="flex flex-col items-center gap-2 text-[#ea6f2a]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-semibold">Uploading and processing audio track...</span>
                    </div>
                  ) : trackForm.audioUrl ? (
                    <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-xs font-semibold">Audio Track Ready for Streaming</span>
                      <span className="text-[11px] text-[#9a9fc4] font-mono truncate max-w-sm">
                        {trackForm.audioUrl}
                      </span>
                      <span className="text-[10px] text-[#ea6f2a] hover:underline">Click to upload a different file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#9a9fc4]">
                      <Upload className="w-6 h-6 text-[#ea6f2a]" />
                      <span className="text-xs font-semibold text-[#f5f7ff]">Click or drop MP3, WAV, AAC, M4A, or FLAC</span>
                      <span className="text-[11px] text-[#7f84ad]">Instant high-speed streaming on StarCast</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Album & Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="single-album" className="text-xs text-[#9a9fc4]">
                  Release Type / Tag
                </Label>
                <Input
                  id="single-album"
                  value={trackForm.albumName || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, albumName: e.target.value })}
                  placeholder="Single"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="single-year" className="text-xs text-[#9a9fc4]">
                  Release Year
                </Label>
                <Input
                  id="single-year"
                  value={trackForm.releaseYear || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, releaseYear: e.target.value })}
                  placeholder="2026"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="single-genre" className="text-xs text-[#9a9fc4]">
                  Genre
                </Label>
                <Input
                  id="single-genre"
                  value={trackForm.genre || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                  placeholder="e.g. Rock, Indie, Metal"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
            </div>

            {/* Artwork Upload & Free Download Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <Label className="text-xs text-[#9a9fc4]">Single Artwork / Cover</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="w-12 h-12 rounded-lg bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0">
                    {trackForm.coverArtUrl ? (
                      <img src={trackForm.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ea6f2a]">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleCoverArtUpload(f)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 text-xs h-9"
                  >
                    {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                    Upload Artwork
                  </Button>
                </div>
              </div>

              {/* Free Download Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#05052d] border border-[#20205a]">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Free MP3 Download
                  </Label>
                  <p className="text-[10px] text-[#7f84ad]">Allow fans to download the file</p>
                </div>
                <Switch
                  checked={trackForm.allowDownload}
                  onCheckedChange={(checked) => setTrackForm({ ...trackForm, allowDownload: checked })}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            {/* Lyrics & Liner Notes */}
            <div>
              <Label htmlFor="single-lyrics" className="text-xs text-[#9a9fc4]">
                Lyrics &amp; Liner Notes (Optional)
              </Label>
              <Textarea
                id="single-lyrics"
                value={trackForm.lyrics || trackForm.description || ""}
                onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value, description: e.target.value })}
                placeholder="Song lyrics, credits, studio notes..."
                rows={3}
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-[#20205a]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrackDialogOpen(false)}
                disabled={busy}
                className="border-[#20205a] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || uploadingAudio}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                {editingTrackId ? "Save Changes" : "Release Single"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. RELEASE ALBUM / EP BATCH DIALOG ── */}
      <Dialog open={albumDialogOpen} onOpenChange={setAlbumDialogOpen}>
        <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[#20efe0]" />
              Release Album / EP / Mixtape (Batch MP3s)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9a9fc4]">
              Select multiple MP3 tracks at once to upload a full album, EP, or demo tape in one easy shot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePublishAlbum} className="space-y-4 py-2">
            {/* Album Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="album-title" className="text-xs text-[#9a9fc4]">
                  Album / EP Title *
                </Label>
                <Input
                  id="album-title"
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                  placeholder="e.g. Great Plains Reckoning (2026)"
                  required
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
              <div>
                <Label htmlFor="album-year" className="text-xs text-[#9a9fc4]">
                  Release Year
                </Label>
                <Input
                  id="album-year"
                  value={albumForm.releaseYear}
                  onChange={(e) => setAlbumForm({ ...albumForm, releaseYear: e.target.value })}
                  placeholder="2026"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                />
              </div>
            </div>

            {/* Album Cover & Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <Label className="text-xs text-[#9a9fc4]">Album Artwork Cover</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="w-12 h-12 rounded-lg bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0">
                    {albumForm.coverArtUrl ? (
                      <img src={albumForm.coverArtUrl} alt="Album Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#20efe0]">
                        <Disc3 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={albumCoverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleAlbumCoverUpload(f)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingAlbumCover}
                    onClick={() => albumCoverInputRef.current?.click()}
                    className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 text-xs h-9"
                  >
                    {uploadingAlbumCover ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                    Upload Cover Art
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="album-genre" className="text-xs text-[#9a9fc4]">
                  Primary Genre
                </Label>
                <Input
                  id="album-genre"
                  value={albumForm.genre}
                  onChange={(e) => setAlbumForm({ ...albumForm, genre: e.target.value })}
                  placeholder="e.g. Alternative Rock, Synthwave"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
            </div>

            {/* Multi-Track MP3 Dropzone */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#20efe0]" /> Album Tracklist ({albumTracks.length} tracks)
                </Label>
                <input
                  ref={albumMultiAudioInputRef}
                  type="file"
                  multiple
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
                  className="hidden"
                  onChange={(e) => handleBatchAudioSelect(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => albumMultiAudioInputRef.current?.click()}
                  className="border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/15 text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Select MP3 Files
                </Button>
              </div>

              {albumTracks.length === 0 ? (
                <div
                  onClick={() => albumMultiAudioInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-[#20205a] hover:border-[#20efe0]/60 rounded-2xl bg-[#05052d]/60 text-center cursor-pointer space-y-2 transition-colors"
                >
                  <FolderPlus className="w-8 h-8 mx-auto text-[#20efe0]" />
                  <p className="text-xs sm:text-sm font-semibold text-[#f5f7ff]">
                    Click here to select multiple MP3 audio tracks
                  </p>
                  <p className="text-[11px] text-[#7f84ad]">
                    Tip: You can select all your album tracks at once (e.g. tracks 01 through 10)
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {albumTracks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#05052d] border border-[#20205a] gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-full bg-[#0c0c3f] border border-[#20205a] flex items-center justify-center font-mono font-bold text-[#20efe0] text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <Input
                          value={t.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setAlbumTracks((prev) => prev.map((item) => (item.id === t.id ? { ...item, title: val } : item)))
                          }}
                          className="h-8 border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-xs"
                          placeholder="Song Title"
                        />
                        {t.durationSeconds > 0 && (
                          <span className="text-[#9a9fc4] font-mono shrink-0">{formatDuration(t.durationSeconds)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() => handleMoveAlbumTrack(idx, "up")}
                          className="h-7 w-7 p-0 text-[#9a9fc4] hover:text-[#f5f7ff]"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === albumTracks.length - 1}
                          onClick={() => handleMoveAlbumTrack(idx, "down")}
                          className="h-7 w-7 p-0 text-[#9a9fc4] hover:text-[#f5f7ff]"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAlbumTrack(t.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:bg-red-950/40"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#05052d] border border-[#20205a]">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1">
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Allow Free MP3 Downloads for Album
                </Label>
                <p className="text-[10px] text-[#7f84ad]">Fans can download tracks directly from your soundstage</p>
              </div>
              <Switch
                checked={albumForm.allowDownload}
                onCheckedChange={(checked) => setAlbumForm({ ...albumForm, allowDownload: checked })}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            {/* Progress indicator */}
            {albumUploadProgress && (
              <div className="p-3 bg-[#121248] border border-[#20efe0]/50 rounded-xl text-[#20efe0] text-xs flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{albumUploadProgress}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-[#20205a]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAlbumDialogOpen(false)}
                disabled={busy}
                className="border-[#20205a] text-[#9a9fc4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || albumTracks.length === 0}
                className="bg-gradient-to-r from-[#20efe0] to-[#00b4d8] text-[#05051f] font-bold"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Disc3 className="w-4 h-4 mr-1.5" />}
                Publish Full Album ({albumTracks.length} Tracks)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
