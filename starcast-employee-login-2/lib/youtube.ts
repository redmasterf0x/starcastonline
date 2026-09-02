// Server-side helpers for pulling real video data straight from YouTube's
// public RSS feeds (no API key required, no quota to run out of) so the
// /shows page can browse actual thumbnails from the real @starcastlivemedia
// channel instead of embedding whole playlist iframes.

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
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
 * public RSS feed. Cached for an hour. Feed caps out at ~15 most recent
 * entries, which is exactly what a "browse this show" row needs.
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
 * Fetches the most recent uploads on a channel, newest first, via YouTube's
 * public RSS feed.
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
