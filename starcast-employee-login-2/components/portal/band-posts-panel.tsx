"use client"

import { useCallback, useEffect, useState } from "react"
import { getBandPosts, createBandPost, deleteBandPost, type BandPost } from "@/app/actions/band-pages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Music, Send, Sparkles, Trash2, CheckCircle2, ImagePlus } from "lucide-react"

/**
 * Posts feed + composer for a band, shown inside the Artist Portal "Posts" tab.
 *
 * Because the only person who can reach the Artist Portal through /portal is the
 * band's owner, a post made here is authored by the owner and therefore reads as
 * an official post from the band on its public page(s).
 */
export function BandPostsPanel({ bandId, bandName }: { bandId: string; bandName: string }) {
  const [posts, setPosts] = useState<BandPost[] | null>(null)
  const [draft, setDraft] = useState("")
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const [justPosted, setJustPosted] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handlePost = async () => {
    const trimmed = draft.trim()
    if (!trimmed || posting) return
    setPosting(true)
    setError(null)
    try {
      await createBandPost(bandId, trimmed)
      setDraft("")
      setFocused(false)
      setJustPosted(true)
      setTimeout(() => setJustPosted(false), 1800)
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Couldn't post. Please try again.")
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      await deleteBandPost(postId)
      await load()
    } catch {
      /* ignore */
    }
  }

  const loading = posts === null

  return (
    <div className="space-y-4">
      {/* Inline composer */}
      <div
        className={`bg-[#0c0c3f]/70 border rounded-2xl p-4 transition-all ${
          focused ? "border-[#ea6f2a]/60 shadow-lg shadow-[#ea6f2a]/10" : "border-[#20205a]/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] shadow-lg shadow-[#ea6f2a]/20 flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(draft.trim().length > 0)}
              rows={focused ? 3 : 1}
              placeholder={`Post an update as ${bandName}…`}
              maxLength={2000}
              className="w-full resize-none bg-transparent text-[#f5f7ff] placeholder-[#9a9fc4]/70 outline-none text-[15px] leading-relaxed"
            />
            {focused && (
              <div className="space-y-3 border-t border-[#20205a]/50 pt-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
                  title="Image upload coming soon"
                  disabled
                >
                  <ImagePlus className="w-4 h-4" />
                  Attach media
                </button>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="border-[#ea6f2a]/40 text-[#ea6f2a] bg-[#ea6f2a]/10">
                    <Sparkles className="w-3 h-3 mr-1" /> Posting as {bandName}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9a9fc4]/60">{draft.length}/2000</span>
                    <button
                      onClick={handlePost}
                      disabled={!draft.trim() || posting}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#ea6f2a]/25"
                    >
                      {posting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Posting…
                        </>
                      ) : justPosted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Posted!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#ea6f2a] mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-[#ea6f2a]" />
          </div>
          <p className="text-[#f5f7ff] text-lg font-medium">No posts yet</p>
          <p className="text-[#9a9fc4] text-sm mt-1">Share the first update from {bandName} above. 💫</p>
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-5 hover:border-[#ea6f2a]/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                {post.author_avatar ? (
                  <AvatarImage src={post.author_avatar} alt="" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] text-white text-sm font-semibold">
                    {(post.author_name || "B")[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#f5f7ff] text-sm font-semibold">{post.author_name}</span>
                  {post.author_is_owner && (
                    <Badge className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white text-[10px] h-5">
                      <Sparkles className="w-3 h-3 mr-1" /> {bandName}
                    </Badge>
                  )}
                  <span className="text-xs text-[#9a9fc4]/60">
                    {new Date(post.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[#d4d8ee] mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {post.images.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt="" className="rounded-lg object-cover max-h-64 w-full" />
                    ))}
                  </div>
                )}
              </div>
              {post.can_delete && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#9a9fc4] hover:text-red-400 transition-all"
                  aria-label="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {post.comments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#20205a]/40 space-y-2">
                {post.comments.map((c) => (
                  <p key={c.id} className="text-sm text-[#9a9fc4]">
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
