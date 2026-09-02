import type { Metadata } from "next"
import { getArticleBySlug } from "@/app/actions/articles"
import ArticleContent from "./article-content"

type Props = {
  params: Promise<{ slug: string }>
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

  if (!article || !article.approved) {
    return {
      title: "Article | Starcast",
      description: "Read articles on Starcast",
    }
  }

  const authorName = `${article.authorFirstName || ""} ${article.authorLastName || ""}`.trim()
  const description = article.content?.substring(0, 160).replace(/\n/g, " ").trim() + "..." || "Read this article on Starcast"

  // Render a branded OG card (title, excerpt, author, and the article's
  // image when available) via a plain API route rather than the
  // opengraph-image.tsx file convention, which crashes on Next.js 16.2.0 +
  // Turbopack when the generator has async dependencies.
  const baseUrl = "https://www.starcast.online"
  const imageUrl = `${baseUrl}/api/og-card/${encodeURIComponent(slug)}`

  return {
    title: `${article.title} | Starcast`,
    description,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: `${baseUrl}/articles/${slug}`,
      authors: authorName ? [authorName] : undefined,
      siteName: "Starcast Media",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [imageUrl],
    },
  }
}

export default function ArticlePage() {
  return <ArticleContent />
}
