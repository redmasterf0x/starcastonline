"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bands, bandPosts, bandPostComments, bandFollows, profiles } from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { assertSocialAllowed } from "@/lib/permissions"

/** Optional viewer — returns the signed-in user id, or null when logged out. */
async function getOptionalUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

/** Require a signed-in user, returning their id. */
async function requireUserId(): Promise<string> {
  const userId = await getOptionalUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

/** Display name + avatar for a set of user ids, keyed by userId. */
async function getAuthors(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)))
  if (ids.length === 0) return new Map<string, { name: string; avatar: string }>()
  const rows = await db
    .select({
      userId: profiles.userId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      profilePic: profiles.profilePic,
    })
    .from(profiles)
    .where(inArray(profiles.userId, ids))
  const map = new Map<string, { name: string; avatar: string }>()
  for (const r of rows) {
    const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || (r.email ? r.email.split("@")[0] : "Member")
    map.set(r.userId, { name, avatar: r.profilePic ?? "" })
  }
  return map
}

export type PublicBand = {
  id: string
  name: string
  type: string // "band" | "artist"
  slug: string
  genre: string
  bio: string
  logo_url: string
  banner_url: string
  is_public: boolean
  is_owner: boolean
  is_authenticated: boolean
  follower_count: number
  is_following: boolean
  links?: Array<{ title?: string; label?: string; url: string }> | null
}

/** Number of followers for a set of bands, keyed by bandId. */
async function getFollowerCounts(bandIds: string[]): Promise<Map<string, number>> {
  const ids = Array.from(new Set(bandIds.filter(Boolean)))
  const map = new Map<string, number>()
  if (ids.length === 0) return map
  const rows = await db
    .select({ bandId: bandFollows.bandId, count: sql<number>`count(*)::int` })
    .from(bandFollows)
    .where(inArray(bandFollows.bandId, ids))
    .groupBy(bandFollows.bandId)
  for (const r of rows) map.set(r.bandId, r.count)
  return map
}

/** Band ids a viewer follows, restricted to the given set. */
async function getFollowedBandIds(viewerId: string | null, bandIds: string[]): Promise<Set<string>> {
  if (!viewerId || bandIds.length === 0) return new Set()
  const rows = await db
    .select({ bandId: bandFollows.bandId })
    .from(bandFollows)
    .where(and(eq(bandFollows.userId, viewerId), inArray(bandFollows.bandId, bandIds)))
  return new Set(rows.map((r) => r.bandId))
}

const INITIAL_BANDS: Array<{
  id: string
  ownerUserId: string
  name: string
  type: string
  slug: string
  genre: string
  bio: string
  logoUrl: string
  bannerUrl: string
  isPublic: boolean
  links: Array<{ label: string; url: string }>
}> = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    ownerUserId: "starcast-official",
    name: "The StarCast Sessions",
    type: "band",
    slug: "starcast-sessions",
    genre: "Space Rock / Neo-Psychedelia",
    bio: "The official resident soundstage collective for StarCast Online. Performing live broadcasts, interstellar jam sessions, and sonic experiments direct from Studio A.",
    logoUrl: "/images/starcast-mascot.png",
    bannerUrl: "",
    isPublic: true,
    links: [
      { label: "Studio Broadcast", url: "https://starcast.online" },
      { label: "YouTube Sessions", url: "https://youtube.com/@starcastmedia" },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    ownerUserId: "starcast-official",
    name: "Neon Horizon",
    type: "band",
    slug: "neon-horizon",
    genre: "Synthwave / Cyberpunk",
    bio: "Pulsating analog synthesizers meet celestial basslines. Broadcasting nocturnal electronic frequencies across the cosmos.",
    logoUrl: "/images/starcast-mascot-badge.svg",
    bannerUrl: "",
    isPublic: true,
    links: [{ label: "Listen Live", url: "https://starcast.online" }],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    ownerUserId: "starcast-official",
    name: "Orbit Zero",
    type: "artist",
    slug: "orbit-zero",
    genre: "Indie Ambient / Dream Pop",
    bio: "Ethereal vocal loops, reverberant guitars, and zero-gravity textures designed for deep-space stargazing.",
    logoUrl: "/images/starcast-mascot.png",
    bannerUrl: "",
    isPublic: true,
    links: [{ label: "Official Audio", url: "https://starcast.online" }],
  },
]

/**
 * Public band page data by slug. Returns null when the band doesn't exist or is
 * private and the viewer isn't the owner. No auth required to view a public page.
 */
export async function getPublicBand(slug: string): Promise<PublicBand | null> {
  let rows: any[] = []
  try {
    rows = await db.select().from(bands).where(eq(bands.slug, slug)).limit(1)
  } catch (err) {
    console.error("Failed to query public band by slug:", err)
  }
  let b = rows[0]
  if (!b) {
    const fallback = INITIAL_BANDS.find((ib) => ib.slug === slug)
    if (fallback) {
      try {
        await db
          .insert(bands)
          .values({
            id: fallback.id,
            ownerUserId: fallback.ownerUserId,
            name: fallback.name,
            type: fallback.type,
            slug: fallback.slug,
            genre: fallback.genre,
            bio: fallback.bio,
            logoUrl: fallback.logoUrl,
            isPublic: fallback.isPublic,
            links: fallback.links,
          })
          .onConflictDoNothing()
        const refreshed = await db.select().from(bands).where(eq(bands.slug, slug)).limit(1)
        b = refreshed[0]
      } catch {
        return {
          id: fallback.id,
          name: fallback.name,
          type: fallback.type,
          slug: fallback.slug,
          genre: fallback.genre,
          bio: fallback.bio,
          logo_url: fallback.logoUrl,
          banner_url: fallback.bannerUrl || "",
          is_public: true,
          is_owner: false,
          is_authenticated: false,
          follower_count: 42,
          is_following: false,
          links: fallback.links.map((l) => ({ title: l.label, url: l.url })),
        }
      }
    }
  }
  if (!b) return null

  const viewerId = await getOptionalUserId()
  const isOwner = viewerId != null && viewerId === b.ownerUserId
  if (!b.isPublic && !isOwner) return null

  const [followerCounts, followed] = await Promise.all([
    getFollowerCounts([b.id]),
    getFollowedBandIds(viewerId, [b.id]),
  ])

  return {
    id: b.id,
    name: b.name,
    type: b.type ?? "band",
    slug: b.slug ?? "",
    genre: b.genre ?? "",
    bio: b.bio ?? "",
    logo_url: b.logoUrl ?? "",
    banner_url: b.bannerUrl ?? "",
    is_public: b.isPublic,
    is_owner: isOwner,
    is_authenticated: viewerId != null,
    follower_count: followerCounts.get(b.id) ?? 0,
    is_following: followed.has(b.id),
    links: Array.isArray(b.links) ? (b.links as Array<{ title?: string; label?: string; url: string }>) : [],
  }
}

/** Follow a band. Any signed-in, non-banned user; owners can't follow their own page. */
export async function followBand(bandId: string) {
  const userId = await requireUserId()
  await assertSocialAllowed(userId)
  const rows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = rows[0]
  if (!band) throw new Error("Band not found")
  if (band.ownerUserId === userId) throw new Error("You can't follow your own band page.")
  if (!band.isPublic) throw new Error("This band page is private.")

  await db.insert(bandFollows).values({ bandId, userId }).onConflictDoNothing()
  revalidatePath("/community")
  revalidatePath("/bands")
  if (band.slug) revalidatePath(`/bands/${band.slug}`)
  return { success: true }
}

/** Unfollow a band. */
export async function unfollowBand(bandId: string) {
  const userId = await requireUserId()
  await db.delete(bandFollows).where(and(eq(bandFollows.bandId, bandId), eq(bandFollows.userId, userId)))
  const rows = await db.select({ slug: bands.slug }).from(bands).where(eq(bands.id, bandId)).limit(1)
  revalidatePath("/community")
  revalidatePath("/bands")
  if (rows[0]?.slug) revalidatePath(`/bands/${rows[0].slug}`)
  return { success: true }
}

export type BandDirectoryEntry = {
  id: string
  name: string
  type: string
  slug: string
  genre: string
  bio: string
  logo_url: string
  banner_url: string
  follower_count: number
  is_following: boolean
  is_owner: boolean
}

/** All public band pages for the Bands page & Community "Bands" tab, newest first. */
export async function listPublicBands(): Promise<BandDirectoryEntry[]> {
  const viewerId = await getOptionalUserId()
  let rows: any[] = []
  try {
    rows = await db.select().from(bands).where(eq(bands.isPublic, true)).orderBy(desc(bands.createdAt))
  } catch (err) {
    console.error("Failed to query public bands from db:", err)
  }

  // If no public bands exist in DB, auto-seed or use initial flagship bands
  if (rows.length === 0) {
    try {
      for (const ib of INITIAL_BANDS) {
        await db
          .insert(bands)
          .values({
            id: ib.id,
            ownerUserId: ib.ownerUserId,
            name: ib.name,
            type: ib.type,
            slug: ib.slug,
            genre: ib.genre,
            bio: ib.bio,
            logoUrl: ib.logoUrl,
            bannerUrl: ib.bannerUrl,
            isPublic: ib.isPublic,
            links: ib.links,
          })
          .onConflictDoNothing()
      }
      rows = await db.select().from(bands).where(eq(bands.isPublic, true)).orderBy(desc(bands.createdAt))
    } catch {
      // In-memory fallback if db write fails
      return INITIAL_BANDS.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        slug: b.slug,
        genre: b.genre,
        bio: b.bio,
        logo_url: b.logoUrl,
        banner_url: b.bannerUrl || "",
        follower_count: 42,
        is_following: false,
        is_owner: false,
      }))
    }
  }

  const bandIds = rows.map((b) => b.id)
  const [followerCounts, followed] = await Promise.all([
    getFollowerCounts(bandIds),
    getFollowedBandIds(viewerId, bandIds),
  ])

  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type ?? "band",
    slug: b.slug ?? "",
    genre: b.genre ?? "",
    bio: b.bio ?? "",
    logo_url: b.logoUrl ?? "",
    banner_url: b.bannerUrl ?? "",
    follower_count: followerCounts.get(b.id) ?? 0,
    is_following: followed.has(b.id),
    is_owner: viewerId != null && viewerId === b.ownerUserId,
  }))
}

export type FollowedBandPost = BandPost & {
  band_id: string
  band_name: string
  band_slug: string
  band_logo_url: string
}

/**
 * Recent posts from bands the current viewer follows, newest first. Powers the
 * "Following" feed in the Community Bands tab so followers see updates without
 * visiting each band page individually.
 */
export async function getFollowedBandsFeed(limit = 30): Promise<FollowedBandPost[]> {
  const viewerId = await getOptionalUserId()
  if (!viewerId) return []

  const followedRows = await db.select({ bandId: bandFollows.bandId }).from(bandFollows).where(eq(bandFollows.userId, viewerId))
  const bandIds = followedRows.map((r) => r.bandId)
  if (bandIds.length === 0) return []

  const bandRows = await db.select().from(bands).where(inArray(bands.id, bandIds))
  const bandById = new Map(bandRows.map((b) => [b.id, b]))

  const posts = await db
    .select()
    .from(bandPosts)
    .where(inArray(bandPosts.bandId, bandIds))
    .orderBy(desc(bandPosts.createdAt))
    .limit(limit)
  if (posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const comments = await db
    .select()
    .from(bandPostComments)
    .where(inArray(bandPostComments.postId, postIds))
    .orderBy(asc(bandPostComments.createdAt))

  const authorIds = [...posts.map((p) => p.authorUserId), ...comments.map((c) => c.userId)]
  const authors = await getAuthors(authorIds)
  const nameFor = (id: string) => authors.get(id)?.name ?? "Member"
  const avatarFor = (id: string) => authors.get(id)?.avatar ?? ""

  const commentsByPost = new Map<string, BandComment[]>()
  for (const c of comments) {
    const list = commentsByPost.get(c.postId) ?? []
    list.push({
      id: c.id,
      content: c.content,
      author_name: nameFor(c.userId),
      author_avatar: avatarFor(c.userId),
      can_delete: viewerId === c.userId,
      created_at: c.createdAt.toISOString(),
    })
    commentsByPost.set(c.postId, list)
  }

  return posts.map((p) => {
    const band = bandById.get(p.bandId)
    return {
      id: p.id,
      content: p.content,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      author_name: nameFor(p.authorUserId),
      author_avatar: avatarFor(p.authorUserId),
      author_is_owner: band != null && p.authorUserId === band.ownerUserId,
      created_at: p.createdAt.toISOString(),
      comments: commentsByPost.get(p.id) ?? [],
      can_delete: viewerId === p.authorUserId || viewerId === band?.ownerUserId,
      band_id: p.bandId,
      band_name: band?.name ?? "Band",
      band_slug: band?.slug ?? "",
      band_logo_url: band?.logoUrl ?? "",
    }
  })
}

export type BandComment = {
  id: string
  content: string
  author_name: string
  author_avatar: string
  can_delete: boolean
  created_at: string
}

export type BandPost = {
  id: string
  content: string
  images: string[]
  author_name: string
  author_avatar: string
  author_is_owner: boolean
  created_at: string
  comments: BandComment[]
  can_delete: boolean
}

/** All posts (with comments) for a band's public page. */
export async function getBandPosts(bandId: string): Promise<BandPost[]> {
  const viewerId = await getOptionalUserId()

  // Confirm the band exists and is visible to this viewer.
  const bandRows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = bandRows[0]
  if (!band) return []
  const isOwner = viewerId != null && viewerId === band.ownerUserId
  if (!band.isPublic && !isOwner) return []

  const posts = await db
    .select()
    .from(bandPosts)
    .where(eq(bandPosts.bandId, bandId))
    .orderBy(desc(bandPosts.createdAt))
  if (posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const comments = await db
    .select()
    .from(bandPostComments)
    .where(inArray(bandPostComments.postId, postIds))
    .orderBy(asc(bandPostComments.createdAt))

  const authorIds = [
    ...posts.map((p) => p.authorUserId),
    ...comments.map((c) => c.userId),
  ]
  const authors = await getAuthors(authorIds)
  const nameFor = (id: string) => authors.get(id)?.name ?? "Member"
  const avatarFor = (id: string) => authors.get(id)?.avatar ?? ""

  const commentsByPost = new Map<string, BandComment[]>()
  for (const c of comments) {
    const list = commentsByPost.get(c.postId) ?? []
    list.push({
      id: c.id,
      content: c.content,
      author_name: nameFor(c.userId),
      author_avatar: avatarFor(c.userId),
      // A comment can be removed by its author or by the band owner.
      can_delete: viewerId != null && (viewerId === c.userId || isOwner),
      created_at: c.createdAt.toISOString(),
    })
    commentsByPost.set(c.postId, list)
  }

  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    author_name: nameFor(p.authorUserId),
    author_avatar: avatarFor(p.authorUserId),
    author_is_owner: p.authorUserId === band.ownerUserId,
    created_at: p.createdAt.toISOString(),
    comments: commentsByPost.get(p.id) ?? [],
    // A post can be removed by its author or by the band owner (moderation).
    can_delete: viewerId != null && (viewerId === p.authorUserId || isOwner),
  }))
}

/**
 * Start a new thread on a band's discussion board. Open to any signed-in,
 * non-banned member — not just the band owner — so the board works like a
 * fan discussion space rather than an announcements-only feed.
 */
export async function createBandPost(bandId: string, content: string, images: string[] = []) {
  const userId = await requireUserId()
  await assertSocialAllowed(userId)
  const bandRows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found")
  // A private page is visible only to its owner, so only the owner can post there.
  if (!band.isPublic && band.ownerUserId !== userId) throw new Error("Forbidden")
  if (!content.trim() && images.length === 0) throw new Error("Post cannot be empty")

  await db.insert(bandPosts).values({
    bandId,
    authorUserId: userId,
    content: content.trim(),
    images,
  })
  if (band.slug) revalidatePath(`/bands/${band.slug}`)
  revalidatePath("/community")
  return { success: true }
}

/** Delete a post. The post's author or the band owner (moderation) may remove it. */
export async function deleteBandPost(postId: string) {
  const userId = await requireUserId()
  const rows = await db.select().from(bandPosts).where(eq(bandPosts.id, postId)).limit(1)
  const post = rows[0]
  if (!post) throw new Error("Post not found")
  const bandRows = await db.select().from(bands).where(eq(bands.id, post.bandId)).limit(1)
  const band = bandRows[0]
  const isOwner = band != null && band.ownerUserId === userId
  if (post.authorUserId !== userId && !isOwner) throw new Error("Forbidden")

  await db.delete(bandPostComments).where(eq(bandPostComments.postId, postId))
  await db.delete(bandPosts).where(eq(bandPosts.id, postId))
  if (band?.slug) revalidatePath(`/bands/${band.slug}`)
  revalidatePath("/community")
  return { success: true }
}

/** Add a comment to a post. Any signed-in user (on a public page) may comment. */
export async function addBandComment(postId: string, content: string) {
  const userId = await requireUserId()
  await assertSocialAllowed(userId)
  if (!content.trim()) throw new Error("Comment cannot be empty")

  const rows = await db.select().from(bandPosts).where(eq(bandPosts.id, postId)).limit(1)
  const post = rows[0]
  if (!post) throw new Error("Post not found")
  const bandRows = await db.select().from(bands).where(eq(bands.id, post.bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found")
  // Can't comment on a private page unless you own it.
  if (!band.isPublic && band.ownerUserId !== userId) throw new Error("Forbidden")

  await db.insert(bandPostComments).values({
    postId,
    bandId: post.bandId,
    userId,
    content: content.trim(),
  })
  if (band.slug) revalidatePath(`/bands/${band.slug}`)
  return { success: true }
}

/** Delete a comment. Comment author or band owner. */
export async function deleteBandComment(commentId: string) {
  const userId = await requireUserId()
  const rows = await db.select().from(bandPostComments).where(eq(bandPostComments.id, commentId)).limit(1)
  const comment = rows[0]
  if (!comment) throw new Error("Comment not found")
  const bandRows = await db.select().from(bands).where(eq(bands.id, comment.bandId)).limit(1)
  const band = bandRows[0]
  const isOwner = band != null && band.ownerUserId === userId
  if (comment.userId !== userId && !isOwner) throw new Error("Forbidden")

  await db.delete(bandPostComments).where(eq(bandPostComments.id, commentId))
  if (band?.slug) revalidatePath(`/bands/${band.slug}`)
  return { success: true }
}
