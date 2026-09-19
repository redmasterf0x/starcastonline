"use client"

import { useState, useEffect, useRef } from "react"
import {
  getBandTracks,
  addBandTrack,
  updateBandTrack,
  deleteBandTrack,
  reorderBandTracks,
  toggleBandMusicCatalog,
  normalizeAudioUrl,
  type BandTrackItem,
  type TrackInput,
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

  // Track Dialog (New / Edit)
  const [trackDialogOpen, setTrackDialogOpen] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [trackForm, setTrackForm] = useState<TrackInput>({
    title: "",
    audioUrl: "",
    durationSeconds: 0,
    albumName: "",
    coverArtUrl: "",
    releaseYear: new Date().getFullYear().toString(),
    genre: "",
    description: "",
    lyrics: "",
    allowDownload: true,
  })

  // Audio Upload / Source Method: "upload" | "url"
  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload")
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

  function handleOpenNewTrack() {
    setError("")
    setEditingTrackId(null)
    setTrackForm({
      title: "",
      audioUrl: "",
      durationSeconds: 0,
      albumName: "",
      coverArtUrl: band.logo_url || "",
      releaseYear: new Date().getFullYear().toString(),
      genre: "",
      description: "",
      lyrics: "",
      allowDownload: true,
    })
    setSourceMode("upload")
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
    setSourceMode("url")
    setTrackDialogOpen(true)
  }

  async function handleAudioFileUpload(file: File) {
    setUploadingAudio(true)
    setError("")
    try {
      // Auto fill title if empty
      if (!trackForm.title) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        setTrackForm((prev) => ({ ...prev, title: cleanTitle }))
      }

      // Detect duration using local audio object
      try {
        const tempUrl = URL.createObjectURL(file)
        const tempAudio = new Audio(tempUrl)
        tempAudio.addEventListener("loadedmetadata", () => {
          if (tempAudio.duration && isFinite(tempAudio.duration)) {
            setTrackForm((prev) => ({ ...prev, durationSeconds: Math.round(tempAudio.duration) }))
          }
        })
      } catch {
        // Duration detection fallback
      }

      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "bands/music")

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed")
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
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "bands/artwork")

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "Cover art upload failed")
      }

      setTrackForm((prev) => ({ ...prev, coverArtUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload artwork.")
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
      setError("Please upload an audio file or enter a valid streaming link.")
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

      {/* ── 1. MUSIC CATALOG CONTROLS CARD ── */}
      <Card className="border-[#20205a]/60 bg-gradient-to-br from-[#0c0c3f]/90 via-[#0a0a2e]/80 to-[#121248]/60 shadow-xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
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
                  {catalogEnabled ? "Live on Page" : "Disabled"}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm text-[#9a9fc4]">
                Upload tracks, demos, and singles for free streaming on your public soundstage page.
              </CardDescription>
            </div>

            {/* Enable / Disable Master Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#05052d]/90 border border-[#20205a] shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-[#f5f7ff]">
                {catalogEnabled ? "Catalog Active" : "Catalog Inactive"}
              </span>
              <Switch
                checked={catalogEnabled}
                onCheckedChange={handleToggleCatalog}
                disabled={savingSettings}
                className="data-[state=checked]:bg-[#ea6f2a]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
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
            <p className="text-[11px] text-[#7f84ad]">
              This title is displayed on your band&apos;s public profile above the audio player.
            </p>
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

          <Button
            onClick={handleOpenNewTrack}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-10 px-4 shadow-md shadow-[#ea6f2a]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Upload Song / Track
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#ea6f2a] animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border border-dashed border-[#20205a] bg-[#05052d]/40 p-6 sm:p-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
                <FileAudio className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#f5f7ff]">No Songs Uploaded Yet</h3>
              <p className="text-xs sm:text-sm text-[#9a9fc4] max-w-md mx-auto leading-relaxed">
                Add your singles, EP demos, live bootlegs, or studio tracks. Fans can listen to them directly from your band page for free!
              </p>
              <div className="pt-2">
                <Button
                  onClick={handleOpenNewTrack}
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-11 px-5"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add First Song
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
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                          isThisPlaying
                            ? "bg-[#20efe0] text-black shadow-lg shadow-[#20efe0]/30"
                            : "bg-[#0c0c3f] border border-[#20205a] text-[#f5f7ff] hover:bg-[#ea6f2a] hover:border-[#ea6f2a]"
                        }`}
                        aria-label={isThisPlaying ? "Pause preview" : "Play preview"}
                      >
                        {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                      </button>

                      {/* Cover Art Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-[#0c0c3f] border border-[#20205a] overflow-hidden shrink-0 relative">
                        {track.coverArtUrl ? (
                          <img
                            src={track.coverArtUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ea6f2a]">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Title, Album & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#f5f7ff] text-sm sm:text-base truncate">
                            {track.title}
                          </span>
                          {track.genre && (
                            <Badge variant="outline" className="border-[#20efe0]/30 text-[#20efe0] text-[10px] px-1.5 py-0">
                              {track.genre}
                            </Badge>
                          )}
                          {track.allowDownload && (
                            <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-600/30 text-[10px] px-1.5 py-0">
                              Free Download
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#9a9fc4] mt-0.5">
                          {track.albumName && <span>{track.albumName}</span>}
                          {track.releaseYear && <span>({track.releaseYear})</span>}
                          {track.durationSeconds > 0 && <span>{formatDuration(track.durationSeconds)}</span>}
                          <span className="flex items-center gap-1 font-mono text-[#ffd166]">
                            <Headphones className="w-3 h-3" /> {track.playCount} plays
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
                      {/* Move Up/Down Order */}
                      <div className="flex items-center bg-[#0c0c3f] border border-[#20205a] rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveTrack(idx, "up")}
                          className="p-1.5 text-[#9a9fc4] hover:text-[#f5f7ff] disabled:opacity-30"
                          aria-label="Move track up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === tracks.length - 1}
                          onClick={() => handleMoveTrack(idx, "down")}
                          className="p-1.5 text-[#9a9fc4] hover:text-[#f5f7ff] disabled:opacity-30"
                          aria-label="Move track down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditTrack(track)}
                        className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 h-9 px-2.5 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="border-red-900/40 text-red-400 hover:bg-red-950/40 hover:text-red-300 h-9 px-2.5 text-xs"
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

      {/* ── 3. ADD / EDIT TRACK MODAL ── */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="w-[96vw] max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto border border-[#20205a] bg-[#0c0c3f]/98 text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black text-[#f5f7ff] flex items-center gap-2">
              <Music className="w-5 h-5 text-[#ea6f2a]" />
              {editingTrackId ? "Edit Song Details" : "Upload / Add Song to Catalog"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#9a9fc4]">
              Provide audio file or link, artwork, and liner notes for {band.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTrack} className="space-y-5 pt-2">
            {/* Title */}
            <div>
              <Label htmlFor="track-title" className="text-xs font-semibold text-[#f5f7ff]">
                Track Title *
              </Label>
              <Input
                id="track-title"
                value={trackForm.title}
                onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                placeholder="e.g. Midnight Horizon, Kansas Stargazer..."
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-sm"
              />
            </div>

            {/* Audio Source Tabs */}
            <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a] space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-[#ea6f2a]" /> Audio File / Streaming Source *
                </Label>
                <div className="flex rounded-lg border border-[#20205a] p-0.5 bg-[#0c0c3f]">
                  <button
                    type="button"
                    onClick={() => setSourceMode("upload")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      sourceMode === "upload" ? "bg-[#ea6f2a] text-white" : "text-[#9a9fc4] hover:text-white"
                    }`}
                  >
                    Direct Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode("url")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      sourceMode === "url" ? "bg-[#ea6f2a] text-white" : "text-[#9a9fc4] hover:text-white"
                    }`}
                  >
                    Drive / Cloud URL
                  </button>
                </div>
              </div>

              {sourceMode === "upload" ? (
                <div className="space-y-2">
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleAudioFileUpload(f)
                    }}
                  />
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    className="border-2 border-dashed border-[#20205a] hover:border-[#ea6f2a] rounded-xl p-6 text-center cursor-pointer bg-[#0c0c3f]/60 transition-colors"
                  >
                    {uploadingAudio ? (
                      <div className="flex flex-col items-center gap-2 text-[#ea6f2a]">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-semibold">Uploading and processing audio track...</span>
                      </div>
                    ) : trackForm.audioUrl ? (
                      <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="text-xs font-semibold">Audio Track Ready</span>
                        <span className="text-[11px] text-[#9a9fc4] font-mono truncate max-w-sm">
                          {trackForm.audioUrl}
                        </span>
                        <span className="text-[10px] text-[#ea6f2a] hover:underline">Click to change audio file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-[#9a9fc4]">
                        <Upload className="w-6 h-6 text-[#ea6f2a]" />
                        <span className="text-xs font-semibold text-[#f5f7ff]">Click to upload MP3, WAV, AAC, M4A, or FLAC</span>
                        <span className="text-[11px] text-[#7f84ad]">Instant streaming from StarCast Cloud</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    value={trackForm.audioUrl}
                    onChange={(e) => setTrackForm({ ...trackForm, audioUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... or direct https://...mp3"
                    className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] text-sm"
                  />
                  <p className="text-[11px] text-[#7f84ad]">
                    💡 <strong>Tip:</strong> You can paste a Google Drive share link! StarCast will automatically convert it into a streamable direct audio feed.
                  </p>
                </div>
              )}
            </div>

            {/* Album & Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="album-name" className="text-xs text-[#9a9fc4]">
                  Album / EP / Single
                </Label>
                <Input
                  id="album-name"
                  value={trackForm.albumName || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, albumName: e.target.value })}
                  placeholder="e.g. Topeka Sessions EP"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="release-year" className="text-xs text-[#9a9fc4]">
                  Release Year
                </Label>
                <Input
                  id="release-year"
                  value={trackForm.releaseYear || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, releaseYear: e.target.value })}
                  placeholder="2026"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
              <div>
                <Label htmlFor="track-genre" className="text-xs text-[#9a9fc4]">
                  Genre / Subgenre
                </Label>
                <Input
                  id="track-genre"
                  value={trackForm.genre || ""}
                  onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                  placeholder="e.g. Rock, Indie, Synthwave"
                  className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
                />
              </div>
            </div>

            {/* Artwork Upload & Free Download Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Cover Art */}
              <div>
                <Label className="text-xs text-[#9a9fc4]">Track Artwork / Single Cover</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="w-12 h-12 rounded-lg bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0">
                    {trackForm.coverArtUrl ? (
                      <img
                        src={trackForm.coverArtUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
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

              {/* Free Download Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#05052d] border border-[#20205a]">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Free MP3 Download
                  </Label>
                  <p className="text-[10px] text-[#7f84ad]">Allow fans to save audio file to device</p>
                </div>
                <Switch
                  checked={trackForm.allowDownload}
                  onCheckedChange={(checked) => setTrackForm({ ...trackForm, allowDownload: checked })}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            {/* Description & Liner Notes */}
            <div>
              <Label htmlFor="track-notes" className="text-xs text-[#9a9fc4]">
                Liner Notes, Personnel &amp; Lyrics (Optional)
              </Label>
              <Textarea
                id="track-notes"
                value={trackForm.lyrics || trackForm.description || ""}
                onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value, description: e.target.value })}
                placeholder="Recorded at StarCast Studio A, lyrics, producer credits..."
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
                {editingTrackId ? "Save Track Changes" : "Publish Song to Catalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
