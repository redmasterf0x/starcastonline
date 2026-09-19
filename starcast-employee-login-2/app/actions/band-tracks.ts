"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bands, bandTracks, trackComments, profiles } from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm"
import { headers } from "next/headers"

export interface BandTrackItem {
  id: string
  bandId: string
  title: string
  slug: string | null
  artistName: string | null
  producer: string | null
  featuredArtists: string | null
  audioUrl: string
  durationSeconds: number
  albumName: string | null
  coverArtUrl: string | null
  releaseYear: string | null
  genre: string | null
  description: string | null
  lyrics: string | null
  allowDownload: boolean
  playCount: number
  position: number
  createdAt: string
  updatedAt: string
  bandName?: string | null
  bandSlug?: string | null
  bandLogo?: string | null
}

export interface TrackCommentItem {
  id: string
  trackId: string
  userId: string
  authorName: string
  authorAvatar: string | null
  content: string
  createdAt: string
}

export interface TrackInput {
  title: string
  slug?: string
  artistName?: string
  producer?: string
  featuredArtists?: string
  audioUrl: string
  durationSeconds?: number
  albumName?: string
  coverArtUrl?: string
  releaseYear?: string
  genre?: string
  description?: string
  lyrics?: string
  allowDownload?: boolean
}

export interface AlbumReleaseInput {
  albumTitle: string
  releaseYear?: string
  genre?: string
  coverArtUrl?: string
  producer?: string
  allowDownload?: boolean
  tracks: {
    title: string
    audioUrl: string
    artistName?: string
    producer?: string
    durationSeconds?: number
    lyrics?: string
  }[]
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

async function verifyBandOwnershipOrAdmin(bandId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error("Please sign in to manage music tracks.")

  const bandRows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found.")

  if (band.ownerUserId === user.id) return { band, user }

  // Check admin
  const profileRows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  if (profileRows[0]?.isAdmin) return { band, user }

  throw new Error("You do not have permission to manage music for this act.")
}

/**
 * Helper to normalize and convert Google Drive sharing links to direct audio streaming links.
 */
export async function normalizeAudioUrl(url: string): Promise<string> {
  const trimmed = url.trim()
  if (!trimmed) return ""

  // Match Google Drive file ID
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`
  }

  // Match Google Drive open id
  const driveIdMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/)
  if (trimmed.includes("drive.google.com") && driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`
  }

  // Match Dropbox dl=0 -> dl=1 for direct streaming
  if (trimmed.includes("dropbox.com") && trimmed.includes("dl=0")) {
    return trimmed.replace("dl=0", "dl=1")
  }

  return trimmed
}

/**
 * Fetch all tracks for a band in position order.
 */
export async function getBandTracks(bandId: string): Promise<BandTrackItem[]> {
  try {
    const rows = await db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))
      .where(eq(bandTracks.bandId, bandId))
      .orderBy(asc(bandTracks.position), asc(bandTracks.createdAt))

    return rows.map(({ track: t, band: b }) => ({
      id: t.id,
      bandId: t.bandId,
      title: t.title,
      slug: t.slug,
      artistName: t.artistName || b?.name || null,
      producer: t.producer,
      featuredArtists: t.featuredArtists,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds || 0,
      albumName: t.albumName,
      coverArtUrl: t.coverArtUrl || b?.logoUrl || null,
      releaseYear: t.releaseYear,
      genre: t.genre || b?.genre || null,
      description: t.description,
      lyrics: t.lyrics,
      allowDownload: t.allowDownload,
      playCount: t.playCount || 0,
      position: t.position || 0,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      bandName: b?.name,
      bandSlug: b?.slug,
      bandLogo: b?.logoUrl || undefined,
    }))
  } catch (err) {
    console.error("Error loading band tracks:", err)
    return []
  }
}

/**
 * Fetch a single track by its slug (or fallback to UUID id) with band details and related tracks.
 */
export async function getTrackBySlug(slugOrId: string): Promise<{
  track: BandTrackItem | null
  relatedTracks: BandTrackItem[]
  comments: TrackCommentItem[]
}> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)

    const rows = await db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))
      .where(isUuid ? or(eq(bandTracks.slug, slugOrId), eq(bandTracks.id, slugOrId)) : eq(bandTracks.slug, slugOrId))
      .limit(1)

    if (rows.length === 0) {
      return { track: null, relatedTracks: [], comments: [] }
    }

    const { track: t, band: b } = rows[0]

    const trackItem: BandTrackItem = {
      id: t.id,
      bandId: t.bandId,
      title: t.title,
      slug: t.slug,
      artistName: t.artistName || b?.name || null,
      producer: t.producer,
      featuredArtists: t.featuredArtists,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds || 0,
      albumName: t.albumName,
      coverArtUrl: t.coverArtUrl || b?.logoUrl || null,
      releaseYear: t.releaseYear,
      genre: t.genre || b?.genre || null,
      description: t.description,
      lyrics: t.lyrics,
      allowDownload: t.allowDownload,
      playCount: t.playCount || 0,
      position: t.position || 0,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      bandName: b?.name,
      bandSlug: b?.slug,
      bandLogo: b?.logoUrl || undefined,
    }

    // Fetch related tracks by the same band
    const relatedRows = await db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))
      .where(and(eq(bandTracks.bandId, t.bandId), sql`${bandTracks.id} != ${t.id}`))
      .orderBy(desc(bandTracks.playCount), asc(bandTracks.position))
      .limit(6)

    const relatedTracks: BandTrackItem[] = relatedRows.map(({ track: rt, band: rb }) => ({
      id: rt.id,
      bandId: rt.bandId,
      title: rt.title,
      slug: rt.slug,
      artistName: rt.artistName || rb?.name || null,
      producer: rt.producer,
      featuredArtists: rt.featuredArtists,
      audioUrl: rt.audioUrl,
      durationSeconds: rt.durationSeconds || 0,
      albumName: rt.albumName,
      coverArtUrl: rt.coverArtUrl || rb?.logoUrl || null,
      releaseYear: rt.releaseYear,
      genre: rt.genre,
      description: rt.description,
      lyrics: rt.lyrics,
      allowDownload: rt.allowDownload,
      playCount: rt.playCount || 0,
      position: rt.position || 0,
      createdAt: rt.createdAt.toISOString(),
      updatedAt: rt.updatedAt.toISOString(),
      bandName: rb?.name,
      bandSlug: rb?.slug,
      bandLogo: rb?.logoUrl || undefined,
    }))

    // Fetch track comments
    const commentRows = await db
      .select()
      .from(trackComments)
      .where(eq(trackComments.trackId, t.id))
      .orderBy(desc(trackComments.createdAt))
      .limit(50)

    const comments: TrackCommentItem[] = commentRows.map((c) => ({
      id: c.id,
      trackId: c.trackId,
      userId: c.userId,
      authorName: c.authorName,
      authorAvatar: c.authorAvatar,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    }))

    return { track: trackItem, relatedTracks, comments }
  } catch (err) {
    console.error("Error fetching track by slug:", err)
    return { track: null, relatedTracks: [], comments: [] }
  }
}

/**
 * Fetch all tracks across StarCast for the /music directory.
 */
export async function getAllPublicTracks(options?: {
  genre?: string
  query?: string
  limit?: number
}): Promise<BandTrackItem[]> {
  try {
    const limit = options?.limit || 60

    let baseQuery = db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))
      .where(eq(bands.isPublic, true))

    const rows = await baseQuery
      .orderBy(desc(bandTracks.createdAt))
      .limit(limit)

    let results = rows.map(({ track: t, band: b }) => ({
      id: t.id,
      bandId: t.bandId,
      title: t.title,
      slug: t.slug,
      artistName: t.artistName || b?.name || null,
      producer: t.producer,
      featuredArtists: t.featuredArtists,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds || 0,
      albumName: t.albumName,
      coverArtUrl: t.coverArtUrl || b?.logoUrl || null,
      releaseYear: t.releaseYear,
      genre: t.genre || b?.genre || null,
      description: t.description,
      lyrics: t.lyrics,
      allowDownload: t.allowDownload,
      playCount: t.playCount || 0,
      position: t.position || 0,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      bandName: b?.name,
      bandSlug: b?.slug,
      bandLogo: b?.logoUrl || undefined,
    }))

    if (options?.genre && options.genre !== "all") {
      const g = options.genre.toLowerCase()
      results = results.filter((t) => t.genre?.toLowerCase().includes(g))
    }

    if (options?.query && options.query.trim()) {
      const q = options.query.toLowerCase().trim()
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artistName?.toLowerCase().includes(q) ||
          t.producer?.toLowerCase().includes(q) ||
          t.albumName?.toLowerCase().includes(q) ||
          t.bandName?.toLowerCase().includes(q)
      )
    }

    return results
  } catch (err) {
    console.error("Error loading public tracks:", err)
    return []
  }
}

/**
 * Add a track to a band's music catalog.
 */
export async function addBandTrack(bandId: string, input: TrackInput) {
  try {
    const { band } = await verifyBandOwnershipOrAdmin(bandId)

    if (!input.title?.trim()) {
      return { success: false, error: "Track title is required." }
    }
    if (!input.audioUrl?.trim()) {
      return { success: false, error: "Audio file or streaming URL is required." }
    }

    const cleanAudioUrl = await normalizeAudioUrl(input.audioUrl)

    // Generate unique slug
    const baseSlug = slugify(input.title.trim()) || "track"
    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const uniqueSlug = `${baseSlug}-${randomSuffix}`

    // Determine next position
    const currentTracks = await db
      .select({ position: bandTracks.position })
      .from(bandTracks)
      .where(eq(bandTracks.bandId, bandId))
      .orderBy(desc(bandTracks.position))
      .limit(1)

    const nextPos = (currentTracks[0]?.position ?? -1) + 1

    const [newTrack] = await db
      .insert(bandTracks)
      .values({
        bandId,
        title: input.title.trim(),
        slug: uniqueSlug,
        artistName: input.artistName?.trim() || band.name || null,
        producer: input.producer?.trim() || null,
        featuredArtists: input.featuredArtists?.trim() || null,
        audioUrl: cleanAudioUrl,
        durationSeconds: input.durationSeconds || 0,
        albumName: input.albumName?.trim() || null,
        coverArtUrl: input.coverArtUrl?.trim() || null,
        releaseYear: input.releaseYear?.trim() || new Date().getFullYear().toString(),
        genre: input.genre?.trim() || null,
        description: input.description?.trim() || null,
        lyrics: input.lyrics?.trim() || null,
        allowDownload: input.allowDownload !== false,
        position: nextPos,
      })
      .returning()

    // Ensure catalog is enabled
    await db
      .update(bands)
      .set({ musicCatalogEnabled: true, updatedAt: new Date() })
      .where(eq(bands.id, bandId))

    return { success: true, track: newTrack, slug: uniqueSlug }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add track." }
  }
}

/**
 * Update an existing track.
 */
export async function updateBandTrack(trackId: string, input: Partial<TrackInput>) {
  try {
    const existing = await db
      .select()
      .from(bandTracks)
      .where(eq(bandTracks.id, trackId))
      .limit(1)

    if (!existing[0]) return { success: false, error: "Track not found." }

    await verifyBandOwnershipOrAdmin(existing[0].bandId)

    const cleanAudioUrl = input.audioUrl ? await normalizeAudioUrl(input.audioUrl) : existing[0].audioUrl

    await db
      .update(bandTracks)
      .set({
        title: input.title !== undefined ? input.title.trim() : existing[0].title,
        artistName: input.artistName !== undefined ? (input.artistName?.trim() || null) : existing[0].artistName,
        producer: input.producer !== undefined ? (input.producer?.trim() || null) : existing[0].producer,
        featuredArtists:
          input.featuredArtists !== undefined ? (input.featuredArtists?.trim() || null) : existing[0].featuredArtists,
        audioUrl: cleanAudioUrl,
        durationSeconds: input.durationSeconds !== undefined ? input.durationSeconds : existing[0].durationSeconds,
        albumName: input.albumName !== undefined ? (input.albumName?.trim() || null) : existing[0].albumName,
        coverArtUrl: input.coverArtUrl !== undefined ? (input.coverArtUrl?.trim() || null) : existing[0].coverArtUrl,
        releaseYear: input.releaseYear !== undefined ? (input.releaseYear?.trim() || null) : existing[0].releaseYear,
        genre: input.genre !== undefined ? (input.genre?.trim() || null) : existing[0].genre,
        description: input.description !== undefined ? (input.description?.trim() || null) : existing[0].description,
        lyrics: input.lyrics !== undefined ? (input.lyrics?.trim() || null) : existing[0].lyrics,
        allowDownload: input.allowDownload !== undefined ? input.allowDownload : existing[0].allowDownload,
        updatedAt: new Date(),
      })
      .where(eq(bandTracks.id, trackId))

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update track." }
  }
}

/**
 * Delete a track.
 */
export async function deleteBandTrack(trackId: string) {
  try {
    const existing = await db
      .select()
      .from(bandTracks)
      .where(eq(bandTracks.id, trackId))
      .limit(1)

    if (!existing[0]) return { success: false, error: "Track not found." }

    await verifyBandOwnershipOrAdmin(existing[0].bandId)

    await db.delete(bandTracks).where(eq(bandTracks.id, trackId))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete track." }
  }
}

/**
 * Reorder tracks for a band.
 */
export async function reorderBandTracks(bandId: string, orderedTrackIds: string[]) {
  try {
    await verifyBandOwnershipOrAdmin(bandId)

    await Promise.all(
      orderedTrackIds.map((id, index) =>
        db
          .update(bandTracks)
          .set({ position: index, updatedAt: new Date() })
          .where(and(eq(bandTracks.id, id), eq(bandTracks.bandId, bandId)))
      )
    )

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to reorder tracks." }
  }
}

/**
 * Toggle the music catalog tab on/off for a band page, and update custom catalog title.
 */
export async function toggleBandMusicCatalog(bandId: string, enabled: boolean, title?: string) {
  try {
    await verifyBandOwnershipOrAdmin(bandId)

    await db
      .update(bands)
      .set({
        musicCatalogEnabled: enabled,
        musicCatalogTitle: title?.trim() || "Original Music & Tracks",
        updatedAt: new Date(),
      })
      .where(eq(bands.id, bandId))

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to toggle music catalog." }
  }
}

/**
 * Release an entire album or EP with multiple tracks in one batch.
 */
export async function releaseBandAlbum(bandId: string, input: AlbumReleaseInput) {
  try {
    const { band } = await verifyBandOwnershipOrAdmin(bandId)

    if (!input.albumTitle?.trim()) {
      return { success: false, error: "Album title is required." }
    }
    if (!input.tracks || input.tracks.length === 0) {
      return { success: false, error: "At least one track is required for an album release." }
    }

    // Determine next starting position
    const currentTracks = await db
      .select({ position: bandTracks.position })
      .from(bandTracks)
      .where(eq(bandTracks.bandId, bandId))
      .orderBy(desc(bandTracks.position))
      .limit(1)

    let startPos = (currentTracks[0]?.position ?? -1) + 1

    for (const t of input.tracks) {
      if (!t.title?.trim() || !t.audioUrl?.trim()) continue

      const cleanAudioUrl = await normalizeAudioUrl(t.audioUrl)
      const baseSlug = slugify(t.title.trim()) || "track"
      const randomSuffix = Math.random().toString(36).substring(2, 7)
      const uniqueSlug = `${baseSlug}-${randomSuffix}`

      await db.insert(bandTracks).values({
        bandId,
        title: t.title.trim(),
        slug: uniqueSlug,
        artistName: t.artistName?.trim() || band.name || null,
        producer: t.producer?.trim() || input.producer?.trim() || null,
        audioUrl: cleanAudioUrl,
        durationSeconds: t.durationSeconds || 0,
        albumName: input.albumTitle.trim(),
        coverArtUrl: input.coverArtUrl?.trim() || null,
        releaseYear: input.releaseYear?.trim() || new Date().getFullYear().toString(),
        genre: input.genre?.trim() || null,
        lyrics: t.lyrics?.trim() || null,
        allowDownload: input.allowDownload !== false,
        position: startPos++,
      })
    }

    // Auto-enable music catalog if disabled
    await db
      .update(bands)
      .set({
        musicCatalogEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(bands.id, bandId))

    return { success: true, count: input.tracks.length }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to release album." }
  }
}

/**
 * Increment play count when someone streams a song.
 */
export async function incrementTrackPlay(trackId: string) {
  try {
    const rows = await db
      .select({ playCount: bandTracks.playCount })
      .from(bandTracks)
      .where(eq(bandTracks.id, trackId))
      .limit(1)

    if (rows[0]) {
      await db
        .update(bandTracks)
        .set({ playCount: (rows[0].playCount || 0) + 1 })
        .where(eq(bandTracks.id, trackId))
    }
  } catch {
    // Non-blocking fire & forget
  }
}

/**
 * Add a fan discussion comment on a standalone track page.
 */
export async function addTrackComment(trackId: string, content: string) {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: "Please sign in to comment on this song." }
    if (!content.trim()) return { success: false, error: "Comment cannot be empty." }

    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
    const profile = profileRows[0]
    const authorName =
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      profile?.username ||
      user.name ||
      "StarCast Fan"
    const authorAvatar = profile?.profilePic || user.image || null

    const [comment] = await db
      .insert(trackComments)
      .values({
        trackId,
        userId: user.id,
        authorName,
        authorAvatar,
        content: content.trim(),
      })
      .returning()

    return {
      success: true,
      comment: {
        id: comment.id,
        trackId: comment.trackId,
        userId: comment.userId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      },
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add comment." }
  }
}

/**
 * Delete a track comment (by author or admin).
 */
export async function deleteTrackComment(commentId: string) {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const [existing] = await db.select().from(trackComments).where(eq(trackComments.id, commentId)).limit(1)
    if (!existing) return { success: false, error: "Comment not found." }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
    const isAdmin = profile?.isAdmin || profile?.isEmployee

    if (existing.userId !== user.id && !isAdmin) {
      return { success: false, error: "You can only delete your own comments." }
    }

    await db.delete(trackComments).where(eq(trackComments.id, commentId))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete comment." }
  }
}

