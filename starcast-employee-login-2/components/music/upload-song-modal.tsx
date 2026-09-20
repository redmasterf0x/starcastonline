"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getMyBands } from "@/app/actions/bands"
import { addBandTrack, type TrackInput } from "@/app/actions/band-tracks"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Music,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Radio,
  Download,
  Disc3,
  User,
  Sliders,
  Users,
} from "lucide-react"

interface UploadSongModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (slug: string) => void
  defaultBandId?: string
}

export function UploadSongModal({ open, onOpenChange, onSuccess, defaultBandId }: UploadSongModalProps) {
  const router = useRouter()
  const [myBands, setMyBands] = useState<{ id: string; name: string; logo_url?: string }[]>([])
  const [selectedBandId, setSelectedBandId] = useState<string>(defaultBandId || "")
  const [loadingBands, setLoadingBands] = useState(true)

  // Form State
  const [form, setForm] = useState<{
    title: string
    artistName: string
    producer: string
    featuredArtists: string
    albumName: string
    genre: string
    releaseYear: string
    coverArtUrl: string
    audioUrl: string
    durationSeconds: number
    lyrics: string
    description: string
    allowDownload: boolean
  }>({
    title: "",
    artistName: "",
    producer: "",
    featuredArtists: "",
    albumName: "Single",
    genre: "",
    releaseYear: new Date().getFullYear().toString(),
    coverArtUrl: "",
    audioUrl: "",
    durationSeconds: 0,
    lyrics: "",
    description: "",
    allowDownload: true,
  })

  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      loadBands()
    }
  }, [open])

  async function loadBands() {
    setLoadingBands(true)
    try {
      const list = await getMyBands()
      const formatted = (list || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        logo_url: b.logo_url,
      }))
      setMyBands(formatted)
      if (formatted.length > 0 && !selectedBandId) {
        setSelectedBandId(formatted[0].id)
        if (!form.artistName) {
          setForm((prev) => ({
            ...prev,
            artistName: formatted[0].name,
            coverArtUrl: prev.coverArtUrl || formatted[0].logo_url || "",
          }))
        }
      }
    } catch {
      // Not logged in or no bands yet
    } finally {
      setLoadingBands(false)
    }
  }

  function handleBandSelect(bandId: string) {
    setSelectedBandId(bandId)
    const found = myBands.find((b) => b.id === bandId)
    if (found) {
      setForm((prev) => ({
        ...prev,
        artistName: found.name,
        coverArtUrl: prev.coverArtUrl || found.logo_url || "",
      }))
    }
  }

  const MAX_IMAGE_MB = 10
  const MAX_AUDIO_MB = 50

  async function handleAudioUpload(file: File) {
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`Audio file exceeds ${MAX_AUDIO_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setUploadingAudio(true)
    setError("")

    // Auto populate title if blank
    if (!form.title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s._-]+/, "")
        .replace(/[_-]+/g, " ")
        .trim()
      setForm((prev) => ({ ...prev, title: cleanName }))
    }

    // Extract duration in browser
    try {
      const objectUrl = URL.createObjectURL(file)
      const audio = new Audio(objectUrl)
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setForm((prev) => ({ ...prev, durationSeconds: Math.round(audio.duration) }))
        }
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      // Non-blocking
    }

    // Upload to server
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `music/tracks`)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Audio upload failed.")

      setForm((prev) => ({ ...prev, audioUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload audio track.")
    } finally {
      setUploadingAudio(false)
    }
  }

  async function handleCoverUpload(file: File) {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Cover image exceeds ${MAX_IMAGE_MB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setUploadingCover(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `music/covers`)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Cover image upload failed.")

      setForm((prev) => ({ ...prev, coverArtUrl: data.url }))
    } catch (err: any) {
      setError(err?.message || "Failed to upload cover art.")
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.title.trim()) {
      setError("Song title is required.")
      return
    }
    if (!form.audioUrl.trim()) {
      setError("Please upload an MP3/audio file or enter a valid streaming link.")
      return
    }

    let targetBandId = selectedBandId

    // If user has no band registered yet, require signing in / registering act
    if (!targetBandId) {
      if (myBands.length > 0) {
        targetBandId = myBands[0].id
      } else {
        setError("Please register or select your Artist/Band profile first in your Artist Portal (/portal).")
        return
      }
    }

    setBusy(true)

    try {
      const trackPayload: TrackInput = {
        title: form.title.trim(),
        artistName: form.artistName.trim() || undefined,
        producer: form.producer.trim() || undefined,
        featuredArtists: form.featuredArtists.trim() || undefined,
        audioUrl: form.audioUrl.trim(),
        durationSeconds: form.durationSeconds,
        albumName: form.albumName.trim() || "Single",
        genre: form.genre.trim() || undefined,
        releaseYear: form.releaseYear.trim() || new Date().getFullYear().toString(),
        coverArtUrl: form.coverArtUrl.trim() || undefined,
        lyrics: form.lyrics.trim() || undefined,
        description: form.description.trim() || undefined,
        allowDownload: form.allowDownload,
      }

      const res = await addBandTrack(targetBandId, trackPayload)
      if (!res.success) {
        throw new Error(res.error || "Failed to release song.")
      }

      const newSlug = (res as any).slug || (res as any).track?.slug || (res as any).track?.id
      onOpenChange(false)

      if (onSuccess && newSlug) {
        onSuccess(newSlug)
      } else if (newSlug) {
        router.push(`/music/${newSlug}`)
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while publishing the song.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#20205a] bg-[#0c0c3f] text-[#f5f7ff] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center text-[#ea6f2a]">
              <Music className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#f5f7ff]">
              Upload Song &amp; Launch Standalone Page
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#9a9fc4]">
            Add all your song information, artwork, and MP3 audio. Your song will instantly get its own dedicated page and player!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Act / Band Selector (if user has acts) */}
          {myBands.length > 0 && (
            <div className="p-3 rounded-xl bg-[#05052d]/80 border border-[#20205a] space-y-1.5">
              <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#20efe0]" /> Releasing Act / Band Profile *
              </Label>
              <div className="flex gap-2 flex-wrap">
                {myBands.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => handleBandSelect(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedBandId === b.id
                        ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                        : "bg-[#0c0c3f] text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Song Title & Artist Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="upload-song-title" className="text-xs text-[#9a9fc4]">
                Song / Track Title *
              </Label>
              <Input
                id="upload-song-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Midnight Drive, Starlight..."
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="upload-artist-name" className="text-xs text-[#9a9fc4]">
                Artist / Band Name *
              </Label>
              <Input
                id="upload-artist-name"
                value={form.artistName}
                onChange={(e) => setForm({ ...form, artistName: e.target.value })}
                placeholder="e.g. The Cosmic Echoes"
                required
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
              />
            </div>
          </div>

          {/* Producer & Featured Artists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="upload-producer" className="text-xs text-[#9a9fc4] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#ffd166]" /> Producer / Audio Engineer
              </Label>
              <Input
                id="upload-producer"
                value={form.producer}
                onChange={(e) => setForm({ ...form, producer: e.target.value })}
                placeholder="e.g. Ray Starnes, Studio A Production"
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
              />
            </div>
            <div>
              <Label htmlFor="upload-featured" className="text-xs text-[#9a9fc4] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#20efe0]" /> Featured Artists (Optional)
              </Label>
              <Input
                id="upload-featured"
                value={form.featuredArtists}
                onChange={(e) => setForm({ ...form, featuredArtists: e.target.value })}
                placeholder="e.g. feat. Sarah Keys"
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
              />
            </div>
          </div>

          {/* Album / EP, Genre, Release Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="upload-album" className="text-xs text-[#9a9fc4]">
                Album / EP / Release Tag
              </Label>
              <Input
                id="upload-album"
                value={form.albumName}
                onChange={(e) => setForm({ ...form, albumName: e.target.value })}
                placeholder="Single"
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
              />
            </div>
            <div>
              <Label htmlFor="upload-genre" className="text-xs text-[#9a9fc4]">
                Genre
              </Label>
              <Input
                id="upload-genre"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                placeholder="e.g. Rock, Indie, Synthwave"
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
              />
            </div>
            <div>
              <Label htmlFor="upload-year" className="text-xs text-[#9a9fc4]">
                Release Year
              </Label>
              <Input
                id="upload-year"
                value={form.releaseYear}
                onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
                placeholder="2026"
                className="mt-1 border-[#20205a] bg-[#05052d] text-[#f5f7ff] text-xs"
              />
            </div>
          </div>

          {/* Audio Upload Dropzone */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#05052d]/90 border border-[#20205a]">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#f5f7ff] flex items-center gap-1.5">
                <FileAudio className="w-4 h-4 text-[#ea6f2a]" /> MP3 / Audio File *
              </Label>
            </div>

            <div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg,audio/aac,audio/m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleAudioUpload(f)
                }}
              />
              <div
                onClick={() => audioInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  form.audioUrl
                    ? "border-emerald-500/50 bg-emerald-950/20"
                    : "border-[#20205a] hover:border-[#ea6f2a]/60 bg-[#0c0c3f]/50"
                }`}
              >
                {uploadingAudio ? (
                  <div className="flex flex-col items-center gap-2 text-[#ea6f2a]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-semibold">Uploading and analyzing audio track...</span>
                  </div>
                ) : form.audioUrl ? (
                  <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-xs font-semibold">Audio Track Ready</span>
                    <span className="text-[11px] text-[#9a9fc4] font-mono truncate max-w-sm">
                      {form.audioUrl}
                    </span>
                    <span className="text-[10px] text-[#ea6f2a] hover:underline">Click to change audio file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-[#9a9fc4]">
                    <Upload className="w-6 h-6 text-[#ea6f2a]" />
                    <span className="text-xs font-semibold text-[#f5f7ff]">Click to select MP3, WAV, AAC, M4A, or FLAC</span>
                    <span className="text-[11px] text-[#7f84ad]">Instant high-speed streaming on StarCast</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cover Art Upload & Download Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <Label className="text-xs text-[#9a9fc4]">Cover Artwork Image</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-12 h-12 rounded-lg bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0">
                  {form.coverArtUrl ? (
                    <img src={form.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
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
                    if (f) handleCoverUpload(f)
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
                <p className="text-[10px] text-[#7f84ad]">Allow fans to download track file</p>
              </div>
              <Switch
                checked={form.allowDownload}
                onCheckedChange={(checked) => setForm({ ...form, allowDownload: checked })}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          {/* Lyrics & Liner Notes */}
          <div>
            <Label htmlFor="upload-lyrics" className="text-xs text-[#9a9fc4]">
              Lyrics &amp; Liner Notes (Optional)
            </Label>
            <Textarea
              id="upload-lyrics"
              value={form.lyrics}
              onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              placeholder="Song lyrics, production notes, recording equipment, inspiration..."
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
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="border-[#20205a] text-[#9a9fc4]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || uploadingAudio}
              className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold shadow-lg shadow-[#ea6f2a]/25"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Publish Song Page
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
