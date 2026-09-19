"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bands, bandTracks, profiles } from "@/lib/db/schema"
import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"

export interface BandTrackItem {
  id: string
  bandId: string
  title: string
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
}

export interface TrackInput {
  title: string
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
  allowDownload?: boolean
  tracks: {
    title: string
    audioUrl: string
    durationSeconds?: number
    lyrics?: string
  }[]
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
 * Example input: https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing
 * Output direct URL: https://drive.google.com/uc?export=download&id=1A2B3C4D5E
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
      .select()
      .from(bandTracks)
      .where(eq(bandTracks.bandId, bandId))
      .orderBy(asc(bandTracks.position), asc(bandTracks.createdAt))

    return rows.map((t) => ({
      id: t.id,
      bandId: t.bandId,
      title: t.title,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds || 0,
      albumName: t.albumName,
      coverArtUrl: t.coverArtUrl,
      releaseYear: t.releaseYear,
      genre: t.genre,
      description: t.description,
      lyrics: t.lyrics,
      allowDownload: t.allowDownload,
      playCount: t.playCount || 0,
      position: t.position || 0,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  } catch (err) {
    console.error("Error loading band tracks:", err)
    return []
  }
}

/**
 * Add a track to a band's music catalog.
 */
export async function addBandTrack(bandId: string, input: TrackInput) {
  try {
    await verifyBandOwnershipOrAdmin(bandId)

    if (!input.title?.trim()) {
      return { success: false, error: "Track title is required." }
    }
    if (!input.audioUrl?.trim()) {
      return { success: false, error: "Audio file or streaming URL is required." }
    }

    const cleanAudioUrl = await normalizeAudioUrl(input.audioUrl)

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
        audioUrl: cleanAudioUrl,
        durationSeconds: input.durationSeconds || 0,
        albumName: input.albumName?.trim() || null,
        coverArtUrl: input.coverArtUrl?.trim() || null,
        releaseYear: input.releaseYear?.trim() || null,
        genre: input.genre?.trim() || null,
        description: input.description?.trim() || null,
        lyrics: input.lyrics?.trim() || null,
        allowDownload: input.allowDownload !== false,
        position: nextPos,
      })
      .returning()

    return { success: true, track: newTrack }
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
 * Release an entire album or EP with multiple tracks in one batch.
 */
export async function releaseBandAlbum(bandId: string, input: AlbumReleaseInput) {
  try {
    await verifyBandOwnershipOrAdmin(bandId)

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
      await db.insert(bandTracks).values({
        bandId,
        title: t.title.trim(),
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

