"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  Share2,
  Check,
  Send,
  Trash2,
  MessageCircle,
  Globe,
  Lock,
  ImageIcon,
  X,
  Users,
  UserPlus,
  UserMinus,
  ArrowLeft,
} from "lucide-react"
import {
  type PublicBand,
  type BandPost,
  createBandPost,
  deleteBandPost,
  addBandComment,
  deleteBandComment,
  getBandPosts,
  followBand,
  unfollowBand,
} from "@/app/actions/band-pages"
import { setBandPublic } from "@/app/actions/bands"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <Image
        src={src || "/placeholder.svg"}
        alt={name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover border border-[#20205a]"
      />
    )
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/30 text-[#ea6f2a] font-semibold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function BandPageClient({ band, initialPosts }: { band: PublicBand; initialPosts: BandPost[] }) {
  const [posts, setPosts] = useState<BandPost[]>(initialPosts)
  const [isPublic, setIsPublic] = useState(band.is_public)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [isFollowing, setIsFollowing] = useState(band.is_following)
  const [followerCount, setFollowerCount] = useState(band.follower_count)
  const [followBusy, setFollowBusy] = useState(false)

  // Composer (owner only)
  const [draft, setDraft] = useState("")
  const [draftImages, setDraftImages] = useState<{ preview: string; dataUrl: string }[]>([])
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setPosts(await getBandPosts(band.id))
  }

  function handleShare() {
    const url = `${window.location.origin}/bands/${band.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleToggleFollow() {
    if (followBusy) return
    setFollowBusy(true)
    setError("")
    const next = !isFollowing
    setIsFollowing(next)
    setFollowerCount((c) => c + (next ? 1 : -1))
    try {
      if (next) await followBand(band.id)
      else await unfollowBand(band.id)
    } catch (e: any) {
      setIsFollowing(!next)
      setFollowerCount((c) => c + (next ? -1 : 1))
      setError(e?.message || "Failed to update follow status")
    } finally {
      setFollowBusy(false)
    }
  }

  async function handleTogglePublic() {
    const next = !isPublic
    setIsPublic(next)
    try {
      await setBandPublic(band.id, next)
    } catch (e: any) {
      setIsPublic(!next)
      setError(e?.message || "Failed to update visibility")
    }
  }

  function handlePickImages(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setDraftImages((prev) => [...prev, { preview: URL.createObjectURL(file), dataUrl: reader.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  async function handlePost() {
    if (!draft.trim() && draftImages.length === 0) return
    setPosting(true)
    setError("")
    try {
      await createBandPost(band.id, draft, draftImages.map((i) => i.dataUrl))
      setDraft("")
      draftImages.forEach((i) => URL.revokeObjectURL(i.preview))
      setDraftImages([])
      await refresh()
    } catch (e: any) {
      setError(e?.message || "Failed to post")
    } finally {
      setPosting(false)
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      await deleteBandPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (e: any) {
      setError(e?.message || "Failed to delete post")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ResponsiveHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button
          asChild
          variant="outline"
          className="mb-5 border-[#20efe0]/35 bg-[#0c0c3f]/55 text-[#c9fbf7] shadow-[0_0_20px_rgba(32,239,224,0.08)] hover:border-[#20efe0]/60 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff]"
        >
          <Link href="/community?tab=bands">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All bands &amp; artists
          </Link>
        </Button>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-300 text-sm">{error}</div>
        )}

        {/* Band hero */}
        <section className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 overflow-hidden mb-8">
          <div className="h-28 bg-gradient-to-r from-[#ea6f2a]/25 via-[#bc3f00]/15 to-[#20efe0]/15" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              {band.logo_url ? (
                <Image
                  src={band.logo_url || "/placeholder.svg"}
                  alt={band.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0c0c3f] bg-[#05052d]"
                />
              ) : (
                <div className="flex items-center justify-center w-24 h-24 rounded-2xl border-4 border-[#0c0c3f] bg-[#05052d]">
                  <Music className="w-10 h-10 text-[#ea6f2a]" />
                </div>
              )}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#f5f7ff]">{band.name}</h1>
                  <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30">
                    {band.type === "artist" ? "Artist" : "Band"}
                  </Badge>
                  {band.genre && (
                    <Badge variant="outline" className="border-[#20205a] text-[#9a9fc4]">
                      {band.genre}
                    </Badge>
                  )}
                  {band.is_owner && !isPublic && (
                    <Badge className="bg-yellow-900/30 text-yellow-400 border border-yellow-700/40">
                      <Lock className="w-3 h-3 mr-1" /> Private
                    </Badge>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-[#9a9fc4] mt-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </p>
              </div>
            </div>

            {band.bio && <p className="text-[#9a9fc4] mt-4 leading-relaxed text-pretty">{band.bio}</p>}

            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {!band.is_owner && band.is_authenticated && (
                <Button
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  className={
                    isFollowing
                      ? "border border-[#20205a] bg-transparent text-[#f5f7ff] hover:bg-[#20205a]/30"
                      : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                  }
                >
                  {isFollowing ? (
                    <UserMinus className="w-4 h-4 mr-1.5" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              <Button
                onClick={handleShare}
                variant={band.is_owner ? "default" : "outline"}
                className={
                  band.is_owner
                    ? "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                    : "border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                }
              >
                {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Share2 className="w-4 h-4 mr-1.5" />}
                {copied ? "Link copied" : "Share page"}
              </Button>
              {band.is_owner && (
                <Button
                  variant="outline"
                  onClick={handleTogglePublic}
                  className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                >
                  {isPublic ? <Globe className="w-4 h-4 mr-1.5" /> : <Lock className="w-4 h-4 mr-1.5" />}
                  {isPublic ? "Public" : "Private"}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Custom Links (Linktree style) */}
          {band.links && band.links.length > 0 && (
  <LinkTree links={band.links.map((link: any) => ({ label: link.title, url: link.url }))} />
)}

          {/* Open discussion board — any signed-in member can start a thread */}
        <section className="mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#9a9fc4]">
            <MessageCircle className="w-4 h-4" /> Discussion Board
          </h2>
        </section>
        {band.is_authenticated && (
          <section className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-4 mb-8">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                band.is_owner ? "Share an update with your followers..." : `Start a discussion about ${band.name}...`
              }
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[90px] resize-none"
            />
            {draftImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {draftImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <Image
                      src={img.preview || "/placeholder.svg"}
                      alt="Attachment preview"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover border border-[#20205a]"
                    />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(img.preview)
                        setDraftImages((prev) => prev.filter((_, i) => i !== idx))
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#bc3f00] text-white flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePickImages(e.target.files)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="text-[#9a9fc4] hover:text-[#ea6f2a] hover:bg-transparent"
              >
                <ImageIcon className="w-4 h-4 mr-1.5" /> Add image
              </Button>
              <Button
                onClick={handlePost}
                disabled={posting || (!draft.trim() && draftImages.length === 0)}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
              >
                <Send className="w-4 h-4 mr-1.5" /> {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </section>
        )}

        {/* Posts feed */}
        {posts.length === 0 ? (
          <div className="text-center py-16 text-[#9a9fc4]">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No posts yet{band.is_authenticated ? " — start the discussion above." : "."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                band={band}
                onDeletePost={handleDeletePost}
                onRefresh={refresh}
                setError={setError}
              />
            ))}
          </div>
        )}

        {!band.is_authenticated && (
          <p className="text-center text-sm text-[#9a9fc4] mt-8">
            <Link href="/login" className="text-[#ea6f2a] hover:underline">
              Sign in
            </Link>{" "}
            to join the conversation.
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}

function PostCard({
  post,
  band,
  onDeletePost,
  onRefresh,
  setError,
}: {
  post: BandPost
  band: PublicBand
  onDeletePost: (id: string) => void
  onRefresh: () => Promise<void>
  setError: (m: string) => void
}) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleComment() {
    if (!comment.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await addBandComment(post.id, comment)
      setComment("")
      await onRefresh()
    } catch (e: any) {
      setError(e?.message || "Failed to comment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      await deleteBandComment(id)
      await onRefresh()
    } catch (e: any) {
      setError(e?.message || "Failed to delete comment")
    }
  }

  return (
    <article className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-5">
      <div className="flex items-start gap-3">
        <Avatar name={post.author_name} src={post.author_avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-[#f5f7ff] leading-tight flex items-center gap-1.5">
                {post.author_name}
                {post.author_is_owner && (
                  <Badge className="bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30 text-[10px] px-1.5 py-0 h-4">
                    {band.type === "artist" ? "Artist" : "Band"}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-[#9a9fc4]">{timeAgo(post.created_at)}</p>
            </div>
            {post.can_delete && (
              <button
                onClick={() => onDeletePost(post.id)}
                className="text-[#9a9fc4] hover:text-[#bc3f00] transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {post.content && (
            <p className="text-[#f5f7ff]/90 mt-2 whitespace-pre-wrap leading-relaxed text-pretty">{post.content}</p>
          )}

          {post.images.length > 0 && (
            <div className={`grid gap-2 mt-3 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {post.images.map((src, idx) => (
                <Image
                  key={idx}
                  src={src || "/placeholder.svg"}
                  alt={`Post image ${idx + 1}`}
                  width={600}
                  height={400}
                  className="w-full rounded-xl object-cover border border-[#20205a] max-h-96"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="mt-4 pl-2 border-l-2 border-[#20205a]/50 space-y-3">
        {post.comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5 group">
            <Avatar name={c.author_name} src={c.author_avatar} />
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-[#05052d]/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#f5f7ff]">{c.author_name}</p>
                  {c.can_delete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-[#9a9fc4] hover:text-[#bc3f00] opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#f5f7ff]/90 whitespace-pre-wrap">{c.content}</p>
              </div>
              <p className="text-[11px] text-[#9a9fc4] mt-1 ml-1">{timeAgo(c.created_at)}</p>
            </div>
          </div>
        ))}

        {band.is_authenticated ? (
          <div className="flex items-center gap-2 pt-1">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  handleComment()
                }
              }}
              placeholder="Write a comment..."
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[40px] max-h-24 resize-none py-2"
              rows={1}
            />
            <Button
              onClick={handleComment}
              disabled={submitting || !comment.trim()}
              size="icon"
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white shrink-0"
              aria-label="Send comment"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
