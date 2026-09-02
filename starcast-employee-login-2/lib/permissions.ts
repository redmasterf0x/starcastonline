import "server-only"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

/**
 * Resolved permission set for the current viewer.
 *
 * `isAdmin` implies every granular permission — admins can do anything, so
 * `canWriteArticles` and `canManageCalendar` are OR-ed with `isAdmin` here so
 * callers never have to remember to also check for admin.
 */
export type AppRole = "admin" | "staff" | "user"

export type ViewerPermissions = {
  userId: string
  profileId: string | null
  role: AppRole
  isStaff: boolean // staff OR admin (can access the operational studio dashboard)
  isEmployee: boolean
  isAdmin: boolean
  canWriteArticles: boolean
  canManageCalendar: boolean
  /** True when an admin has revoked this member's social privileges. */
  socialBanned: boolean
  socialBanReason: string | null
  /** False until the member finishes the onboarding wizard. */
  onboardingCompleted: boolean
}

/** Thrown when a socially banned member attempts a social action. */
export const SOCIAL_BAN_MESSAGE =
  "Your social privileges have been suspended. You can still browse and manage bookings, but you cannot post, comment, like, or message other members."

/** Returns the current viewer's permissions, or null if signed out. */
export async function getViewerPermissions(): Promise<ViewerPermissions | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const rows = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      isEmployee: profiles.isEmployee,
      isAdmin: profiles.isAdmin,
      canWriteArticles: profiles.canWriteArticles,
      canManageCalendar: profiles.canManageCalendar,
      socialBanned: profiles.socialBanned,
      socialBanReason: profiles.socialBanReason,
      onboardingCompleted: profiles.onboardingCompleted,
    })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  const p = rows[0]
  // The boolean flags and the role column are reconciled here so legacy data
  // (flags set before the role column existed) still resolves correctly.
  const isAdmin = (p?.isAdmin ?? false) || p?.role === "admin"
  const isStaff = isAdmin || (p?.isEmployee ?? false) || p?.role === "staff"
  const role: AppRole = isAdmin ? "admin" : isStaff ? "staff" : "user"

  return {
    userId: session.user.id,
    profileId: p?.id ?? null,
    role,
    isStaff,
    isEmployee: p?.isEmployee ?? false,
    isAdmin,
    canWriteArticles: isAdmin || (p?.canWriteArticles ?? false),
    canManageCalendar: isAdmin || (p?.canManageCalendar ?? false),
    // Admins can never be socially banned (prevents locking out moderators).
    socialBanned: !isAdmin && (p?.socialBanned ?? false),
    socialBanReason: p?.socialBanReason ?? null,
    onboardingCompleted: p?.onboardingCompleted ?? false,
  }
}

/** Throws Unauthorized if signed out, then returns the viewer's permissions. */
export async function requireViewer(): Promise<ViewerPermissions> {
  const viewer = await getViewerPermissions()
  if (!viewer) throw new Error("Unauthorized")
  return viewer
}

/**
 * Requires the viewer to be signed in AND not socially banned.
 *
 * Use this for every interaction that touches another member: posting,
 * commenting, liking/starring, direct messages, and friend requests. Banned
 * members keep read access and can still manage their own bookings.
 */
export async function requireSocialPrivileges(): Promise<ViewerPermissions> {
  const viewer = await requireViewer()
  if (viewer.socialBanned) throw new Error(SOCIAL_BAN_MESSAGE)
  return viewer
}

/**
 * Throws if the given auth user id belongs to a socially banned member.
 *
 * For call sites that already resolved a Better Auth user id and don't need the
 * full permission set. Admins are exempt.
 */
export async function assertSocialAllowed(userId: string): Promise<void> {
  const rows = await db
    .select({ socialBanned: profiles.socialBanned, isAdmin: profiles.isAdmin, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
  const p = rows[0]
  if (!p) return
  const isAdmin = p.isAdmin || p.role === "admin"
  if (!isAdmin && p.socialBanned) throw new Error(SOCIAL_BAN_MESSAGE)
}

/** Requires permission to create/edit articles. */
export async function requireArticleWriter(): Promise<ViewerPermissions> {
  const viewer = await requireViewer()
  if (!viewer.canWriteArticles) throw new Error("Forbidden")
  return viewer
}

/** Requires permission to add/edit staff calendar (production) events. */
export async function requireCalendarManager(): Promise<ViewerPermissions> {
  const viewer = await requireViewer()
  if (!viewer.canManageCalendar) throw new Error("Forbidden")
  return viewer
}

/** Requires the viewer to be staff or admin (access to the studio operations dashboard). */
export async function requireStaff(): Promise<ViewerPermissions> {
  const viewer = await requireViewer()
  if (!viewer.isStaff) throw new Error("Forbidden")
  return viewer
}

/** Requires the viewer to be an admin (highest privilege: revenue, deletes, role management). */
export async function requireAdmin(): Promise<ViewerPermissions> {
  const viewer = await requireViewer()
  if (!viewer.isAdmin) throw new Error("Forbidden")
  return viewer
}
