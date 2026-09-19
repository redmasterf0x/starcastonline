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
  bannerUrl?: string
  links?: any[]
}

function toIso(d: any): string | null {
  if (!d) return null
  if (typeof d === "string") return d
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString()
  try {
    const parsed = new Date(d)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString()
  } catch {
    return null
  }
}

function serialize(b: typeof bands.$inferSelect) {
  return {
    id: b.id,
    owner_user_id: b.ownerUserId,
    name: b.name,
    type: b.type ?? "band",
    slug: b.slug ?? "",
    is_public: Boolean(b.isPublic),
    genre: b.genre ?? "",
    bio: b.bio ?? "",
    contact_email: b.contactEmail ?? "",
    contact_phone: b.contactPhone ?? "",
    logo_url: b.logoUrl ?? "",
    banner_url: b.bannerUrl ?? "",
    links: Array.isArray(b.links) ? b.links : [],
    has_active_pass: Boolean(b.hasActivePass),
    pass_expires_at: toIso(b.passExpiresAt),
    youtube_agreement_signed: Boolean(b.youtubeAgreementSigned),
    youtube_agreement_signed_at: toIso(b.youtubeAgreementSignedAt),
    ticketing_status: b.ticketingStatus ?? "none",
    ticketing_application_notes: b.ticketingApplicationNotes ?? null,
    ticketing_applied_at: toIso(b.ticketingAppliedAt),
    stripe_account_id: b.stripeAccountId ?? null,
    stripe_account_status: b.stripeAccountStatus ?? "not_connected",
    music_catalog_enabled: Boolean(b.musicCatalogEnabled),
    music_catalog_title: b.musicCatalogTitle ?? "Original Music & Tracks",
    created_at: toIso(b.createdAt) || new Date().toISOString(),
  }
}

/** The current user's own bands (artist portal). */
export async function getMyBands() {
  try {
    const viewer = await requireViewer()
    const rows = await db
      .select()
      .from(bands)
      .where(eq(bands.ownerUserId, viewer.userId))
      .orderBy(desc(bands.createdAt))
    return rows.map(serialize)
  } catch (err) {
    console.error("getMyBands error:", err)
    return []
  }
}

/** All bands (staff/admin operations + admin management). */
export async function listAllBands() {
  try {
    await requireStaff()
    const rows = await db.select().from(bands).orderBy(desc(bands.createdAt))
    return rows.map(serialize)
  } catch (err) {
    console.error("listAllBands error:", err)
    return []
  }
}

export async function getBand(id: string) {
  try {
    const viewer = await requireViewer()
    const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
    const b = rows[0]
    if (!b) return null
    // Owners can read their own band; staff/admin can read any band.
    if (b.ownerUserId !== viewer.userId && !viewer.isStaff) return null
    return serialize(b)
  } catch (err) {
    console.error("getBand error:", err)
    return null
  }
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
  try {
    const viewer = await requireViewer()
    if (!input.name?.trim()) {
      return { success: false, error: "Band name is required" }
    }

    // One page per account: strictly enforce one band or artist page per account.
    const existing = await db
      .select({ id: bands.id, name: bands.name })
      .from(bands)
      .where(eq(bands.ownerUserId, viewer.userId))
      .limit(1)
    if (existing.length > 0) {
      return {
        success: false,
        error: `You already have an active profile ("${existing[0].name}"). Each account can only create one band or artist page.`,
        existingBandId: existing[0].id,
      }
    }

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
        bannerUrl: input.bannerUrl?.trim() || null,
        links: Array.isArray(input.links) ? input.links : [],
      })
      .returning()
    revalidatePath("/portal")
    revalidatePath("/admin")
    revalidatePath("/bands")
    const s = serialize(row)
    return { success: true, band: s, ...s }
  } catch (err: any) {
    console.error("createBand error:", err)
    return { success: false, error: err?.message || "Failed to create band" }
  }
}

/** Toggle whether a band's public page is visible. Owner or staff/admin. */
export async function setBandPublic(id: string, isPublic: boolean) {
  try {
    const viewer = await requireViewer()
    const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
    const b = rows[0]
    if (!b) return { success: false, error: "Band not found" }
    if (b.ownerUserId !== viewer.userId && !viewer.isStaff) return { success: false, error: "Forbidden" }
    await db.update(bands).set({ isPublic, updatedAt: new Date() }).where(eq(bands.id, id))
    revalidatePath("/portal")
    revalidatePath("/bands")
    if (b.slug) revalidatePath(`/bands/${b.slug}`)
    return { success: true }
  } catch (err: any) {
    console.error("setBandPublic error:", err)
    return { success: false, error: err?.message || "Failed to update band visibility" }
  }
}

/** Update a band's profile. Owner or staff/admin. */
export async function updateBand(id: string, input: BandInput) {
  try {
    const viewer = await requireViewer()
    const rows = await db.select().from(bands).where(eq(bands.id, id)).limit(1)
    const b = rows[0]
    if (!b) return { success: false, error: "Band not found" }
    if (b.ownerUserId !== viewer.userId && !viewer.isStaff) return { success: false, error: "Forbidden" }
    const allowedTypes = ["band", "artist", "producer", "dj", "podcast"]
    await db
      .update(bands)
      .set({
        name: input.name?.trim() || b.name,
        type: input.type && allowedTypes.includes(input.type) ? input.type : b.type,
        genre: input.genre !== undefined ? (input.genre?.trim() || null) : b.genre,
        bio: input.bio !== undefined ? (input.bio?.trim() || null) : b.bio,
        contactEmail: input.contactEmail !== undefined ? (input.contactEmail?.trim() || null) : b.contactEmail,
        contactPhone: input.contactPhone !== undefined ? (input.contactPhone?.trim() || null) : b.contactPhone,
        logoUrl: input.logoUrl !== undefined ? (input.logoUrl?.trim() || null) : b.logoUrl,
        bannerUrl: input.bannerUrl !== undefined ? (input.bannerUrl?.trim() || null) : b.bannerUrl,
        links: Array.isArray(input.links) ? input.links : b.links,
        updatedAt: new Date(),
      })
      .where(eq(bands.id, id))
    revalidatePath("/portal")
    revalidatePath("/admin")
    revalidatePath("/bands")
    if (b.slug) revalidatePath(`/bands/${b.slug}`)
    return { success: true }
  } catch (err: any) {
    console.error("updateBand error:", err)
    return { success: false, error: err?.message || "Failed to update band" }
  }
}

/** Band signs the YouTube content agreement (owner only). */
export async function signYoutubeAgreement(bandId: string) {
  try {
    const viewer = await requireViewer()
    const rows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
    const b = rows[0]
    if (!b) return { success: false, error: "Band not found" }
    if (b.ownerUserId !== viewer.userId) return { success: false, error: "Forbidden" }
    await db
      .update(bands)
      .set({ youtubeAgreementSigned: true, youtubeAgreementSignedAt: new Date(), updatedAt: new Date() })
      .where(eq(bands.id, bandId))
    revalidatePath("/portal")
    return { success: true }
  } catch (err: any) {
    console.error("signYoutubeAgreement error:", err)
    return { success: false, error: err?.message || "Failed to sign agreement" }
  }
}

/** Staff/admin grant or update a studio pass for a band. */
export async function setBandPass(bandId: string, active: boolean, expiresAt: string | null) {
  try {
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
  } catch (err: any) {
    console.error("setBandPass error:", err)
    return { success: false, error: err?.message || "Failed to update studio pass" }
  }
}

/** Viewer context for the portal: who they are + whether they have any bands. */
export async function getPortalViewer() {
  try {
    const viewer = await getViewerPermissions()
    if (!viewer) return null
    return { userId: viewer.userId, role: viewer.role, isStaff: viewer.isStaff, isAdmin: viewer.isAdmin }
  } catch (err) {
    console.error("getPortalViewer error:", err)
    return null
  }
}
