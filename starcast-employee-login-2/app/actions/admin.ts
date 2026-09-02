"use server"

import { db } from "@/lib/db"
import {
  profiles,
  articles,
  communityPosts,
  communityCategories,
  inboxMessages,
  sponsors,
  postStars,
} from "@/lib/db/schema"
import { eq, desc, asc, and, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)
  const profile = rows[0]
  if (!profile?.isAdmin) throw new Error("Forbidden")
  return session.user
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function adminListUsers() {
  await requireAdmin()
  const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt))
  return rows.map((p) => ({
    id: p.id,
    user_id: p.userId,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone ?? undefined,
    bio: p.bio ?? undefined,
    profile_pic: p.profilePic ?? undefined,
    location: p.location ?? undefined,
    website: p.website ?? undefined,
    role: (p.isAdmin ? "admin" : p.isEmployee || p.role === "staff" ? "staff" : (p.role || "user")) as "admin" | "staff" | "user",
    is_employee: p.isEmployee,
    is_admin: p.isAdmin,
    can_write_articles: p.canWriteArticles,
    can_manage_calendar: p.canManageCalendar,
    username: p.username ?? "",
    social_banned: p.socialBanned,
    social_ban_reason: p.socialBanReason ?? "",
    social_banned_at: p.socialBannedAt ? p.socialBannedAt.toISOString() : null,
    created_at: p.createdAt.toISOString(),
  }))
}

/**
 * Apply or lift a social ban (admin only).
 *
 * A social ban blocks liking, commenting, posting, direct messages and friend
 * requests while leaving read access and studio bookings intact. Admins cannot
 * be banned, and an admin cannot ban themselves.
 */
export async function adminSetSocialBan(profileId: string, banned: boolean, reason?: string) {
  const admin = await requireAdmin()

  const rows = await db
    .select({ userId: profiles.userId, isAdmin: profiles.isAdmin, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1)
  const target = rows[0]
  if (!target) throw new Error("Member not found")
  if (target.userId === admin.id) throw new Error("You cannot social ban yourself")
  if (banned && (target.isAdmin || target.role === "admin")) {
    throw new Error("Admins cannot be social banned. Change their role first.")
  }

  await db
    .update(profiles)
    .set({
      socialBanned: banned,
      socialBanReason: banned ? reason?.trim() || null : null,
      socialBannedAt: banned ? new Date() : null,
      socialBannedBy: banned ? admin.id : null,
    })
    .where(eq(profiles.id, profileId))

  return { success: true }
}

/**
 * Set a user's role (admin only). Keeps the `role` column and the legacy
 * boolean flags in sync so every existing gate keeps working:
 * - admin  → role=admin, is_admin=true, is_employee=true
 * - staff  → role=staff, is_admin=false, is_employee=true
 * - user   → role=user,  is_admin=false, is_employee=false, staff perms revoked
 */
export async function adminSetRole(profileId: string, role: "admin" | "staff" | "user") {
  const admin = await requireAdmin()
  if (!["admin", "staff", "user"].includes(role)) throw new Error("Invalid role")

  // Prevent an admin from demoting themselves (avoid lockout).
  if (role !== "admin") {
    const rows = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1)
    if (rows[0]?.userId === admin.id) throw new Error("You cannot change your own admin role")
  }

  if (role === "admin") {
    await db
      .update(profiles)
      .set({ role: "admin", isAdmin: true, isEmployee: true })
      .where(eq(profiles.id, profileId))
  } else if (role === "staff") {
    await db
      .update(profiles)
      .set({ role: "staff", isAdmin: false, isEmployee: true })
      .where(eq(profiles.id, profileId))
  } else {
    await db
      .update(profiles)
      .set({
        role: "user",
        isAdmin: false,
        isEmployee: false,
        canWriteArticles: false,
        canManageCalendar: false,
      })
      .where(eq(profiles.id, profileId))
  }
  return { success: true }
}

export async function adminPromoteUser(profileId: string) {
  await requireAdmin()
  await db.update(profiles).set({ isEmployee: true }).where(eq(profiles.id, profileId))
  return { success: true }
}

export async function adminDemoteUser(profileId: string) {
  await requireAdmin()
  // Removing staff status also revokes every staff-only permission.
  await db
    .update(profiles)
    .set({ isEmployee: false, canWriteArticles: false, canManageCalendar: false })
    .where(eq(profiles.id, profileId))
  return { success: true }
}

type PermissionField = "isEmployee" | "isAdmin" | "canWriteArticles" | "canManageCalendar"

/**
 * Grant or revoke a single permission for a user (admin only).
 * - Turning ON a granular staff permission implies staff status.
 * - Turning OFF staff status revokes all staff-only permissions.
 */
export async function adminSetPermission(
  profileId: string,
  field: PermissionField,
  value: boolean,
) {
  const admin = await requireAdmin()

  const allowed: PermissionField[] = ["isEmployee", "isAdmin", "canWriteArticles", "canManageCalendar"]
  if (!allowed.includes(field)) throw new Error("Invalid permission")

  // Prevent an admin from removing their own admin access (avoid lockout).
  if (field === "isAdmin" && value === false) {
    const rows = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1)
    if (rows[0]?.userId === admin.id) {
      throw new Error("You cannot remove your own admin access")
    }
  }

  const patch: Partial<Record<
    "isEmployee" | "isAdmin" | "canWriteArticles" | "canManageCalendar",
    boolean
  >> = { [field]: value }

  // Granting a staff-only permission implies the person is staff.
  if (value && (field === "canWriteArticles" || field === "canManageCalendar")) {
    patch.isEmployee = true
  }
  // Revoking staff status revokes every staff-only permission.
  if (field === "isEmployee" && value === false) {
    patch.canWriteArticles = false
    patch.canManageCalendar = false
  }

  await db.update(profiles).set(patch).where(eq(profiles.id, profileId))
  return { success: true }
}

// ── Articles ─────────────────────────────────────────────────────────────────

async function articlesWithAuthor(approved: boolean, limit?: number) {
  const q = db
    .select()
    .from(articles)
    .where(eq(articles.approved, approved))
    .orderBy(desc(articles.createdAt))
  const rows = limit ? await q.limit(limit) : await q

  // Fetch author names
  const authorIds = [...new Set(rows.map((a) => a.authorId).filter(Boolean))] as string[]
  let authorMap = new Map<string, { first_name: string; last_name: string }>()
  if (authorIds.length) {
    const profileRows = await db
      .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles)
      .where(inArray(profiles.id, authorIds))
    for (const p of profileRows) {
      authorMap.set(p.id, { first_name: p.firstName, last_name: p.lastName })
    }
  }

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    subtitle: a.subtitle ?? undefined,
    excerpt: a.excerpt ?? undefined,
    tags: (a.tags as string[]) ?? [],
    approved: a.approved,
    created_at: a.createdAt.toISOString(),
    employee_id: a.authorId ?? "",
    slug: a.slug ?? undefined,
    employee: a.authorId ? authorMap.get(a.authorId) : undefined,
  }))
}

export async function adminListPendingArticles() {
  return articlesWithAuthor(false)
}

export async function adminListApprovedArticles() {
  return articlesWithAuthor(true, 10)
}

export async function adminApproveArticle(articleId: string) {
  await requireAdmin()
  await db.update(articles).set({ approved: true }).where(eq(articles.id, articleId))
  return { success: true }
}

export async function adminDeleteArticle(articleId: string) {
  await requireAdmin()
  await db.delete(articles).where(eq(articles.id, articleId))
  return { success: true }
}

// ── Community posts ───────────────────────────────────────────────────────────

export async function adminListCommunityPosts() {
  await requireAdmin()
  const rows = await db
    .select()
    .from(communityPosts)
    .orderBy(desc(communityPosts.createdAt))
    .limit(20)

  const authorIds = [...new Set(rows.map((p) => p.authorId).filter(Boolean))] as string[]
  let authorMap = new Map<string, { first_name: string; last_name: string; profile_pic?: string }>()
  if (authorIds.length) {
    const profileRows = await db
      .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName, profilePic: profiles.profilePic })
      .from(profiles)
      .where(inArray(profiles.id, authorIds))
    for (const p of profileRows) {
      authorMap.set(p.id, { first_name: p.firstName, last_name: p.lastName, profile_pic: p.profilePic ?? undefined })
    }
  }

  const postIds = rows.map((p) => p.id)
  const starMap = new Map<string, number>()
  if (postIds.length) {
    const starRows = await db.select({ postId: postStars.postId }).from(postStars).where(inArray(postStars.postId, postIds))
    for (const s of starRows) starMap.set(s.postId, (starMap.get(s.postId) ?? 0) + 1)
  }

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    pinned: p.pinned,
    created_at: p.createdAt.toISOString(),
    employee_id: p.authorId ?? "",
    star_count: starMap.get(p.id) ?? 0,
    users: p.authorId ? authorMap.get(p.authorId) : undefined,
  }))
}

export async function adminPinPost(postId: string, pinned: boolean) {
  await requireAdmin()
  await db.update(communityPosts).set({ pinned }).where(eq(communityPosts.id, postId))
  return { success: true }
}

export async function adminDeletePost(postId: string) {
  await requireAdmin()
  await db.delete(communityPosts).where(eq(communityPosts.id, postId))
  return { success: true }
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function adminListCategories() {
  await requireAdmin()
  const rows = await db.select().from(communityCategories).orderBy(asc(communityCategories.name))
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon ?? "💬" }))
}

export async function adminCreateCategory(name: string, icon: string) {
  await requireAdmin()
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  await db.insert(communityCategories).values({ name, slug, icon: icon || "💬" })
  return { success: true }
}

export async function adminDeleteCategory(categoryId: string) {
  await requireAdmin()
  await db.delete(communityCategories).where(eq(communityCategories.id, categoryId))
  return { success: true }
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

export async function adminListInbox() {
  await requireAdmin()
  const rows = await db.select().from(inboxMessages).orderBy(desc(inboxMessages.createdAt))
  return rows.map((m) => ({
    id: m.id,
    resend_id: m.resendId ?? null,
    from_email: m.fromEmail ?? "",
    from_name: m.fromName ?? null,
    to_email: m.toEmail ?? "",
    subject: m.subject ?? "(no subject)",
    text_body: m.textBody ?? m.body ?? null,
    html_body: m.htmlBody ?? null,
    is_read: m.isRead,
    replied_at: m.repliedAt?.toISOString() ?? null,
    created_at: m.createdAt.toISOString(),
  }))
}

export async function adminMarkRead(messageId: string) {
  await requireAdmin()
  await db.update(inboxMessages).set({ isRead: true }).where(eq(inboxMessages.id, messageId))
  return { success: true }
}

export async function adminMarkReplied(messageId: string) {
  await requireAdmin()
  await db.update(inboxMessages).set({ repliedAt: new Date() }).where(eq(inboxMessages.id, messageId))
  return { success: true }
}

export async function adminGetMessage(messageId: string) {
  await requireAdmin()
  const rows = await db.select().from(inboxMessages).where(eq(inboxMessages.id, messageId)).limit(1)
  const m = rows[0]
  if (!m) return null
  return {
    id: m.id,
    resend_id: m.resendId ?? null,
    from_email: m.fromEmail ?? "",
    from_name: m.fromName ?? null,
    to_email: m.toEmail ?? "",
    subject: m.subject ?? "(no subject)",
    text_body: m.textBody ?? m.body ?? null,
    html_body: m.htmlBody ?? null,
    is_read: m.isRead,
    replied_at: m.repliedAt?.toISOString() ?? null,
    created_at: m.createdAt.toISOString(),
  }
}

// ── Sponsors ──────────────────────────────────────────────────────────────────

export async function adminListSponsors() {
  await requireAdmin()
  const rows = await db.select().from(sponsors).orderBy(desc(sponsors.createdAt))
  return rows.map((s) => ({
    id: s.id,
    company_name: s.companyName ?? s.name,
    company_email: s.companyEmail ?? "",
    contact_name: s.contactName ?? "",
    package_name: s.packageName ?? "",
    amount_cents: s.amountCents ?? 0,
    status: s.status,
    created_at: s.createdAt.toISOString(),
  }))
}
