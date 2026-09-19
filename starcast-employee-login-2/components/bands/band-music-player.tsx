"use client"

import { useState, useRef, useEffect } from "react"
import { type BandTrackItem, incrementTrackPlay } from "@/app/actions/band-tracks"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Download,
  FileText,
  Headphones,
  Music,
  Disc3,
  Sparkles,
  Radio,
  Clock,
} from "lucide-react"

interface BandMusicPlayerProps {
  bandName: string
  bandLogo?: string
  catalogTitle?: string | null
  tracks: BandTrackItem[]
}

export function BandMusicPlayer({
  bandName,
  bandLogo,
  catalogTitle,
  tracks,
}: BandMusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [activeLyricsTrack, setActiveLyricsTrack] = useState<BandTrackItem | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLInputElement | null>(null)

  const currentTrack = tracks[currentTrackIndex] || null

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Track change handler
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return
    audioRef.current.src = currentTrack.audioUrl
    setCurrentTime(0)
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false))
      incrementTrackPlay(currentTrack.id)
    }
  }, [currentTrackIndex])

  function handlePlayTrack(index: number) {
    if (index === currentTrackIndex) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
        if (currentTrack) incrementTrackPlay(currentTrack.id)
      }
    } else {
      setCurrentTrackIndex(index)
      setIsPlaying(true)
      if (tracks[index]) incrementTrackPlay(tracks[index].id)
    }
  }

  function handleNextTrack() {
    if (tracks.length === 0) return
    if (isShuffled) {
      const nextIndex = Math.floor(Math.random() * tracks.length)
      setCurrentTrackIndex(nextIndex)
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
    }
    setIsPlaying(true)
  }

  function handlePrevTrack() {
    if (tracks.length === 0) return
    if (currentTime > 3) {
      // If played more than 3 seconds, restart current track
      if (audioRef.current) audioRef.current.currentTime = 0
      setCurrentTime(0)
    } else {
      setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
      setIsPlaying(true)
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (audioRef.current.duration && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration)
      }
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const target = parseFloat(e.target.value)
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  function handleTrackEnded() {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else {
      handleNextTrack()
    }
  }

  function formatTime(secs: number) {
    if (!secs || isNaN(secs)) return "0:00"
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  if (!tracks || tracks.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleTrackEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center text-[#ea6f2a]">
            <Disc3 className={`w-5 h-5 ${isPlaying ? "animate-spin text-[#20efe0]" : ""}`} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#f5f7ff]">
              {catalogTitle || "Original Music & Tracks"}
            </h2>
            <p className="text-xs text-[#9a9fc4]">
              Official free streaming audio from <span className="text-[#f5f7ff] font-semibold">{bandName}</span>
            </p>
          </div>
        </div>

        <Badge className="bg-[#05052d] text-[#20efe0] border border-[#20efe0]/40 font-mono text-xs hidden sm:flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#38ef7d]" />
          <span>{tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}</span>
        </Badge>
      </div>

      {/* ── ACTIVE SHOWCASE PLAYER ── */}
      {currentTrack && (
        <div className="relative overflow-hidden rounded-3xl border border-[#20205a]/80 bg-gradient-to-br from-[#0c0c3f] via-[#080829] to-[#05051f] p-6 sm:p-8 shadow-2xl shadow-[#0c0c3f]/50">
          {/* Cosmic ambient lights */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Rotating Vinyl / Artwork Container */}
            <div className="relative shrink-0 group">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-[#05052d] border-2 border-[#20205a] shadow-2xl shadow-[#ea6f2a]/20">
                {currentTrack.coverArtUrl || bandLogo ? (
                  <img
                    src={currentTrack.coverArtUrl || bandLogo}
                    alt={currentTrack.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? "scale-105" : "scale-100"
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#ea6f2a]">
                    <Music className="w-12 h-12" />
                  </div>
                )}
                {/* Center subtle glow badge */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Glowing Pulse Ring when Playing */}
              {isPlaying && (
                <div className="absolute -inset-1 rounded-2xl border border-[#20efe0]/60 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Track Info & Scrubber */}
            <div className="flex-1 min-w-0 w-full space-y-4 text-center md:text-left">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1 flex-wrap">
                  <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 text-xs font-mono">
                    Now Streaming
                  </Badge>
                  {currentTrack.genre && (
                    <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] text-xs">
                      {currentTrack.genre}
                    </Badge>
                  )}
                  {currentTrack.releaseYear && (
                    <span className="text-xs text-[#7f84ad] font-mono">({currentTrack.releaseYear})</span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] tracking-tight truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-sm text-[#cbd0f2] mt-0.5">
                  {bandName} {currentTrack.albumName ? `• ${currentTrack.albumName}` : ""}
                </p>
              </div>

              {/* Scrubber Timeline */}
              <div className="space-y-1.5">
                <input
                  ref={progressBarRef}
                  type="range"
                  min="0"
                  max={duration || currentTrack.durationSeconds || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-[#20205a] rounded-lg appearance-none cursor-pointer accent-[#ea6f2a] hover:accent-[#20efe0] transition-colors"
                />
                <div className="flex items-center justify-between text-xs font-mono text-[#9a9fc4]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || currentTrack.durationSeconds)}</span>
                </div>
              </div>

              {/* Main Player Controls Bar */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                {/* Left Secondary Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={`p-2 rounded-lg text-xs transition-colors ${
                      isShuffled ? "text-[#20efe0] bg-[#20efe0]/15" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLooping(!isLooping)}
                    className={`p-2 rounded-lg text-xs transition-colors ${
                      isLooping ? "text-[#20efe0] bg-[#20efe0]/15" : "text-[#9a9fc4] hover:text-[#f5f7ff]"
                    }`}
                    title="Repeat track"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Playback Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevTrack}
                    className="p-2.5 rounded-full bg-[#05052d] border border-[#20205a] text-[#f5f7ff] hover:bg-[#ea6f2a] hover:border-[#ea6f2a] transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayTrack(currentTrackIndex)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#ea6f2a] text-white flex items-center justify-center shadow-lg shadow-[#ea6f2a]/30 active:scale-95 transition-transform"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextTrack}
                    className="p-2.5 rounded-full bg-[#05052d] border border-[#20205a] text-[#f5f7ff] hover:bg-[#ea6f2a] hover:border-[#ea6f2a] transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* Right Actions: Volume / Download / Lyrics */}
                <div className="flex items-center gap-2">
                  {/* Volume Toggle */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 text-[#9a9fc4] hover:text-[#f5f7ff]"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value))
                        setIsMuted(false)
                      }}
                      className="w-16 h-1.5 bg-[#20205a] rounded-lg appearance-none cursor-pointer accent-[#20efe0]"
                    />
                  </div>

                  {/* Lyrics / Notes */}
                  {currentTrack.lyrics && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveLyricsTrack(currentTrack)}
                      className="border-[#20205a] bg-[#05052d]/80 text-[#cbd0f2] hover:bg-[#20205a]/60 h-9 px-2.5 text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1 text-[#ffd166]" /> Liner Notes
                    </Button>
                  )}

                  {/* Download MP3 */}
                  {currentTrack.allowDownload && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-3 text-xs shadow-md"
                    >
                      <a href={currentTrack.audioUrl} download={`${bandName} - ${currentTrack.title}.mp3`}>
                        <Download className="w-3.5 h-3.5 mr-1" /> Free MP3
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRACKLIST TABLE ── */}
      <div className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/50 p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#20205a]/60 text-xs font-mono text-[#7f84ad]">
          <span>Track / Title</span>
          <span className="hidden sm:inline">Album / Release</span>
          <span>Plays &amp; Duration</span>
        </div>

        <div className="divide-y divide-[#20205a]/40 mt-1">
          {tracks.map((track, idx) => {
            const isThisActive = currentTrackIndex === idx
            const isThisPlaying = isThisActive && isPlaying

            return (
              <div
                key={track.id}
                className={`flex items-center justify-between py-3.5 px-3 rounded-xl transition-colors cursor-pointer group ${
                  isThisActive
                    ? "bg-[#121248]/90 text-[#f5f7ff]"
                    : "hover:bg-[#05052d]/80 text-[#cbd0f2]"
                }`}
                onClick={() => handlePlayTrack(idx)}
              >
                {/* Left info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                  <div className="w-7 text-center font-mono text-xs text-[#7f84ad] group-hover:hidden shrink-0">
                    {isThisPlaying ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#20efe0] inline-block animate-ping" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-[#ea6f2a] text-white hidden group-hover:flex items-center justify-center shrink-0 shadow-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayTrack(idx)
                    }}
                    aria-label={isThisPlaying ? "Pause" : "Play"}
                  >
                    {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                  </button>

                  <div className="min-w-0">
                    <p className={`font-bold text-sm sm:text-base truncate ${isThisActive ? "text-[#20efe0]" : "text-[#f5f7ff]"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-[#7f84ad] sm:hidden truncate">
                      {track.albumName || bandName}
                    </p>
                  </div>
                </div>

                {/* Center Album */}
                <div className="hidden sm:block text-xs text-[#9a9fc4] truncate flex-1 px-3">
                  {track.albumName || "Single Release"}
                </div>

                {/* Right stats & actions */}
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-[#9a9fc4]">
                  <span className="hidden sm:flex items-center gap-1 text-[#ffd166]">
                    <Headphones className="w-3 h-3" /> {track.playCount}
                  </span>
                  <span>{formatTime(track.durationSeconds)}</span>

                  {track.allowDownload && (
                    <a
                      href={track.audioUrl}
                      download={`${bandName} - ${track.title}.mp3`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-[#9a9fc4] hover:text-emerald-400 hover:bg-[#05052d]"
                      title="Download Free MP3"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── LINER NOTES / LYRICS MODAL ── */}
      <Dialog open={Boolean(activeLyricsTrack)} onOpenChange={(open) => !open && setActiveLyricsTrack(null)}>
        {activeLyricsTrack && (
          <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto border border-[#20205a] bg-[#0c0c3f]/98 text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#f5f7ff]">
                <FileText className="w-5 h-5 text-[#ffd166]" />
                {activeLyricsTrack.title} — Liner Notes
              </DialogTitle>
              <DialogDescription className="text-xs text-[#9a9fc4]">
                Written &amp; performed by {bandName}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 p-4 rounded-xl bg-[#05052d] border border-[#20205a] text-xs sm:text-sm text-[#cbd0f2] whitespace-pre-line leading-relaxed">
              {activeLyricsTrack.lyrics || activeLyricsTrack.description || "No liner notes provided for this track."}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
