import type { Metadata } from "next"
import { getArticleBySlug } from "@/app/actions/articles"
import ArticleContent from "./article-content"

type Props = {
  params: Promise<{ slug: string }>
}

function cleanText(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, "") // strip markdown images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip markdown links
    .replace(/[#*`_~]/g, "") // strip markdown format symbols
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  let article: Awaited<ReturnType<typeof getArticleBySlug>> | null = null
  try {
    article = await getArticleBySlug(decodedSlug)
  } catch {
    article = null
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://starcast.online"
  const encodedSlug = encodeURIComponent(slug)
  const canonicalUrl = `${baseUrl}/articles/${encodedSlug}`

  if (!article) {
    return {
      title: { absolute: "Article Not Found | StarCast Media" },
      description: "Read the latest news and spotlight articles on StarCast Online.",
      alternates: { canonical: canonicalUrl },
    }
  }

  if (!article.approved) {
    return {
      title: { absolute: `[Preview] ${article.title} | StarCast Media` },
      description: "Previewing unapproved draft article.",
      robots: { index: false, follow: false },
      alternates: { canonical: canonicalUrl },
    }
  }

  const authorName = cleanText(`${article.authorFirstName || ""} ${article.authorLastName || ""}`) || "StarCast Media"
  const rawExcerpt = cleanText(article.excerpt || article.content)
  const description = rawExcerpt.length > 180 ? rawExcerpt.slice(0, 177) + "..." : rawExcerpt || "Read this article on StarCast Online"

  const dynamicOgUrl = `${baseUrl}/api/og-card/${encodedSlug}`

  const directImageUrl = article.thumbnailUrl
    ? (article.thumbnailUrl.startsWith("http") ? article.thumbnailUrl : `${baseUrl}${article.thumbnailUrl.startsWith("/") ? "" : "/"}${article.thumbnailUrl}`)
    : null

  const images = [
    {
      url: dynamicOgUrl,
      width: 1200,
      height: 630,
      alt: article.title,
      type: "image/png",
    },
    ...(directImageUrl
      ? [
          {
            url: directImageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ]
      : []),
  ]

  return {
    title: { absolute: `${article.title} | StarCast` },
    description,
    authors: authorName ? [{ name: authorName }] : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: canonicalUrl,
      publishedTime: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
      authors: authorName ? [authorName] : undefined,
      siteName: "StarCast Media",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [dynamicOgUrl],
    },
  }
}

export default function ArticlePage() {
  return <ArticleContent />
}
