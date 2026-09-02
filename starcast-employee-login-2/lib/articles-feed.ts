import { db } from "@/lib/db"
import { articles, profiles } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

/**
 * Public query for feeds (sitemap, RSS): approved articles with author names.
 * Plain server module (not a server action) so it can run in cached/ISR
 * contexts without touching request headers.
 */
export async function getApprovedArticlesForFeed(limit = 50) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
      slug: articles.slug,
      images: articles.images,
      createdAt: articles.createdAt,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .where(eq(articles.approved, true))
    .orderBy(desc(articles.createdAt))
    .limit(limit)
}
