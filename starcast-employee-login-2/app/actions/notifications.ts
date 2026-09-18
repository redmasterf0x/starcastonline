"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications, profiles } from "@/lib/db/schema"
import { eq, and, desc, sql, count } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

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

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "post_star"
  | "post_comment"
  | "comment_reply"
  | "comment_on_your_post"
  | "comment_star"

export type NotificationItem = {
  id: string
  type: NotificationType
  postId: string | null
  commentId: string | null
  friendshipId: string | null
  postTitle: string | null
  snippet: string | null
  isRead: boolean
  createdAt: string
  actor: {
    id: string
    firstName: string
    lastName: string
    profilePic: string | null
    username: string | null
  }
}

/** Internal helper to record a notification if actor != recipient */
export async function createNotification(data: {
  recipientProfileId: string
  actorProfileId: string
  type: NotificationType
  postId?: string | null
  commentId?: string | null
  friendshipId?: string | null
  postTitle?: string | null
  snippet?: string | null
}) {
  try {
    // Never notify someone about their own actions
    if (data.recipientProfileId === data.actorProfileId) return null

    const [inserted] = await db
      .insert(notifications)
      .values({
        recipientProfileId: data.recipientProfileId,
        actorProfileId: data.actorProfileId,
        type: data.type,
        postId: data.postId || null,
        commentId: data.commentId || null,
        friendshipId: data.friendshipId || null,
        postTitle: data.postTitle || null,
        snippet: data.snippet ? data.snippet.slice(0, 200) : null,
        isRead: false,
      })
      .returning()

    return inserted
  } catch (err) {
    console.error("createNotification error:", err)
    return null
  }
}

/** Get the current user's notifications */
export async function getMyNotifications(limit: number = 30): Promise<NotificationItem[]> {
  try {
    const viewer = await getViewerProfile()
    if (!viewer) return []

    const rows = await db
      .select({
        notification: notifications,
        actor: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePic: profiles.profilePic,
          username: profiles.username,
        },
      })
      .from(notifications)
      .innerJoin(profiles, eq(profiles.id, notifications.actorProfileId))
      .where(eq(notifications.recipientProfileId, viewer.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    return rows.map((r) => ({
      id: r.notification.id,
      type: r.notification.type as NotificationType,
      postId: r.notification.postId,
      commentId: r.notification.commentId,
      friendshipId: r.notification.friendshipId,
      postTitle: r.notification.postTitle,
      snippet: r.notification.snippet,
      isRead: r.notification.isRead,
      createdAt: r.notification.createdAt.toISOString(),
      actor: r.actor,
    }))
  } catch (err) {
    console.error("getMyNotifications error:", err)
    return []
  }
}

/** Get unread notification count */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const viewer = await getViewerProfile()
    if (!viewer) return 0

    const [{ value }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.recipientProfileId, viewer.id), eq(notifications.isRead, false)))

    return Number(value || 0)
  } catch (err) {
    console.error("getUnreadNotificationCount error:", err)
    return 0
  }
}

/** Mark a specific notification as read */
export async function markNotificationRead(notificationId: string) {
  try {
    const viewer = await getViewerProfile()
    if (!viewer) return { success: false }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.recipientProfileId, viewer.id)))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("markNotificationRead error:", err)
    return { success: false }
  }
}

/** Mark all notifications as read */
export async function markAllNotificationsRead() {
  try {
    const viewer = await getViewerProfile()
    if (!viewer) return { success: false }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientProfileId, viewer.id))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("markAllNotificationsRead error:", err)
    return { success: false }
  }
}

/** Delete a notification */
export async function deleteNotification(notificationId: string) {
  try {
    const viewer = await getViewerProfile()
    if (!viewer) return { success: false }

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.recipientProfileId, viewer.id)))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("deleteNotification error:", err)
    return { success: false }
  }
}
