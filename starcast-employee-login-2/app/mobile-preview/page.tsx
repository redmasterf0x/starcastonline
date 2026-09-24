"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Tv,
  FileText,
  MessageSquare,
  User,
  Radio,
  Play,
  Share2,
  Heart,
  MoreVertical,
  Plus,
  Shield,
  Flag,
  UserX,
  EyeOff,
  LogOut,
  Trash2,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Maximize2,
  ArrowLeft,
  Search,
  CheckCircle2,
  X
} from "lucide-react"

// Mock Data matching mobile app
const SHOWS = [
  {
    id: "observation-deck",
    title: "The Observation Deck",
    tagline: "Live Studio Broadcast & Cultural Interviews",
    duration: "48:12",
    views: "1.2K Live",
    badge: "LIVE NOW",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
    description: "Deep dive conversations with Topeka creators, artists, and regional voices live from the StarCast Soundstage."
  },
  {
    id: "star-talk",
    title: "Star Talk with Neil deGrasse Tyson & Guests",
    tagline: "Cosmic Journeys & Astrophysics",
    duration: "45:12",
    views: "102K views",
    badge: "EPISODE 14",
    thumbnail: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    description: "Exploring the cosmos, planetary science, and cultural intersections with world-renowned scientists."
  },
  {
    id: "hollywood-babylon",
    title: "Hollywood After Babylon",
    tagline: "Vintage Cinema & Untold Film Lore",
    duration: "58:30",
    views: "89K views",
    badge: "SEASON 2",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80",
    description: "The scandalous, secret, and legendary golden era of American cinema dissected."
  },
  {
    id: "psyco-g-spot",
    title: "The Psyco G Spot",
    tagline: "Geek Culture, Hip-Hop & Unfiltered Talk",
    duration: "52:15",
    views: "67K views",
    badge: "NEW",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    description: "The hottest underground music review, gaming highlights, and Midwest creator debates."
  }
]

const ARTICLES = [
  {
    id: "1",
    title: "A Who’s Who in Topeka: How StarCast Media Built the Ultimate Local Talent Spotlight",
    author: "Ray Starnes",
    date: "Sep 18, 2026",
    readTime: "6 min read",
    category: "SPOTLIGHT",
    tagColor: "bg-[#ea6f2a]",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    excerpt: "From underground musicians to community trailblazers, StarCast is putting Midwest creators on the global radar with dedicated soundstages."
  },
  {
    id: "2",
    title: "Unplugged: Defining the Sound of the Heartland Revival",
    author: "StarCast Music Desk",
    date: "Sep 16, 2026",
    readTime: "4 min read",
    category: "MUSIC",
    tagColor: "bg-[#ffd166] text-black",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    excerpt: "Inside the recording sessions capturing Heartland rock, hip-hop, and indie acoustics at the new downtown broadcast hub."
  },
  {
    id: "3",
    title: "Inside the Box: Elevating Regional Video & Live Streaming",
    author: "Marcus T.",
    date: "Sep 14, 2026",
    readTime: "5 min read",
    category: "PRODUCTION",
    tagColor: "bg-[#20efe0] text-black",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80",
    excerpt: "How 4K multi-camera switching and low-latency audio are empowering independent creators without studio overhead."
  }
]

const INITIAL_POSTS = [
  {
    id: "post-1",
    author: "Astrid V.",
    avatar: "A",
    time: "15m ago",
    category: "The DECK",
    title: "Welcome to The DECK! StarCast's New Mobile Community Hub",
    content: "Say hello, introduce yourself, and let's build the ultimate creator forum! Drop your favorite regional artists below.",
    replies: 42,
    likes: 156
  },
  {
    id: "post-2",
    author: "CosmicCaleb",
    avatar: "C",
    time: "34m ago",
    category: "Shows",
    title: "Predictions for the upcoming 'Observation Deck' episode?",
    content: "Who's excited for Friday night? I'm hoping to hear about the new soundstage expansion and the guest DJ set.",
    replies: 18,
    likes: 64
  },
  {
    id: "post-3",
    author: "HeartlandBeats",
    avatar: "H",
    time: "1h ago",
    category: "Music",
    title: "Best tracks for late-night studio sessions?",
    content: "Looking for smooth, chill atmospheric music recommendations. What are you all producing this week?",
    replies: 9,
    likes: 31
  }
]

export default function MobileAppPreviewPage() {
  const [activeTab, setActiveTab] = useState<"watch" | "articles" | "deck" | "profile">("watch")
  const [phoneFrame, setPhoneFrame] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  // Community interactive state
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [blockedAuthors, setBlockedAuthors] = useState<string[]>([])
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([])
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null)
  const [reportModalPost, setReportModalPost] = useState<any | null>(null)
  const [newPostModalOpen, setNewPostModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    const newPost = {
      id: `post-${Date.now()}`,
      author: "You (Member)",
      avatar: "Y",
      time: "Just now",
      category: "The DECK",
      title: newTitle.trim() || newContent.slice(0, 40),
      content: newContent.trim(),
      replies: 0,
      likes: 1
    }
    setPosts([newPost, ...posts])
    setNewTitle("")
    setNewContent("")
    setNewPostModalOpen(false)
    showToast("🎉 Post published to The DECK!")
  }

  const handleBlockUser = (author: string) => {
    setBlockedAuthors([...blockedAuthors, author])
    setPostMenuOpen(null)
    showToast(`🚫 Blocked ${author}. Their posts are hidden.`)
  }

  const handleHidePost = (id: string) => {
    setHiddenPostIds([...hiddenPostIds, id])
    setPostMenuOpen(null)
    showToast("👁️ Post hidden from your feed.")
  }

  const handleReportPost = (post: any) => {
    setReportModalPost(post)
    setPostMenuOpen(null)
  }

  const visiblePosts = posts.filter(
    (p) =>
      !blockedAuthors.includes(p.author) &&
      !hiddenPostIds.includes(p.id) &&
      (selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#020216] text-[#f5f7ff] flex flex-col items-center justify-start p-2 sm:p-6 select-none font-sans">
      {/* Top Banner with Controls */}
      <header className="w-full max-w-4xl flex items-center justify-between py-3 px-4 mb-4 rounded-2xl bg-[#090938] border border-[#20205a]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#ffd166] hover:text-[#ea6f2a] font-mono uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Site Home
          </Link>
          <span className="text-[#303070]">|</span>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-[#f5f7ff] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            StarCast Android App Live Simulator
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhoneFrame(!phoneFrame)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#14144e] border border-[#2d2d7c] hover:border-[#ea6f2a] transition-colors"
          >
            {phoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#20efe0]" /> Full Screen
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#ffd166]" /> Phone Frame
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container / Mobile Frame */}
      <div
        className={`w-full transition-all duration-300 relative ${
          phoneFrame
            ? "max-w-[400px] h-[820px] rounded-[48px] border-[10px] border-[#181844] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(234,111,42,0.15)] overflow-hidden flex flex-col bg-[#05052d]"
            : "max-w-2xl h-[860px] rounded-2xl border border-[#20205a] overflow-hidden flex flex-col bg-[#05052d]"
        }`}
      >
        {/* Phone Notch / Status Bar */}
        <div className="bg-[#05052d] px-6 py-2 flex items-center justify-between text-[11px] font-mono text-[#8b92be] border-b border-[#141445] shrink-0">
          <span>9:41</span>
          <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#101030] mr-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a45]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-4 h-2.5 border border-[#8b92be] rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Dynamic App Content Area */}
        <div className="flex-1 overflow-y-auto relative scrollbar-none">
          {!isSignedIn ? (
            /* Welcome / Sign In Screen */
            <div className="p-6 flex flex-col items-center justify-center min-h-full text-center">
              <div className="w-20 h-20 rounded-full bg-[#0a0a38] border-2 border-[#ea6f2a] flex items-center justify-center shadow-[0_0_30px_rgba(234,111,42,0.3)] mb-4">
                <Radio className="w-10 h-10 text-[#ea6f2a]" />
              </div>
              <h1 className="text-2xl font-black tracking-wider text-[#f5f7ff]">STARCAST</h1>
              <p className="text-[11px] font-bold text-[#ffd166] tracking-widest uppercase mb-8">
                Broadcast &amp; Talent Network
              </p>

              <div className="w-full p-6 rounded-2xl bg-[#0c0c3f] border border-[#20205a] space-y-4">
                <h2 className="text-base font-bold text-[#f5f7ff]">Sign In or Sign Up</h2>
                <p className="text-xs text-[#9a9fc4]">Access Watch, Articles, and The DECK community</p>

                <button
                  onClick={() => setIsSignedIn(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#ea6f2a] hover:bg-[#d65f1e] font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <span className="text-lg font-bold">G</span> Continue with Google
                </button>

                <button
                  onClick={() => setIsSignedIn(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#14144e] border border-[#2d2d7c] font-semibold text-xs text-[#f5f7ff] flex items-center justify-center gap-2 hover:border-[#20efe0] transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-[#20efe0]" /> Continue with Phone Number
                </button>

                <div className="pt-2 border-t border-[#1a1a52]">
                  <button
                    onClick={() => setIsSignedIn(true)}
                    className="text-xs text-[#20efe0] hover:underline font-bold"
                  >
                    Explore as Guest &rarr;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: WATCH */}
              {activeTab === "watch" && (
                <div className="p-4 space-y-5">
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#151545]">
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-[#ea6f2a]" />
                      <span className="font-black tracking-wider text-base text-[#f5f7ff]">STARCAST</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
                    </span>
                  </div>

                  {/* Featured Hero Player Card */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#2a2a68] shadow-2xl bg-black group">
                    <img
                      src={SHOWS[0].thumbnail}
                      alt={SHOWS[0].title}
                      className="w-full h-48 object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05052d] via-black/40 to-transparent" />
                    
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {SHOWS[0].badge}
                    </span>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-[#ffd166] font-mono">
                      {SHOWS[0].views}
                    </span>

                    <button
                      onClick={() => showToast("▶️ Opening live broadcast stream...")}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </button>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold text-[#f5f7ff] leading-tight mb-0.5">
                        {SHOWS[0].title}
                      </h3>
                      <p className="text-[11px] text-[#ffd166] line-clamp-1">{SHOWS[0].tagline}</p>
                    </div>
                  </div>

                  {/* Trending Series List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-mono uppercase tracking-wider text-[#ffd166]">
                        Original Shows &amp; Series
                      </h2>
                      <span className="text-[11px] text-[#8b92be]">4 Shows</span>
                    </div>

                    <div className="space-y-3">
                      {SHOWS.slice(1).map((show) => (
                        <div
                          key={show.id}
                          className="flex gap-3 p-2.5 rounded-xl bg-[#0c0c3f] border border-[#1d1d58] hover:border-[#ea6f2a] transition-colors cursor-pointer"
                          onClick={() => showToast(`🎬 Playing: ${show.title}`)}
                        >
                          <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-black">
                            <img src={show.thumbnail} alt={show.title} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                              {show.duration}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[9px] font-mono text-[#ea6f2a] uppercase font-bold">
                              {show.badge}
                            </span>
                            <h4 className="text-xs font-bold text-[#f5f7ff] leading-snug line-clamp-1">
                              {show.title}
                            </h4>
                            <p className="text-[10px] text-[#9a9fc4] line-clamp-1 mt-0.5">{show.tagline}</p>
                            <span className="text-[9px] text-[#8b92be] mt-1">{show.views}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ARTICLES */}
              {activeTab === "articles" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#151545]">
                    <h1 className="text-sm font-bold text-[#f5f7ff] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#ffd166]" /> Dispatches &amp; Articles
                    </h1>
                    <Search className="w-4 h-4 text-[#8b92be]" />
                  </div>

                  {/* Hero Featured Article */}
                  <div
                    onClick={() => showToast(`📖 Reading: ${ARTICLES[0].title}`)}
                    className="rounded-2xl overflow-hidden bg-[#0c0c3f] border border-[#20205a] hover:border-[#ffd166] transition-colors cursor-pointer"
                  >
                    <img src={ARTICLES[0].image} alt={ARTICLES[0].title} className="w-full h-36 object-cover" />
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#ea6f2a] text-white">
                          {ARTICLES[0].category}
                        </span>
                        <span className="text-[10px] text-[#8b92be]">{ARTICLES[0].readTime}</span>
                      </div>
                      <h3 className="text-xs font-bold text-[#f5f7ff] leading-snug">{ARTICLES[0].title}</h3>
                      <p className="text-[11px] text-[#9a9fc4] line-clamp-2">{ARTICLES[0].excerpt}</p>
                      <p className="text-[10px] text-[#ffd166]">By {ARTICLES[0].author} &middot; {ARTICLES[0].date}</p>
                    </div>
                  </div>

                  {/* Editorial Feed */}
                  <div className="space-y-3">
                    {ARTICLES.slice(1).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => showToast(`📖 Reading: ${art.title}`)}
                        className="flex gap-3 p-3 rounded-xl bg-[#0c0c3f] border border-[#1d1d58] hover:border-[#ffd166] transition-colors cursor-pointer"
                      >
                        <img src={art.image} alt={art.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 flex flex-col justify-between">
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded self-start ${art.tagColor}`}>
                            {art.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#f5f7ff] line-clamp-2 leading-tight">
                            {art.title}
                          </h4>
                          <span className="text-[9px] text-[#8b92be]">{art.author} &middot; {art.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: THE DECK COMMUNITY */}
              {activeTab === "deck" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#151545]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#ffd166]" />
                      <span className="font-bold text-sm text-[#f5f7ff]">The DECK Community</span>
                    </div>
                    <button
                      onClick={() => setNewPostModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#ffd166] text-black text-xs font-bold flex items-center gap-1 hover:bg-[#ffc233] transition-transform active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Post
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {["All", "The DECK", "Discussion", "Shows", "Music"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-colors ${
                          selectedCategory === cat
                            ? "bg-[#ffd166] text-black"
                            : "bg-[#0c0c3f] text-[#8b92be] border border-[#1d1d58]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Feed */}
                  <div className="space-y-3">
                    {visiblePosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-2xl bg-[#0c0c3f] border border-[#1d1d58] space-y-2 relative"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#ffd166]/20 text-[#ffd166] flex items-center justify-center font-bold text-xs">
                              {post.avatar}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#f5f7ff] block">{post.author}</span>
                              <span className="text-[10px] text-[#8b92be]">{post.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#16164d] text-[#ffd166] border border-[#2d2d7c]">
                              {post.category}
                            </span>
                            <button
                              onClick={() => setPostMenuOpen(postMenuOpen === post.id ? null : post.id)}
                              className="p-1 text-[#8b92be] hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 3-Dots UGC Menu (Report / Block / Hide) */}
                        {postMenuOpen === post.id && (
                          <div className="absolute right-3 top-10 w-44 rounded-xl bg-[#14144e] border border-[#2d2d7c] shadow-2xl p-1 z-20 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => handleReportPost(post)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-500/15"
                            >
                              <Flag className="w-3.5 h-3.5" /> Report Post
                            </button>
                            <button
                              onClick={() => handleBlockUser(post.author)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[#f5f7ff] hover:bg-[#202066]"
                            >
                              <UserX className="w-3.5 h-3.5 text-red-400" /> Block {post.author}
                            </button>
                            <button
                              onClick={() => handleHidePost(post.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[#8b92be] hover:bg-[#202066]"
                            >
                              <EyeOff className="w-3.5 h-3.5" /> Hide Post
                            </button>
                          </div>
                        )}

                        <h4 className="text-xs font-bold text-[#f5f7ff]">{post.title}</h4>
                        <p className="text-[11px] text-[#c4c7da] leading-relaxed">{post.content}</p>

                        <div className="flex items-center gap-4 pt-1 text-[11px] text-[#8b92be]">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {post.replies} replies
                          </span>
                          <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer">
                            <Heart className="w-3 h-3" /> {post.likes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE */}
              {activeTab === "profile" && (
                <div className="p-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-[#0c0c3f] border border-[#20205a] text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a] text-[#ea6f2a] font-black text-2xl mx-auto flex items-center justify-center">
                      R
                    </div>
                    <h3 className="text-sm font-bold text-[#f5f7ff]">Ray Starnes</h3>
                    <p className="text-[11px] text-[#8b92be]">ray@starcast.online</p>
                    <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                      StarCast All-Access Pass
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#0c0c3f] border border-[#20205a] overflow-hidden text-xs divide-y divide-[#18184e]">
                    <a
                      href="https://starcast.online"
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 flex items-center justify-between hover:bg-[#121245]"
                    >
                      <span className="text-[#f5f7ff]">StarCast Online Web</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#20efe0]" />
                    </a>
                    <a
                      href="https://starcast.online/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 flex items-center justify-between hover:bg-[#121245]"
                    >
                      <span className="text-[#f5f7ff]">Privacy Policy</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8b92be]" />
                    </a>
                    <a
                      href="https://starcast.online/delete-account"
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 flex items-center justify-between hover:bg-[#121245]"
                    >
                      <span className="text-red-400">Account Deletion URL</span>
                      <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                    </a>
                  </div>

                  {/* Account Actions */}
                  <div className="rounded-2xl bg-[#0c0c3f] border border-[#20205a] overflow-hidden text-xs divide-y divide-[#18184e]">
                    <button
                      onClick={() => setIsSignedIn(false)}
                      className="w-full p-3 flex items-center justify-between text-[#ea6f2a] font-bold hover:bg-[#121245]"
                    >
                      <span>Switch Account / Sign In</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to permanently delete your account and data?")) {
                          setIsSignedIn(false)
                          showToast("Account deletion request submitted.")
                        }
                      }}
                      className="w-full p-3 flex items-center justify-between text-red-400 font-bold hover:bg-[#121245]"
                    >
                      <span>Delete Account &amp; Data</span>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        {isSignedIn && (
          <div className="bg-[#070733] border-t border-[#1d1d58] px-4 py-2.5 flex items-center justify-around shrink-0">
            <button
              onClick={() => setActiveTab("watch")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "watch" ? "text-[#ea6f2a]" : "text-[#8b92be] hover:text-white"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span className="text-[10px] font-bold">Watch</span>
            </button>

            <button
              onClick={() => setActiveTab("articles")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "articles" ? "text-[#ffd166]" : "text-[#8b92be] hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px] font-bold">Articles</span>
            </button>

            <button
              onClick={() => setActiveTab("deck")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "deck" ? "text-[#ffd166]" : "text-[#8b92be] hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-bold">The DECK</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === "profile" ? "text-[#20efe0]" : "text-[#8b92be] hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-12 left-4 right-4 p-3 rounded-xl bg-[#090938] border border-[#ea6f2a] text-white text-xs shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#ea6f2a] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal: New Post on The DECK */}
        {newPostModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
            <div className="bg-[#0c0c3f] border-t border-[#20205a] rounded-t-3xl p-5 space-y-3 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f1f54]">
                <h3 className="text-sm font-bold text-[#f5f7ff]">Start a Discussion</h3>
                <button onClick={() => setNewPostModalOpen(false)} className="text-[#8b92be]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <input
                  type="text"
                  placeholder="Discussion Topic / Headline"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#05052d] border border-[#1d1d58] text-xs text-white placeholder-[#6a719d] focus:outline-none focus:border-[#ffd166]"
                />
                <textarea
                  placeholder="What's on your mind? Share thoughts with StarCast..."
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#05052d] border border-[#1d1d58] text-xs text-white placeholder-[#6a719d] focus:outline-none focus:border-[#ffd166]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#ffd166] text-black font-bold text-xs hover:bg-[#ffc233]"
                >
                  Post to The DECK
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Report Post */}
        {reportModalPost && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-[#0c0c3f] border border-[#20205a] rounded-2xl p-5 space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <Flag className="w-4 h-4" /> Report Content
              </div>
              <p className="text-xs text-[#9a9fc4]">
                Why are you reporting this post by <strong>{reportModalPost.author}</strong>?
              </p>
              <div className="space-y-1.5 text-xs text-[#c4c7da]">
                {["Inappropriate content", "Harassment or hate speech", "Spam or advertising", "Misinformation"].map(
                  (reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#07072e] border border-[#18184e] cursor-pointer hover:border-red-400"
                    >
                      <input type="radio" name="report-reason" defaultChecked={reason === "Inappropriate content"} />
                      <span>{reason}</span>
                    </label>
                  )
                )}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setReportModalPost(null)}
                  className="flex-1 py-2 rounded-xl bg-[#14144e] text-xs text-[#8b92be]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleHidePost(reportModalPost.id)
                    setReportModalPost(null)
                    showToast("🛡️ Report submitted to StarCast moderators.")
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#6a719d] mt-4 font-mono">
        Official StarCast Mobile App Simulation &middot; Route: <code>/mobile-preview</code>
      </p>
    </div>
  )
}
