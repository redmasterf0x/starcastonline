"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, savedArticles, articles } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Ensure a profiles row exists for the signed-in user.
 * Called right after sign-up (and safe to call any time).
 */
export async function ensureProfile(firstName: string, lastName: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(profiles).values({
      userId: session.user.id,
      email: session.user.email,
      firstName,
      lastName,
    })
  }
}

/** Get the signed-in user's profile. */
export async function getMyProfile() {
  const userId = await getUserId()
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)
  return rows[0] ?? null
}

/** Update the signed-in user's editable profile fields. */
export async function updateMyProfile(fields: {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  profilePic?: string
}) {
  const userId = await getUserId()
  await db
    .update(profiles)
    .set({
      ...(fields.firstName !== undefined && { firstName: fields.firstName }),
      ...(fields.lastName !== undefined && { lastName: fields.lastName }),
      ...(fields.phone !== undefined && { phone: fields.phone }),
      ...(fields.bio !== undefined && { bio: fields.bio }),
      ...(fields.location !== undefined && { location: fields.location }),
      ...(fields.website !== undefined && { website: fields.website }),
      ...(fields.profilePic !== undefined && { profilePic: fields.profilePic }),
    })
    .where(eq(profiles.userId, userId))
}

/** Get the signed-in user's saved articles with title/slug. */
export async function getMySavedArticles() {
  const userId = await getUserId()
  const rows = await db
    .select({
      id: savedArticles.id,
      articleId: savedArticles.articleId,
      createdAt: savedArticles.createdAt,
      title: articles.title,
      slug: articles.slug,
    })
    .from(savedArticles)
    .innerJoin(articles, eq(savedArticles.articleId, articles.id))
    .where(eq(savedArticles.userId, userId))
    .orderBy(desc(savedArticles.createdAt))
  return rows
}

/** Remove one of the signed-in user's saved articles. */
export async function removeSavedArticle(savedId: string) {
  const userId = await getUserId()
  await db
    .delete(savedArticles)
    .where(and(eq(savedArticles.id, savedId), eq(savedArticles.userId, userId)))
}
