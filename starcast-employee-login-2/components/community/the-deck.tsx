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
      {/* Composer */}
      <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#ea6f2a]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ea6f2a]">Post to the DECK</h2>
        </div>

        {!currentUserId ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#05052d]/60 border border-[#20205a]/50 px-4 py-3">
            <p className="text-sm text-[#9a9fc4]">Sign in to claim your spot on the DECK.</p>
            <Button onClick={() => router.push("/login")} className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white">
              Sign In
            </Button>
          </div>
        ) : viewerHasPosted ? (
          <p className="text-sm text-[#9a9fc4]">
            {"You've claimed your spot on the DECK. Everyone gets one post \u2014 but you can reply to anyone as much as you like."}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#9a9fc4]">
              {"You get one post on the wall, so make it count. You can reply to others without limit."}
            </p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something to the whole crew..."
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[110px] resize-none"
              maxLength={2000}
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9a9fc4]/60">{draft.length}/2000</span>
              <Button
                onClick={handlePost}
                disabled={posting || !draft.trim()}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white gap-2"
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
        <div className="text-center py-16 text-[#9a9fc4]">Loading the DECK...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[#9a9fc4]">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>The DECK is empty. Be the first to post.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isOwn = !!currentProfileId && post.employee_id === currentProfileId
            return (
              <div
                key={post.id}
                className="rounded-2xl border border-[#20205a]/50 bg-[#0c0c3f]/40 overflow-hidden"
              >
                <div className="p-5">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      href={`/profile/${post.employee_id}`}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ea6f2a] to-[#20205a] p-0.5 shrink-0"
                    >
                      <div className="w-full h-full rounded-full bg-[#05052d] flex items-center justify-center overflow-hidden">
                        {post.employee?.profile_pic ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.employee.profile_pic || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-[#f5f7ff]">
                            {initials(post.employee?.first_name, post.employee?.last_name)}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div>
                      <p className="font-semibold text-[#f5f7ff] text-sm">
                        {post.employee?.first_name} {post.employee?.last_name}
                        {isOwn && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[#ea6f2a]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#9a9fc4]">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-[#e4e6fa] text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-[#20205a]/50">
                    <button
                      onClick={() => handleStar(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        post.user_starred
                          ? "bg-[#ea6f2a]/20 text-[#ea6f2a]"
                          : "text-[#9a9fc4] hover:bg-[#20205a]/50 hover:text-[#f5f7ff]"
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={post.user_starred ? "currentColor" : "none"} />
                      {post.star_count || 0}
                    </button>
                    <button
                      onClick={() => setOpenComments({ ...openComments, [post.id]: !openComments[post.id] })}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#9a9fc4] hover:bg-[#20205a]/50 hover:text-[#f5f7ff] transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments?.length || 0} {post.comments?.length === 1 ? "reply" : "replies"}
                    </button>
                  </div>
                </div>

                {/* Replies */}
                {openComments[post.id] && (
                  <div className="border-t border-[#20205a]/50 bg-[#05052d]/50 p-4 space-y-4">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#20205a] shrink-0 flex items-center justify-center overflow-hidden">
                                {comment.user?.profile_pic ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={comment.user.profile_pic || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs text-[#f5f7ff]">
                                    {initials(comment.user?.first_name, comment.user?.last_name)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-[#0c0c3f] rounded-2xl rounded-tl-sm px-4 py-2.5">
                                  <p className="text-xs font-medium text-[#f5f7ff] mb-0.5">
                                    {comment.user?.first_name} {comment.user?.last_name}
                                  </p>
                                  <p className="text-sm text-[#c4c7e4] whitespace-pre-wrap">{comment.comment}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 px-2">
                                  <button
                                    onClick={() => handleCommentStar(comment.id)}
                                    className={`text-xs font-medium transition-colors ${
                                      comment.user_starred ? "text-[#ea6f2a]" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
                                    }`}
                                  >
                                    Like {comment.star_count ? `(${comment.star_count})` : ""}
                                  </button>
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs font-medium text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
                                  >
                                    Reply
                                  </button>
                                  <span className="text-xs text-[#9a9fc4]/60">{formatDate(comment.created_at)}</span>
                                </div>

                                {/* Nested replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-2 space-y-2 pl-4 border-l border-[#20205a]/60">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <CornerDownRight className="w-3.5 h-3.5 text-[#9a9fc4]/50 mt-2 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-[#0c0c3f] rounded-2xl rounded-tl-sm px-3 py-2">
                                            <p className="text-xs font-medium text-[#f5f7ff] mb-0.5">
                                              {reply.user?.first_name} {reply.user?.last_name}
                                            </p>
                                            <p className="text-sm text-[#c4c7e4] whitespace-pre-wrap">{reply.comment}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply input */}
                                {replyingTo === comment.id && (
                                  <div className="flex gap-2 mt-2">
                                    <Input
                                      value={replyText[comment.id] || ""}
                                      onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                                      placeholder="Write a reply..."
                                      className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm h-9 rounded-full"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                                          e.preventDefault()
                                          handleReply(post.id, comment.id)
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={() => handleReply(post.id, comment.id)}
                                      size="sm"
                                      className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full shrink-0"
                                    >
                                      <Send className="w-3.5 h-3.5" />
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
                      <div className="flex gap-2">
                        <Input
                          value={commentText[post.id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                          placeholder="Add a reply..."
                          className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-sm h-10 rounded-full"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                              e.preventDefault()
                              handleComment(post.id)
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleComment(post.id)}
                          size="sm"
                          className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full shrink-0 h-10 px-4"
                        >
                          <Send className="w-4 h-4" />
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
