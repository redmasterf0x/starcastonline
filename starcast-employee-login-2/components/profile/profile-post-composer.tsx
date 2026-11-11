"use client"

import { useEffect, useState, useRef } from "react"
import {
  listCommunityCategories,
  createCommunityPost,
} from "@/app/actions/community"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  X,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react"

interface CategoryOption {
  id: string
  name: string
  slug: string
  icon: string
}

const MAX_IMAGES_PER_POST = 4
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * Clean inline composer shown at the top of a member's OWN profile.
 * Provides a clean space to write text or upload photos without distracting dividers
 * until the user starts typing or selects media to upload.
 * Strictly enforces limits (max 4 photos, 10MB limit, 2000 chars) to prevent spam.
 */
export function ProfilePostComposer({
  onPosted,
  authorInitials,
  authorPic,
}: {
  onPosted: () => Promise<void> | void
  authorInitials: string
  authorPic: string | null
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [category, setCategory] = useState("")
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [selectedImages, setSelectedImages] = useState<
    { file: File; preview: string; credit: string }[]
  >([])
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justPosted, setJustPosted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listCommunityCategories()
      .then((cats) => {
        setCategories(cats as unknown as CategoryOption[])
        if (cats.length > 0) {
          setCategory((prev) => prev || cats[0].slug)
        }
      })
      .catch(() => {})
  }, [])

  const hasStartedContent = content.trim().length > 0 || selectedImages.length > 0 || title.trim().length > 0
  const isExpanded = focused || hasStartedContent
  const canPost = (content.trim().length > 0 || selectedImages.length > 0) && !posting

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const remainingSlots = MAX_IMAGES_PER_POST - selectedImages.length
    if (remainingSlots <= 0) {
      setError(`Maximum limit reached: You can attach up to ${MAX_IMAGES_PER_POST} photos per post.`)
      return
    }

    const filesToAdd = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} photo(s) added. Maximum is ${MAX_IMAGES_PER_POST} photos per post.`)
    }

    const validNewImages: { file: File; preview: string; credit: string }[] = []

    for (const file of filesToAdd) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image. Only JPG, PNG, WEBP, and GIF are allowed.`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
        continue
      }
      validNewImages.push({
        file,
        preview: URL.createObjectURL(file),
        credit: "",
      })
    }

    if (validNewImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...validNewImages].slice(0, MAX_IMAGES_PER_POST))
      setFocused(true)
    }

    // Reset input so same file can be selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (idx: number) => {
    setSelectedImages((prev) => {
      const removed = prev[idx]
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handlePost = async () => {
    if (!canPost) return
    setPosting(true)
    setError(null)

    try {
      // 1. Upload photos if any
      const uploadedImages: { url: string; credit: string }[] = []
      for (const img of selectedImages) {
        const formData = new FormData()
        formData.append("file", img.file)
        formData.append("folder", "community")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || "Failed to upload photo. Please check file format.")
        }
        const data = await res.json()
        uploadedImages.push({ url: data.url, credit: img.credit.trim() })
      }

      // 2. Submit post
      await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        category: category || categories[0]?.slug || "general",
        images: uploadedImages,
      })

      // 3. Reset
      setContent("")
      setTitle("")
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview))
      setSelectedImages([])
      setFocused(false)
      setJustPosted(true)
      setTimeout(() => setJustPosted(false), 2500)
      await onPosted()
    } catch (e: any) {
      setError(e?.message ?? "Couldn't create your post. Please try again.")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${
        isExpanded
          ? "bg-[#0c0c3f]/90 border border-[#ea6f2a]/40 shadow-xl shadow-[#ea6f2a]/5 p-5"
          : "bg-[#0c0c3f]/50 border border-[#20205a]/60 hover:border-[#20205a] p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 rounded-xl shrink-0 mt-0.5">
          {authorPic ? (
            <AvatarImage src={authorPic} alt="" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] text-white text-xs font-bold">
              {authorInitials || "★"}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Main Content Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 2000))}
            onFocus={() => setFocused(true)}
            rows={isExpanded ? 3 : 1}
            placeholder={
              isExpanded
                ? "What's happening? Share a thought, story, or project update..."
                : "Write an update or upload photos to your profile feed..."
            }
            className="w-full resize-none bg-transparent text-[#f5f7ff] placeholder-[#8f95c0] outline-none text-sm sm:text-base leading-relaxed"
          />

          {/* Quick Upload Action Bar when collapsed (NO divider lines until active/uploaded) */}
          {!isExpanded && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs text-[#20efe0] hover:text-[#ffd166] transition-colors font-medium py-1 px-2 rounded-lg hover:bg-[#20efe0]/10"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload Photos (up to 4)</span>
              </button>

              <button
                type="button"
                onClick={() => setFocused(true)}
                className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
              >
                Open composer &rarr;
              </button>
            </div>
          )}

          {/* Content divider & expanded options ONLY render once user starts typing or uploading */}
          {isExpanded && (
            <div className="space-y-4 pt-3 border-t border-[#20205a]/60 mt-2 animate-in fade-in duration-200">
              {/* Optional Headline */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                maxLength={120}
                placeholder="Optional post headline..."
                className="w-full bg-[#05052d]/80 border border-[#20205a] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#f5f7ff] placeholder-[#7f84ad] outline-none focus:border-[#ea6f2a]/60"
              />

              {/* Photo Previews */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#9a9fc4]">
                    <span className="font-semibold text-[#f5f7ff] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#20efe0]" />
                      Attached Photos ({selectedImages.length}/{MAX_IMAGES_PER_POST})
                    </span>
                    <span className="text-[11px] text-[#7f84ad]">Max 10MB each</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-[#20205a] bg-[#05052d] aspect-square"
                      >
                        <img
                          src={img.preview}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-md"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add More button if under limit */}
                    {selectedImages.length < MAX_IMAGES_PER_POST && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-[#20205a] hover:border-[#20efe0]/60 rounded-xl flex flex-col items-center justify-center aspect-square text-[#7f84ad] hover:text-[#20efe0] transition-colors p-2 text-center"
                      >
                        <ImageIcon className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-semibold">+ Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Selector */}
                  <div className="w-40 sm:w-48">
                    <Select value={category || categories[0]?.slug} onValueChange={setCategory}>
                      <SelectTrigger className="bg-[#05052d] border-[#20205a] text-xs sm:text-sm text-[#f5f7ff] h-9 rounded-xl">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c3f] border-[#20205a]">
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.slug}
                            value={cat.slug}
                            className="text-[#f5f7ff] text-xs sm:text-sm"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add photo trigger if no photos attached yet */}
                  {selectedImages.length === 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#20205a] hover:border-[#20efe0]/50 bg-[#05052d] text-xs text-[#dbe0fb] hover:text-[#20efe0] transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#20efe0]" />
                      <span>Attach Photos</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-[11px] font-mono text-[#7f84ad]">
                    {content.length}/2000
                  </span>

                  {/* Cancel / Collapse button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasStartedContent) {
                        setFocused(false)
                      } else if (confirm("Clear your draft?")) {
                        setContent("")
                        setTitle("")
                        selectedImages.forEach((img) => URL.revokeObjectURL(img.preview))
                        setSelectedImages([])
                        setFocused(false)
                      }
                    }}
                    className="text-xs text-[#9a9fc4] hover:text-white px-2 py-1 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handlePost}
                    disabled={!canPost || posting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#ea6f2a]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {posting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : justPosted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Posted!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleImageFileChange}
      />
    </div>
  )
}
