import { MetadataRoute } from "next"
import { getApprovedArticlesForFeed } from "@/lib/articles-feed"
import { listPublicBands } from "@/app/actions/band-pages"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://starcast.online"

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
        priority: 0.75,
      }))
  } catch {
    // Database unavailable — serve static routes only
  }

  // Fetch public bands for sitemap
  let bandUrls: MetadataRoute.Sitemap = []
  try {
    const bands = await listPublicBands()
    bandUrls = bands
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${baseUrl}/bands/${b.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    // Fallback if band listing is unavailable
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/watch`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/shows`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shows/theobservationdeck`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shows/star-talk`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shows/psyco-g-spot`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shows/hollywood-after-babylon`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/music`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/bands`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sponsors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/information`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/merch`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...articleUrls,
    ...bandUrls,
  ]
}

