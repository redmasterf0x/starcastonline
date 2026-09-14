// Server-side helpers for pulling real video data straight from YouTube's
// public RSS feeds and live channel page (no API key required, no quota to run out of).

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
}

export interface WatchVideo {
  id: string
  title: string
  show: string
  duration: string
  views: string
  timeAgo: string
  thumbnail: string
  featured?: boolean
}

function parseFeed(xml: string): YouTubeVideo[] {
  const entries = xml.split("<entry>").slice(1)

  return entries
    .map((entry) => {
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]
      const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      const publishedAt = entry.match(/<published>(.*?)<\/published>/)?.[1]

      if (!videoId || !rawTitle || !publishedAt) return null

      const title = rawTitle
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")

      return {
        id: videoId,
        title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt,
      }
    })
    .filter((video): video is YouTubeVideo => video !== null)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * Fetches the videos in a public playlist, newest first, via YouTube's
 * public RSS feed. Cached for an hour.
 */
export async function getPlaylistVideos(playlistId: string): Promise<YouTubeVideo[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return parseFeed(await res.text())
  } catch {
    return []
  }
}

/**
 * Fetches the most recent uploads on a channel via YouTube's public RSS feed.
 */
export async function getChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return parseFeed(await res.text())
  } catch {
    return []
  }
}

function detectShowName(title: string): string {
  const lt = title.toLowerCase()
  if (lt.includes("observation deck")) return "The Observation Deck"
  if (lt.includes("psyco g spot") || lt.includes("psyco g")) return "The Psyco G Spot"
  if (lt.includes("star talk")) return "Star Talk"
  if (lt.includes("talkin' with 40") || lt.includes("talkin with 40")) return "Talkin' With 40"
  if (lt.includes("hollywood") || lt.includes("babylon")) return "Hollywood: After Babylon"
  if (lt.includes("performance") || lt.includes("live") || lt.includes("session") || lt.includes("kreepy") || lt.includes("tyler swain")) {
    return "Performances"
  }
  return "StarCast Original"
}

export const FALLBACK_WATCH_VIDEOS: WatchVideo[] = [
  {
    id: "5mqYVGrXzpE",
    title: "StarCast Media Presents: The Observation Deck | Ep. 24 — AK Sin",
    show: "The Observation Deck",
    duration: "13:29",
    views: "29 views",
    timeAgo: "4 days ago",
    thumbnail: "https://i.ytimg.com/vi/5mqYVGrXzpE/hqdefault.jpg",
    featured: true,
  },
  {
    id: "y1Gabn4VC5I",
    title: "StarCast Media Presents: The Observation Deck | Ep. 25 — Just JP",
    show: "The Observation Deck",
    duration: "45:10",
    views: "42 views",
    timeAgo: "1 week ago",
    thumbnail: "https://i.ytimg.com/vi/y1Gabn4VC5I/hqdefault.jpg",
  },
  {
    id: "Hefw7zEuzx8",
    title: "StarCast Presents: Talkin' With 40 — Episode 1: Chad Matlock",
    show: "Talkin' With 40",
    duration: "24:38",
    views: "19 views",
    timeAgo: "13 days ago",
    thumbnail: "https://i.ytimg.com/vi/Hefw7zEuzx8/hqdefault.jpg",
  },
  {
    id: "sO_YlIzsitg",
    title: "StarCast Media Presents: The Observation Deck | Ep. 23 — Logan & Prolific",
    show: "The Observation Deck",
    duration: "24:09",
    views: "55 views",
    timeAgo: "3 weeks ago",
    thumbnail: "https://i.ytimg.com/vi/sO_YlIzsitg/hqdefault.jpg",
  },
  {
    id: "bIxrvK9OgUU",
    title: "StarCast Media Presents: The Observation Deck | Ep. 22 — Silent Ave",
    show: "The Observation Deck",
    duration: "28:32",
    views: "58 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/bIxrvK9OgUU/hqdefault.jpg",
  },
  {
    id: "fsLOPC9XB6U",
    title: "StarCast Media Presents: The Observation Deck | Ep. 21 — Efrain & FrenzyFingerz",
    show: "The Observation Deck",
    duration: "42:15",
    views: "108 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/fsLOPC9XB6U/hqdefault.jpg",
  },
  {
    id: "JWqGvRc3bMg",
    title: "StarCast Media Presents: The Observation Deck | Ep. 20 — The Return of Colter Grant Robinson",
    show: "The Observation Deck",
    duration: "40:10",
    views: "306 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/JWqGvRc3bMg/hqdefault.jpg",
  },
  {
    id: "cHRhOFRG1JU",
    title: "StarCast Media Presents: The Observation Deck | Ep. 19 — Alexander Lancaster",
    show: "The Observation Deck",
    duration: "10:56",
    views: "184 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/cHRhOFRG1JU/hqdefault.jpg",
  },
  {
    id: "XwimBvPddPM",
    title: "StarCast Presents: The Psyco G Spot w/ Psyco G | Ep. 5 — Kevin G",
    show: "The Psyco G Spot",
    duration: "36:32",
    views: "118 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/XwimBvPddPM/hqdefault.jpg",
  },
  {
    id: "qA6wg-hlwDk",
    title: "StarCast Media Presents: The Observation Deck | Ep. 18 — Colter Grant Robinson",
    show: "The Observation Deck",
    duration: "44:34",
    views: "208 views",
    timeAgo: "1 month ago",
    thumbnail: "https://i.ytimg.com/vi/qA6wg-hlwDk/hqdefault.jpg",
  },
  {
    id: "zc6etQ-YGsw",
    title: "StarCast Media Presents: Kreepy Isotope — \"Kansas Boy\" | Live",
    show: "Performances",
    duration: "3:31",
    views: "128 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/zc6etQ-YGsw/hqdefault.jpg",
  },
  {
    id: "Os4vFwbyadA",
    title: "StarCast Media Presents: Tyler Swain — \"Drinkin' My Baby Goodbye\" Charlie Daniels Band Cover | Live",
    show: "Performances",
    duration: "2:22",
    views: "141 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/Os4vFwbyadA/hqdefault.jpg",
  },
  {
    id: "OvqY2odSOXU",
    title: "Hollywood After Babylon with Nic Nassuet | Episode 1: Mapping the Matrix",
    show: "Hollywood: After Babylon",
    duration: "1:31:28",
    views: "198 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/OvqY2odSOXU/hqdefault.jpg",
  },
  {
    id: "2drqAW6D6gw",
    title: "StarCast Media Presents: The Observation Deck | Ep. 17 — Tyler Swain",
    show: "The Observation Deck",
    duration: "44:03",
    views: "198 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/2drqAW6D6gw/hqdefault.jpg",
  },
  {
    id: "r19c5i8hN3w",
    title: "StarCast Presents: The Psyco G Spot w/ Psyco G | Ep. 4 — D-Rey The Giant",
    show: "The Psyco G Spot",
    duration: "44:37",
    views: "89 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/r19c5i8hN3w/hqdefault.jpg",
  },
  {
    id: "KxLwH3oFfoc",
    title: "StarCast Media Presents: The Observation Deck | Ep. 16 — Big C, Big Ant & King James (The Real 785)",
    show: "The Observation Deck",
    duration: "33:47",
    views: "128 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/KxLwH3oFfoc/hqdefault.jpg",
  },
  {
    id: "97gW-B7J8tM",
    title: "StarCast Media Presents: The Observation Deck | Ep. 15 — DJ SIKK",
    show: "The Observation Deck",
    duration: "30:46",
    views: "83 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/97gW-B7J8tM/hqdefault.jpg",
  },
  {
    id: "0W3QJ7LSm7Y",
    title: "StarCast Presents: The Psyco G Spot w/ Psyco G | Ep. 3 — Big Mike",
    show: "The Psyco G Spot",
    duration: "47:20",
    views: "122 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/0W3QJ7LSm7Y/hqdefault.jpg",
  },
  {
    id: "ARwtCX3qUes",
    title: "Star Talk with Joe & Ray | Pilot Episode — Welcome to StarCast",
    show: "Star Talk",
    duration: "48:15",
    views: "215 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/ARwtCX3qUes/hqdefault.jpg",
  },
  {
    id: "t8X5q7kLm9P",
    title: "StarCast Presents: The Psyco G Spot w/ Psyco G | Ep. 2 — Kansas Underground",
    show: "The Psyco G Spot",
    duration: "39:50",
    views: "95 views",
    timeAgo: "2 months ago",
    thumbnail: "https://i.ytimg.com/vi/t8X5q7kLm9P/hqdefault.jpg",
  },
  {
    id: "m4L8vW2kRtQ",
    title: "StarCast Presents: The Psyco G Spot w/ Psyco G | Ep. 1 — The Launch",
    show: "The Psyco G Spot",
    duration: "41:12",
    views: "154 views",
    timeAgo: "3 months ago",
    thumbnail: "https://i.ytimg.com/vi/m4L8vW2kRtQ/hqdefault.jpg",
  },
]

/**
 * Fetches all shows and videos from @starcastlivemedia with automatic
 * deduplication, live metadata parsing, and seamless fallback continuity.
 */
export async function getWatchVideos(): Promise<WatchVideo[]> {
  const allVideos = new Map<string, WatchVideo>()

  // 1. Try real-time scraping from the channel's public web endpoints
  const urls = [
    "https://www.youtube.com/@starcastlivemedia/videos",
    "https://www.youtube.com/@starcastlivemedia",
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 1800 }, // 30 min cache
      })
      if (!res.ok) continue
      const html = await res.text()
      const match =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/)
      if (!match) continue
      const data = JSON.parse(match[1])

      const findLockups = (obj: any) => {
        if (!obj || typeof obj !== "object") return
        if (obj.lockupViewModel) {
          const l = obj.lockupViewModel
          const videoId =
            l.contentId ||
            l.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId
          const title = l.metadata?.lockupMetadataViewModel?.title?.content
          if (videoId && title && !allVideos.has(videoId)) {
            let duration = ""
            const overlays = l.contentImage?.thumbnailViewModel?.overlays || []
            for (const o of overlays) {
              const text = o.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text
              if (text && /\d/.test(text)) {
                duration = text
                break
              }
            }

            let views = ""
            let timeAgo = ""
            const parts =
              l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]
                ?.metadataParts || []
            for (const p of parts) {
              const c = p.text?.content || ""
              if (c.toLowerCase().includes("view")) views = c
              else if (c.toLowerCase().includes("ago") || c.toLowerCase().includes("streamed")) timeAgo = c
            }

            allVideos.set(videoId, {
              id: videoId,
              title,
              show: detectShowName(title),
              duration,
              views,
              timeAgo,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            })
          }
        }
        for (const k in obj) findLockups(obj[k])
      }

      findLockups(data)
    } catch {
      // Continue to next or fallback
    }
  }

  // 2. Merge in fallback catalog for complete catalog depth & offline resilience
  for (const fb of FALLBACK_WATCH_VIDEOS) {
    if (!allVideos.has(fb.id)) {
      allVideos.set(fb.id, fb)
    } else {
      // If scraped video is missing duration or views, supplement from known fallback
      const existing = allVideos.get(fb.id)!
      if (!existing.duration && fb.duration) existing.duration = fb.duration
      if (!existing.views && fb.views) existing.views = fb.views
      if (!existing.timeAgo && fb.timeAgo) existing.timeAgo = fb.timeAgo
    }
  }

  const list = Array.from(allVideos.values())
  if (list.length > 0) {
    list[0].featured = true
  }

  return list
}
