import { NextResponse } from "next/server"

const PLAYLIST_ID = "PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM"
const BASE_URL = "https://starcast.online"

export async function GET() {
  let items = ""

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const xml = await res.text()
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []
      items = entries.map((entry) => {
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "Untitled"
        const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ""
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? new Date().toISOString()
        const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.trim() ?? title
        const pubDate = new Date(published).toUTCString()
        const ytUrl = `https://www.youtube.com/watch?v=${videoId}`
        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${ytUrl}</link>
      <guid isPermaLink="true">${ytUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <enclosure url="${ytUrl}" type="video/mp4" length="0"/>
      <itunes:title><![CDATA[${title}]]></itunes:title>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:image href="${BASE_URL}/images/star-talk-cover.png"/>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`
      }).join("\n")
    }
  } catch (e) {
    console.error("[v0] Star Talk RSS fetch error:", e)
  }

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
>
  <channel>
    <title>Star Talk</title>
    <link>${BASE_URL}/shows/star-talk</link>
    <language>en-us</language>
    <description>Conversations, interviews, and discussions on topics that matter. Brought to you by Starcast Media.</description>
    <atom:link href="${BASE_URL}/api/rss/star-talk" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/images/star-talk-cover.png</url>
      <title>Star Talk</title>
      <link>${BASE_URL}/shows/star-talk</link>
    </image>
    <itunes:author>Starcast Media</itunes:author>
    <itunes:owner>
      <itunes:name>Starcast Media</itunes:name>
      <itunes:email>starcastlivemedia@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${BASE_URL}/images/star-talk-cover.png"/>
    <itunes:category text="Sports"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    ${items}
  </channel>
</rss>`

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
