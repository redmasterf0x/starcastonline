import { db } from "@/lib/db"
import {
  profiles,
  communityPosts,
  postComments,
  postStars,
  friendships,
  bandTicketOrders,
  bands,
  bandTracks,
} from "@/lib/db/schema"
import { and, eq, inArray, or, sql } from "drizzle-orm"
import { calculateLevelProgress, type LevelProgress } from "@/lib/profile-progression"

export async function computeUserLevelProgress(
  profileRow: typeof profiles.$inferSelect
): Promise<LevelProgress> {
  const userId = profileRow.userId
  const profileId = profileRow.id

  const [
    postRows,
    commentCountRows,
    friendCountRows,
    ticketCountRows,
    userBands,
  ] = await Promise.all([
    db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(or(eq(communityPosts.authorId, profileId), eq(communityPosts.userId, userId))),
    db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(postComments)
      .where(eq(postComments.userId, userId)),
    db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(eq(friendships.requesterId, profileId), eq(friendships.addresseeId, profileId))
        )
      ),
    db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(bandTicketOrders)
      .where(and(eq(bandTicketOrders.buyerUserId, userId), eq(bandTicketOrders.status, "paid"))),
    db
      .select({ id: bands.id })
      .from(bands)
      .where(eq(bands.ownerUserId, userId)),
  ])

  const postIds = postRows.map((p) => p.id)
  const bandIds = userBands.map((b) => b.id)

  const [starCountRows, trackCountRows] = await Promise.all([
    postIds.length > 0
      ? db
          .select({ cnt: sql<number>`count(*)::int` })
          .from(postStars)
          .where(inArray(postStars.postId, postIds))
      : Promise.resolve([{ cnt: 0 }]),
    bandIds.length > 0
      ? db
          .select({ cnt: sql<number>`count(*)::int` })
          .from(bandTracks)
          .where(inArray(bandTracks.bandId, bandIds))
      : Promise.resolve([{ cnt: 0 }]),
  ])

  const createdMs = profileRow.createdAt ? new Date(profileRow.createdAt).getTime() : Date.now()
  const weeksMember = Math.max(0, Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24 * 7)))

  return calculateLevelProgress({
    postsCount: postIds.length,
    commentsCount: commentCountRows[0]?.cnt ?? 0,
    starsReceived: starCountRows[0]?.cnt ?? 0,
    friendsCount: friendCountRows[0]?.cnt ?? 0,
    ticketsCount: ticketCountRows[0]?.cnt ?? 0,
    tracksUploaded: trackCountRows[0]?.cnt ?? 0,
    ownsBand: bandIds.length > 0,
    hasAvatar: Boolean(profileRow.profilePic && profileRow.profilePic.trim()),
    hasBio: Boolean(profileRow.bio && profileRow.bio.trim()),
    hasLocationOrWebsite: Boolean(
      (profileRow.location && profileRow.location.trim()) ||
        (profileRow.website && profileRow.website.trim())
    ),
    weeksMember,
    bonusXp: profileRow.bonusXp ?? 0,
  })
}
