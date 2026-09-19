"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  type BandTrackItem,
  type TrackCommentItem,
  incrementTrackPlay,
  addTrackComment,
  deleteTrackComment,
} from "@/app/actions/band-tracks"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Share2,
  Check,
  Disc3,
  Music,
  Headphones,
  Sliders,
  Users,
  Sparkles,
  Radio,
  FileText,
  MessageCircle,
  Send,
  Trash2,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

interface SongPlayerViewProps {
  track: BandTrackItem
  relatedTracks: BandTrackItem[]
  initialComments: TrackCommentItem[]
  currentUser?: { id: string; name?: string; image?: string } | null
}

function formatDuration(secs: number) {
  if (!secs || isNaN(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

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

export function SongPlayerView({ track, relatedTracks, initialComments, currentUser }: SongPlayerViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(track.durationSeconds || 0)
  const [volume, setVolume] = useState(0.9)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [playCount, setPlayCount] = useState(track.playCount || 0)
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false)
  const [copied, setCopied] = useState(false)

  // Comments state
  const [comments, setComments] = useState<TrackCommentItem[]>(initialComments)
  const [commentDraft, setCommentDraft] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        if (!hasLoggedPlay) {
          setHasLoggedPlay(true)
          setPlayCount((prev) => prev + 1)
          incrementTrackPlay(track.id)
        }
      }).catch((err) => {
        console.error("Audio playback error:", err)
      })
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
    if (!duration && audioRef.current.duration) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value)
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  const handleEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://starcast.online/music/${track.slug || track.id}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const handleSocialShare = (platform: "twitter" | "facebook") => {
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.href : `https://starcast.online/music/${track.slug || track.id}`)
    const text = encodeURIComponent(`Listen to "${track.title}" by ${track.artistName || track.bandName} on StarCast Online! 🎶`)

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank")
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
    }
  }

  const handleDownload = () => {
    if (!track.audioUrl) return
    const a = document.createElement("a")
    a.href = track.audioUrl
    a.download = `${track.title || "StarCast_Track"}.mp3`
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentDraft.trim()) return

    setSubmittingComment(true)
    setCommentError("")
    try {
      const res = await addTrackComment(track.id, commentDraft)
      if (res.success && res.comment) {
        setComments((prev) => [res.comment!, ...prev])
        setCommentDraft("")
      } else {
        setCommentError(res.error || "Failed to post comment.")
      }
    } catch (err: any) {
      setCommentError(err?.message || "Failed to post comment.")
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    try {
      const res = await deleteTrackComment(commentId)
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch {
      // Ignore
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const artwork = track.coverArtUrl || track.bandLogo || "/placeholder.svg"

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/music" />

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={track.audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/40 -ml-2 text-xs font-semibold"
          >
            <Link href="/music">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Music Hub
            </Link>
          </Button>

          {track.bandSlug && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#20efe0]/40 text-[#20efe0] hover:bg-[#20efe0]/15 text-xs font-semibold"
            >
              <Link href={`/bands/${track.bandSlug}`}>
                <Radio className="w-3.5 h-3.5 mr-1.5" /> Visit Band Soundstage
              </Link>
            </Button>
          )}
        </div>

        {/* ── HERO CUSTOM MP3 PLAYER & VINYL SHOWCASE ── */}
        <div className="relative rounded-3xl overflow-hidden border border-[#20205a]/80 bg-gradient-to-br from-[#0c0c3f] via-[#080829] to-[#121248] p-6 sm:p-10 shadow-2xl">
          {/* Cosmic Glow Background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Interactive Spinning Vinyl & Artwork */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                {/* Vinyl Record Slide-out when playing */}
                <div
                  className={`absolute top-0 right-0 w-52 h-52 sm:w-72 sm:h-72 rounded-full bg-[#050510] border-4 border-[#121226] shadow-2xl flex items-center justify-center transition-transform duration-700 pointer-events-none ${
                    isPlaying ? "translate-x-12 sm:translate-x-20 rotate-180" : "translate-x-0"
                  }`}
                >
                  {/* Vinyl Grooves */}
                  <div className="w-44 h-44 sm:w-60 sm:h-60 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-white/5 flex items-center justify-center">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#ea6f2a] to-[#20efe0] p-1 shadow-inner">
                        <div className="w-full h-full rounded-full bg-[#050510] flex items-center justify-center text-[10px] font-mono font-bold text-[#ffd166]">
                          STARCAST
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Album Artwork Sleeve */}
                <div className="relative z-10 w-56 h-56 sm:w-76 sm:h-76 md:w-80 md:h-80 rounded-2xl overflow-hidden bg-[#05052d] border-2 border-[#20205a] shadow-[0_0_35px_rgba(0,0,0,0.8)] group-hover:border-[#20efe0]/60 transition-colors">
                  <img
                    src={artwork}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Play overlay button on image */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ea6f2a]/90 hover:bg-[#ea6f2a] text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 group-hover:scale-105"
                    aria-label={isPlaying ? "Pause track" : "Play track"}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                  </button>

                  {/* Floating Live Beacon */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#05051f]/80 backdrop-blur-md border border-[#20efe0]/40 text-[10px] font-mono text-[#20efe0] flex items-center gap-1.5">
                    <Radio className={`w-3 h-3 ${isPlaying ? "text-emerald-400 animate-pulse" : "text-[#7f84ad]"}`} />
                    <span>{isPlaying ? "NOW PLAYING" : "STARCAST AUDIO"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Track Information & Audio Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badges & Category */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 font-mono text-xs uppercase px-2.5 py-0.5">
                  {track.albumName || "Single Release"}
                </Badge>
                {track.genre && (
                  <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 font-mono text-xs">
                    {track.genre}
                  </Badge>
                )}
                {track.releaseYear && (
                  <span className="text-xs font-mono text-[#9a9fc4] bg-[#05052d] px-2.5 py-0.5 rounded-full border border-[#20205a]">
                    {track.releaseYear}
                  </span>
                )}
              </div>

              {/* Title & Artist */}
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight leading-tight">
                  {track.title}
                </h1>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-[#ffd166] flex items-center gap-2">
                    {track.bandSlug ? (
                      <Link href={`/bands/${track.bandSlug}`} className="hover:underline flex items-center gap-2">
                        {track.artistName || track.bandName}
                        <ExternalLink className="w-4 h-4 opacity-70" />
                      </Link>
                    ) : (
                      <span>{track.artistName || track.bandName || "StarCast Artist"}</span>
                    )}
                  </span>
                  {track.featuredArtists && (
                    <span className="text-sm text-[#9a9fc4] italic">
                      ({track.featuredArtists})
                    </span>
                  )}
                </div>
              </div>

              {/* Producer & Audio Credits */}
              {track.producer && (
                <div className="p-3.5 rounded-2xl bg-[#05052d]/80 border border-[#20205a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ffd166]/15 border border-[#ffd166]/30 flex items-center justify-center text-[#ffd166] shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#9a9fc4] uppercase tracking-wider font-semibold">Production &amp; Engineering</div>
                    <div className="text-sm font-semibold text-[#f5f7ff]">{track.producer}</div>
                  </div>
                </div>
              )}

              {/* ── AUDIO CONTROLS & TIMELINE ── */}
              <div className="p-5 rounded-2xl bg-[#05052d]/90 border border-[#20205a] space-y-4 shadow-xl">
                {/* Scrubbing Bar */}
                <div className="space-y-1.5">
                  <div className="relative group/bar flex items-center">
                    <input
                      ref={progressBarRef}
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 rounded-lg bg-[#20205a] accent-[#20efe0] cursor-pointer appearance-none outline-none group-hover/bar:h-2.5 transition-all"
                      style={{
                        background: `linear-gradient(to right, #20efe0 ${progressPercent}%, #20205a ${progressPercent}%)`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-mono text-[#9a9fc4]">
                    <span>{formatDuration(currentTime)}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[#20efe0]">
                        <Headphones className="w-3.5 h-3.5" /> {playCount} streams
                      </span>
                      <span>/</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Buttons & Volume Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white flex items-center justify-center shadow-lg shadow-[#ea6f2a]/30 hover:opacity-90 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={() => setIsLooping(!isLooping)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isLooping
                          ? "bg-[#20efe0]/20 border-[#20efe0] text-[#20efe0]"
                          : "bg-[#0c0c3f] border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff]"
                      }`}
                      title={isLooping ? "Loop On" : "Loop Off"}
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2.5 w-full sm:w-44">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-[#9a9fc4] hover:text-[#f5f7ff]"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value))
                        setIsMuted(false)
                      }}
                      className="w-full h-1.5 rounded-lg bg-[#20205a] accent-[#ea6f2a] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action Ribbon: Download & Share */}
              <div className="flex items-center gap-3 flex-wrap">
                {track.allowDownload && (
                  <Button
                    onClick={handleDownload}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-11 px-5 shadow-lg shadow-emerald-950/50"
                  >
                    <Download className="w-4 h-4 mr-2" /> Free MP3 Download
                  </Button>
                )}

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-[#20205a] bg-[#0c0c3f]/80 text-[#f5f7ff] hover:bg-[#20205a]/50 rounded-xl h-11 px-4 text-xs font-semibold"
                >
                  {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {copied ? "Link Copied!" : "Copy Share Link"}
                </Button>

                <Button
                  onClick={() => handleSocialShare("twitter")}
                  variant="outline"
                  className="border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:text-white hover:bg-[#20205a]/50 rounded-xl h-11 px-3 text-xs"
                  title="Share on X / Twitter"
                >
                  Share to X
                </Button>
                <Button
                  onClick={() => handleSocialShare("facebook")}
                  variant="outline"
                  className="border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:text-white hover:bg-[#20205a]/50 rounded-xl h-11 px-3 text-xs"
                  title="Share on Facebook"
                >
                  Facebook
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── LYRICS & LINER NOTES SECTION ── */}
        {(track.lyrics || track.description) && (
          <section className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/60 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#20efe0]" />
              <h2 className="text-xl font-bold text-[#f5f7ff]">Lyrics &amp; Liner Notes</h2>
            </div>
            <div className="p-5 rounded-2xl bg-[#05052d]/90 border border-[#20205a]/60 text-sm sm:text-base text-[#dbe0fb] whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto">
              {track.lyrics || track.description}
            </div>
          </section>
        )}

        {/* ── FAN DISCUSSION & COMMENTS BOARD ── */}
        <section className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/60 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#ea6f2a]" />
              <h2 className="text-xl font-bold text-[#f5f7ff]">Song Discussion &amp; Fan Reactions</h2>
            </div>
            <span className="text-xs font-mono text-[#20efe0] font-semibold">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>

          {/* Comment Composer */}
          <form onSubmit={handlePostComment} className="space-y-3">
            <Textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder={
                currentUser
                  ? "Leave your thoughts, favorite line, or praise for the artist and producer..."
                  : "Sign in to leave a comment on this track..."
              }
              rows={3}
              disabled={!currentUser || submittingComment}
              className="border-[#20205a] bg-[#05052d] text-[#f5f7ff] placeholder:text-[#7f84ad] text-sm resize-none rounded-2xl"
            />

            {commentError && (
              <p className="text-xs text-red-400">{commentError}</p>
            )}

            <div className="flex justify-between items-center">
              {!currentUser && (
                <p className="text-xs text-[#9a9fc4]">
                  <Link href="/login" className="text-[#ea6f2a] underline font-semibold">
                    Sign in with Google
                  </Link>{" "}
                  to join the conversation.
                </p>
              )}
              <Button
                type="submit"
                disabled={!currentUser || !commentDraft.trim() || submittingComment}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl ml-auto text-xs h-10 px-5"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Post Comment
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-xs sm:text-sm text-[#9a9fc4]">
                Be the first fan to leave a comment on this song!
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center font-bold text-xs text-[#ea6f2a] shrink-0">
                        {c.authorName ? c.authorName.charAt(0).toUpperCase() : "★"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#f5f7ff]">{c.authorName}</span>
                        <span className="text-[10px] text-[#7f84ad] ml-2 font-mono">{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>

                    {currentUser && currentUser.id === c.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(c.id)}
                        className="h-7 w-7 p-0 text-[#7f84ad] hover:text-red-400"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[#dbe0fb] leading-relaxed pl-10">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── MORE TRACKS FROM THIS ACT ── */}
        {relatedTracks.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-[#20efe0]" />
                More from {track.artistName || track.bandName}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTracks.map((rt) => (
                <Link
                  key={rt.id}
                  href={`/music/${rt.slug || rt.id}`}
                  className="p-4 rounded-2xl border border-[#20205a] bg-[#0c0c3f]/70 hover:border-[#20efe0]/50 transition-all flex items-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#05052d] border border-[#20205a] overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={rt.coverArtUrl || rt.bandLogo || "/placeholder.svg"}
                      alt={rt.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#f5f7ff] truncate group-hover:text-[#20efe0] transition-colors">
                      {rt.title}
                    </h3>
                    <p className="text-xs text-[#9a9fc4] truncate">
                      {rt.artistName || rt.bandName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#7f84ad] mt-1">
                      <span>{formatDuration(rt.durationSeconds)}</span>
                      <span>·</span>
                      <span className="text-[#20efe0] flex items-center gap-0.5">
                        <Headphones className="w-3 h-3" /> {rt.playCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
