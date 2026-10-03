"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useGlobalAudio } from "./global-audio-context"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Disc3,
  Music,
  Sliders,
  Radio,
} from "lucide-react"

function formatTime(secs: number) {
  if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export function BottomAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLooping,
    isShuffled,
    queue,
    isVisible,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
    playNext,
    playPrevious,
    closePlayer,
    setIsVisible,
  } = useGlobalAudio()

  const [isMinimized, setIsMinimized] = useState(false)

  if (!currentTrack || !isVisible) {
    return null
  }

  const effectiveDuration = duration || currentTrack.durationSeconds || 0
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0
  const artwork = currentTrack.coverArtUrl || currentTrack.bandLogo || "/images/spacemanlogo.png"

  return (
    <aside
      aria-label="Audio Player"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isMinimized ? "translate-y-[calc(100%-28px)]" : "translate-y-0"
      }`}
    >
      {/* ── Top neon accent & progress line ── */}
      <div className="relative w-full h-1 bg-[#151545] cursor-pointer group" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const ratio = Math.max(0, Math.min(1, clickX / rect.width))
        seek(ratio * effectiveDuration)
      }}>
        <div
          className="h-full bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] transition-all relative"
          style={{ width: `${progressPercent}%` }}
        >
          <span className="absolute right-0 -top-1 w-3 h-3 rounded-full bg-[#20efe0] shadow-[0_0_8px_#20efe0] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── Minimized expand pill (when collapsed) ── */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute -top-7 right-6 px-3 py-1 rounded-t-xl bg-[#080829] border-t border-x border-[#20205a] text-xs font-mono text-[#20efe0] flex items-center gap-1.5 shadow-xl hover:text-white"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span className="truncate max-w-[150px]">{currentTrack.title}</span>
        </button>
      )}

      {/* ── Main Player Bar ── */}
      <div className="bg-[#070724]/95 backdrop-blur-2xl border-t border-[#20205a]/80 shadow-[0_-10px_35px_rgba(0,0,0,0.7)] px-3 sm:px-6 py-2.5 sm:py-3 text-[#f5f7ff]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. Track Artwork & Info (Left) */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-1/4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#05051f] border border-[#20205a] shrink-0 shadow-lg group">
              <img
                src={artwork}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? "scale-105" : ""
                }`}
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {currentTrack.slug ? (
                  <Link
                    href={`/music/${currentTrack.slug}`}
                    className="font-bold text-xs sm:text-sm text-[#f5f7ff] hover:text-[#20efe0] transition-colors truncate block"
                    title={currentTrack.title}
                  >
                    {currentTrack.title}
                  </Link>
                ) : (
                  <span className="font-bold text-xs sm:text-sm text-[#f5f7ff] truncate block" title={currentTrack.title}>
                    {currentTrack.title}
                  </span>
                )}
                {isPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20efe0] animate-ping shrink-0" />
                )}
              </div>

              <div className="text-[11px] text-[#ffd166] truncate mt-0.5 flex items-center gap-1">
                {currentTrack.bandSlug ? (
                  <Link href={`/bands/${currentTrack.bandSlug}`} className="hover:underline truncate font-medium">
                    {currentTrack.artistName || currentTrack.bandName || "StarCast Artist"}
                  </Link>
                ) : (
                  <span className="truncate font-medium">{currentTrack.artistName || currentTrack.bandName || "StarCast Artist"}</span>
                )}
                {currentTrack.producer && (
                  <span className="hidden md:inline text-[10px] text-[#7f84ad] shrink-0">
                    · Prod. {currentTrack.producer}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Central Playback Controls & Scrubber (Center) */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-xl space-y-1">
            {/* Buttons Row */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg text-xs transition-colors hidden sm:block ${
                  isShuffled ? "text-[#20efe0] bg-[#20efe0]/15" : "text-[#7f84ad] hover:text-[#f5f7ff]"
                }`}
                title={isShuffled ? "Shuffle On" : "Shuffle Off"}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={playPrevious}
                className="p-1.5 text-[#cbd0f2] hover:text-[#ea6f2a] active:scale-95 transition-transform"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] text-white flex items-center justify-center shadow-lg shadow-[#ea6f2a]/30 active:scale-95 hover:opacity-95 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                className="p-1.5 text-[#cbd0f2] hover:text-[#ea6f2a] active:scale-95 transition-transform"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={toggleLoop}
                className={`p-1.5 rounded-lg text-xs transition-colors hidden sm:block ${
                  isLooping ? "text-[#20efe0] bg-[#20efe0]/15" : "text-[#7f84ad] hover:text-[#f5f7ff]"
                }`}
                title={isLooping ? "Repeat On" : "Repeat Off"}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time & Timeline Seeker */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono text-[#7f84ad]">
              <span className="w-8 text-right shrink-0">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1 sm:h-1.5 rounded-lg bg-[#20205a] accent-[#20efe0] cursor-pointer appearance-none outline-none"
                style={{
                  background: `linear-gradient(to right, #20efe0 ${progressPercent}%, #20205a ${progressPercent}%)`,
                }}
              />
              <span className="w-8 shrink-0">{formatTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* 3. Extra Actions & Volume (Right) */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 sm:flex-initial sm:w-1/4">
            {/* Dedicated Song Page Link */}
            {currentTrack.slug && (
              <Link
                href={`/music/${currentTrack.slug}`}
                className="hidden lg:flex items-center gap-1 text-[11px] text-[#20efe0] hover:underline font-semibold"
                title="View Song Page"
              >
                <span>Song Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            {/* Free MP3 Download */}
            {currentTrack.allowDownload && (
              <a
                href={currentTrack.audioUrl}
                download={`${currentTrack.title}.mp3`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#7f84ad] hover:text-emerald-400 transition-colors hidden md:block"
                title="Download MP3"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            {/* Volume Slider */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-[#7f84ad] hover:text-[#f5f7ff] transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 lg:w-20 h-1.5 rounded-lg bg-[#20205a] accent-[#ea6f2a] cursor-pointer appearance-none outline-none"
              />
            </div>

            {/* Minimize button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-[#7f84ad] hover:text-[#f5f7ff] transition-colors rounded-lg hover:bg-[#20205a]/40"
              title="Minimize player"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={closePlayer}
              className="p-1.5 text-[#7f84ad] hover:text-red-400 transition-colors rounded-lg hover:bg-[#20205a]/40"
              title="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </aside>
  )
}
