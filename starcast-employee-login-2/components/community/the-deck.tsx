"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Sparkles, CornerDownRight } from "lucide-react"
import {
  listDeckPosts,
  createDeckPost,
  togglePostStar,
  addPostComment,
  toggleCommentStar,
} from "@/app/actions/community"

interface DeckComment {
  id: string
  user_id: string
  comment: string
  created_at: string
  parent_comment_id?: string | null
  user?: { first_name: string; last_name: string; profile_pic: string }
  star_count?: number
  user_starred?: boolean
  replies?: DeckComment[]
}

interface DeckPost {
  id: string
  employee_id: string
  content: string
  created_at: string
  employee?: { first_name: string; last_name: string; profile_pic: string }
  star_count?: number
  user_starred?: boolean
  comments?: DeckComment[]
}

interface TheDeckProps {
  currentUserId: string | null
  currentProfileId: string | null
}

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}` || "?"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TheDeck({ currentUserId, currentProfileId }: TheDeckProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<DeckPost[]>([])
  const [viewerHasPosted, setViewerHasPosted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const data = await listDeckPosts()
      setPosts(data.posts as DeckPost[])
      setViewerHasPosted(data.viewerHasPosted)
    } catch {
      setPosts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const requireAuth = () => {
    if (!currentUserId) {
      router.push("/login")
      return false
    }
    return true
  }

  const handlePost = async () => {
    if (!requireAuth()) return
    if (!draft.trim()) return
    setPosting(true)
    setError(null)
    try {
      await createDeckPost(draft.trim())
      setDraft("")
      await load()
    } catch (err: any) {
      setError(err?.message || "Could not post to the DECK. Please try again.")
    }
    setPosting(false)
  }

  const handleStar = async (postId: string) => {
    if (!requireAuth()) return
    await togglePostStar(postId)
    load()
  }

  const handleComment = async (postId: string) => {
    if (!requireAuth()) return
    if (!commentText[postId]?.trim()) return
    await addPostComment(postId, commentText[postId].trim())
    setCommentText({ ...commentText, [postId]: "" })
    load()
  }

  const handleReply = async (postId: string, parentCommentId: string) => {
    if (!requireAuth()) return
    if (!replyText[parentCommentId]?.trim()) return
    await addPostComment(postId, replyText[parentCommentId].trim(), parentCommentId)
    setReplyText({ ...replyText, [parentCommentId]: "" })
    setReplyingTo(null)
    load()
  }

  const handleCommentStar = async (commentId: string) => {
    if (!requireAuth()) return
    await toggleCommentStar(commentId)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Composer (Enlarged Mobile Card) */}
      <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="w-5 h-5 text-[#ffd166]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-[#ffd166]">Daily Dispatch on The DECK</h2>
        </div>

        {!currentUserId ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 p-5">
            <p className="text-sm sm:text-base text-[#dbe0fb]">Sign in to claim your daily spot on the DECK.</p>
            <Button onClick={() => router.push("/login")} className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl h-11 px-6 text-sm sm:text-base shrink-0">
              Sign In
            </Button>
          </div>
        ) : viewerHasPosted ? (
          <div className="rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 p-5">
            <p className="text-sm sm:text-base text-[#dbe0fb] leading-relaxed">
              {"You've claimed your spot on the DECK today! Everyone gets one post per day \u2014 but you can reply to anyone as much as you like."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#dbe0fb]">
              {"You get one post per day on the wall, so make it count. You can reply to others without limit."}
            </p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Broadcast something to the network..."
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[120px] resize-none text-base p-4 rounded-2xl"
              maxLength={2000}
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#cbd0f2]">{draft.length}/2000</span>
              <Button
                onClick={handlePost}
                disabled={posting || !draft.trim()}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl h-12 px-6 text-sm sm:text-base gap-2 shadow-lg shadow-[#ea6f2a]/25"
              >
                <Send className="w-4 h-4" />
                {posting ? "Posting..." : "Post to the DECK"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Wall */}
      {loading ? (
        <div className="text-center py-20 text-[#dbe0fb] text-base">Loading the DECK...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl bg-[#0c0c3f]/50 border border-[#20205a]/60 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center mx-auto mb-4 text-[#ffd166]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">The DECK is clear for now</h3>
          <p className="text-sm sm:text-base text-[#dbe0fb] max-w-md mx-auto mt-2 leading-relaxed">
            Claim the first spot of the day! Share what you&apos;re watching, regional music picks, or soundstage thoughts.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const isOwn = !!currentProfileId && post.employee_id === currentProfileId
            return (
              <div
                key={post.id}
                className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 overflow-hidden shadow-xl"
              >
                <div className="p-6 sm:p-7">
                  {/* Author */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <Link
                      href={`/profile/${post.employee_id}`}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ea6f2a] to-[#20efe0] p-0.5 shrink-0"
                    >
                      <div className="w-full h-full rounded-full bg-[#05052d] flex items-center justify-center overflow-hidden">
                        {post.employee?.profile_pic ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.employee.profile_pic || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#f5f7ff]">
                            {initials(post.employee?.first_name, post.employee?.last_name)}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div>
                      <p className="font-bold text-[#f5f7ff] text-base">
                        {post.employee?.first_name} {post.employee?.last_name}
                        {isOwn && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#ea6f2a]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#20efe0] font-medium">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-[#f5f7ff] text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-5">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-[#20205a]/60">
                    <button
                      onClick={() => handleStar(post.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                        post.user_starred
                          ? "bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40"
                          : "text-[#dbe0fb] hover:bg-[#20205a]/60 hover:text-[#f5f7ff]"
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={post.user_starred ? "currentColor" : "none"} />
                      {post.star_count || 0}
                    </button>
                    <button
                      onClick={() => setOpenComments({ ...openComments, [post.id]: !openComments[post.id] })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-[#dbe0fb] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] transition-all"
                    >
                      <MessageCircle className="w-4 h-4 text-[#20efe0]" />
                      {post.comments?.length || 0} {post.comments?.length === 1 ? "reply" : "replies"}
                    </button>
                  </div>
                </div>

                {/* Replies */}
                {openComments[post.id] && (
                  <div className="border-t border-[#20205a]/60 bg-[#05052d]/70 p-5 space-y-4">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3.5">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#20205a] shrink-0 flex items-center justify-center overflow-hidden border border-[#20205a]">
                                {comment.user?.profile_pic ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={comment.user.profile_pic || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-[#f5f7ff]">
                                    {initials(comment.user?.first_name, comment.user?.last_name)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-[#0c0c3f] rounded-2xl rounded-tl-sm px-4 py-3 border border-[#20205a]/60">
                                  <p className="text-xs sm:text-sm font-bold text-[#f5f7ff] mb-1">
                                    {comment.user?.first_name} {comment.user?.last_name}
                                  </p>
                                  <p className="text-sm sm:text-base text-[#dbe0fb] whitespace-pre-wrap leading-relaxed">{comment.comment}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 px-2 text-xs">
                                  <button
                                    onClick={() => handleCommentStar(comment.id)}
                                    className={`font-semibold transition-colors ${
                                      comment.user_starred ? "text-[#ea6f2a]" : "text-[#cbd0f2] hover:text-[#f5f7ff]"
                                    }`}
                                  >
                                    Like {comment.star_count ? `(${comment.star_count})` : ""}
                                  </button>
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="font-semibold text-[#20efe0] hover:underline"
                                  >
                                    Reply
                                  </button>
                                  <span className="text-[#cbd0f2]/80">{formatDate(comment.created_at)}</span>
                                </div>

                                {/* Nested replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-2.5 space-y-2.5 pl-4 border-l-2 border-[#20205a]/80">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2.5">
                                        <CornerDownRight className="w-4 h-4 text-[#20efe0] mt-2 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-[#0c0c3f] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-[#20205a]/50">
                                            <p className="text-xs sm:text-sm font-bold text-[#f5f7ff] mb-0.5">
                                              {reply.user?.first_name} {reply.user?.last_name}
                                            </p>
                                            <p className="text-sm sm:text-base text-[#dbe0fb] whitespace-pre-wrap leading-relaxed">{reply.comment}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply input */}
                                {replyingTo === comment.id && (
                                  <div className="flex gap-2 mt-2.5">
                                    <Input
                                      value={replyText[comment.id] || ""}
                                      onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                                      placeholder="Write a reply..."
                                      className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] text-sm h-11 rounded-full px-4"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                                          e.preventDefault()
                                          handleReply(post.id, comment.id)
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={() => handleReply(post.id, comment.id)}
                                      className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full shrink-0 h-11 px-4"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add top-level reply */}
                    {currentUserId && (
                      <div className="flex gap-2.5 pt-2">
                        <Input
                          value={commentText[post.id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                          placeholder="Add a reply to this post..."
                          className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] text-sm sm:text-base h-11 rounded-full px-4"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                              e.preventDefault()
                              handleComment(post.id)
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleComment(post.id)}
                          className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full shrink-0 h-11 px-5 font-semibold"
                        >
                          <Send className="w-4 h-4 mr-1.5" /> Reply
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
