"use server"

import { db } from "@/lib/db"
import { bands } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getViewerPermissions, requireViewer, requireStaff } from "@/lib/permissions"

export type BandInput = {
  name: string
  type?: string // "band" | "artist"
  genre?: string
  bio?: string
  contactEmail?: string
  contactPhone?: string
  logoUrl?: string
  links?: any[]
}

function serialize(b: typeof bands.$inferSelect) {
  return {
    id: b.id,
    owner_user_id: b.ownerUserId,
    name: b.name,
    type: b.type ?? "band",
    slug: b.slug ?? "",
    is_public: b.isPublic,
    genre: b.genre ?? "",
    bio: b.bio ?? "",
    contact_email: b.contactEmail ?? "",
    contact_phone: b.contactPhone ?? "",
    logo_url: b.logoUrl ?? "",
    links: b.links ?? [],
    has_active_pass: b.hasActivePass,
    pass_expires_at: b.passExpiresAt ? b.passExpiresAt.toISOString() : null,
    youtube_agreement_signed: b.youtubeAgreementSigned,
    youtube_agreement_signed_at: b.youtubeAgreementSignedAt
      ? b.youtubeAgreementSignedAt.toISOString()
      : null,
    created_at: b.createdAt.toISOString(),
  }
}

/** The current user's own bands (artist portal). */
export async function getMyBands() {
  const viewer = await requireViewer()
  const rows = await db
    .select()
    .from(bands)
    .where(eq(bands.ownerUserId, viewer.userId))
    .orderBy(desc(bands.createdAt))
  return rows.map(serialize)
}

/** All bands (staff/admin operations + admin management). */
export async function listAllBands() {
  await requireStaff()
  const rows = await db.select().from(bands).orderBy(desc(bands.createdAt))
  return rows.map(serialize)
}

export async function getBand(id: string) {
  const viewer = await requireViewer()
  const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
  const b = rows[0]
  if (!b) return null
  // Owners can read their own band; staff/admin can read any band.
  if (b.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")
  return serialize(b)
}

/** Turn a band name into a URL-safe base slug. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
}

/** Find a slug not already taken, appending -2, -3, ... on collision. */
async function uniqueSlug(base: string) {
  const root = base || "band"
  let candidate = root
  let n = 1
  // Loop until we find a free slug. Bounded in practice by number of collisions.
  while (true) {
    const existing = await db.select({ id: bands.id }).from(bands).where(eq(bands.slug, candidate)).limit(1)
    if (existing.length === 0) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

/**
 * Create a band. Any signed-in user can create their own band, but each user is
 * limited to a single band/artist page.
 */
export async function createBand(input: BandInput) {
  const viewer = await requireViewer()
  if (!input.name?.trim()) throw new Error("Band name is required")

  // One page per account: reject if the user already owns a band.
  const existing = await db
    .select({ id: bands.id })
    .from(bands)
    .where(eq(bands.ownerUserId, viewer.userId))
    .limit(1)
  if (existing.length > 0) throw new Error("You can only create one band page per account.")

  const slug = await uniqueSlug(slugify(input.name))
  const allowedTypes = ["band", "artist", "producer", "dj", "podcast"]
  const [row] = await db
    .insert(bands)
    .values({
      ownerUserId: viewer.userId,
      name: input.name.trim(),
      type: input.type && allowedTypes.includes(input.type) ? input.type : "band",
      slug,
      genre: input.genre?.trim() || null,
      bio: input.bio?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
      links: input.links ?? [],
    })
    .returning()
  revalidatePath("/portal")
  revalidatePath("/admin")
  return serialize(row)
}

/** Toggle whether a band's public page is visible. Owner or staff/admin. */
export async function setBandPublic(id: string, isPublic: boolean) {
  const viewer = await requireViewer()
  const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
  const b = rows[0]
  if (!b) throw new Error("Band not found")
  if (b.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")
  await db.update(bands).set({ isPublic, updatedAt: new Date() }).where(eq(bands.id, id))
  revalidatePath("/portal")
  if (b.slug) revalidatePath(`/bands/${b.slug}`)
  return { success: true }
}

/** Update a band's profile. Owner or staff/admin. */
export async function updateBand(id: string, input: BandInput) {
  const viewer = await requireViewer()
  const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
  const b = rows[0]
  if (!b) throw new Error("Band not found")
  if (b.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")
  const allowedTypes = ["band", "artist", "producer", "dj", "podcast"]
  await db
    .update(bands)
    .set({
      name: input.name?.trim() || b.name,
      type: input.type && allowedTypes.includes(input.type) ? input.type : b.type,
      genre: input.genre?.trim() || null,
      bio: input.bio?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
      links: input.links ?? b.links,
      updatedAt: new Date(),
    })
    .where(eq(bands.id, id))
  revalidatePath("/portal")
  revalidatePath("/admin")
  return { success: true }
}

/** Band signs the YouTube content agreement (owner only). */
export async function signYoutubeAgreement(bandId: string) {
  const viewer = await requireViewer()
  const rows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const b = rows[0]
  if (!b) throw new Error("Band not found")
  if (b.ownerUserId !== viewer.userId) throw new Error("Forbidden")
  await db
    .update(bands)
    .set({ youtubeAgreementSigned: true, youtubeAgreementSignedAt: new Date(), updatedAt: new Date() })
    .where(eq(bands.id, bandId))
  revalidatePath("/portal")
  return { success: true }
}

/** Staff/admin grant or update a studio pass for a band. */
export async function setBandPass(bandId: string, active: boolean, expiresAt: string | null) {
  await requireStaff()
  await db
    .update(bands)
    .set({
      hasActivePass: active,
      passExpiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(bands.id, bandId))
  revalidatePath("/admin")
  revalidatePath("/staff")
  revalidatePath("/portal")
  return { success: true }
}

/** Viewer context for the portal: who they are + whether they have any bands. */
export async function getPortalViewer() {
  const viewer = await getViewerPermissions()
  if (!viewer) return null
  return { userId: viewer.userId, role: viewer.role, isStaff: viewer.isStaff, isAdmin: viewer.isAdmin }
}
