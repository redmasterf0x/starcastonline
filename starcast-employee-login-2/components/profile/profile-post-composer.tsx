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
import { CheckCircle2, Loader2, Plus, Send } from "lucide-react"

interface CategoryOption {
  id: string
  name: string
  slug: string
  icon: string
}

/**
 * Inline "New Post" composer shown only on a member's OWN profile.
 *
 * The parent controls visibility: it is only mounted when the viewer is the
 * same member whose profile is being viewed (`isOwnProfile`). Submitting a
 * post hits the normal server action used across the community so the same
 * server-side checks apply (signed in, not socially banned, Neon write).
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
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justPosted, setJustPosted] = useState(false)

  useEffect(() => {
    listCommunityCategories()
      .then((cats) => {
        setCategories(cats as unknown as CategoryOption[])
        // Default to the first "general/open" category if there is one,
        // otherwise fall back to the first category in the list.
        if (cats.length > 0) {
          setCategory((prev) => prev || cats[0].slug)
        }
      })
      .catch(() => {})
  }, [])

  const canPost = content.trim().length > 0

  const handlePost = async () => {
    if (!canPost || posting) return
    setPosting(true)
    setError(null)
    try {
      await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        category: category || categories[0]?.slug || "general",
        images: [],
      })
      // Reset the composer then tell the parent to refresh the feed.
      setContent("")
      setTitle("")
      setJustPosted(true)
      setTimeout(() => setJustPosted(false), 2000)
      await onPosted()
    } catch (e: any) {
      setError(e?.message ?? "Couldn't create your post. Please try again.")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className={`bg-[#0c0c3f]/60 border rounded-2xl p-4 transition-all ${
        focused ? "border-[#ea6f2a]/50 shadow-lg shadow-[#ea6f2a]/5" : "border-[#20205a]/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 rounded-xl">
          {authorPic ? (
            <AvatarImage src={authorPic} alt="" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold">
              {authorInitials || "?"}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 space-y-3">
          {/* Composer input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(content.trim().length === 0 ? false : true)}
            rows={focused ? 3 : 1}
            placeholder={`What's on your mind, ${authorInitials ? "Star" : "Star"}? Write a quick post for the community…`}
            className="w-full resize-none bg-transparent text-[#f5f7ff] placeholder-[#9a9fc4]/70 outline-none text-[15px] leading-relaxed"
          />

          {/* Expandable controls */}
          {focused && (
            <div className="space-y-3 border-t border-[#20205a]/50 pt-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Optional headline…"
                className="w-full bg-[#05052d]/60 border border-[#20205a]/60 rounded-lg px-3 py-2 text-sm text-[#f5f7ff] placeholder-[#9a9fc4]/60 outline-none focus:border-[#ea6f2a]/50"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="w-44">
                  <Select value={category || categories[0]?.slug} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#05052d]/60 border-[#20205a]/60 text-sm text-[#f5f7ff] h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c0c3f] border-[#20205a]">
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.slug}
                          value={cat.slug}
                          className="text-[#f5f7ff] text-sm"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{cat.icon}</span>
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9a9fc4]/60">{content.length}/2000</span>
                  <button
                    onClick={handlePost}
                    disabled={!canPost || posting}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold shadow-lg shadow-[#ea6f2a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[#ea6f2a]/30"
                  >
                    {posting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Posting…
                      </>
                    ) : justPosted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Posted!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
