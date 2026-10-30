"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Disc3, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { updateBandAlbum, type BandAlbumItem } from "@/app/actions/band-tracks"

interface EditAlbumModalProps {
  album: BandAlbumItem | null
  isOpen: boolean
  onClose: () => void
  onSaved?: (updatedName: string, updatedCover?: string) => void
}

export function EditAlbumModal({ album, isOpen, onClose, onSaved }: EditAlbumModalProps) {
  const [albumName, setAlbumName] = useState("")
  const [coverArtUrl, setCoverArtUrl] = useState("")
  const [artistName, setArtistName] = useState("")
  const [producer, setProducer] = useState("")
  const [genre, setGenre] = useState("")
  const [releaseYear, setReleaseYear] = useState("")

  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (album) {
      setAlbumName(album.albumName || "")
      setCoverArtUrl(album.coverArtUrl || "")
      setArtistName(album.artistName || "")
      setProducer(album.producer || "")
      setGenre(album.genre || "")
      setReleaseYear(album.releaseYear || "")
    }
  }, [album, isOpen])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "albums")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload image")
      }
      setCoverArtUrl(data.url)
      toast.success("Album artwork uploaded!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload album artwork")
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!album) return
    if (!albumName.trim()) {
      toast.error("Album title is required.")
      return
    }

    setSaving(true)
    try {
      const res = await updateBandAlbum(album.bandId, album.albumName, {
        newAlbumName: albumName.trim(),
        coverArtUrl: coverArtUrl.trim() || undefined,
        artistName: artistName.trim() || undefined,
        producer: producer.trim() || undefined,
        genre: genre.trim() || undefined,
        releaseYear: releaseYear.trim() || undefined,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to update album.")
      }

      toast.success(`Album "${albumName}" updated across all ${album.tracks.length} tracks!`)
      onSaved?.(albumName.trim(), coverArtUrl.trim() || undefined)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update album.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0a0a2e] border-[#20205a] text-[#f5f7ff] p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#f5f7ff]">
            <Disc3 className="w-5 h-5 text-[#20efe0]" /> Edit Album / EP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Cover Art */}
          <div className="flex items-center gap-4">
            <div className="relative aspect-square w-24 rounded-xl overflow-hidden bg-[#05051f] border border-[#20205a] shrink-0">
              {coverArtUrl ? (
                <img src={coverArtUrl} alt="Album cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#9a9fc4]">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[9px]">No Cover</span>
                </div>
              )}
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#20efe0] animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-[#9a9fc4]">Album Artwork</Label>
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
                className="text-xs w-full border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20efe0]/15"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                {coverArtUrl ? "Change Artwork" : "Upload Artwork"}
              </Button>
              <p className="text-[10px] text-[#9a9fc4]">
                Applies artwork across all {album?.tracks.length || 0} tracks in this album.
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs text-[#9a9fc4]">Album Title *</Label>
            <Input
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="e.g. Neon Horizons"
              className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-10 text-sm"
            />
          </div>

          {/* Artist & Producer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Artist / Band</Label>
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Artist name"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Producer</Label>
              <Input
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                placeholder="Producer"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
              />
            </div>
          </div>

          {/* Genre & Release Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Genre</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Rock, Indie"
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
            disabled={saving || uploadingCover}
            className="bg-gradient-to-r from-[#20efe0] to-[#009b9e] hover:opacity-90 text-[#05051f] font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-[#20efe0]/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...
              </>
            ) : (
              "Update Album"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

