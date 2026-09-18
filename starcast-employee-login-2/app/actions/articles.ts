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
  // Admins and employees implicitly have permission to write/submit articles.
  return {
    ...p,
    canWriteArticles: p.isAdmin || p.isEmployee || p.canWriteArticles,
    canManageCalendar: p.isAdmin || p.canManageCalendar,
  }
}

/** List approved articles (or the viewer's own articles, or pending articles for admins) with author names. */
export async function listArticles(opts?: { mineOnly?: boolean; pendingOnly?: boolean }) {
  const viewer = await getViewerContext()

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
      thumbnailUrl: articles.thumbnailUrl,
      approved: articles.approved,
      approvedAt: articles.approvedAt,
      createdAt: articles.createdAt,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorIsEmployee: profiles.isEmployee,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))

  if (opts?.mineOnly && viewer) {
    return base.where(eq(articles.authorId, viewer.profileId)).orderBy(desc(articles.createdAt)).limit(50)
  }

  if (opts?.pendingOnly && viewer?.isAdmin) {
    return base.where(eq(articles.approved, false)).orderBy(desc(articles.createdAt)).limit(50)
  }

  return base.where(eq(articles.approved, true)).orderBy(desc(articles.createdAt)).limit(50)
}

/** Create a new article. If author is admin and publishImmediately is true, it is approved immediately. Otherwise, it is submitted for admin review. */
export async function createArticle(input: {
  title: string
  subtitle?: string | null
  excerpt?: string | null
  externalLink?: string | null
  tags?: string[]
  content: string
  images?: { url: string; credit: string }[]
  publishImmediately?: boolean
}) {
  const userId = await requireUserId()
  const profileRows = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      isAdmin: profiles.isAdmin,
      isEmployee: profiles.isEmployee,
      canWriteArticles: profiles.canWriteArticles,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
  const profile = profileRows[0]
  if (!profile) throw new Error("Profile not found")

  // Admins, employees/crew, or staff with canWriteArticles may create articles.
  if (!profile.isAdmin && !profile.isEmployee && !profile.canWriteArticles) {
    throw new Error("Forbidden: You do not have permission to write articles.")
  }

  const isApproved = Boolean(profile.isAdmin && input.publishImmediately)

  const authorName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "starcast"
  let baseSlug = `${authorName}-${input.title.trim()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (!baseSlug) baseSlug = `article-${Date.now()}`

  let slug = baseSlug
  let counter = 1
  while (true) {
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1)
    if (existing.length === 0) break
    counter++
    slug = `${baseSlug}-${counter}`
  }

  const thumbnailUrl = input.images?.[0]?.url || null

  const inserted = await db.insert(articles).values({
    userId,
    authorId: profile.id,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    excerpt: input.excerpt?.trim() || null,
    externalLink: input.externalLink?.trim() || null,
    tags: input.tags ?? [],
    content: input.content.trim(),
    images: input.images ?? [],
    thumbnailUrl,
    slug,
    approved: isApproved,
    approvedAt: isApproved ? new Date() : null,
  }).returning({
    id: articles.id,
    slug: articles.slug,
    approved: articles.approved,
  })

  return inserted[0]
}

/** Fetch a single article by slug, with author info. Also permits preview for authors and admins if unapproved. */
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
      thumbnailUrl: articles.thumbnailUrl,
      content: articles.content,
      approved: articles.approved,
      approvedAt: articles.approvedAt,
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

  const article = rows[0] ?? null
  if (!article) return null

  // If already approved, it's public for everyone
  if (article.approved) {
    return { ...article, isPendingPreview: false, isViewerAdmin: false }
  }

  // If not approved, only author or an admin may view/preview it
  const user = await getSessionUser()
  if (!user) return null

  const profileRows = await db
    .select({ id: profiles.id, isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)
  const viewerProfile = profileRows[0]
  const isAuthor = article.userId === user.id || (viewerProfile && article.authorId === viewerProfile.id)
  const isAdmin = viewerProfile?.isAdmin === true

  if (!isAuthor && !isAdmin) {
    return null
  }

  return { ...article, isPendingPreview: true, isViewerAdmin: isAdmin }
}

/** Quick approve action for an article (admin only). */
export async function approveArticle(articleId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  const profileRows = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)
  if (!profileRows[0]?.isAdmin) throw new Error("Forbidden: Admin access required")

  await db
    .update(articles)
    .set({ approved: true, approvedAt: new Date() })
    .where(eq(articles.id, articleId))
  return { success: true }
}

/** Unpublish an article back to draft/pending (admin only). */
export async function unpublishArticle(articleId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  const profileRows = await db
    .select({ isAdmin: profiles.isAdmin })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)
  if (!profileRows[0]?.isAdmin) throw new Error("Forbidden: Admin access required")

  await db
    .update(articles)
    .set({ approved: false, approvedAt: null })
    .where(eq(articles.id, articleId))
  return { success: true }
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
