"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Users, Upload, Loader2, Image as ImageIcon, Sparkles } from "lucide-react"
import { updateBand } from "@/app/actions/bands"

interface EditBandModalProps {
  band: {
    id: string
    name: string
    slug: string
    type?: string
    genre?: string
    bio?: string
    logo_url?: string
    banner_url?: string
    contact_email?: string
    contact_phone?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onSaved?: (updated: any) => void
}

export function EditBandModal({ band, isOpen, onClose, onSaved }: EditBandModalProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState("band")
  const [genre, setGenre] = useState("")
  const [bio, setBio] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (band) {
      setName(band.name || "")
      setSlug(band.slug || "")
      setType(band.type || "band")
      setGenre(band.genre || "")
      setBio(band.bio || "")
      setLogoUrl(band.logo_url || "")
      setBannerUrl(band.banner_url || "")
      setContactEmail(band.contact_email || "")
      setContactPhone(band.contact_phone || "")
    }
  }, [band, isOpen])

  const handleUploadImage = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(data.error || "Failed to upload image")
    }
    return data.url
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await handleUploadImage(file, "bands/logos")
      setLogoUrl(url)
      toast.success("Logo uploaded!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    try {
      const url = await handleUploadImage(file, "bands/banners")
      setBannerUrl(url)
      toast.success("Banner uploaded!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload banner")
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!band) return
    if (!name.trim()) {
      toast.error("Act or Band name is required.")
      return
    }

    setSaving(true)
    try {
      const res = await updateBand(band.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        type,
        genre: genre.trim() || undefined,
        bio: bio.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to update band profile.")
      }

      toast.success(`Band page "${name}" updated successfully!`)
      onSaved?.({
        ...band,
        name: name.trim(),
        slug: slug.trim() || band.slug,
        type,
        genre: genre.trim(),
        bio: bio.trim(),
        logo_url: logoUrl.trim(),
        banner_url: bannerUrl.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
      })
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update band.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0a2e] border-[#20205a] text-[#f5f7ff] p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#f5f7ff]">
            <Users className="w-5 h-5 text-[#ea6f2a]" /> Edit Band / Artist Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Banner Upload Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#9a9fc4]">Header Banner Image</Label>
            <div className="relative aspect-[3/1] w-full rounded-xl overflow-hidden bg-[#05051f] border border-[#20205a]">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-[#9a9fc4] text-xs">
                  No Banner Image
                </div>
              )}
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#20efe0] animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="text-xs border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20efe0]/15"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              {bannerUrl ? "Change Banner" : "Upload Banner"}
            </Button>
          </div>

          {/* Logo / Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative aspect-square w-24 rounded-full overflow-hidden bg-[#05051f] border-2 border-[#20205a]">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#ea6f2a] font-black text-xl">
                    {name ? name.charAt(0).toUpperCase() : "★"}
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#20efe0] animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-[11px] h-7 px-2 border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:bg-[#20efe0]/15"
              >
                <Upload className="w-3 h-3 mr-1" />
                {logoUrl ? "Change" : "Upload Logo"}
              </Button>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <Label className="text-xs text-[#9a9fc4]">Band / Artist Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Midwest Stars"
                  className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-[#9a9fc4]">Act Type</Label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md bg-[#05051f] border border-[#20205a] text-[#f5f7ff] h-9 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#20efe0]"
                  >
                    <option value="band">Band / Group</option>
                    <option value="artist">Solo Artist / Singer</option>
                    <option value="producer">Producer / Beatmaker</option>
                    <option value="dj">DJ / Electronic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#9a9fc4]">Genre</Label>
                  <Input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Rock, Blues, Pop"
                    className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slug URL */}
          <div className="space-y-1">
            <Label className="text-xs text-[#9a9fc4]">Custom Page URL Slug</Label>
            <div className="flex items-center gap-1.5 text-xs text-[#9a9fc4]">
              <span>starcast.online/bands/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug-name"
                className="bg-[#05051f] border-[#20205a] text-[#20efe0] font-mono h-8 text-xs flex-1"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <Label className="text-xs text-[#9a9fc4]">Bio &amp; Story</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell fans about the band, music origins, or upcoming tours..."
              className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] text-xs resize-none"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Booking Email</Label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="booking@band.com"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#9a9fc4]">Booking Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. 785-555-0199"
                className="bg-[#05051f] border-[#20205a] text-[#f5f7ff] h-8 text-xs"
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
            disabled={saving || uploadingLogo || uploadingBanner}
            className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-90 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-[#ea6f2a]/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save Band Profile"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

