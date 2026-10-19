import React from "react"
import Link from "next/link"
import { Play, Music, ExternalLink, Disc3, Radio } from "lucide-react"

interface SocialContentProps {
  text: string
  className?: string
  enableEmbeds?: boolean
}

interface EmbedItem {
  type: "youtube" | "spotify" | "soundcloud" | "starcast_music"
  id?: string
  subType?: string
  url?: string
}

export function SocialContent({ text, className = "", enableEmbeds = true }: SocialContentProps) {
  if (!text) return null

  // Collect media embeds (limit max 2 per post)
  const embeds: EmbedItem[] = []
  const seenUrls = new Set<string>()

  // Combined token regex: URLs or @mentions
  const tokenRegex = /(https?:\/\/[^\s<]+|\/music\/[a-zA-Z0-9_-]+|@([a-zA-Z0-9_-]{2,30}))/g

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchStart = match.index
    const matchEnd = tokenRegex.lastIndex
    const token = match[0]

    // Preceding text
    if (matchStart > lastIndex) {
      parts.push(text.substring(lastIndex, matchStart))
    }

    if (token.startsWith("@")) {
      const username = token.slice(1)
      parts.push(
        <Link
          key={`mention-${matchStart}-${username}`}
          href={`/u/${username}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center text-[#20efe0] hover:text-[#72fff6] font-semibold bg-[#20efe0]/10 hover:bg-[#20efe0]/20 px-1.5 py-0.5 rounded-md border border-[#20efe0]/30 transition-all text-inherit mx-0.5"
        >
          @{username}
        </Link>
      )
    } else {
      // It's a URL or internal /music/ path
      const url = token.replace(/[.,;!?)]+$/, "") // strip trailing punctuation
      let isMedia = false

      if (enableEmbeds && embeds.length < 2 && !seenUrls.has(url)) {
        // YouTube check
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        if (ytMatch) {
          isMedia = true
          seenUrls.add(url)
          embeds.push({ type: "youtube", id: ytMatch[1] })
        }

        // Spotify check
        const spMatch = url.match(/open\.spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/)
        if (!isMedia && spMatch) {
          isMedia = true
          seenUrls.add(url)
          embeds.push({ type: "spotify", subType: spMatch[1], id: spMatch[2] })
        }

        // SoundCloud check
        if (!isMedia && url.includes("soundcloud.com/") && !url.endsWith("soundcloud.com/")) {
          isMedia = true
          seenUrls.add(url)
          embeds.push({ type: "soundcloud", url })
        }

        // StarCast soundstage check
        const scMatch = url.match(/(?:starcast\.online)?\/music\/([a-zA-Z0-9_-]+)/)
        if (!isMedia && scMatch) {
          isMedia = true
          seenUrls.add(url)
          embeds.push({ type: "starcast_music", id: scMatch[1] })
        }
      }

      const isExternal = url.startsWith("http")
      parts.push(
        isExternal ? (
          <a
            key={`link-${matchStart}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#20efe0] hover:text-[#72fff6] underline underline-offset-2 break-all transition-colors inline-flex items-baseline gap-1"
          >
            <span>{url.length > 45 ? url.substring(0, 42) + "..." : url}</span>
            <ExternalLink className="w-3 h-3 inline self-center opacity-70" />
          </a>
        ) : (
          <Link
            key={`local-${matchStart}`}
            href={url}
            onClick={(e) => e.stopPropagation()}
            className="text-[#20efe0] hover:text-[#72fff6] underline underline-offset-2 font-medium transition-colors"
          >
            {url}
          </Link>
        )
      )
    }

    lastIndex = matchEnd
  }

  // Trailing text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return (
    <div className="space-y-3">
      <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
        {parts}
      </div>

      {embeds.length > 0 && (
        <div className="space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
          {embeds.map((embed, idx) => {
            if (embed.type === "youtube" && embed.id) {
              return (
                <div
                  key={`yt-${embed.id}-${idx}`}
                  className="rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-xl relative aspect-video w-full max-w-2xl"
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${embed.id}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )
            }

            if (embed.type === "spotify" && embed.id && embed.subType) {
              const height = embed.subType === "track" ? 152 : 352
              return (
                <div
                  key={`sp-${embed.id}-${idx}`}
                  className="rounded-xl overflow-hidden border border-emerald-500/20 bg-black/60 shadow-xl max-w-2xl"
                >
                  <iframe
                    src={`https://open.spotify.com/embed/${embed.subType}/${embed.id}?utm_source=generator&theme=0`}
                    width="100%"
                    height={height}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                  />
                </div>
              )
            }

            if (embed.type === "soundcloud" && embed.url) {
              return (
                <div
                  key={`sc-${idx}`}
                  className="rounded-xl overflow-hidden border border-orange-500/20 bg-black/60 shadow-xl max-w-2xl"
                >
                  <iframe
                    width="100%"
                    height="166"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                      embed.url
                    )}&color=%2320efe0&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                    className="rounded-xl"
                  />
                </div>
              )
            }

            if (embed.type === "starcast_music" && embed.id) {
              return (
                <div
                  key={`scm-${embed.id}-${idx}`}
                  className="rounded-xl border border-[#20efe0]/30 bg-gradient-to-r from-[#0c0c3f] via-[#05052d] to-[#0c0c3f] p-4 shadow-xl max-w-xl group hover:border-[#20efe0]/60 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ea6f2a] to-[#20efe0] p-0.5 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <div className="w-full h-full bg-[#05052d] rounded-[7px] flex items-center justify-center">
                          <Disc3 className="w-6 h-6 text-[#20efe0] animate-spin-slow" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/40">
                            Soundstage Track
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-base truncate capitalize mt-0.5">
                          {embed.id.replace(/-/g, " ")}
                        </h4>
                        <p className="text-xs text-white/60 flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-[#ea6f2a]" />
                          StarCast Music Catalog
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/music/${embed.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#ea6f2a] to-[#20efe0] text-[#05052d] font-bold text-xs hover:brightness-110 shadow-md shrink-0 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Track</span>
                    </Link>
                  </div>
                </div>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
