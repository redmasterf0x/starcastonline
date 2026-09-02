"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, profiles, articleLikes, savedArticles } from "@/lib/db/schema"
import { and, desc, eq, count } from "drizzle-orm"
import { headers } from "next/headers"
import { assertSocialAllowed } from "@/lib/permissions"

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

async function requireUserId() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}

/** Viewer context for the articles pages: profile id + role flags (null if signed out). */
export async function getViewerContext() {
  const user = await getSessionUser()
  if (!user) return null
  const rows = await db
    .select({
      profileId: profiles.id,
      isEmployee: profiles.isEmployee,
      isAdmin: profiles.isAdmin,
      canWriteArticles: profiles.canWriteArticles,
      canManageCalendar: profiles.canManageCalendar,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)
  const p = rows[0]
  if (!p) return null
  // Admins implicitly have every granular permission.
  return {
    ...p,
    canWriteArticles: p.isAdmin || p.canWriteArticles,
    canManageCalendar: p.isAdmin || p.canManageCalendar,
  }
}

/** List approved articles (or the viewer's own articles) with author names. */
export async function listArticles(opts?: { mineOnly?: boolean }) {
  const viewer = opts?.mineOnly ? await getViewerContext() : null

  const base = db
    .select({
      id: articles.id,
      authorId: articles.authorId,
      slug: articles.slug,
      title: articles.title,
      subtitle: articles.subtitle,
      excerpt: articles.excerpt,
      externalLink: articles.externalLink,
      tags: articles.tags,
      featured: articles.featured,
      images: articles.images,
      approved: articles.approved,
      createdAt: articles.createdAt,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorIsEmployee: profiles.isEmployee,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))

  const rows =
    opts?.mineOnly && viewer
      ? await base.where(eq(articles.authorId, viewer.profileId)).orderBy(desc(articles.createdAt)).limit(50)
      : await base.where(eq(articles.approved, true)).orderBy(desc(articles.createdAt)).limit(50)

  return rows
}

/** Create a new (unapproved) article for the signed-in user. */
export async function createArticle(input: {
  title: string
  subtitle?: string | null
  excerpt?: string | null
  externalLink?: string | null
  tags?: string[]
  content: string
  images?: { url: string; credit: string }[]
}) {
  const userId = await requireUserId()
  const profileRows = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      isAdmin: profiles.isAdmin,
      canWriteArticles: profiles.canWriteArticles,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
  const profile = profileRows[0]
  if (!profile) throw new Error("Profile not found")
  // Only staff who have been granted the article-writing permission (or admins)
  // may create articles.
  if (!profile.isAdmin && !profile.canWriteArticles) throw new Error("Forbidden")

  const authorName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
  const slug = `${authorName}-${input.title.trim()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  await db.insert(articles).values({
    userId,
    authorId: profile.id,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    excerpt: input.excerpt?.trim() || null,
    externalLink: input.externalLink?.trim() || null,
    tags: input.tags ?? [],
    content: input.content.trim(),
    images: input.images ?? [],
    slug,
    approved: false,
  })
}

/** Fetch a single article by slug, with author info. */
export async function getArticleBySlug(slug: string) {
  const rows = await db
    .select({
      id: articles.id,
      authorId: articles.authorId,
      userId: articles.userId,
      title: articles.title,
      subtitle: articles.subtitle,
      excerpt: articles.excerpt,
      externalLink: articles.externalLink,
      tags: articles.tags,
      featured: articles.featured,
      images: articles.images,
      content: articles.content,
      approved: articles.approved,
      createdAt: articles.createdAt,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorProfilePic: profiles.profilePic,
      authorBio: profiles.bio,
      authorIsEmployee: profiles.isEmployee,
      authorUserId: profiles.userId,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .where(eq(articles.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

/** Like state + count for an article for the current viewer. */
export async function getArticleLikeState(articleId: string) {
  const user = await getSessionUser()
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(articleLikes)
    .where(eq(articleLikes.articleId, articleId))

  let liked = false
  let saved = false
  if (user) {
    const likedRows = await db
      .select({ id: articleLikes.id })
      .from(articleLikes)
      .where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, user.id)))
      .limit(1)
    liked = likedRows.length > 0
    const savedRows = await db
      .select({ id: savedArticles.id })
      .from(savedArticles)
      .where(and(eq(savedArticles.articleId, articleId), eq(savedArticles.userId, user.id)))
      .limit(1)
    saved = savedRows.length > 0
  }
  return { total, liked, saved }
}

/** Toggle like on an article. Returns the new state. */
export async function toggleArticleLike(articleId: string) {
  const userId = await requireUserId()
  await assertSocialAllowed(userId)
  const existing = await db
    .select({ id: articleLikes.id })
    .from(articleLikes)
    .where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(articleLikes).where(eq(articleLikes.id, existing[0].id))
    return { liked: false }
  }
  await db.insert(articleLikes).values({ articleId, userId })
  return { liked: true }
}

async function canManageArticle(articleId: string, userId: string) {
  const rows = await db
    .select({ articleUserId: articles.userId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (rows.length === 0) return false
  if (rows[0].articleUserId === userId) return true
  const profileRows = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
  return profileRows[0]?.isAdmin === true
}

/** Update an article's title/content (author or admin only). */
export async function updateArticle(articleId: string, input: { title: string; content: string }) {
  const userId = await requireUserId()
  if (!(await canManageArticle(articleId, userId))) throw new Error("Forbidden")
  await db
    .update(articles)
    .set({ title: input.title, content: input.content })
    .where(eq(articles.id, articleId))
}

/** Delete an article (author or admin only). */
export async function deleteArticle(articleId: string) {
  const userId = await requireUserId()
  if (!(await canManageArticle(articleId, userId))) throw new Error("Forbidden")
  await db.delete(articleLikes).where(eq(articleLikes.articleId, articleId))
  await db.delete(savedArticles).where(eq(savedArticles.articleId, articleId))
  await db.delete(articles).where(eq(articles.id, articleId))
}

/** Toggle save on an article. Returns the new state. */
export async function toggleArticleSave(articleId: string) {
  const userId = await requireUserId()
  const existing = await db
    .select({ id: savedArticles.id })
    .from(savedArticles)
    .where(and(eq(savedArticles.articleId, articleId), eq(savedArticles.userId, userId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(savedArticles).where(eq(savedArticles.id, existing[0].id))
    return { saved: false }
  }
  await db.insert(savedArticles).values({ articleId, userId })
  return { saved: true }
}
