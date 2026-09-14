"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { authClient } from "@/lib/auth-client"
import {
  getCommunityViewer,
  listCommunityCategories,
  listCommunityPosts,
  createCommunityPost,
  togglePostStar,
  addPostComment,
  toggleCommentStar,
  listMembers,
  listFriends,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  listConversations,
  getChatMessages,
  sendChatMessage,
} from "@/app/actions/community"
import {
  listPublicBands,
  getFollowedBandsFeed,
  followBand,
  unfollowBand,
  type BandDirectoryEntry,
  type FollowedBandPost,
} from "@/app/actions/band-pages"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { SocialBanBanner } from "@/components/community/social-ban-banner"
import { TheDeck } from "@/components/community/the-deck"
import { 
  Search, UserPlus, UserCheck, Clock, MessageSquare, Users, 
  ArrowBigUp, MessageCircle, ChevronRight, ChevronLeft, 
  Sparkles, TrendingUp, Send, X, Plus, Image as ImageIcon,
  Heart, Share2, Bookmark, MoreHorizontal, User, Music, UserMinus
} from "lucide-react"

interface CommunityPost {
  id: string
  employee_id: string
  title: string
  content: string
  category: string
  images: { url: string; credit: string }[]
  created_at: string
  employee?: {
    first_name: string
    last_name: string
    profile_pic: string
  }
  star_count?: number
  user_starred?: boolean
  comments?: Comment[]
}

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  parent_comment_id?: string | null
  user?: {
    first_name: string
    last_name: string
    profile_pic: string
  }
  star_count?: number
  user_starred?: boolean
  replies?: Comment[]
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  show_id: string
  show_title: string
  topic: string
}

interface Member {
  id: string
  user_id: string
  first_name: string
  last_name: string
  bio: string
  profile_pic: string
  location: string
  is_employee: boolean
  created_at: string
  friendship_status?: "none" | "pending_sent" | "pending_received" | "accepted"
  friendship_id?: string
}

interface FriendRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string
  requester?: Member
  addressee?: Member
}

export default function CommunityPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Members & friends state
  const [activeTab, setActiveTab] = useState<
    "deck" | "feed" | "explore" | "members" | "friends" | "messages" | "bands"
  >(searchParams.get("tab") === "bands" ? "bands" : "deck")
  const [members, setMembers] = useState<Member[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  // Bands tab state
  const [bandsView, setBandsView] = useState<"discover" | "following">("discover")
  const [bandsList, setBandsList] = useState<BandDirectoryEntry[]>([])
  const [followedFeed, setFollowedFeed] = useState<FollowedBandPost[]>([])
  const [bandsLoading, setBandsLoading] = useState(false)
  const [bandSearch, setBandSearch] = useState("")
  const [bandActionError, setBandActionError] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [images, setImages] = useState<{ file: File; credit: string; preview: string }[]>([])
  const [newImageCredit, setNewImageCredit] = useState("")
  const [postError, setPostError] = useState<string | null>(null)

  // Comment state
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const search = memberSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name?.toLowerCase().includes(search) ||
        m.last_name?.toLowerCase().includes(search) ||
        m.location?.toLowerCase().includes(search)
    )
  }, [members, memberSearch])

  // Group categories by their show so the feed can render one section per
  // show, each containing its "General" and "Community" topics. Categories
  // without a show (legacy/site-wide) fall under an "Other" bucket.
  const groupedCategories = useMemo(() => {
    const groups = new Map<string, { showTitle: string; categories: Category[] }>()
    for (const cat of categories) {
      const key = cat.show_id || "other"
      if (!groups.has(key)) {
        groups.set(key, { showTitle: cat.show_title || "Other", categories: [] })
      }
      groups.get(key)!.categories.push(cat)
    }
    // Order topics so "General" comes before "Community" within each show.
    for (const group of groups.values()) {
      group.categories.sort((a, b) => (a.topic === "general" ? -1 : 1) - (b.topic === "general" ? -1 : 1))
    }
    return Array.from(groups.values())
  }, [categories])

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (activeTab === "members") fetchMembers()
    if (activeTab === "friends") fetchFriends()
    if (activeTab === "messages") fetchConversations()
    if (activeTab === "bands") fetchBands()
  }, [activeTab, currentUserDbId])

  useEffect(() => {
    if (activeTab === "feed") {
      fetchPosts()
    }
  }, [activeTab, selectedCategory, currentUserId])

  const fetchCategories = async () => {
    try {
      const data = await listCommunityCategories()
      setCategories(data)
      if (data.length > 0 && !category) {
        setCategory(data[0].slug)
      }
    } catch {
      setCategories([])
    }
  }

  const checkAuth = async () => {
    try {
      const viewer = await getCommunityViewer()
      if (viewer) {
        setCurrentUserId(viewer.id)
        setCurrentUserDbId(viewer.id)
        setIsAdmin(viewer.is_admin)
        setIsCrew(viewer.is_employee)
      }
    } catch {
      // signed out
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const data = await listCommunityPosts(selectedCategory === "all" ? null : selectedCategory)
      setPosts(data as CommunityPost[])
    } catch {
      setPosts([])
    }
    setLoading(false)
  }

  const handleToggleStar = async (postId: string, _currentlyStarred: boolean) => {
    if (!currentUserId) {
      router.push("/login")
      return
    }
    await togglePostStar(postId)
    fetchPosts()
  }

  const handleAddComment = async (postId: string) => {
    if (!currentUserId) {
      router.push("/login")
      return
    }
    if (!commentText[postId]?.trim()) return
    await addPostComment(postId, commentText[postId].trim())
    setCommentText({ ...commentText, [postId]: "" })
    fetchPosts()
  }

  const handleAddReply = async (postId: string, parentCommentId: string) => {
    if (!currentUserId) {
      router.push("/login")
      return
    }
    if (!replyText[parentCommentId]?.trim()) return
    await addPostComment(postId, replyText[parentCommentId].trim(), parentCommentId)
    setReplyText({ ...replyText, [parentCommentId]: "" })
    setReplyingTo(null)
    fetchPosts()
  }

  const handleToggleCommentStar = async (commentId: string, _currentlyStarred: boolean) => {
    if (!currentUserId) {
      router.push("/login")
      return
    }
    await toggleCommentStar(commentId)
    fetchPosts()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const preview = URL.createObjectURL(file)
      setImages([...images, { file, credit: newImageCredit || "Uncredited", preview }])
      setNewImageCredit("")
      e.target.value = ""
    }
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview)
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSavePost = async () => {
    if (!title.trim() || !content.trim() || !currentUserId) return

    const imageData = await Promise.all(
      images.map(async (img) => {
        const reader = new FileReader()
        return new Promise<{ url: string; credit: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({ url: reader.result as string, credit: img.credit })
          }
          reader.readAsDataURL(img.file)
        })
      })
    )

    try {
      await createCommunityPost({
        title,
        content,
        category,
        images: imageData,
      })
      images.forEach((img) => URL.revokeObjectURL(img.preview))
      setTitle("")
      setContent("")
      setImages([])
      setCreateDialogOpen(false)
      fetchPosts()
    } catch (err: any) {
      // Surface the reason (e.g. a social ban) instead of failing silently.
      setPostError(err?.message || "Could not publish your post. Please try again.")
    }
  }

  // Members functions
  const fetchMembers = async () => {
    setMembersLoading(true)
    try {
      const data = await listMembers()
      setMembers(data as Member[])
    } catch {
      setMembers([])
    }
    setMembersLoading(false)
  }

  const fetchFriends = async () => {
    if (!currentUserDbId) return
    try {
      const { friends: friendList, requests } = await listFriends()
      setFriends(friendList as Member[])
      setFriendRequests(requests as any[])
    } catch {
      setFriends([])
      setFriendRequests([])
    }
  }

  const handleSendFriendRequest = async (addresseeId: string) => {
    if (!currentUserDbId) return
    await sendFriendRequest(addresseeId)
    fetchMembers()
    fetchFriends()
  }

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId)
    fetchFriends()
    fetchMembers()
  }

  const handleDeclineFriendRequest = async (friendshipId: string) => {
    await removeFriendship(friendshipId)
    fetchFriends()
    fetchMembers()
  }

  const handleUnfriend = async (friendshipId: string) => {
    await removeFriendship(friendshipId)
    fetchFriends()
    fetchMembers()
  }

  // Bands tab functions
  const fetchBands = async () => {
    setBandsLoading(true)
    try {
      const [list, feed] = await Promise.all([listPublicBands(), getFollowedBandsFeed()])
      setBandsList(list)
      setFollowedFeed(feed)
    } catch {
      setBandsList([])
      setFollowedFeed([])
    }
    setBandsLoading(false)
  }

  const handleToggleBandFollow = async (band: BandDirectoryEntry) => {
    setBandActionError("")
    const next = !band.is_following
    // Optimistic update so the follower count and button state respond instantly.
    setBandsList((prev) =>
      prev.map((b) =>
        b.id === band.id ? { ...b, is_following: next, follower_count: b.follower_count + (next ? 1 : -1) } : b,
      ),
    )
    try {
      if (next) await followBand(band.id)
      else await unfollowBand(band.id)
      const feed = await getFollowedBandsFeed()
      setFollowedFeed(feed)
    } catch (e: any) {
      setBandsList((prev) =>
        prev.map((b) =>
          b.id === band.id ? { ...b, is_following: !next, follower_count: b.follower_count + (next ? -1 : 1) } : b,
        ),
      )
      setBandActionError(e?.message || "Failed to update follow status")
    }
  }

  const filteredBands = useMemo(() => {
    if (!bandSearch.trim()) return bandsList
    const search = bandSearch.toLowerCase()
    return bandsList.filter(
      (b) => b.name.toLowerCase().includes(search) || b.genre?.toLowerCase().includes(search),
    )
  }, [bandsList, bandSearch])

  // Messages functions
  const fetchConversations = async () => {
    if (!currentUserDbId) return
    try {
      const { conversations: convList, unreadCount: unread } = await listConversations()
      setConversations(convList as any[])
      setUnreadCount(unread)
    } catch {
      setConversations([])
      setUnreadCount(0)
    }
  }

  const fetchChatMessages = async (partnerId: string) => {
    if (!currentUserDbId) return
    try {
      const data = await getChatMessages(partnerId)
      setChatMessages(data as any[])
    } catch {
      setChatMessages([])
    }
    fetchConversations()
  }

  const handleSendMessage = async () => {
    if (!currentUserDbId || !activeConversation || !messageInput.trim()) return
    await sendChatMessage(activeConversation, messageInput)
    setMessageInput("")
    fetchChatMessages(activeConversation)
  }

  const startConversation = async (userId: string) => {
    setActiveConversation(userId)
    setActiveTab("messages")
    await fetchChatMessages(userId)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  // Main community hub view
  return (
    <div className="public-shell flex min-h-screen flex-col">
      <ResponsiveHeader
        currentPage="/community"
        isAdmin={isAdmin}
        isCrew={isCrew}
        isLoggedIn={!!currentUserId}
        onSignOut={handleSignOut}
        onLogin={() => router.push("/login")}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 md:py-10">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#f5f7ff]">Community</h1>
          </div>
          <p className="text-[#9a9fc4] max-w-lg">Connect with fellow fans, share your thoughts, and be part of the conversation.</p>
  </div>

  {/* Explains missing interactions to socially banned members */}
  <SocialBanBanner className="mb-6" />

  {/* Navigation Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "deck", label: "The DECK", icon: Sparkles },
            { id: "feed", label: "Discussions", icon: MessageSquare },
            { id: "bands", label: "Bands", icon: Music },
            { id: "members", label: "Members", icon: Users },
            ...(currentUserId ? [
              { id: "friends", label: "Friends", icon: UserCheck, badge: friendRequests.length },
              { id: "messages", label: "Messages", icon: MessageCircle, badge: unreadCount }
            ] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/20"
                  : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
          
          {/* My Profile Link */}
          {currentUserId && (
            <Link
              href={`/profile/${currentUserId}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50 ml-auto"
            >
              <User className="w-4 h-4" />
              My Profile
            </Link>
          )}
        </div>

        {/* The DECK - main community wall (one post per day per member, unlimited replies) */}
        {activeTab === "deck" && (
          <TheDeck currentUserId={currentUserId} currentProfileId={currentUserDbId} />
        )}

        {/* Feed Tab - Community Discussions & General Posting */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            {/* Header / Intro Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0c0c3f]/90 via-[#05052d]/90 to-[#121248]/90 border border-[#20205a]/80 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-[#ea6f2a] text-xs font-mono font-bold tracking-widest uppercase mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>OPEN FORUM // NO DAILY POST LIMITS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
                  Community Discussions &amp; General Posting
                </h2>
                <p className="text-xs sm:text-sm text-[#9a9fc4] mt-1">
                  Open discussion for everyone. Start threads, share stories, react to shows, and discuss music — post and comment freely!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentUserId ? (
                  <Button
                    onClick={() => {
                      setCreateDialogOpen(true)
                      setPostError(null)
                      if (selectedCategory && selectedCategory !== "all") {
                        setCategory(selectedCategory)
                      } else if (categories.length > 0) {
                        setCategory(categories[0].slug)
                      }
                    }}
                    className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-full px-5 shadow-lg shadow-[#ea6f2a]/25"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Discussion Post
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/login")}
                    className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-full px-5 shadow-lg shadow-[#ea6f2a]/25"
                  >
                    Sign In To Post
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/25"
                    : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:text-[#f5f7ff] border border-[#20205a]/50"
                }`}
              >
                All Discussions
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.slug
                      ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/25"
                      : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:text-[#f5f7ff] border border-[#20205a]/50"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Discussions Feed */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#0c0c3f]/40 border border-[#20205a]/50">
                <div className="w-16 h-16 rounded-full bg-[#ea6f2a]/10 border border-[#ea6f2a]/20 flex items-center justify-center mx-auto mb-4 text-[#ea6f2a]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f7ff] mb-1">No discussion posts yet</h3>
                <p className="text-sm text-[#9a9fc4] max-w-md mx-auto mb-6">
                  {selectedCategory === "all"
                    ? "Be the first to kick off the conversation! Share an idea, ask a question, or introduce yourself."
                    : `No posts yet in this channel. Be the first to start a thread!`}
                </p>
                {currentUserId ? (
                  <Button
                    onClick={() => {
                      setCreateDialogOpen(true)
                      setPostError(null)
                      if (selectedCategory !== "all") setCategory(selectedCategory)
                      else if (categories.length > 0) setCategory(categories[0].slug)
                    }}
                    className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-full px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Start Discussion
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/login")}
                    className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-full px-6"
                  >
                    Sign In To Start Discussion
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article key={post.id} className="media-card overflow-hidden rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/50">
                    <div className="p-5 sm:p-6">
                      {/* Author & Meta */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Link href={post.employee_id ? `/profile/${post.employee_id}` : "#"}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ea6f2a] to-[#20205a] p-0.5 cursor-pointer">
                              <div className="w-full h-full rounded-full bg-[#05052d] flex items-center justify-center overflow-hidden">
                                {post.employee?.profile_pic ? (
                                  <img src={post.employee.profile_pic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-[#f5f7ff]">
                                    {post.employee?.first_name?.[0]}{post.employee?.last_name?.[0] || "U"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#f5f7ff] text-sm">
                                {post.employee?.first_name} {post.employee?.last_name || "Community Member"}
                              </p>
                              {post.category && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#20205a]/60 text-[#ffd166] border border-[#20205a]">
                                  {categories.find((c) => c.slug === post.category)?.name || post.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7f84ad]">
                              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-[#f5f7ff] mb-2 leading-snug">{post.title}</h3>
                      <p className="text-[#9a9fc4] text-sm leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {post.images.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img.url} 
                              alt="" 
                              className="h-48 w-auto rounded-xl object-cover flex-shrink-0 border border-[#20205a]" 
                            />
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-[#20205a]/50">
                        <button
                          onClick={() => handleToggleStar(post.id, post.user_starred || false)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            post.user_starred 
                              ? "bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/30" 
                              : "text-[#9a9fc4] hover:bg-[#20205a]/50 hover:text-[#f5f7ff] border border-transparent"
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={post.user_starred ? "currentColor" : "none"} />
                          <span>{post.star_count || 0}</span>
                        </button>
                        <button
                          onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            showComments[post.id]
                              ? "bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30"
                              : "text-[#9a9fc4] hover:bg-[#20205a]/50 hover:text-[#f5f7ff] border border-transparent"
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{post.comments?.length || 0} comments</span>
                        </button>
                      </div>

                      {/* Comment section */}
                      {showComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-[#20205a]/50 space-y-3">
                          {post.comments && post.comments.length > 0 && (
                            <div className="space-y-3 mb-4">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm">
                                  <div className="w-7 h-7 rounded-full bg-[#20205a] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {comment.user?.profile_pic ? (
                                      <img src={comment.user.profile_pic} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] text-[#f5f7ff]">
                                        {comment.user?.first_name?.[0]}{comment.user?.last_name?.[0]}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-[#05052d] border border-[#20205a]/60 rounded-2xl px-4 py-2.5">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-[#f5f7ff]">
                                          {comment.user?.first_name} {comment.user?.last_name}
                                        </p>
                                        <span className="text-[10px] text-[#7f84ad]">
                                          {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#c5caea] mt-1">{comment.comment}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-[#7f84ad]">
                                      <button
                                        onClick={() => handleToggleCommentStar(comment.id, comment.user_starred || false)}
                                        className="hover:text-[#ea6f2a] flex items-center gap-1"
                                      >
                                        <Heart className="w-3 h-3" fill={comment.user_starred ? "currentColor" : "none"} />
                                        {comment.star_count || 0}
                                      </button>
                                      <button
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        className="hover:text-[#f5f7ff]"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {/* Threaded reply input */}
                                    {replyingTo === comment.id && (
                                      <div className="flex gap-2 mt-2">
                                        <Input
                                          value={replyText[comment.id] || ""}
                                          onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                                          placeholder="Write a reply..."
                                          className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-xs h-8 rounded-full"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault()
                                              handleAddReply(post.id, comment.id)
                                            }
                                          }}
                                        />
                                        <Button
                                          onClick={() => handleAddReply(post.id, comment.id)}
                                          size="sm"
                                          className="bg-[#ea6f2a] hover:bg-[#bc3f00] h-8 px-3 rounded-full text-xs"
                                          disabled={!replyText[comment.id]?.trim()}
                                        >
                                          Reply
                                        </Button>
                                      </div>
                                    )}

                                    {/* Nested replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                      <div className="mt-2 space-y-2 ml-4 border-l-2 border-[#20205a] pl-3">
                                        {comment.replies.map((reply) => (
                                          <div key={reply.id} className="flex gap-2">
                                            <div className="w-5 h-5 rounded-full bg-[#20205a] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                              {reply.user?.profile_pic ? (
                                                <img src={reply.user.profile_pic} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="text-[9px] text-[#f5f7ff]">
                                                  {reply.user?.first_name?.[0]}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex-1 bg-[#05052d] border border-[#20205a]/40 rounded-xl px-3 py-1.5">
                                              <p className="text-[11px] font-bold text-[#f5f7ff]">
                                                {reply.user?.first_name} {reply.user?.last_name}
                                              </p>
                                              <p className="text-xs text-[#9a9fc4] mt-0.5">{reply.comment}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add comment input */}
                          <div className="flex gap-2">
                            <Input
                              value={commentText[post.id] || ""}
                              onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                              placeholder={currentUserId ? "Write a comment..." : "Sign in to join discussion..."}
                              disabled={!currentUserId}
                              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] text-xs rounded-full h-9"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddComment(post.id)
                                }
                              }}
                            />
                            <Button
                              onClick={() => handleAddComment(post.id)}
                              className="bg-[#ea6f2a] hover:bg-[#bc3f00] rounded-full h-9 px-4"
                              disabled={!currentUserId || !commentText[post.id]?.trim()}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bands Tab — discover band/artist pages and see posts from bands you follow */}
        {activeTab === "bands" && (
          <div className="space-y-6">
            {bandActionError && (
              <p role="alert" className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {bandActionError}
              </p>
            )}

            <div className="flex items-center gap-2">
              {(
                [
                  { id: "discover", label: "Discover" },
                  { id: "following", label: "Following" },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setBandsView(sub.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bandsView === sub.id
                      ? "bg-[#ea6f2a] text-white"
                      : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:text-[#f5f7ff] border border-[#20205a]/50"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {bandsLoading ? (
              <div className="text-center py-16 text-[#9a9fc4]">Loading bands...</div>
            ) : bandsView === "discover" ? (
              <>
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9fc4]" />
                  <Input
                    value={bandSearch}
                    onChange={(e) => setBandSearch(e.target.value)}
                    placeholder="Search bands by name or genre..."
                    className="bg-[#0c0c3f]/60 border-[#20205a]/50 text-[#f5f7ff] pl-12 h-12 rounded-xl"
                  />
                </div>

                {filteredBands.length === 0 ? (
                  <div className="text-center py-16 text-[#9a9fc4]">
                    <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>
                      {bandsList.length === 0
                        ? "No band pages yet. Create one from your dashboard's Artist Portal."
                        : "No bands match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBands.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col p-5 rounded-2xl bg-[#0c0c3f]/40 border border-[#20205a]/50 hover:border-[#ea6f2a]/40 transition-colors"
                      >
                        <Link href={`/bands/${b.slug}`} className="flex items-center gap-3 group">
                          {b.logo_url ? (
                            <Image
                              src={b.logo_url || "/placeholder.svg"}
                              alt={b.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-xl object-cover border border-[#20205a] flex-shrink-0"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex-shrink-0">
                              <Music className="w-5 h-5 text-[#ea6f2a]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors truncate">
                              {b.name}
                            </p>
                            <p className="text-xs text-[#9a9fc4] truncate">
                              {b.genre || (b.type === "artist" ? "Artist" : "Band")} · {b.follower_count}{" "}
                              {b.follower_count === 1 ? "follower" : "followers"}
                            </p>
                          </div>
                        </Link>
                        {!b.is_owner && currentUserId && (
                          <Button
                            onClick={() => handleToggleBandFollow(b)}
                            size="sm"
                            className={`mt-4 ${
                              b.is_following
                                ? "border border-[#20205a] bg-transparent text-[#f5f7ff] hover:bg-[#20205a]/30"
                                : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                            }`}
                          >
                            {b.is_following ? (
                              <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {b.is_following ? "Following" : "Follow"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : !currentUserId ? (
              <p className="text-center text-sm text-[#9a9fc4] py-16">
                <Link href="/login" className="text-[#ea6f2a] hover:underline">
                  Sign in
                </Link>{" "}
                to follow bands and see their posts here.
              </p>
            ) : followedFeed.length === 0 ? (
              <div className="text-center py-16 text-[#9a9fc4]">
                <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Follow a band from Discover to see their posts here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {followedFeed.map((post) => (
                  <Link
                    key={post.id}
                    href={`/bands/${post.band_slug}`}
                    className="block p-5 rounded-2xl bg-[#0c0c3f]/40 border border-[#20205a]/50 hover:border-[#ea6f2a]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {post.band_logo_url ? (
                        <Image
                          src={post.band_logo_url || "/placeholder.svg"}
                          alt={post.band_name}
                          width={28}
                          height={28}
                          className="w-7 h-7 rounded-lg object-cover border border-[#20205a]"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#ea6f2a]/15 border border-[#ea6f2a]/30">
                          <Music className="w-3.5 h-3.5 text-[#ea6f2a]" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-[#f5f7ff]">{post.band_name}</span>
                      <span className="text-xs text-[#9a9fc4]">
                        {post.author_is_owner ? "posted an update" : `${post.author_name} posted`}
                      </span>
                    </div>
                    {post.content && (
                      <p className="text-[#f5f7ff]/90 text-sm whitespace-pre-wrap leading-relaxed text-pretty line-clamp-3">
                        {post.content}
                      </p>
                    )}
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {post.images.slice(0, 3).map((src, idx) => (
                          <Image
                            key={idx}
                            src={src || "/placeholder.svg"}
                            alt={`${post.band_name} post image ${idx + 1}`}
                            width={200}
                            height={140}
                            className="w-full h-24 rounded-lg object-cover border border-[#20205a]"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-[#9a9fc4]">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {post.comments.length}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9fc4]" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members..."
                className="bg-[#0c0c3f]/60 border-[#20205a]/50 text-[#f5f7ff] pl-12 h-12 rounded-xl"
              />
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#9a9fc4]">No members found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-[#0c0c3f]/40 border border-[#20205a]/50 rounded-2xl p-5 hover:border-[#20205a] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Link href={`/profile/${member.user_id}`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ea6f2a]/20 to-[#20205a] p-0.5 cursor-pointer hover:from-[#ea6f2a] transition-all">
                          <div className="w-full h-full rounded-full bg-[#05052d] flex items-center justify-center overflow-hidden">
                            {member.profile_pic ? (
                              <img src={member.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-medium text-[#f5f7ff]">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${member.user_id}`} className="hover:text-[#ea6f2a] transition-colors">
                          <h3 className="font-semibold text-[#f5f7ff] truncate">{member.first_name} {member.last_name}</h3>
                        </Link>
                        {member.is_employee && (
                          <span className="inline-block text-[10px] bg-[#ea6f2a]/20 text-[#ea6f2a] px-2 py-0.5 rounded-full mt-1">
                            Team
                          </span>
                        )}
                        {member.location && (
                          <p className="text-xs text-[#9a9fc4] mt-1 truncate">{member.location}</p>
                        )}
                      </div>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-[#9a9fc4] mt-3 line-clamp-2">{member.bio}</p>
                    )}
                    {currentUserId && (
                      <div className="mt-4 pt-4 border-t border-[#20205a]/50 flex gap-2">
                        {member.friendship_status === "none" && (
                          <Button
                            onClick={() => handleSendFriendRequest(member.id)}
                            size="sm"
                            className="flex-1 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-lg"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                          </Button>
                        )}
                        {member.friendship_status === "pending_sent" && (
                          <Button size="sm" variant="outline" disabled className="flex-1 border-[#20205a] text-[#9a9fc4] bg-transparent rounded-lg">
                            <Clock className="w-4 h-4 mr-2" />
                            Pending
                          </Button>
                        )}
                        {member.friendship_status === "pending_received" && (
                          <Button
                            onClick={() => handleAcceptFriendRequest(member.friendship_id!)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                          >
                            Accept
                          </Button>
                        )}
                        {member.friendship_status === "accepted" && (
                          <Button
                            onClick={() => startConversation(member.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent rounded-lg"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && currentUserId && (
          <div className="space-y-8">
            {friendRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#f5f7ff] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ea6f2a]" />
                  Friend Requests
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendRequests.map((req) => (
                    <div key={req.id} className="bg-[#0c0c3f]/60 border border-[#ea6f2a]/30 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#20205a] flex items-center justify-center overflow-hidden">
                          {req.requester?.profile_pic ? (
                            <img src={req.requester.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm text-[#f5f7ff]">
                              {req.requester?.first_name?.[0]}{req.requester?.last_name?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#f5f7ff]">
                            {req.requester?.first_name} {req.requester?.last_name}
                          </p>
                          <p className="text-xs text-[#9a9fc4]">Wants to connect</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptFriendRequest(req.id)}
                          size="sm"
                          className="flex-1 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-lg"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeclineFriendRequest(req.id)}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-[#20205a] text-[#9a9fc4] hover:text-red-400 hover:border-red-800 bg-transparent rounded-lg"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-[#f5f7ff] mb-4">Your Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <div className="bg-[#0c0c3f]/40 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#20205a]/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#9a9fc4]" />
                  </div>
                  <p className="text-[#f5f7ff] font-medium mb-1">No friends yet</p>
                  <p className="text-sm text-[#9a9fc4] mb-4">Find people to connect with in the Members tab</p>
                  <Button
                    onClick={() => setActiveTab("members")}
                    className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full"
                  >
                    Browse Members
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="bg-[#0c0c3f]/40 border border-[#20205a]/50 rounded-2xl p-5 hover:border-[#20205a] transition-colors">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${friend.user_id}`}>
                          <div className="w-12 h-12 rounded-full bg-[#20205a] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#ea6f2a] transition-all">
                            {friend.profile_pic ? (
                              <img src={friend.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm text-[#f5f7ff]">
                                {friend.first_name?.[0]}{friend.last_name?.[0]}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${friend.user_id}`}>
                            <p className="font-semibold text-[#f5f7ff] hover:text-[#ea6f2a] transition-colors truncate">
                              {friend.first_name} {friend.last_name}
                            </p>
                          </Link>
                          {friend.location && (
                            <p className="text-xs text-[#9a9fc4] truncate">{friend.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#20205a]/50">
                        <Button
                          onClick={() => startConversation(friend.id)}
                          size="sm"
                          className="flex-1 bg-[#20205a]/50 hover:bg-[#20205a] text-[#f5f7ff] rounded-lg"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          onClick={() => handleUnfriend(friend.friendship_id!)}
                          size="sm"
                          variant="ghost"
                          className="text-[#9a9fc4] hover:text-red-400 hover:bg-red-950/20 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && currentUserId && (
          <div className="bg-[#0c0c3f]/40 border border-[#20205a]/50 rounded-2xl overflow-hidden min-h-[500px] flex">
            {/* Conversation List */}
            <div className={`w-full md:w-80 border-r border-[#20205a]/50 flex-shrink-0 ${activeConversation ? "hidden md:block" : ""}`}>
              <div className="p-4 border-b border-[#20205a]/50">
                <h3 className="font-semibold text-[#f5f7ff]">Messages</h3>
              </div>
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-[#9a9fc4]/50 mx-auto mb-3" />
                  <p className="text-sm text-[#9a9fc4]">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#20205a]/30">
                  {conversations.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => { setActiveConversation(conv.partnerId); fetchChatMessages(conv.partnerId) }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-[#20205a]/30 transition-colors text-left ${
                        activeConversation === conv.partnerId ? "bg-[#20205a]/40" : ""
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-[#20205a] flex items-center justify-center overflow-hidden">
                          {conv.partner?.profile_pic ? (
                            <img src={conv.partner.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm text-[#f5f7ff]">
                              {conv.partner?.first_name?.[0]}{conv.partner?.last_name?.[0]}
                            </span>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea6f2a] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#f5f7ff] truncate">
                          {conv.partner?.first_name} {conv.partner?.last_name}
                        </p>
                        <p className="text-xs text-[#9a9fc4] truncate">{conv.lastMessage?.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!activeConversation ? "hidden md:flex" : ""}`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-[#20205a]/50 flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 rounded-full hover:bg-[#20205a]/50 text-[#9a9fc4]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                      const partner = conversations.find(c => c.partnerId === activeConversation)?.partner
                      return (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#20205a] flex items-center justify-center overflow-hidden">
                            {partner?.profile_pic ? (
                              <img src={partner.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm text-[#f5f7ff]">
                                {partner?.first_name?.[0]}{partner?.last_name?.[0]}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#f5f7ff]">{partner?.first_name} {partner?.last_name}</p>
                        </>
                      )
                    })()}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUserDbId ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                            msg.sender_id === currentUserDbId
                              ? "bg-[#ea6f2a] text-white rounded-br-sm"
                              : "bg-[#20205a] text-[#f5f7ff] rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_id === currentUserDbId ? "text-white/60" : "text-[#9a9fc4]"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-[#20205a]/50 flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-full px-5"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-[#9a9fc4]/30 mx-auto mb-3" />
                    <p className="text-[#9a9fc4]">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Discussion Post Modal */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#f5f7ff]">
                <MessageSquare className="w-5 h-5 text-[#ea6f2a]" />
                New Discussion Post
              </DialogTitle>
              <DialogDescription className="text-xs text-[#9a9fc4]">
                Share your thoughts, stories, and join the conversation. No daily limits in discussions!
              </DialogDescription>
            </DialogHeader>

            {postError && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs">
                {postError}
              </div>
            )}

            <div className="space-y-4 my-2">
              <div>
                <Label className="text-xs font-semibold text-[#9a9fc4] mb-1.5 block">
                  Category / Channel
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug} className="focus:bg-[#20205a] focus:text-white">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#9a9fc4] mb-1.5 block">
                  Post Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's on your mind? (e.g. Favorite session, backstage recap...)"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#9a9fc4] mb-1.5 block">
                  Discussion Content
                </Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post here... Feel free to be detailed!"
                  rows={5}
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] resize-none"
                />
              </div>

              {/* Image upload preview */}
              <div>
                <Label className="text-xs font-semibold text-[#9a9fc4] mb-1.5 block">
                  Attach Image (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-[#05052d] hover:bg-[#20205a]/60 border border-[#20205a] text-xs font-medium text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors">
                    <ImageIcon className="w-4 h-4 text-[#ea6f2a]" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {images.length > 0 && (
                    <span className="text-xs text-[#20efe0] font-medium">
                      {images.length} {images.length === 1 ? "image" : "images"} attached
                    </span>
                  )}
                </div>

                {images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <div key={i} className="relative group shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#20205a]">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#20205a]/50">
              <Button
                variant="ghost"
                onClick={() => setCreateDialogOpen(false)}
                className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePost}
                disabled={!title.trim() || !content.trim() || !category}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/20"
              >
                Publish Discussion Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}
