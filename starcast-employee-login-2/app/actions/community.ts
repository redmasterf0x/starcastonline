"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  profiles,
  communityCategories,
  communityPosts,
  postStars,
  postComments,
  commentStars,
  friendships,
  messages,
  notifications,
  bands,
  bandTicketOrders,
  communityPollVotes,
} from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, or, count, gte, ne, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { SOCIAL_BAN_MESSAGE } from "@/lib/permissions"
import { createNotification } from "@/app/actions/notifications"

// Reserved category slug for the shared DECK wall.
const DECK_SLUG = "the-deck"

// All ids exposed to the client are profile ids (profiles.id), matching the
// legacy Supabase shape where community rows referenced users.id.

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

async function getViewerProfile() {
  const user = await getSessionUser()
  if (!user) return null
  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  return rows[0] ?? null
}

/**
 * Returns the viewer's profile, throwing if signed out or socially banned.
 *
 * Every action that touches another member (posting, commenting, starring,
 * friend requests, DMs) goes through here so a banned member is blocked
 * server-side even if the UI is bypassed. Admins are exempt.
 */
async function requireSocialViewer() {
  const viewer = await getViewerProfile()
  if (!viewer) throw new Error("Unauthorized")
  const isAdmin = viewer.isAdmin || viewer.role === "admin"
  if (!isAdmin && viewer.socialBanned) throw new Error(SOCIAL_BAN_MESSAGE)
  return viewer
}

/**
 * Lightweight social standing lookup for client UI.
 *
 * Lets pages disable/annotate social controls instead of letting a banned
 * member submit and hit a server error with no explanation.
 */
export async function getMySocialStatus(): Promise<{ socialBanned: boolean; reason: string | null }> {
  const viewer = await getViewerProfile()
  if (!viewer) return { socialBanned: false, reason: null }
  const isAdmin = viewer.isAdmin || viewer.role === "admin"
  return {
    socialBanned: !isAdmin && viewer.socialBanned,
    reason: viewer.socialBanReason ?? null,
  }
}

function profileToMember(p: typeof profiles.$inferSelect) {
  return {
    id: p.id,
    user_id: p.userId,
    first_name: p.firstName,
    last_name: p.lastName,
    bio: p.bio ?? "",
    profile_pic: p.profilePic ?? "",
    location: p.location ?? "",
    website: p.website ?? "",
    is_employee: p.isEmployee,
    is_admin: p.isAdmin,
    username: p.username ?? "",
    role: p.role ?? "user",
    created_at: p.createdAt.toISOString(),
  }
}

/** Current viewer as a community member (or null). */
export async function getCommunityViewer() {
  const profile = await getViewerProfile()
  return profile ? profileToMember(profile) : null
}

/** All community categories, tagged with their show for grouping. */
export async function listCommunityCategories() {
  let rows = await db.select().from(communityCategories).orderBy(asc(communityCategories.createdAt))
  if (rows.length === 0) {
    const defaults = [
      { name: "General Discussion", slug: "general", icon: "💬", showTitle: "Community Lounge", topic: "general" },
      { name: "Shows & Originals", slug: "shows", icon: "📺", showTitle: "StarCast Shows", topic: "shows" },
      { name: "Bands & Music", slug: "music", icon: "🎸", showTitle: "Soundstage", topic: "music" },
      { name: "Production & Studio", slug: "production", icon: "🎙️", showTitle: "StarCast Studios", topic: "production" },
      { name: "The Lounge (Off-Topic)", slug: "lounge", icon: "☕", showTitle: "Community Lounge", topic: "general" },
    ]
    try {
      await db.insert(communityCategories).values(defaults)
      rows = await db.select().from(communityCategories).orderBy(asc(communityCategories.createdAt))
    } catch {
      return defaults.map((d, i) => ({
        id: `default-${i}`,
        name: d.name,
        slug: d.slug,
        icon: d.icon,
        show_id: "",
        show_title: d.showTitle,
        topic: d.topic,
      }))
    }
  }
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? "",
    show_id: c.showId ?? "",
    show_title: c.showTitle ?? "",
    topic: c.topic ?? "",
  }))
}

/** A single public profile by profile id, or by auth user id as fallback. */
export async function getPublicProfile(id: string) {
  let rows = await db.select().from(profiles).where(eq(profiles.userId, id)).limit(1)
  if (rows.length === 0) {
    // May be a profile uuid rather than an auth user id
    try {
      rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)
    } catch {
      rows = []
    }
  }
  return rows[0] ? profileToMember(rows[0]) : null
}

/**
 * Everything the public profile page needs in one round trip:
 * profile, posts with star counts, friends, and viewer friendship status.
 */
export async function getProfilePageData(id: string) {
  const member = await getPublicProfile(id)
  if (!member) return null

  const viewer = await getViewerProfile()

  // Posts by this profile with star counts
  const postRows = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.authorId, member.id))
    .orderBy(desc(communityPosts.createdAt))
    .limit(20)

  const postIds = postRows.map((p) => p.id)
  const starsByPost = new Map<string, number>()
  if (postIds.length > 0) {
    const starRows = await db
      .select({ postId: postStars.postId })
      .from(postStars)
      .where(inArray(postStars.postId, postIds))
    for (const s of starRows) {
      starsByPost.set(s.postId, (starsByPost.get(s.postId) ?? 0) + 1)
    }
  }

  let totalStars = 0
  const posts = postRows.map((p) => {
    const starCount = starsByPost.get(p.id) ?? 0
    totalStars += starCount
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      category: p.category ?? "",
      created_at: p.createdAt.toISOString(),
      star_count: starCount,
    }
  })

  // Accepted friendships for this profile
  const friendshipRows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, member.id), eq(friendships.addresseeId, member.id)),
      ),
    )

  const friendIds = friendshipRows.map((f) =>
    f.requesterId === member.id ? f.addresseeId : f.requesterId,
  )
  const friendProfiles =
    friendIds.length > 0
      ? await db.select().from(profiles).where(inArray(profiles.id, friendIds))
      : []
  const friends = friendProfiles.map((p) => ({
    id: p.id,
    user_id: p.userId,
    first_name: p.firstName,
    last_name: p.lastName,
    profile_pic: p.profilePic ?? "",
    is_employee: p.isEmployee,
  }))

  // Viewer's friendship status with this profile
  let friendshipStatus: "none" | "pending_sent" | "pending_received" | "accepted" | "self" = "none"
  let friendshipId: string | null = null
  if (viewer) {
    if (viewer.id === member.id) {
      friendshipStatus = "self"
    } else {
      const rows = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, member.id)),
            and(eq(friendships.requesterId, member.id), eq(friendships.addresseeId, viewer.id)),
          ),
        )
        .limit(1)
      const f = rows[0]
      if (f) {
        friendshipId = f.id
        if (f.status === "accepted") friendshipStatus = "accepted"
        else if (f.requesterId === viewer.id) friendshipStatus = "pending_sent"
        else friendshipStatus = "pending_received"
      }
    }
  }

  return {
    profile: member,
    posts,
    friends,
    totalStars,
    friendshipStatus,
    friendshipId,
    viewer: viewer ? profileToMember(viewer) : null,
  }
}

async function getBadgeSets(profilesList: (typeof profiles.$inferSelect)[]) {
  if (profilesList.length === 0) {
    return {
      artistUserIds: new Set<string>(),
      vipUserIds: new Set<string>(),
      regularProfileIds: new Set<string>(),
    }
  }

  const userIds = [...new Set(profilesList.map((p) => p.userId).filter(Boolean))]
  const profileIds = [...new Set(profilesList.map((p) => p.id))]

  try {
    const [bandRows, ticketRows, postCountRows] = await Promise.all([
      userIds.length > 0
        ? db
            .select({ ownerUserId: bands.ownerUserId })
            .from(bands)
            .where(inArray(bands.ownerUserId, userIds))
        : Promise.resolve([]),
      userIds.length > 0
        ? db
            .select({ buyerUserId: bandTicketOrders.buyerUserId })
            .from(bandTicketOrders)
            .where(
              and(
                inArray(bandTicketOrders.buyerUserId, userIds),
                eq(bandTicketOrders.status, "paid")
              )
            )
        : Promise.resolve([]),
      profileIds.length > 0
        ? db
            .select({ authorId: communityPosts.authorId, val: count() })
            .from(communityPosts)
            .where(inArray(communityPosts.authorId, profileIds))
            .groupBy(communityPosts.authorId)
        : Promise.resolve([]),
    ])

    const artistUserIds = new Set(bandRows.map((b) => b.ownerUserId))
    const vipUserIds = new Set(ticketRows.map((t) => t.buyerUserId).filter(Boolean) as string[])
    const regularProfileIds = new Set(
      postCountRows.filter((p) => Number(p.val) >= 2).map((p) => p.authorId).filter(Boolean) as string[]
    )

    return { artistUserIds, vipUserIds, regularProfileIds }
  } catch (err) {
    console.error("getBadgeSets error:", err)
    return {
      artistUserIds: new Set<string>(),
      vipUserIds: new Set<string>(),
      regularProfileIds: new Set<string>(),
    }
  }
}

function computeBadges(
  p: typeof profiles.$inferSelect,
  sets: { artistUserIds: Set<string>; vipUserIds: Set<string>; regularProfileIds: Set<string> }
) {
  return {
    isAdmin: !!p.isAdmin || p.role === "admin",
    isStaff: !!p.isEmployee || p.role === "staff",
    isArtist: sets.artistUserIds.has(p.userId),
    isVip: sets.vipUserIds.has(p.userId),
    isRegular: sets.regularProfileIds.has(p.id),
  }
}

async function dispatchMentionNotifications(
  text: string,
  actorProfileId: string,
  context: { postId?: string; commentId?: string; postTitle?: string }
) {
  try {
    const mentionMatches = text.match(/@([a-zA-Z0-9_-]{2,30})/g)
    if (!mentionMatches || mentionMatches.length === 0) return

    const handles = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))]
    if (handles.length === 0) return

    const matched = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(sql`lower(${profiles.username}) IN ${handles}`)

    for (const target of matched) {
      if (target.id !== actorProfileId) {
        await createNotification({
          recipientProfileId: target.id,
          actorProfileId,
          type: "mention",
          postId: context.postId,
          commentId: context.commentId,
          postTitle: context.postTitle || "Community discussion",
          snippet: text,
        })
      }
    }
  } catch (err) {
    console.error("dispatchMentionNotifications error:", err)
  }
}

async function decoratePost(
  post: typeof communityPosts.$inferSelect,
  viewerProfileId: string | null,
  profileById: Map<string, typeof profiles.$inferSelect>,
) {
  const authorProfile = post.authorId ? profileById.get(post.authorId) : undefined

  // Fetch cosmic reactions on this post
  const postReactionRows = await db
    .select({ reactionType: postStars.reactionType, userId: postStars.userId })
    .from(postStars)
    .where(eq(postStars.postId, post.id))

  const reactionCounts: Record<string, number> = {}
  const userReactions: string[] = []
  for (const r of postReactionRows) {
    const t = r.reactionType || "love"
    reactionCounts[t] = (reactionCounts[t] || 0) + 1
    if (viewerProfileId && r.userId === viewerProfileId) {
      userReactions.push(t)
    }
  }
  const totalReactions = postReactionRows.length
  const userStarred = userReactions.length > 0

  // Fetch poll data & votes if this post has an attached poll
  let poll: {
    question: string
    options: { id: string; text: string; votes: number; percentage: number }[]
    totalVotes: number
    userVotedOptionId: string | null
  } | null = null

  if (post.pollData && typeof post.pollData === "object" && "question" in (post.pollData as any)) {
    try {
      const pData = post.pollData as { question: string; options: { id: string; text: string }[] }
      const voteRows = await db
        .select({ optionId: communityPollVotes.optionId, userId: communityPollVotes.userId })
        .from(communityPollVotes)
        .where(eq(communityPollVotes.postId, post.id))

      const votesByOption: Record<string, number> = {}
      let userVotedOptionId: string | null = null
      for (const v of voteRows) {
        votesByOption[v.optionId] = (votesByOption[v.optionId] || 0) + 1
        if (viewerProfileId && v.userId === viewerProfileId) {
          userVotedOptionId = v.optionId
        }
      }
      const totalVotes = voteRows.length
      poll = {
        question: pData.question,
        options: (pData.options || []).map((opt) => {
          const count = votesByOption[opt.id] || 0
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          return {
            id: opt.id,
            text: opt.text,
            votes: count,
            percentage,
          }
        }),
        totalVotes,
        userVotedOptionId,
      }
    } catch (err) {
      console.error("Error decorating poll:", err)
    }
  }

  const allComments = await db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, post.id))
    .orderBy(asc(postComments.createdAt))

  const commenterIds = [...new Set(allComments.map((c) => c.userId))]
  const commenterProfiles =
    commenterIds.length > 0
      ? await db.select().from(profiles).where(inArray(profiles.id, commenterIds))
      : []
  const commenterById = new Map(commenterProfiles.map((p) => [p.id, p]))

  // Resolve scene badges for author & commenters
  const allProfiles = [
    ...(authorProfile ? [authorProfile] : []),
    ...commenterProfiles,
  ]
  const badgeSets = await getBadgeSets(allProfiles)

  const commentIds = allComments.map((c) => c.id)
  const commentReactionsMap = new Map<string, { counts: Record<string, number>; userReactions: string[]; total: number }>()
  if (commentIds.length > 0) {
    const starRows = await db
      .select({ commentId: commentStars.commentId, reactionType: commentStars.reactionType, userId: commentStars.userId })
      .from(commentStars)
      .where(inArray(commentStars.commentId, commentIds))
    for (const s of starRows) {
      if (!commentReactionsMap.has(s.commentId)) {
        commentReactionsMap.set(s.commentId, { counts: {}, userReactions: [], total: 0 })
      }
      const cData = commentReactionsMap.get(s.commentId)!
      const t = s.reactionType || "love"
      cData.counts[t] = (cData.counts[t] || 0) + 1
      cData.total++
      if (viewerProfileId && s.userId === viewerProfileId) {
        cData.userReactions.push(t)
      }
    }
  }

  const toCommentShape = (c: typeof postComments.$inferSelect) => {
    const cp = commenterById.get(c.userId)
    const cReactions = commentReactionsMap.get(c.id) ?? { counts: {}, userReactions: [], total: 0 }
    return {
      id: c.id,
      user_id: c.userId,
      comment: c.content,
      created_at: c.createdAt.toISOString(),
      parent_comment_id: c.parentCommentId,
      user: cp
        ? {
            first_name: cp.firstName,
            last_name: cp.lastName,
            profile_pic: cp.profilePic ?? "",
            username: cp.username ?? null,
            is_admin: cp.isAdmin,
            is_employee: cp.isEmployee,
            role: cp.role,
            badges: computeBadges(cp, badgeSets),
          }
        : undefined,
      reactions: cReactions,
      star_count: cReactions.total,
      user_starred: cReactions.userReactions.length > 0,
    }
  }

  const topLevel = allComments.filter((c) => !c.parentCommentId).map(toCommentShape)
  const replies = allComments.filter((c) => c.parentCommentId).map(toCommentShape)
  const withReplies = topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parent_comment_id === c.id),
  }))

  return {
    id: post.id,
    employee_id: post.authorId ?? "",
    title: post.title,
    content: post.content,
    category: post.category ?? "",
    images: (post.images as { url: string; credit: string }[] | null) ?? [],
    created_at: post.createdAt.toISOString(),
    employee: authorProfile
      ? {
          first_name: authorProfile.firstName,
          last_name: authorProfile.lastName,
          profile_pic: authorProfile.profilePic ?? "",
          username: authorProfile.username ?? null,
          is_admin: authorProfile.isAdmin,
          is_employee: authorProfile.isEmployee,
          role: authorProfile.role,
          badges: computeBadges(authorProfile, badgeSets),
        }
      : undefined,
    reactions: {
      counts: reactionCounts,
      userReactions,
      total: totalReactions,
    },
    star_count: totalReactions,
    user_starred: userStarred,
    poll,
    comments: withReplies,
  }
}

/** Posts in a category (or all categories if empty or 'all') with stars + threaded comments. */
export async function listCommunityPosts(categorySlug?: string | null) {
  const viewer = await getViewerProfile()
  const posts =
    categorySlug && categorySlug !== "all"
      ? await db
          .select()
          .from(communityPosts)
          .where(eq(communityPosts.category, categorySlug))
          .orderBy(desc(communityPosts.createdAt))
      : await db
          .select()
          .from(communityPosts)
          .where(ne(communityPosts.category, DECK_SLUG))
          .orderBy(desc(communityPosts.createdAt))

  const authorIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))] as string[]
  const authorProfiles =
    authorIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, authorIds)) : []
  const profileById = new Map(authorProfiles.map((p) => [p.id, p]))

  const decorated = await Promise.all(posts.map((p) => decoratePost(p, viewer?.id ?? null, profileById)))
  return decorated
}

/** Recent posts for a specific author profile (used on profile pages). */
export async function listPostsByAuthor(authorProfileId: string) {
  const posts = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.authorId, authorProfileId))
    .orderBy(desc(communityPosts.createdAt))
    .limit(20)

  const results = []
  let totalStars = 0
  for (const post of posts) {
    const [{ value: starCount }] = await db
      .select({ value: count() })
      .from(postStars)
      .where(eq(postStars.postId, post.id))
    totalStars += starCount
    results.push({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category ?? "",
      created_at: post.createdAt.toISOString(),
      star_count: starCount,
    })
  }
  return { posts: results, totalStars }
}

/** Create a community post as the signed-in user. */
export async function createCommunityPost(input: {
  title: string
  content: string
  category: string
  images: { url: string; credit: string }[]
  poll?: { question: string; options: string[] } | null
}) {
  const viewer = await requireSocialViewer()
  let pollData = null
  if (
    input.poll &&
    input.poll.question?.trim() &&
    Array.isArray(input.poll.options) &&
    input.poll.options.filter((o) => o.trim().length > 0).length >= 2
  ) {
    pollData = {
      question: input.poll.question.trim(),
      options: input.poll.options
        .filter((o) => o.trim().length > 0)
        .map((opt, idx) => ({
          id: `opt_${idx + 1}`,
          text: opt.trim(),
        })),
    }
  }

  const [newPost] = await db
    .insert(communityPosts)
    .values({
      userId: viewer.userId,
      authorId: viewer.id,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      images: input.images,
      pollData,
    })
    .returning()

  await dispatchMentionNotifications(
    `${input.title} ${input.content}`,
    viewer.id,
    { postId: newPost?.id, postTitle: input.title }
  )
}

/** Toggle a cosmic reaction on a post ('love' | 'fire' | 'riff' | 'cosmic' | 'legend' | 'hype') */
export async function togglePostReaction(postId: string, reactionType: string = "love") {
  const viewer = await requireSocialViewer()
  const existing = await db
    .select({ id: postStars.id })
    .from(postStars)
    .where(
      and(
        eq(postStars.postId, postId),
        eq(postStars.userId, viewer.id),
        eq(postStars.reactionType, reactionType)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    await db.delete(postStars).where(eq(postStars.id, existing[0].id))
    return { reacted: false, reactionType }
  }

  await db.insert(postStars).values({
    postId,
    userId: viewer.id,
    reactionType,
  })

  // Trigger notification to post author
  try {
    const [post] = await db
      .select({ authorId: communityPosts.authorId, title: communityPosts.title })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1)

    if (post?.authorId && post.authorId !== viewer.id) {
      await createNotification({
        recipientProfileId: post.authorId,
        actorProfileId: viewer.id,
        type: "post_star",
        postId,
        postTitle: post.title,
        snippet: `Reacted with ${reactionType}`,
      })
    }
  } catch (err) {
    console.error("Failed to trigger post_star notification:", err)
  }

  return { reacted: true, reactionType }
}

/** Toggle a star on a post for the signed-in user (legacy compatibility). */
export async function togglePostStar(postId: string) {
  const res = await togglePostReaction(postId, "love")
  return { starred: res.reacted }
}

/** Vote or retract vote on a community poll */
export async function voteOnPoll(postId: string, optionId: string) {
  const viewer = await requireSocialViewer()

  const existingVote = await db
    .select({ id: communityPollVotes.id, optionId: communityPollVotes.optionId })
    .from(communityPollVotes)
    .where(
      and(
        eq(communityPollVotes.postId, postId),
        eq(communityPollVotes.userId, viewer.id)
      )
    )
    .limit(1)

  if (existingVote.length > 0) {
    if (existingVote[0].optionId === optionId) {
      await db.delete(communityPollVotes).where(eq(communityPollVotes.id, existingVote[0].id))
      revalidatePath("/community")
      return { voted: false, optionId: null }
    } else {
      await db
        .update(communityPollVotes)
        .set({ optionId })
        .where(eq(communityPollVotes.id, existingVote[0].id))
      revalidatePath("/community")
      return { voted: true, optionId }
    }
  }

  await db.insert(communityPollVotes).values({
    postId,
    optionId,
    userId: viewer.id,
  })

  revalidatePath("/community")
  return { voted: true, optionId }
}

/** Add a comment (or threaded reply) to a post. */
export async function addPostComment(postId: string, comment: string, parentCommentId?: string | null) {
  const viewer = await requireSocialViewer()
  const [newComment] = await db
    .insert(postComments)
    .values({
      postId,
      userId: viewer.id,
      content: comment.trim(),
      parentCommentId: parentCommentId ?? null,
    })
    .returning()

  // Trigger notification to parent commenter or post author
  try {
    const [post] = await db
      .select({ authorId: communityPosts.authorId, title: communityPosts.title })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1)

    if (parentCommentId) {
      const [parent] = await db
        .select({ userId: postComments.userId })
        .from(postComments)
        .where(eq(postComments.id, parentCommentId))
        .limit(1)

      if (parent?.userId && parent.userId !== viewer.id) {
        await createNotification({
          recipientProfileId: parent.userId,
          actorProfileId: viewer.id,
          type: "comment_reply",
          postId,
          commentId: parentCommentId,
          postTitle: post?.title,
          snippet: comment,
        })
      }

      // Also notify post author if they're not the replier or parent commenter
      if (post?.authorId && post.authorId !== viewer.id && post.authorId !== parent?.userId) {
        await createNotification({
          recipientProfileId: post.authorId,
          actorProfileId: viewer.id,
          type: "comment_on_your_post",
          postId,
          commentId: newComment?.id,
          postTitle: post.title,
          snippet: comment,
        })
      }
    } else {
      // Top-level comment
      if (post?.authorId && post.authorId !== viewer.id) {
        await createNotification({
          recipientProfileId: post.authorId,
          actorProfileId: viewer.id,
          type: "post_comment",
          postId,
          commentId: newComment?.id,
          postTitle: post.title,
          snippet: comment,
        })
      }
    }

    // Trigger mention notifications if any @handles were typed
    await dispatchMentionNotifications(comment, viewer.id, {
      postId,
      commentId: newComment?.id,
      postTitle: post?.title,
    })
  } catch (err) {
    console.error("Failed to trigger comment notification:", err)
  }
}

/** Toggle a cosmic reaction on a comment ('love' | 'fire' | 'riff' | 'cosmic' | 'legend' | 'hype') */
export async function toggleCommentReaction(commentId: string, reactionType: string = "love") {
  const viewer = await requireSocialViewer()
  const existing = await db
    .select({ id: commentStars.id })
    .from(commentStars)
    .where(
      and(
        eq(commentStars.commentId, commentId),
        eq(commentStars.userId, viewer.id),
        eq(commentStars.reactionType, reactionType)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    await db.delete(commentStars).where(eq(commentStars.id, existing[0].id))
    return { reacted: false, reactionType }
  }

  await db.insert(commentStars).values({
    commentId,
    userId: viewer.id,
    reactionType,
  })

  try {
    const [c] = await db
      .select({ userId: postComments.userId, content: postComments.content, postId: postComments.postId })
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1)

    if (c?.userId && c.userId !== viewer.id) {
      await createNotification({
        recipientProfileId: c.userId,
        actorProfileId: viewer.id,
        type: "comment_star",
        commentId,
        postId: c.postId,
        snippet: `Reacted with ${reactionType}: ${c.content.slice(0, 50)}`,
      })
    }
  } catch (err) {
    console.error("Failed to trigger comment_star notification:", err)
  }

  return { reacted: true, reactionType }
}

/** Toggle a star on a comment for the signed-in user (legacy compatibility). */
export async function toggleCommentStar(commentId: string) {
  const res = await toggleCommentReaction(commentId, "love")
  return { starred: res.reacted }
}

// --- Members & friendships ---------------------------------------------------

/** All members with the viewer's friendship status attached. */
export async function listMembers() {
  const viewer = await getViewerProfile()
  const allProfiles = await db.select().from(profiles).orderBy(asc(profiles.firstName))

  if (!viewer) {
    return allProfiles.map((p) => ({ ...profileToMember(p), friendship_status: "none" as const }))
  }

  const myFriendships = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, viewer.id)))

  return allProfiles
    .filter((p) => p.id !== viewer.id)
    .map((p) => {
      const f = myFriendships.find(
        (fr) =>
          (fr.requesterId === viewer.id && fr.addresseeId === p.id) ||
          (fr.addresseeId === viewer.id && fr.requesterId === p.id),
      )
      let status: "none" | "pending_sent" | "pending_received" | "accepted" = "none"
      if (f) {
        if (f.status === "accepted") status = "accepted"
        else if (f.requesterId === viewer.id) status = "pending_sent"
        else status = "pending_received"
      }
      return { ...profileToMember(p), friendship_status: status, friendship_id: f?.id }
    })
}

/** Friends + incoming pending requests for the signed-in user. */
export async function listFriends() {
  const viewer = await getViewerProfile()
  if (!viewer) return { friends: [], requests: [] }

  const accepted = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, viewer.id)),
      ),
    )

  const friendIds = accepted.map((f) => (f.requesterId === viewer.id ? f.addresseeId : f.requesterId))
  const friendProfiles =
    friendIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, friendIds)) : []
  const friends = friendProfiles.map((p) => ({
    ...profileToMember(p),
    friendship_status: "accepted" as const,
    friendship_id: accepted.find((f) => f.requesterId === p.id || f.addresseeId === p.id)?.id,
  }))

  const pending = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.addresseeId, viewer.id), eq(friendships.status, "pending")))

  const requesterIds = pending.map((r) => r.requesterId)
  const requesterProfiles =
    requesterIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, requesterIds)) : []

  const requests = pending.map((req) => ({
    id: req.id,
    requester_id: req.requesterId,
    addressee_id: req.addresseeId,
    status: req.status,
    created_at: req.createdAt.toISOString(),
    requester: requesterProfiles.find((p) => p.id === req.requesterId)
      ? profileToMember(requesterProfiles.find((p) => p.id === req.requesterId)!)
      : undefined,
  }))

  return { friends, requests }
}

/** Friendship state between the viewer and another profile. */
export async function getFriendshipWith(otherProfileId: string) {
  const viewer = await getViewerProfile()
  if (!viewer) return null
  if (viewer.id === otherProfileId) return { status: "self" as const, id: null }

  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, otherProfileId)),
        and(eq(friendships.requesterId, otherProfileId), eq(friendships.addresseeId, viewer.id)),
      ),
    )
    .limit(1)

  const f = rows[0]
  if (!f) return { status: "none" as const, id: null }
  if (f.status === "accepted") return { status: "accepted" as const, id: f.id }
  if (f.requesterId === viewer.id) return { status: "pending_sent" as const, id: f.id }
  return { status: "pending_received" as const, id: f.id }
}

/** Accepted friends of an arbitrary profile (public profile page). */
export async function listFriendsOf(profileId: string) {
  const accepted = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, profileId), eq(friendships.addresseeId, profileId)),
      ),
    )
  const friendIds = accepted.map((f) => (f.requesterId === profileId ? f.addresseeId : f.requesterId))
  if (friendIds.length === 0) return []
  const friendProfiles = await db.select().from(profiles).where(inArray(profiles.id, friendIds))
  return friendProfiles.map(profileToMember)
}

export async function sendFriendRequest(addresseeProfileId: string) {
  const viewer = await requireSocialViewer()
  const [inserted] = await db
    .insert(friendships)
    .values({ requesterId: viewer.id, addresseeId: addresseeProfileId })
    .returning()

  try {
    if (inserted && addresseeProfileId !== viewer.id) {
      await createNotification({
        recipientProfileId: addresseeProfileId,
        actorProfileId: viewer.id,
        type: "friend_request",
        friendshipId: inserted.id,
      })
    }
  } catch (err) {
    console.error("Failed to trigger friend_request notification:", err)
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  const viewer = await requireSocialViewer()
  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, viewer.id)))
    .returning()

  // Clean up incoming friend_request notifications so requests never linger once accepted
  try {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.recipientProfileId, viewer.id),
          eq(notifications.friendshipId, friendshipId),
          eq(notifications.type, "friend_request"),
        ),
      )
  } catch (err) {
    console.error("Failed to delete incoming friend_request notification:", err)
  }

  try {
    if (updated && updated.requesterId !== viewer.id) {
      // Prevent duplicate notifications if clicked multiple times
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.friendshipId, updated.id),
            eq(notifications.type, "friend_accepted"),
          ),
        )
        .limit(1)

      if (existing.length === 0) {
        await createNotification({
          recipientProfileId: updated.requesterId,
          actorProfileId: viewer.id,
          type: "friend_accepted",
          friendshipId: updated.id,
        })
      }
    }
  } catch (err) {
    console.error("Failed to trigger friend_accepted notification:", err)
  }

  revalidatePath("/community")
  revalidatePath("/dashboard")
  revalidatePath("/profile")
}

export async function removeFriendship(friendshipId: string) {
  const viewer = await getViewerProfile()
  if (!viewer) throw new Error("Unauthorized")
  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        or(eq(friendships.requesterId, viewer.id), eq(friendships.addresseeId, viewer.id)),
      ),
    )

  // Clear any notifications associated with this friendship
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.friendshipId, friendshipId))
  } catch (err) {
    console.error("Failed to delete friendship notifications:", err)
  }

  revalidatePath("/community")
  revalidatePath("/dashboard")
  revalidatePath("/profile")
}

// --- Direct messages ---------------------------------------------------------

/** Conversation list for the signed-in user. */
export async function listConversations() {
  const viewer = await getViewerProfile()
  if (!viewer) return { conversations: [], unreadCount: 0 }

  const allMessages = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, viewer.id), eq(messages.receiverId, viewer.id)))
    .orderBy(desc(messages.createdAt))

  if (allMessages.length === 0) return { conversations: [], unreadCount: 0 }

  const convMap = new Map<string, { partnerId: string; lastMessage: (typeof allMessages)[0]; unreadCount: number }>()
  for (const msg of allMessages) {
    const partnerId = msg.senderId === viewer.id ? msg.receiverId : msg.senderId
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { partnerId, lastMessage: msg, unreadCount: 0 })
    }
    if (!msg.read && msg.receiverId === viewer.id) {
      convMap.get(partnerId)!.unreadCount++
    }
  }

  const partnerIds = Array.from(convMap.keys())
  const partners = partnerIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, partnerIds)) : []

  const conversations = Array.from(convMap.values()).map((conv) => ({
    partnerId: conv.partnerId,
    unreadCount: conv.unreadCount,
    lastMessage: {
      id: conv.lastMessage.id,
      sender_id: conv.lastMessage.senderId,
      receiver_id: conv.lastMessage.receiverId,
      content: conv.lastMessage.content,
      read: conv.lastMessage.read,
      created_at: conv.lastMessage.createdAt.toISOString(),
    },
    partner: (() => {
      const p = partners.find((pp) => pp.id === conv.partnerId)
      return p
        ? { id: p.id, first_name: p.firstName, last_name: p.lastName, profile_pic: p.profilePic ?? "" }
        : undefined
    })(),
  }))

  return {
    conversations,
    unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  }
}

/** Full message thread with a partner; marks incoming messages read. */
export async function getChatMessages(partnerProfileId: string) {
  const viewer = await getViewerProfile()
  if (!viewer) return []

  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, viewer.id), eq(messages.receiverId, partnerProfileId)),
        and(eq(messages.senderId, partnerProfileId), eq(messages.receiverId, viewer.id)),
      ),
    )
    .orderBy(asc(messages.createdAt))

  await db
    .update(messages)
    .set({ read: true })
    .where(
      and(
        eq(messages.senderId, partnerProfileId),
        eq(messages.receiverId, viewer.id),
        eq(messages.read, false),
      ),
    )

  return rows.map((m) => ({
    id: m.id,
    sender_id: m.senderId,
    receiver_id: m.receiverId,
    content: m.content,
    read: m.read,
    created_at: m.createdAt.toISOString(),
  }))
}

export async function sendChatMessage(receiverProfileId: string, content: string) {
  const viewer = await requireSocialViewer()
  // Block DMs to a banned member too, so a ban also stops inbound harassment.
  const target = await db
    .select({ socialBanned: profiles.socialBanned })
    .from(profiles)
    .where(eq(profiles.id, receiverProfileId))
    .limit(1)
  if (target[0]?.socialBanned) throw new Error("This member is not able to receive messages right now.")
  await db.insert(messages).values({
    senderId: viewer.id,
    receiverId: receiverProfileId,
    content: content.trim(),
  })
}

// --- The DECK (main community wall) ------------------------------------------
// The DECK is a single shared wall where every member gets exactly ONE post,
// but can reply (comment) as many times as they want. It reuses the community
// posts/comments tables under a reserved category slug, so no dedicated tables
// are needed and the existing star/comment actions work unchanged.

/**
 * All DECK posts, newest first, decorated with stars + threaded replies.
 * Also reports whether the viewer has already claimed their single post.
 */
export async function listDeckPosts() {
  const viewer = await getViewerProfile()
  const posts = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.category, DECK_SLUG))
    .orderBy(desc(communityPosts.createdAt))

  const authorIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))] as string[]
  const authorProfiles =
    authorIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, authorIds)) : []
  const profileById = new Map(authorProfiles.map((p) => [p.id, p]))

  const decorated = await Promise.all(posts.map((p) => decoratePost(p, viewer?.id ?? null, profileById)))

  // Check if viewer has already posted within the last 24 hours (daily limit)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const viewerRecentPost = viewer
    ? posts.find((p) => p.authorId === viewer.id && p.createdAt && new Date(p.createdAt) >= oneDayAgo)
    : null

  return { posts: decorated, viewerHasPosted: !!viewerRecentPost, viewerPostId: viewerRecentPost?.id ?? null }
}

/**
 * Create the viewer's daily DECK post. Throws if they have already posted in the
 * past 24 hours so the 1-post-per-day rule holds even if the client UI is bypassed.
 */
export async function createDeckPost(
  content: string,
  poll?: { question: string; options: string[] } | null
) {
  const viewer = await requireSocialViewer()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.category, DECK_SLUG),
        eq(communityPosts.authorId, viewer.id),
        gte(communityPosts.createdAt, oneDayAgo)
      )
    )
    .limit(1)
  if (existing.length > 0) {
    throw new Error("You already have a post on the DECK today. You can post again tomorrow, and reply to others as much as you like in the meantime!")
  }

  const trimmed = content.trim()
  if (!trimmed) throw new Error("Your post can't be empty.")

  let pollData = null
  if (
    poll &&
    poll.question?.trim() &&
    Array.isArray(poll.options) &&
    poll.options.filter((o) => o.trim().length > 0).length >= 2
  ) {
    pollData = {
      question: poll.question.trim(),
      options: poll.options
        .filter((o) => o.trim().length > 0)
        .map((opt, idx) => ({
          id: `opt_${idx + 1}`,
          text: opt.trim(),
        })),
    }
  }

  const [newPost] = await db
    .insert(communityPosts)
    .values({
      userId: viewer.userId,
      authorId: viewer.id,
      title: "",
      content: trimmed,
      category: DECK_SLUG,
      images: [],
      pollData,
    })
    .returning()

  await dispatchMentionNotifications(trimmed, viewer.id, {
    postId: newPost?.id,
    postTitle: "The DECK",
  })
}
