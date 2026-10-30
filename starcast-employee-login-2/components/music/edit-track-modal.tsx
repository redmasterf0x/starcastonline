"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Music, Upload, Loader2, Image as ImageIcon, Sliders, Disc3 } from "lucide-react"
import { type BandTrackItem, updateBandTrack } from "@/app/actions/band-tracks"

interface EditTrackModalProps {
  track: BandTrackItem | null
  isOpen: boolean
  onClose: () => void
  onSaved?: (updated: BandTrackItem) => void
}

export function EditTrackModal({ track, isOpen, onClose, onSaved }: EditTrackModalProps) {
  const [title, setTitle] = useState("")
  const [artistName, setArtistName] = useState("")
  const [producer, setProducer] = useState("")
  const [featuredArtists, setFeaturedArtists] = useState("")
  const [albumName, setAlbumName] = useState("")
  const [coverArtUrl, setCoverArtUrl] = useState("")
  const [genre, setGenre] = useState("")
  const [releaseYear, setReleaseYear] = useState("")
  const [description, setDescription] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [allowDownload, setAllowDownload] = useState(true)
  const [audioUrl, setAudioUrl] = useState("")

  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (track) {
      setTitle(track.title || "")
      setArtistName(track.artistName || "")
      setProducer(track.producer || "")
      setFeaturedArtists(track.featuredArtists || "")
      setAlbumName(track.albumName || "")
      setCoverArtUrl(track.coverArtUrl || "")
      setGenre(track.genre || "")
      setReleaseYear(track.releaseYear || "")
      setDescription(track.description || "")
      setLyrics(track.lyrics || "")
      setAllowDownload(track.allowDownload !== false)
      setAudioUrl(track.audioUrl || "")
    }
  }, [track, isOpen])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "covers")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload image")
      }
      setCoverArtUrl(data.url)
      toast.success("Cover artwork uploaded!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload cover art")
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ""
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAudio(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "tracks")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload audio")
      }
      setAudioUrl(data.url)
      toast.success("New audio track uploaded!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload audio")
    } finally {
      setUploadingAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!track) return
    if (!title.trim()) {
      toast.error("Track title is required.")
      return
    }

    setSaving(true)
    try {
      const res = await updateBandTrack(track.id, {
        title: title.trim(),
        artistName: artistName.trim() || undefined,
        producer: producer.trim() || undefined,
        featuredArtists: featuredArtists.trim() || undefined,
        albumName: albumName.trim() || undefined,
        coverArtUrl: coverArtUrl.trim() || undefined,
        genre: genre.trim() || undefined,
        releaseYear: releaseYear.trim() || undefined,
        description: description.trim() || undefined,
        lyrics: lyrics.trim() || undefined,
        allowDownload,
        audioUrl: audioUrl.trim() || undefined,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to update track.")
      }

      toast.success("Song updated successfully!")
      const updatedTrack: BandTrackItem = {
        ...track,
        title: title.trim(),
        artistName: artistName.trim() || null,
        producer: producer.trim() || null,
        featuredArtists: featuredArtists.trim() || null,
        albumName: albumName.trim() || null,
        coverArtUrl: coverArtUrl.trim() || null,
        genre: genre.trim() || null,
        releaseYear: releaseYear.trim() || null,
        description: description.trim() || null,
        lyrics: lyrics.trim() || null,
        allowDownload,
        audioUrl: audioUrl.trim() || track.audioUrl,
      }
      onSaved?.(updatedTrack)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update song.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a2e] border-[#20205a] text-[#f5f7ff] p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#f5f7ff]">
            <Music className="w-5 h-5 text-[#ea6f2a]" /> Edit Song Info
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Artwork & Basic Details */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Artwork preview */}
            <div className="flex flex-col items-center gap-2 w-full sm:w-36 shrink-0">
              <div className="relative aspect-square w-32 rounded-xl overflow-hidden bg-[#05051f] border border-[#20205a] group shadow-inner">
                {coverArtUrl ? (
                  <img src={coverArtUrl} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#9a9fc4]">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[10px]">No Artwork</span>
                  </div>
                )}
                {uploadingCover && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#20efe0] animate-spin" />
                  </div>
                )}
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="text-xs w-32 border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20efe0]/15"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                {coverArtUrl ? "Change Art" : "Upload Art"}
              </Button>
            </div>

            {/* Title, Artist, Producer */}
            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <Label className="text-xs text-[#9a9fc4]">Song Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Horizon"
                  className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-[#9a9fc4]">Artist / Performer</Label>
                  <Input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g. Solar Wave"
                    className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#9a9fc4]">Producer / Beatmaker</Label>
                  <Input
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    placeholder="e.g. Dave Beats"
                    className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-[#9a9fc4]">Featured Artists (optional)</Label>
                <Input
                  value={featuredArtists}
                  onChange={(e) => setFeaturedArtists(e.target.value)}
                  placeholder="e.g. feat. Luna & Nova"
                  className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Album & Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Album / EP Name</Label>
              <Input
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="e.g. Cosmic EP Vol. 1"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Genre</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Indie Rock"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Release Year</Label>
              <Input
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="e.g. 2026"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
              />
            </div>
          </div>

          {/* Description & Lyrics */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Song Description / Liner Notes</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Story behind the track, gear used, or special dedication..."
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Lyrics (optional)</Label>
              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={3}
                placeholder="Paste lyrics here..."
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] text-xs font-mono"
              />
            </div>
          </div>

          {/* Direct Audio URL / Replace Audio File */}
          <div className="space-y-2 p-3 rounded-xl bg-[#05051f] border border-[#20205a]">
            <Label className="text-xs text-[#9a9fc4] flex items-center justify-between">
              <span>Audio File Stream URL</span>
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={uploadingAudio}
                className="text-[11px] text-[#20efe0] hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                {uploadingAudio ? "Uploading Audio..." : "Upload New Audio File"}
              </button>
            </Label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            <Input
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://... or Google Drive / Dropbox link"
              className="bg-[#0a0a2e] border-[#20205a] text-[#f5f7ff] h-8 text-xs font-mono"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#05051f] border border-[#20205a]">
            <div>
              <p className="text-xs font-semibold text-[#f5f7ff]">Allow Fan Downloads</p>
              <p className="text-[11px] text-[#9a9fc4]">
                Allows listeners to download high quality audio for free.
              </p>
            </div>
            <Switch
              checked={allowDownload}
              onCheckedChange={setAllowDownload}
              className="data-[state=checked]:bg-[#20efe0]"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-[#20205a]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingCover || uploadingAudio}
            className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-[#ea6f2a]/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

