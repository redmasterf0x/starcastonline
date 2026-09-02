import { NextResponse } from "next/server"
import { getApprovedArticlesForFeed } from "@/lib/articles-feed"

export async function GET() {
  let articles: Awaited<ReturnType<typeof getApprovedArticlesForFeed>> = []
  try {
    articles = await getApprovedArticlesForFeed(50)
  } catch {
    // Database unavailable — serve empty feed
  }

  const baseUrl = "https://www.starcast.online"
  const items = articles.map((article) => {
    const author =
      `${article.authorFirstName || ""} ${article.authorLastName || ""}`.trim() || "Starcast Media"
    const description = (article.content ?? "").substring(0, 300).replace(/[<>&'"]/g, (c: string) => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c] ?? c)) + "..."
    const images = article.images as { url: string }[] | null
    const imageUrl = images?.[0]?.url?.startsWith("data:") ? null : images?.[0]?.url
    const articleUrl = `${baseUrl}/articles/${article.slug}`
    const pubDate = new Date(article.createdAt).toUTCString()

    return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <description><![CDATA[${description}]]></description>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ""}
      <media:content url="${imageUrl ?? `${baseUrl}/images/spacemanlogo.png`}" medium="image" />
    </item>`
  }).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
>
  <channel>
    <title>The Observation Deck - Starcast Media</title>
    <link>${baseUrl}/shows</link>
    <atom:link href="${baseUrl}/shows.xml" rel="self" type="application/rss+xml" />
    <description>A laid-back talk show hosted by Dirty Dave, sitting down with the creators, artists, and personalities who make Topeka interesting.</description>
    <language>en-us</language>
    <copyright>Starcast Media</copyright>
    <managingEditor>starcastlivemedia@gmail.com (Starcast Media)</managingEditor>
    <webMaster>starcastlivemedia@gmail.com (Starcast Media)</webMaster>
    <itunes:owner>
      <itunes:name>Starcast Media</itunes:name>
      <itunes:email>starcastlivemedia@gmail.com</itunes:email>
    </itunes:owner>
    <image>
      <url>${baseUrl}/images/spacemanlogo.png</url>
      <title>The Observation Deck - Starcast Media</title>
      <link>${baseUrl}/shows</link>
    </image>
    <itunes:author>Starcast Media</itunes:author>
    <itunes:summary>A laid-back talk show hosted by Dirty Dave, sitting down with the creators, artists, and personalities who make Topeka interesting.</itunes:summary>
    <itunes:image href="${baseUrl}/images/spacemanlogo.png" />
    <itunes:category text="Society &amp; Culture" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
