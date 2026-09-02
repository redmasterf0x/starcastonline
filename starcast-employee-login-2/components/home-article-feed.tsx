import Link from "next/link"
import { Newspaper, ArrowRight } from "lucide-react"

type ArticleRow = {
  id: string
  slug: string | null
  title: string
  subtitle: string | null
  excerpt: string | null
  tags: unknown
  images: unknown
  createdAt: Date | string
  authorFirstName: string | null
  authorLastName: string | null
  authorIsEmployee: boolean | null
}

function articleImageSrc(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0] as any
  return typeof first === "string" ? first : first?.url ?? null
}

function relativeDate(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input)
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function HomeArticleFeed({ articles }: { articles: ArticleRow[] }) {
  return (
    <section className="relative w-full overflow-hidden border-b border-[#20205a]/60 bg-[#05052d]">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-[#ea6f2a] shadow-[0_0_14px_rgba(234,111,42,0.5)]" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ea6f2a] mb-1">
                <Newspaper className="h-3.5 w-3.5" />
                Latest from the press
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#f5f7ff] text-balance">Welcome back</h1>
            </div>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors"
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-[#20205a] bg-[#0c0c3f]/60 p-8 text-center">
            <p className="text-[#9a9fc4]">No articles have been published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => {
              const href = article.slug ? `/articles/${article.slug}` : "/articles"
              const authorName = [article.authorFirstName, article.authorLastName].filter(Boolean).join(" ")
              const imageSrc = articleImageSrc(article.images)
              const tags = Array.isArray(article.tags) ? (article.tags as string[]) : []

              return (
                <Link
                  key={article.id}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-xl border border-[#20205a] bg-[#0c0c3f]/70 transition-all hover:border-[#ea6f2a]/50 hover:bg-[#0c0c3f]"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[#20205a] via-[#12123f] to-[#05052d]">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc || "/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper className="h-8 w-8 text-[#3a3f7a]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-base font-bold text-[#f5f7ff] leading-snug text-pretty line-clamp-2">
                      {article.title}
                    </h2>
                    {(article.excerpt || article.subtitle) && (
                      <p className="text-sm text-[#9a9fc4] leading-relaxed line-clamp-2">
                        {article.excerpt || article.subtitle}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[#6b70a0]">
                      <span className="truncate">{authorName || "Starcast Staff"}</span>
                      <span>{relativeDate(article.createdAt)}</span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#20205a] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#9a9fc4]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
