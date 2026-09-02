import { MetadataRoute } from "next"
import { getApprovedArticlesForFeed } from "@/lib/articles-feed"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.starcast.online"

  // Fetch approved articles for sitemap
  let articleUrls: MetadataRoute.Sitemap = []
  try {
    const rows = await getApprovedArticlesForFeed(500)
    articleUrls = rows
      .filter((article) => article.slug)
      .map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: new Date(article.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    // Database unavailable — serve static routes only
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shows`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/information`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shows/theobservationdeck`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shows/star-talk`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...articleUrls,
  ]
}
