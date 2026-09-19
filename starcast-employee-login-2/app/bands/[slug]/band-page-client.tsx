"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BandQrModal } from "@/components/bands/band-qr-modal"
import { LinkTree } from "@/components/LinkTree"
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
  QrCode,
  Sparkles,
  Radio,
  ExternalLink,
  ShieldCheck,
  Settings,
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
  const [hasError, setHasError] = useState(false)
  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className="w-10 h-10 rounded-full object-cover border border-[#20205a] shrink-0"
      />
    )
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/30 text-[#ea6f2a] font-semibold text-sm shrink-0">
      {name ? name.charAt(0).toUpperCase() : "★"}
    </div>
  )
}

import { BandTicketsWidget, type BandEventItem } from "@/components/bands/band-tickets-widget"
import { BandMusicPlayer } from "@/components/bands/band-music-player"
import type { BandTrackItem } from "@/app/actions/band-tracks"

export function BandPageClient({
  band,
  initialPosts,
  initialEvents = [],
  initialTracks = [],
}: {
  band: PublicBand
  initialPosts: BandPost[]
  initialEvents?: BandEventItem[]
  initialTracks?: BandTrackItem[]
}) {
  const [posts, setPosts] = useState<BandPost[]>(initialPosts)
  const [events, setEvents] = useState<BandEventItem[]>(initialEvents)
  const [tracks, setTracks] = useState<BandTrackItem[]>(initialTracks)
  const [isPublic, setIsPublic] = useState(band.is_public)
  const [bannerError, setBannerError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
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
    const url = typeof window !== "undefined" ? `${window.location.origin}/bands/${band.slug}` : `https://starcast.online/bands/${band.slug}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
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
      const res = await setBandPublic(band.id, next)
      if (res && !res.success) {
        throw new Error(res.error || "Failed to update visibility")
      }
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
    <div className="public-shell flex flex-col min-h-screen text-[#f5f7ff]">
      <ResponsiveHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Button
            asChild
            variant="outline"
            className="border-[#20efe0]/35 bg-[#0c0c3f]/55 text-[#c9fbf7] shadow-[0_0_20px_rgba(32,239,224,0.08)] hover:border-[#20efe0]/60 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff] rounded-xl h-10 sm:h-11 px-4 text-xs sm:text-sm font-semibold"
          >
            <Link href="/bands">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Soundstage Directory
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setQrModalOpen(true)}
              variant="outline"
              className="border-[#20efe0]/40 bg-[#0c0c3f]/80 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl text-xs sm:text-sm font-semibold h-10 sm:h-11 px-4 shadow-md shadow-[#20efe0]/10"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-[#20efe0]" />
              Get QR Code
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              className="border-[#20205a] bg-[#0c0c3f]/80 text-[#dbe0fb] hover:text-[#f5f7ff] hover:bg-[#20205a]/40 rounded-xl text-xs sm:text-sm font-semibold h-10 sm:h-11 px-4"
            >
              {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-1.5" />}
              {copied ? "Link Copied!" : "Share"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-800/80 bg-red-950/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Soundstage Grand Hero */}
        <section className="relative rounded-3xl border border-[#20205a]/80 bg-gradient-to-b from-[#0c0c3f]/80 via-[#070725]/90 to-[#05051f] overflow-hidden mb-8 shadow-2xl shadow-black/60">
          {/* Banner Image Stage Rig */}
          {band.banner_url && !bannerError ? (
            <div className="relative h-44 sm:h-72 w-full overflow-hidden bg-[#05052d]">
              <img
                src={band.banner_url}
                alt={`${band.name} banner`}
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] via-[#05051f]/40 to-transparent pointer-events-none" />
              {/* Audio tracking grid overlay */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            </div>
          ) : (
            <div className="relative h-36 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-[#ea6f2a]/25 via-[#121248] to-[#20efe0]/20">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c3f] to-transparent pointer-events-none" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#20efe0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            </div>
          )}

          {/* Soundstage Verified Beacon */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05051f]/80 border border-[#20efe0]/40 backdrop-blur-md text-[11px] font-mono text-[#20efe0]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#38ef7d]" />
            <span>SOUNDSTAGE LIVE // TOPEKA</span>
          </div>

          <div className="relative z-10 px-4 sm:px-8 pb-6 sm:pb-8 pt-2 sm:pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              {/* Overlapping Avatar with Glow */}
              <div className="-mt-12 sm:-mt-24 shrink-0 relative z-20">
                <div className="relative p-1 rounded-2xl bg-gradient-to-tr from-[#ea6f2a] via-[#ffd166] to-[#20efe0] shadow-2xl shadow-[#ea6f2a]/20">
                  {band.logo_url && !logoError ? (
                    <img
                      src={band.logo_url}
                      alt={band.name}
                      onError={() => setLogoError(true)}
                      className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl object-cover bg-[#05052d] border-2 border-[#0c0c3f]"
                      loading="eager"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 sm:w-36 sm:h-36 rounded-xl bg-[#0c0c3f] border-2 border-[#0c0c3f]">
                      <Music className="w-10 h-10 sm:w-14 sm:h-14 text-[#ea6f2a]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Band Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
                    {band.name}
                  </h1>
                  <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 font-mono text-xs uppercase px-2.5 py-0.5">
                    {band.type === "artist"
                      ? "Solo Artist"
                      : band.type === "producer"
                      ? "Producer"
                      : band.type === "dj"
                      ? "DJ / Electronic"
                      : "Band"}
                  </Badge>
                  {band.genre && (
                    <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 font-mono text-xs">
                      {band.genre}
                    </Badge>
                  )}
                  {band.is_owner && !isPublic && (
                    <Badge className="bg-yellow-900/40 text-yellow-300 border border-yellow-700/50">
                      <Lock className="w-3 h-3 mr-1" /> Private Act
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-[#dbe0fb] mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-[#20efe0]" />
                    <strong className="text-[#f5f7ff] font-bold">{followerCount}</strong> {followerCount === 1 ? "follower" : "followers"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
                    StarCast Resident Act
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Description */}
            {band.bio && (
              <div className="mt-6 pt-6 border-t border-[#20205a]/50">
                <p className="text-base sm:text-lg text-[#dbe0fb] leading-relaxed text-pretty max-w-3xl">
                  {band.bio}
                </p>
              </div>
            )}

            {/* Interactive Action Ribbon */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#20205a]/50 flex-wrap">
              {!band.is_owner && band.is_authenticated && (
                <Button
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  className={
                    isFollowing
                      ? "border border-[#20205a] bg-transparent text-[#f5f7ff] hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-6 text-sm font-semibold"
                      : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white rounded-xl h-11 sm:h-12 px-6 text-sm font-semibold shadow-lg shadow-[#ea6f2a]/25"
                  }
                >
                  {isFollowing ? (
                    <UserMinus className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {isFollowing ? "Following Act" : "Follow Act"}
                </Button>
              )}

              <Button
                onClick={() => setQrModalOpen(true)}
                className="bg-gradient-to-r from-[#20efe0]/20 to-[#0c0c3f] border border-[#20efe0]/50 text-[#20efe0] hover:bg-[#20efe0]/30 hover:text-white rounded-xl font-semibold shadow-md h-11 sm:h-12 px-5 text-sm"
              >
                <QrCode className="w-4 h-4 mr-2 text-[#20efe0]" />
                Get QR Code
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/60 hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-5 text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-2" />}
                {copied ? "Link Copied" : "Share Page"}
              </Button>

              {band.is_owner && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleTogglePublic}
                    className="border-[#20205a] text-[#f5f7ff] bg-[#0c0c3f]/60 hover:bg-[#20205a]/40 rounded-xl h-11 sm:h-12 px-5 text-sm font-medium"
                  >
                    {isPublic ? <Globe className="w-4 h-4 mr-2 text-emerald-400" /> : <Lock className="w-4 h-4 mr-2 text-yellow-400" />}
                    {isPublic ? "Public Page" : "Private Page"}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="border-[#ea6f2a]/50 text-[#ea6f2a] hover:bg-[#ea6f2a]/15 rounded-xl ml-auto h-11 sm:h-12 px-5 text-sm font-semibold"
                  >
                    <Link href="/portal">
                      <Settings className="w-4 h-4 mr-2" />
                      Artist Portal Edit
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Custom Links (Cosmic Linktree style) */}
        {band.links && band.links.length > 0 && (
          <LinkTree links={band.links.map((link: any) => ({ label: link.title, url: link.url }))} />
        )}

        {/* Music Catalog & Audio Streaming Showcase */}
        {((band.music_catalog_enabled && tracks.length > 0) || (band.is_owner && tracks.length > 0)) && (
          <section className="mb-10">
            <BandMusicPlayer
              bandName={band.name}
              bandLogo={band.logo_url}
              catalogTitle={band.music_catalog_title}
              tracks={tracks}
            />
          </section>
        )}

        {/* Owner helper prompt if catalog empty or disabled */}
        {band.is_owner && tracks.length === 0 && (
          <div className="mb-8 p-4 rounded-2xl border border-dashed border-[#20efe0]/30 bg-[#0c0c3f]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-[#20efe0]/10 border border-[#20efe0]/30 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-[#20efe0]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#f5f7ff]">Enable Free Music Streaming Catalog</p>
                <p className="text-xs text-[#9a9fc4]">Upload MP3s, WAVs, or paste Google Drive stream links so fans can listen for free on your page.</p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white hover:opacity-90 shrink-0 font-medium"
            >
              <Link href="/portal">
                Open Music Studio
              </Link>
            </Button>
          </div>
        )}

        {/* Live Event Ticketing Section */}
        {events && events.length > 0 && (
          <section className="mb-10">
            <BandTicketsWidget events={events} bandName={band.name} bandId={band.id} />
          </section>
        )}

        {/* Open Discussion Board */}
        <section className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#ea6f2a]" />
            <h2 className="text-lg sm:text-xl font-black text-[#f5f7ff] tracking-tight">
              Soundstage Discussion &amp; Fan Wall
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-mono text-[#20efe0] font-semibold">
            {posts.length} {posts.length === 1 ? "thread" : "threads"}
          </span>
        </section>

        {/* Composer for signed-in users */}
        {band.is_authenticated && (
          <section className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/60 p-6 sm:p-7 mb-8 shadow-xl">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                band.is_owner
                  ? `Broadcast an official announcement to your ${followerCount} followers...`
                  : `Start a conversation or shout out ${band.name}...`
              }
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 min-h-[110px] resize-none rounded-2xl text-base p-4"
            />

            {draftImages.length > 0 && (
              <div className="flex gap-2.5 flex-wrap mt-3.5">
                {draftImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <Image
                      src={img.preview || "/placeholder.svg"}
                      alt="Attachment preview"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover border border-[#20205a]"
                    />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(img.preview)
                        setDraftImages((prev) => prev.filter((_, i) => i !== idx))
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#bc3f00] text-white flex items-center justify-center shadow-md"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#20205a]/50">
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
                className="text-[#dbe0fb] hover:text-[#20efe0] hover:bg-transparent text-xs sm:text-sm font-medium"
              >
                <ImageIcon className="w-4 h-4 mr-1.5 text-[#20efe0]" /> Attach Photos
              </Button>

              <Button
                onClick={handlePost}
                disabled={posting || (!draft.trim() && draftImages.length === 0)}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl px-6 h-11 sm:h-12 shadow-md shadow-[#ea6f2a]/20 text-xs sm:text-sm"
              >
                <Send className="w-4 h-4 mr-2" /> {posting ? "Posting..." : "Publish Post"}
              </Button>
            </div>
          </section>
        )}

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-8 sm:p-14 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#ea6f2a]" />
            <p className="text-base sm:text-lg font-bold text-[#f5f7ff]">There are no discussions for now</p>
            <p className="text-sm sm:text-base text-[#dbe0fb] mt-2 max-w-md mx-auto leading-relaxed">
              {band.is_authenticated ? "Be the first to share an update, announce a gig, or spark a conversation above!" : "Sign in to join the conversation and support the band."}
            </p>
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
          <div className="mt-8 p-6 sm:p-8 rounded-3xl border border-[#20205a]/60 bg-[#0c0c3f]/40 text-center">
            <p className="text-sm sm:text-base text-[#dbe0fb]">
              Want to join the conversation?{" "}
              <Link href="/login" className="text-[#ea6f2a] hover:text-[#ffd166] hover:underline font-bold ml-1">
                Sign in to your StarCast account
              </Link>
            </p>
          </div>
        )}
      </main>

      <Footer />

      {/* QR Code Modal */}
      <BandQrModal
        isOpen={qrModalOpen}
        onOpenChange={setQrModalOpen}
        band={{
          name: band.name,
          slug: band.slug,
          logo_url: band.logo_url,
          genre: band.genre,
          type: band.type,
        }}
      />
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
    <article className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/70 to-[#070725]/80 p-6 sm:p-7 shadow-xl hover:border-[#ea6f2a]/40 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar name={post.author_name} src={post.author_avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-base sm:text-lg text-[#f5f7ff] leading-tight flex items-center gap-2 flex-wrap">
                {post.author_name}
                {post.author_is_owner && (
                  <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 text-[10px] px-2 py-0.5 uppercase font-mono font-bold">
                    {band.type === "artist" ? "Artist" : "Band"}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-[#20efe0] font-mono mt-1">{timeAgo(post.created_at)}</p>
            </div>
            {post.can_delete && (
              <button
                onClick={() => onDeletePost(post.id)}
                className="text-[#9a9fc4] hover:text-red-400 p-1.5 rounded-lg hover:bg-[#20205a]/40 transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {post.content && (
            <p className="text-[#f5f7ff] mt-3.5 whitespace-pre-wrap leading-relaxed text-pretty text-base sm:text-lg">
              {post.content}
            </p>
          )}

          {post.images.length > 0 && (
            <div className={`grid gap-2.5 mt-4 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {post.images.map((src, idx) => (
                <img
                  key={idx}
                  src={src || "/placeholder.svg"}
                  alt={`Post attachment ${idx + 1}`}
                  className="w-full rounded-2xl object-cover border border-[#20205a] max-h-96 shadow-md"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6 pl-4 border-l-2 border-[#20205a]/60 space-y-3.5">
        {post.comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 group">
            <Avatar name={c.author_name} src={c.author_avatar} />
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl bg-[#05052d]/95 border border-[#20205a]/60 px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-[#f5f7ff]">{c.author_name}</p>
                  {c.can_delete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-[#9a9fc4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#dbe0fb] mt-1.5 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
              <p className="text-[11px] text-[#20efe0]/90 font-mono mt-1 ml-1">{timeAgo(c.created_at)}</p>
            </div>
          </div>
        ))}

        {band.is_authenticated ? (
          <div className="flex items-center gap-2 pt-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  handleComment()
                }
              }}
              placeholder="Write a reply..."
              className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 min-h-[44px] max-h-24 resize-none py-2.5 px-3.5 text-xs sm:text-sm rounded-xl"
              rows={1}
            />
            <Button
              onClick={handleComment}
              disabled={submitting || !comment.trim()}
              size="icon"
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white shrink-0 rounded-xl h-11 w-11 shadow-md shadow-[#ea6f2a]/20"
              aria-label="Send reply"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
