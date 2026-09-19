"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Play, Pause, Download, Headphones, ExternalLink, Sliders, Music, Disc3, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BandPostAudioTrack } from "@/app/actions/band-pages"

interface PostAudioPlayerProps {
  tracks: BandPostAudioTrack[]
  postType?: string
  bandName?: string
  bandLogo?: string
}

function formatDuration(secs?: number) {
  if (!secs || isNaN(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export function PostAudioPlayer({ tracks, postType, bandName, bandLogo }: PostAudioPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentTrack = tracks[currentIdx] || tracks[0]

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.pause()
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [currentIdx])

  const togglePlay = (index?: number) => {
    if (index !== undefined && index !== currentIdx) {
      setCurrentIdx(index)
      setTimeout(() => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
      }, 50)
      return
    }

    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
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
    const val = Number(e.target.value)
    setCurrentTime(val)
    if (audioRef.current) audioRef.current.currentTime = val
  }

  const handleEnded = () => {
    if (currentIdx < tracks.length - 1) {
      setCurrentIdx((prev) => prev + 1)
      setTimeout(() => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
      }, 50)
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  if (!tracks || tracks.length === 0) return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const cover = currentTrack.cover_art_url || bandLogo || "/placeholder.svg"

  return (
    <div className="rounded-2xl border border-[#20205a]/80 bg-[#05052d]/90 p-4 sm:p-5 space-y-3 shadow-xl">
      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Track Player Header */}
      <div className="flex items-center gap-4">
        {/* Cover Art & Vinyl Glow */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#0c0c3f] border border-[#20205a] shrink-0 group">
          <img src={cover} alt={currentTrack.title} className="w-full h-full object-cover" />
          <button
            onClick={() => togglePlay()}
            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#ea6f2a] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105"
            aria-label="Play track"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Track Title, Artist & Producer */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base text-[#f5f7ff] truncate">{currentTrack.title}</span>
            {tracks.length > 1 && (
              <Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30 text-[10px] py-0 px-1.5">
                Track {currentIdx + 1} of {tracks.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#ffd166] font-semibold truncate">
            <span>{currentTrack.artist_name || bandName || "StarCast Artist"}</span>
          </div>

          {currentTrack.producer && (
            <div className="text-[11px] text-[#9a9fc4] flex items-center gap-1 truncate">
              <Sliders className="w-3 h-3 text-[#ffd166]" /> Prod. {currentTrack.producer}
            </div>
          )}
        </div>

        {/* Standalone Song Page Link */}
        {currentTrack.slug && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:flex border-[#20205a] text-[#20efe0] hover:bg-[#20efe0]/10 text-xs shrink-0"
          >
            <Link href={`/music/${currentTrack.slug}`}>
              Song Page <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {/* Scrubbing Bar & Timeline */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-lg bg-[#20205a] accent-[#20efe0] cursor-pointer"
          style={{
            background: `linear-gradient(to right, #20efe0 ${progressPercent}%, #20205a ${progressPercent}%)`,
          }}
        />
        <div className="flex justify-between text-[11px] font-mono text-[#9a9fc4]">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration || currentTrack.duration_seconds)}</span>
        </div>
      </div>

      {/* Multiple Tracks Playlist (if album / multi-song post) */}
      {tracks.length > 1 && (
        <div className="pt-2 border-t border-[#20205a]/50 space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {tracks.map((t, idx) => {
            const isThis = currentIdx === idx

            return (
              <button
                key={idx}
                type="button"
                onClick={() => togglePlay(idx)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                  isThis
                    ? "bg-[#121248] text-[#20efe0] border border-[#20efe0]/40 font-semibold"
                    : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#0c0c3f] hover:text-[#f5f7ff]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-mono text-[10px] opacity-60 w-4 text-left">{idx + 1}.</span>
                  <span className="truncate">{t.title}</span>
                  {t.producer && <span className="text-[10px] text-[#ffd166] opacity-75">· {t.producer}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span>{formatDuration(t.duration_seconds)}</span>
                  {isThis && isPlaying ? (
                    <Pause className="w-3 h-3 fill-current text-[#20efe0]" />
                  ) : (
                    <Play className="w-3 h-3 fill-current opacity-60" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        {currentTrack.allow_download !== false ? (
          <a
            href={currentTrack.audio_url}
            download={`${currentTrack.title}.mp3`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Download className="w-3 h-3" /> Free MP3 Download
          </a>
        ) : (
          <span />
        )}

        {currentTrack.slug && (
          <Link
            href={`/music/${currentTrack.slug}`}
            className="text-[#ea6f2a] hover:underline flex items-center gap-1 font-semibold text-[11px] sm:hidden"
          >
            View Full Song Page <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
