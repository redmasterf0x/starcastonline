"use client"

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react"
import { incrementTrackPlay } from "@/app/actions/band-tracks"

export interface GlobalTrack {
  id: string
  title: string
  audioUrl: string
  artistName?: string | null
  bandName?: string | null
  bandLogo?: string | null
  coverArtUrl?: string | null
  slug?: string | null
  bandSlug?: string | null
  albumName?: string | null
  producer?: string | null
  durationSeconds?: number
  allowDownload?: boolean
  genre?: string | null
}

interface GlobalAudioContextType {
  currentTrack: GlobalTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLooping: boolean
  isShuffled: boolean
  queue: GlobalTrack[]
  queueIndex: number
  isVisible: boolean
  playTrack: (track: GlobalTrack, newQueue?: GlobalTrack[]) => void
  togglePlay: () => void
  pause: () => void
  resume: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleLoop: () => void
  toggleShuffle: () => void
  playNext: () => void
  playPrevious: () => void
  closePlayer: () => void
  setIsVisible: (visible: boolean) => void
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined)

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<GlobalTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.9)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [queue, setQueue] = useState<GlobalTrack[]>([])
  const [queueIndex, setQueueIndex] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loggedPlaysRef = useRef<Set<string>>(new Set())

  // Initialize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Sync MediaSession API for lockscreen & hardware keys
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !currentTrack) return

    const artworkUrl = currentTrack.coverArtUrl || currentTrack.bandLogo || "/images/spacemanlogo.png"

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName || currentTrack.bandName || "StarCast Media",
      album: currentTrack.albumName || "StarCast Soundstage",
      artwork: [
        { src: artworkUrl, sizes: "96x96", type: "image/png" },
        { src: artworkUrl, sizes: "128x128", type: "image/png" },
        { src: artworkUrl, sizes: "192x192", type: "image/png" },
        { src: artworkUrl, sizes: "512x512", type: "image/png" },
      ],
    })

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {})
    })
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause()
    })
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime
        setCurrentTime(details.seekTime)
      }
    })
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      playPrevious()
    })
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      playNext()
    })
  }, [currentTrack, queue, queueIndex])

  const playTrack = useCallback((track: GlobalTrack, newQueue?: GlobalTrack[]) => {
    setCurrentTrack(track)
    setIsVisible(true)

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue)
      const foundIdx = newQueue.findIndex((t) => t.id === track.id || t.audioUrl === track.audioUrl)
      setQueueIndex(foundIdx >= 0 ? foundIdx : 0)
    } else {
      setQueue([track])
      setQueueIndex(0)
    }

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl
      audioRef.current.currentTime = 0
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          if (track.id && !loggedPlaysRef.current.has(track.id)) {
            loggedPlaysRef.current.add(track.id)
            incrementTrackPlay(track.id).catch(() => {})
          }
        })
        .catch((err) => {
          console.warn("Audio play prevented or interrupted:", err)
        })
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          if (currentTrack.id && !loggedPlaysRef.current.has(currentTrack.id)) {
            loggedPlaysRef.current.add(currentTrack.id)
            incrementTrackPlay(currentTrack.id).catch(() => {})
          }
        })
        .catch(() => {})
    }
  }, [isPlaying, currentTrack])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [currentTrack])

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds
      setCurrentTime(seconds)
    }
  }, [])

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val))
    setVolumeState(clamped)
    if (isMuted && clamped > 0) {
      setIsMuted(false)
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev)
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev)
  }, [])

  const playNext = useCallback(() => {
    if (queue.length === 0) return

    let nextIndex = 0
    if (isShuffled && queue.length > 1) {
      let rand = Math.floor(Math.random() * queue.length)
      while (rand === queueIndex && queue.length > 1) {
        rand = Math.floor(Math.random() * queue.length)
      }
      nextIndex = rand
    } else {
      nextIndex = (queueIndex + 1) % queue.length
    }

    const nextTrack = queue[nextIndex]
    if (nextTrack) {
      setQueueIndex(nextIndex)
      setCurrentTrack(nextTrack)
      if (audioRef.current) {
        audioRef.current.src = nextTrack.audioUrl
        audioRef.current.currentTime = 0
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true)
            if (nextTrack.id && !loggedPlaysRef.current.has(nextTrack.id)) {
              loggedPlaysRef.current.add(nextTrack.id)
              incrementTrackPlay(nextTrack.id).catch(() => {})
            }
          })
          .catch(() => {})
      }
    }
  }, [queue, queueIndex, isShuffled])

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return

    // If played more than 3 seconds, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }

    const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1
    const prevTrack = queue[prevIndex]
    if (prevTrack) {
      setQueueIndex(prevIndex)
      setCurrentTrack(prevTrack)
      if (audioRef.current) {
        audioRef.current.src = prevTrack.audioUrl
        audioRef.current.currentTime = 0
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true)
            if (prevTrack.id && !loggedPlaysRef.current.has(prevTrack.id)) {
              loggedPlaysRef.current.add(prevTrack.id)
              incrementTrackPlay(prevTrack.id).catch(() => {})
            }
          })
          .catch(() => {})
      }
    }
  }, [queue, queueIndex])

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setIsVisible(false)
  }, [])

  // Audio element event listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else {
      if (queue.length > 1) {
        playNext()
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }
  }

  return (
    <GlobalAudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLooping,
        isShuffled,
        queue,
        queueIndex,
        isVisible,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        toggleShuffle,
        playNext,
        playPrevious,
        closePlayer,
        setIsVisible,
      }}
    >
      {/* 
        Single Global Audio Element — Lives in the root layout so playback never stops 
        when the user navigates between pages!
      */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      {children}
    </GlobalAudioContext.Provider>
  )
}

export function useGlobalAudio() {
  const context = useContext(GlobalAudioContext)
  if (!context) {
    throw new Error("useGlobalAudio must be used within a GlobalAudioProvider")
  }
  return context
}
