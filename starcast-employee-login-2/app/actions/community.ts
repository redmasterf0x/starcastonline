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
} from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, or, count } from "drizzle-orm"
import { headers } from "next/headers"
import { SOCIAL_BAN_MESSAGE } from "@/lib/permissions"

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
  const rows = await db.select().from(communityCategories).orderBy(asc(communityCategories.createdAt))
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

async function decoratePost(
  post: typeof communityPosts.$inferSelect,
  viewerProfileId: string | null,
  profileById: Map<string, typeof profiles.$inferSelect>,
) {
  const authorProfile = post.authorId ? profileById.get(post.authorId) : undefined

  const [{ value: starCount }] = await db
    .select({ value: count() })
    .from(postStars)
    .where(eq(postStars.postId, post.id))

  let userStarred = false
  if (viewerProfileId) {
    const rows = await db
      .select({ id: postStars.id })
      .from(postStars)
      .where(and(eq(postStars.postId, post.id), eq(postStars.userId, viewerProfileId)))
      .limit(1)
    userStarred = rows.length > 0
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

  const commentIds = allComments.map((c) => c.id)
  const starsByComment = new Map<string, number>()
  const viewerStarredComments = new Set<string>()
  if (commentIds.length > 0) {
    const starRows = await db
      .select({ commentId: commentStars.commentId, userId: commentStars.userId })
      .from(commentStars)
      .where(inArray(commentStars.commentId, commentIds))
    for (const s of starRows) {
      starsByComment.set(s.commentId, (starsByComment.get(s.commentId) ?? 0) + 1)
      if (viewerProfileId && s.userId === viewerProfileId) viewerStarredComments.add(s.commentId)
    }
  }

  const toCommentShape = (c: typeof postComments.$inferSelect) => {
    const cp = commenterById.get(c.userId)
    return {
      id: c.id,
      user_id: c.userId,
      comment: c.content,
      created_at: c.createdAt.toISOString(),
      parent_comment_id: c.parentCommentId,
      user: cp
        ? { first_name: cp.firstName, last_name: cp.lastName, profile_pic: cp.profilePic ?? "" }
        : undefined,
      star_count: starsByComment.get(c.id) ?? 0,
      user_starred: viewerStarredComments.has(c.id),
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
        }
      : undefined,
    star_count: starCount,
    user_starred: userStarred,
    comments: withReplies,
  }
}

/** Posts in a category with stars + threaded comments, sorted by stars. */
export async function listCommunityPosts(categorySlug: string) {
  const viewer = await getViewerProfile()
  const posts = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.category, categorySlug))
    .orderBy(desc(communityPosts.createdAt))

  const authorIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))] as string[]
  const authorProfiles =
    authorIds.length > 0 ? await db.select().from(profiles).where(inArray(profiles.id, authorIds)) : []
  const profileById = new Map(authorProfiles.map((p) => [p.id, p]))

  const decorated = await Promise.all(posts.map((p) => decoratePost(p, viewer?.id ?? null, profileById)))
  decorated.sort((a, b) => (b.star_count || 0) - (a.star_count || 0))
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
}) {
  const viewer = await requireSocialViewer()
  await db.insert(communityPosts).values({
    userId: viewer.userId,
    authorId: viewer.id,
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category,
    images: input.images,
  })
}

/** Toggle a star on a post for the signed-in user. */
export async function togglePostStar(postId: string) {
  const viewer = await requireSocialViewer()
  const existing = await db
    .select({ id: postStars.id })
    .from(postStars)
    .where(and(eq(postStars.postId, postId), eq(postStars.userId, viewer.id)))
    .limit(1)
  if (existing.length > 0) {
    await db.delete(postStars).where(eq(postStars.id, existing[0].id))
    return { starred: false }
  }
  await db.insert(postStars).values({ postId, userId: viewer.id })
  return { starred: true }
}

/** Add a comment (or threaded reply) to a post. */
export async function addPostComment(postId: string, comment: string, parentCommentId?: string | null) {
  const viewer = await requireSocialViewer()
  await db.insert(postComments).values({
    postId,
    userId: viewer.id,
    content: comment.trim(),
    parentCommentId: parentCommentId ?? null,
  })
}

/** Toggle a star on a comment for the signed-in user. */
export async function toggleCommentStar(commentId: string) {
  const viewer = await requireSocialViewer()
  const existing = await db
    .select({ id: commentStars.id })
    .from(commentStars)
    .where(and(eq(commentStars.commentId, commentId), eq(commentStars.userId, viewer.id)))
    .limit(1)
  if (existing.length > 0) {
    await db.delete(commentStars).where(eq(commentStars.id, existing[0].id))
    return { starred: false }
  }
  await db.insert(commentStars).values({ commentId, userId: viewer.id })
  return { starred: true }
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
  await db.insert(friendships).values({ requesterId: viewer.id, addresseeId: addresseeProfileId })
}

export async function acceptFriendRequest(friendshipId: string) {
  const viewer = await requireSocialViewer()
  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, viewer.id)))
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

// Reserved category slug for the shared DECK wall. Kept as a module-local
// (not exported) because "use server" files may only export async functions.
const DECK_SLUG = "the-deck"

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

  const viewerPostId = viewer ? decorated.find((p) => p.employee_id === viewer.id)?.id ?? null : null

  return { posts: decorated, viewerHasPosted: !!viewerPostId, viewerPostId }
}

/**
 * Create the viewer's single DECK post. Throws if they already have one so the
 * one-post rule holds even if the client UI is bypassed.
 */
export async function createDeckPost(content: string) {
  const viewer = await requireSocialViewer()

  const existing = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(and(eq(communityPosts.category, DECK_SLUG), eq(communityPosts.authorId, viewer.id)))
    .limit(1)
  if (existing.length > 0) {
    throw new Error("You already have a post on the DECK. You can still reply as many times as you like.")
  }

  const trimmed = content.trim()
  if (!trimmed) throw new Error("Your post can't be empty.")

  await db.insert(communityPosts).values({
    userId: viewer.userId,
    authorId: viewer.id,
    title: "",
    content: trimmed,
    category: DECK_SLUG,
    images: [],
  })
}
