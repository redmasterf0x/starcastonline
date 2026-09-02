import { NextResponse } from "next/server"
import { getApprovedArticlesForFeed } from "@/lib/articles-feed"

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  let articles: Awaited<ReturnType<typeof getApprovedArticlesForFeed>> = []
  try {
    articles = await getApprovedArticlesForFeed(50)
  } catch {
    // Database unavailable — serve empty feed
  }

  const baseUrl = "https://www.starcast.online"
  const now = new Date().toUTCString()

  const items = articles
    .map((article) => {
      const author =
        `${article.authorFirstName || ""} ${article.authorLastName || ""}`.trim() || "Starcast Media"
      const url = `${baseUrl}/articles/${article.slug || ""}`
      const description = article.content
        ?.replace(/<[^>]*>/g, "")
        .substring(0, 300)
        .trim() + "..."
      const pubDate = new Date(article.createdAt).toUTCString()
      const images = article.images as { url: string }[] | null
      const imageUrl = images?.[0]?.url

      // Only include enclosure if it's a real https URL (not base64)
      const enclosure =
        imageUrl && imageUrl.startsWith("http")
          ? `<enclosure url="${imageUrl}" type="image/jpeg" />`
          : imageUrl
          ? `<enclosure url="${baseUrl}/api/og-image/${encodeURIComponent(article.slug || "")}" type="image/jpeg" />`
          : ""

      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${description}]]></description>
      <author>${author}</author>
      <pubDate>${pubDate}</pubDate>
      ${enclosure}
    </item>`
    })
    .join("")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Starcast Media</title>
    <link>${baseUrl}</link>
    <description>Topeka's premier media production and advertising company. Articles, sports coverage, and more.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/images/spacemanlogo.png</url>
      <title>Starcast Media</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
