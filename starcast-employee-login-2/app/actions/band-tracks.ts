"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bands, bandTracks, bandPosts, trackComments, profiles, trackLikes, albumLikes } from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { scanAudioForCopyrightAndDuplicates, generateProofOfMasterHash } from "@/lib/audio-fingerprint"

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
  audioHash?: string | null
  fingerprint?: string | null
  fingerprintAlgorithm?: string | null
  copyrightStatus?: string | null
  copyrightDetails?: any
  proofOfMasterHash?: string | null
  likeCount?: number
  isLiked?: boolean
  canEdit?: boolean
}

export interface BandAlbumItem {
  albumName: string
  bandId: string
  bandName?: string | null
  bandSlug?: string | null
  bandLogo?: string | null
  artistName?: string | null
  producer?: string | null
  coverArtUrl?: string | null
  releaseYear?: string | null
  genre?: string | null
  tracks: BandTrackItem[]
  likeCount: number
  isLiked: boolean
  canEdit?: boolean
}

export interface AlbumUpdateInput {
  newAlbumName?: string
  coverArtUrl?: string
  genre?: string
  releaseYear?: string
  producer?: string
  artistName?: string
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
  audioHash?: string | null
  fingerprint?: string | null
  fingerprintAlgorithm?: string | null
  copyrightStatus?: string | null
  copyrightDetails?: any
  proofOfMasterHash?: string | null
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
    audioHash?: string
    fingerprint?: string
    proofOfMasterHash?: string
    copyrightStatus?: string
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
  const p = profileRows[0]
  const isAdmin = Boolean(p?.isAdmin || p?.role === "admin")
  if (isAdmin) return { band, user }

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

/**
 * Attaches real-time like counts, viewer like states, and edit privileges to a list of tracks.
 */
export async function attachTrackLikesAndPerms(
  tracks: BandTrackItem[],
  viewerId: string | null,
  isAdmin: boolean
): Promise<BandTrackItem[]> {
  if (tracks.length === 0) return tracks

  const trackIds = tracks.map((t) => t.id)

  const countMap = new Map<string, number>()
  const likedSet = new Set<string>()

  try {
    const countRows = await db
      .select({
        trackId: trackLikes.trackId,
        count: sql<number>`count(*)::int`,
      })
      .from(trackLikes)
      .where(inArray(trackLikes.trackId, trackIds))
      .groupBy(trackLikes.trackId)

    for (const r of countRows) {
      countMap.set(r.trackId, r.count)
    }

    if (viewerId) {
      const userLikes = await db
        .select({ trackId: trackLikes.trackId })
        .from(trackLikes)
        .where(and(eq(trackLikes.userId, viewerId), inArray(trackLikes.trackId, trackIds)))
      for (const ul of userLikes) {
        likedSet.add(ul.trackId)
      }
    }
  } catch (err) {
    console.error("Error reading track likes:", err)
  }

  const bandIds = Array.from(new Set(tracks.map((t) => t.bandId).filter(Boolean)))
  const bandOwnerMap = new Map<string, string>()

  if (bandIds.length > 0) {
    try {
      const bandRows = await db
        .select({ id: bands.id, ownerUserId: bands.ownerUserId })
        .from(bands)
        .where(inArray(bands.id, bandIds))
      for (const b of bandRows) {
        bandOwnerMap.set(b.id, b.ownerUserId)
      }
    } catch (err) {
      console.error("Error reading band owners:", err)
    }
  }

  return tracks.map((t) => {
    const ownerUserId = bandOwnerMap.get(t.bandId)
    const canEdit = Boolean(isAdmin || (viewerId && ownerUserId && ownerUserId === viewerId))
    return {
      ...t,
      likeCount: countMap.get(t.id) ?? 0,
      isLiked: likedSet.has(t.id),
      canEdit,
    }
  })
}

export async function getAlbumLikesInfo(
  albums: Array<{ bandId: string; albumName: string }>,
  viewerId: string | null
): Promise<Map<string, { count: number; isLiked: boolean }>> {
  const result = new Map<string, { count: number; isLiked: boolean }>()
  if (albums.length === 0) return result

  for (const a of albums) {
    result.set(`${a.bandId}:::${a.albumName}`, { count: 0, isLiked: false })
  }

  const bandIds = Array.from(new Set(albums.map((a) => a.bandId)))
  const albumNames = Array.from(new Set(albums.map((a) => a.albumName)))

  try {
    const countRows = await db
      .select({
        bandId: albumLikes.bandId,
        albumName: albumLikes.albumName,
        count: sql<number>`count(*)::int`,
      })
      .from(albumLikes)
      .where(and(inArray(albumLikes.bandId, bandIds), inArray(albumLikes.albumName, albumNames)))
      .groupBy(albumLikes.bandId, albumLikes.albumName)

    for (const r of countRows) {
      const key = `${r.bandId}:::${r.albumName}`
      const existing = result.get(key)
      if (existing) {
        existing.count = r.count
      }
    }

    if (viewerId) {
      const userLikes = await db
        .select({
          bandId: albumLikes.bandId,
          albumName: albumLikes.albumName,
        })
        .from(albumLikes)
        .where(
          and(
            eq(albumLikes.userId, viewerId),
            inArray(albumLikes.bandId, bandIds),
            inArray(albumLikes.albumName, albumNames)
          )
        )

      for (const ul of userLikes) {
        const key = `${ul.bandId}:::${ul.albumName}`
        const existing = result.get(key)
        if (existing) {
          existing.isLiked = true
        }
      }
    }
  } catch (err) {
    console.error("Error fetching album likes info:", err)
  }

  return result
}

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

    const existingAudioUrls = new Set<string>()

    const results: BandTrackItem[] = rows.map(({ track: t, band: b }) => {
      existingAudioUrls.add(t.audioUrl.trim())
      return {
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
        audioHash: t.audioHash,
        fingerprint: t.fingerprint,
        fingerprintAlgorithm: t.fingerprintAlgorithm,
        copyrightStatus: t.copyrightStatus || "clean",
        copyrightDetails: t.copyrightDetails || {},
        proofOfMasterHash: t.proofOfMasterHash,
      }
    })

    // Also fetch any audio tracks attached to band_posts for this band
    try {
      const postRows = await db
        .select({
          post: bandPosts,
          band: bands,
        })
        .from(bandPosts)
        .leftJoin(bands, eq(bandPosts.bandId, bands.id))
        .where(
          and(
            eq(bandPosts.bandId, bandId),
            sql`${bandPosts.audioTracks} IS NOT NULL AND jsonb_array_length(${bandPosts.audioTracks}) > 0`
          )
        )
        .orderBy(desc(bandPosts.createdAt))

      for (const { post: p, band: b } of postRows) {
        const rawTracks = p.audioTracks as any[]
        if (Array.isArray(rawTracks)) {
          for (let i = 0; i < rawTracks.length; i++) {
            const rt = rawTracks[i]
            const audioUrl = (rt.audio_url || rt.audioUrl || "").trim()
            if (!audioUrl || existingAudioUrls.has(audioUrl)) continue

            existingAudioUrls.add(audioUrl)
            results.push({
              id: rt.id || p.id,
              bandId: p.bandId,
              title: rt.title || "Untitled Track",
              slug: rt.slug || null,
              artistName: rt.artist_name || rt.artistName || b?.name || null,
              producer: rt.producer || null,
              featuredArtists: rt.featured_artists || rt.featuredArtists || null,
              audioUrl: audioUrl,
              durationSeconds: rt.duration_seconds || rt.durationSeconds || 0,
              albumName: rt.album_name || rt.albumName || null,
              coverArtUrl: rt.cover_art_url || rt.coverArtUrl || b?.logoUrl || null,
              releaseYear: rt.release_year || rt.releaseYear || null,
              genre: rt.genre || b?.genre || null,
              description: p.content || null,
              lyrics: rt.lyrics || null,
              allowDownload: rt.allow_download !== false && rt.allowDownload !== false,
              playCount: 0,
              position: results.length,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.createdAt.toISOString(),
              bandName: b?.name,
              bandSlug: b?.slug,
              bandLogo: b?.logoUrl || undefined,
            })
          }
        }
      }
    } catch (postErr) {
      console.error("Error loading post audio fallback:", postErr)
    }

    const user = await getSessionUser()
    const viewerId = user?.id || null
    let isAdmin = false
    if (user) {
      const pr = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
      isAdmin = Boolean(pr[0]?.isAdmin || pr[0]?.role === "admin")
    }
    return await attachTrackLikesAndPerms(results, viewerId, isAdmin)
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
      audioHash: t.audioHash,
      fingerprint: t.fingerprint,
      fingerprintAlgorithm: t.fingerprintAlgorithm,
      copyrightStatus: t.copyrightStatus || "clean",
      copyrightDetails: t.copyrightDetails || {},
      proofOfMasterHash: t.proofOfMasterHash,
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
      audioHash: rt.audioHash,
      fingerprint: rt.fingerprint,
      fingerprintAlgorithm: rt.fingerprintAlgorithm,
      copyrightStatus: rt.copyrightStatus || "clean",
      copyrightDetails: rt.copyrightDetails || {},
      proofOfMasterHash: rt.proofOfMasterHash,
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
    const limit = options?.limit || 200

    let baseQuery = db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))

    const rows = await baseQuery
      .orderBy(desc(bandTracks.createdAt))
      .limit(limit)

    const existingAudioUrls = new Set<string>()

    let results: BandTrackItem[] = rows.map(({ track: t, band: b }) => {
      existingAudioUrls.add(t.audioUrl.trim())
      return {
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
        audioHash: t.audioHash,
        fingerprint: t.fingerprint,
        fingerprintAlgorithm: t.fingerprintAlgorithm,
        copyrightStatus: t.copyrightStatus || "clean",
        copyrightDetails: t.copyrightDetails || {},
        proofOfMasterHash: t.proofOfMasterHash,
      }
    })

    // Fallback: Also gather audio tracks from band_posts so nothing is ever missed
    try {
      const audioPosts = await db
        .select({
          post: bandPosts,
          band: bands,
        })
        .from(bandPosts)
        .leftJoin(bands, eq(bandPosts.bandId, bands.id))
        .where(sql`${bandPosts.audioTracks} IS NOT NULL AND jsonb_array_length(${bandPosts.audioTracks}) > 0`)
        .orderBy(desc(bandPosts.createdAt))
        .limit(100)

      for (const { post: p, band: b } of audioPosts) {
        const rawTracks = p.audioTracks as any[]
        if (Array.isArray(rawTracks)) {
          for (let i = 0; i < rawTracks.length; i++) {
            const rt = rawTracks[i]
            const audioUrl = (rt.audio_url || rt.audioUrl || "").trim()
            if (!audioUrl || existingAudioUrls.has(audioUrl)) continue

            existingAudioUrls.add(audioUrl)
            results.push({
              id: rt.id || p.id,
              bandId: p.bandId,
              title: rt.title || "Untitled Track",
              slug: rt.slug || null,
              artistName: rt.artist_name || rt.artistName || b?.name || null,
              producer: rt.producer || null,
              featuredArtists: rt.featured_artists || rt.featuredArtists || null,
              audioUrl: audioUrl,
              durationSeconds: rt.duration_seconds || rt.durationSeconds || 0,
              albumName: rt.album_name || rt.albumName || null,
              coverArtUrl: rt.cover_art_url || rt.coverArtUrl || b?.logoUrl || null,
              releaseYear: rt.release_year || rt.releaseYear || null,
              genre: rt.genre || b?.genre || null,
              description: p.content || null,
              lyrics: rt.lyrics || null,
              allowDownload: rt.allow_download !== false && rt.allowDownload !== false,
              playCount: 0,
              position: results.length,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.createdAt.toISOString(),
              bandName: b?.name,
              bandSlug: b?.slug,
              bandLogo: b?.logoUrl || undefined,
            })
          }
        }
      }
    } catch (postErr) {
      console.error("Error gathering post audio in getAllPublicTracks:", postErr)
    }

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
    const { band, user } = await verifyBandOwnershipOrAdmin(bandId)

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
        audioHash: input.audioHash || null,
        fingerprint: input.fingerprint || null,
        fingerprintAlgorithm: input.fingerprintAlgorithm || "starcast-spectral-v1",
        copyrightStatus: input.copyrightStatus || "clean",
        copyrightDetails: input.copyrightDetails || {},
        proofOfMasterHash: input.proofOfMasterHash || (input.audioHash ? generateProofOfMasterHash(input.audioHash, bandId, Date.now()) : null),
      })
      .returning()

    // Ensure catalog is enabled
    await db
      .update(bands)
      .set({ musicCatalogEnabled: true, updatedAt: new Date() })
      .where(eq(bands.id, bandId))

    // Auto-broadcast new track to the band's fan feed
    try {
      const audioTrackPayload = {
        id: newTrack.id,
        title: newTrack.title,
        audio_url: cleanAudioUrl,
        duration_seconds: input.durationSeconds || 0,
        artist_name: input.artistName?.trim() || band.name,
        producer: input.producer?.trim() || undefined,
        cover_art_url: input.coverArtUrl?.trim() || band.logoUrl || undefined,
        allow_download: input.allowDownload !== false,
        slug: uniqueSlug,
      }

      const postBody =
        input.description?.trim() ||
        `🎵 New release: "${input.title.trim()}" is now streaming on the soundstage!`

      await db.insert(bandPosts).values({
        bandId,
        authorUserId: user.id || band.ownerUserId,
        content: postBody,
        postType: "audio",
        images: input.coverArtUrl ? [input.coverArtUrl] : [],
        audioTracks: [audioTrackPayload] as any,
      })
    } catch (postErr) {
      console.error("Failed to auto-post track to band feed:", postErr)
    }

    if (band.slug) {
      revalidatePath(`/bands/${band.slug}`)
    }
    revalidatePath("/community")
    revalidatePath("/music")

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

    const [updated] = await db
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
      .returning()

    revalidatePath("/music")
    revalidatePath("/community")
    revalidatePath("/bands")

    return { success: true, track: updated }
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

    revalidatePath("/music")
    revalidatePath("/community")
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
    const { band, user } = await verifyBandOwnershipOrAdmin(bandId)

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

    const albumAudioTracks = []

    for (const t of input.tracks) {
      if (!t.title?.trim() || !t.audioUrl?.trim()) continue

      const cleanAudioUrl = await normalizeAudioUrl(t.audioUrl)
      const baseSlug = slugify(t.title.trim()) || "track"
      const randomSuffix = Math.random().toString(36).substring(2, 7)
      const uniqueSlug = `${baseSlug}-${randomSuffix}`

      const [newTrk] = await db
        .insert(bandTracks)
        .values({
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
          audioHash: t.audioHash || null,
          fingerprint: t.fingerprint || null,
          fingerprintAlgorithm: "starcast-spectral-v1",
          copyrightStatus: t.copyrightStatus || "clean",
          proofOfMasterHash: t.proofOfMasterHash || (t.audioHash ? generateProofOfMasterHash(t.audioHash, bandId, Date.now()) : null),
        })
        .returning()

      albumAudioTracks.push({
        id: newTrk.id,
        title: newTrk.title,
        audio_url: cleanAudioUrl,
        duration_seconds: t.durationSeconds || 0,
        artist_name: t.artistName?.trim() || band.name,
        producer: t.producer?.trim() || input.producer?.trim() || undefined,
        cover_art_url: input.coverArtUrl?.trim() || band.logoUrl || undefined,
        allow_download: input.allowDownload !== false,
        slug: uniqueSlug,
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

    // Auto-broadcast new album drop to the band's fan feed
    if (albumAudioTracks.length > 0) {
      try {
        const postBody = `💿 New album release: "${input.albumTitle.trim()}" (${albumAudioTracks.length} tracks) is now streaming!`
        await db.insert(bandPosts).values({
          bandId,
          authorUserId: user.id || band.ownerUserId,
          content: postBody,
          postType: "album",
          images: input.coverArtUrl ? [input.coverArtUrl] : [],
          audioTracks: albumAudioTracks as any,
        })
      } catch (postErr) {
        console.error("Failed to auto-post album to band feed:", postErr)
      }
    }

    if (band.slug) {
      revalidatePath(`/bands/${band.slug}`)
    }
    revalidatePath("/community")
    revalidatePath("/music")

    return { success: true, count: albumAudioTracks.length }
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



/**
 * Perform an on-demand acoustic fingerprint scan and copyright compliance check on a track.
 */
export async function rescanTrackAudio(trackId: string): Promise<{
  success: boolean
  track?: any
  scanResult?: any
  error?: string
}> {
  try {
    const rows = await db
      .select({
        track: bandTracks,
        band: bands,
      })
      .from(bandTracks)
      .leftJoin(bands, eq(bandTracks.bandId, bands.id))
      .where(eq(bandTracks.id, trackId))
      .limit(1)

    if (rows.length === 0) return { success: false, error: "Track not found." }
    const { track: t, band: b } = rows[0]

    // Fetch the audio buffer
    const audioRes = await fetch(t.audioUrl)
    if (!audioRes.ok) {
      return { success: false, error: "Could not retrieve audio file for acoustic scanning." }
    }

    const arrayBuffer = await audioRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const scanResult = await scanAudioForCopyrightAndDuplicates(buffer, {
      bandId: t.bandId,
      title: t.title,
      durationSeconds: t.durationSeconds || 0,
    })

    const updated = await db
      .update(bandTracks)
      .set({
        audioHash: scanResult.audioHash,
        fingerprint: scanResult.fingerprint,
        fingerprintAlgorithm: scanResult.fingerprintAlgorithm,
        copyrightStatus: scanResult.status,
        copyrightDetails: scanResult.matchDetails as any,
        proofOfMasterHash: scanResult.proofOfMasterHash,
        updatedAt: new Date(),
      })
      .where(eq(bandTracks.id, trackId))
      .returning()

    revalidatePath("/music")
    if (b?.slug) revalidatePath(`/bands/${b.slug}`)

    return { success: true, track: updated[0], scanResult }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to rescan track audio." }
  }
}


/**
 * Toggle like on a track for the authenticated user.
 */
export async function toggleLikeTrack(trackId: string): Promise<{
  success: boolean
  liked: boolean
  likeCount: number
  error?: string
}> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, liked: false, likeCount: 0, error: "Please sign in to like songs." }

    const existing = await db
      .select()
      .from(trackLikes)
      .where(and(eq(trackLikes.trackId, trackId), eq(trackLikes.userId, user.id)))
      .limit(1)

    let liked = false
    if (existing.length > 0) {
      await db
        .delete(trackLikes)
        .where(and(eq(trackLikes.trackId, trackId), eq(trackLikes.userId, user.id)))
      liked = false
    } else {
      await db
        .insert(trackLikes)
        .values({
          trackId,
          userId: user.id,
        })
        .onConflictDoNothing()
      liked = true
    }

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trackLikes)
      .where(eq(trackLikes.trackId, trackId))

    const likeCount = countRes[0]?.count ?? 0

    revalidatePath("/music")
    return { success: true, liked, likeCount }
  } catch (err: any) {
    console.error("toggleLikeTrack error:", err)
    return { success: false, liked: false, likeCount: 0, error: err?.message || "Failed to like track." }
  }
}

/**
 * Toggle like on an album. AUTOMATICALLY LIKES ALL SONGS IN THAT ALBUM!
 */
export async function toggleLikeAlbum(
  bandId: string,
  albumName: string
): Promise<{
  success: boolean
  liked: boolean
  likeCount: number
  affectedTrackIds: string[]
  error?: string
}> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, liked: false, likeCount: 0, affectedTrackIds: [], error: "Please sign in to like albums." }

    const cleanAlbum = albumName.trim()
    if (!cleanAlbum) return { success: false, liked: false, likeCount: 0, affectedTrackIds: [], error: "Album name is required." }

    // Find all tracks in this album
    const albumTracksList = await db
      .select({ id: bandTracks.id })
      .from(bandTracks)
      .where(and(eq(bandTracks.bandId, bandId), eq(bandTracks.albumName, cleanAlbum)))

    const trackIds = albumTracksList.map((t) => t.id)

    const existing = await db
      .select()
      .from(albumLikes)
      .where(
        and(
          eq(albumLikes.bandId, bandId),
          eq(albumLikes.albumName, cleanAlbum),
          eq(albumLikes.userId, user.id)
        )
      )
      .limit(1)

    let liked = false
    if (existing.length > 0) {
      // User is unliking the album
      await db
        .delete(albumLikes)
        .where(
          and(
            eq(albumLikes.bandId, bandId),
            eq(albumLikes.albumName, cleanAlbum),
            eq(albumLikes.userId, user.id)
          )
        )
      liked = false
    } else {
      // User is liking the album -> insert album like
      await db
        .insert(albumLikes)
        .values({
          bandId,
          albumName: cleanAlbum,
          userId: user.id,
        })
        .onConflictDoNothing()
      liked = true

      // CRITICAL REQUIREMENT: Automatically like all songs in this album!
      for (const trk of albumTracksList) {
        await db
          .insert(trackLikes)
          .values({
            trackId: trk.id,
            userId: user.id,
          })
          .onConflictDoNothing()
      }
    }

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(albumLikes)
      .where(and(eq(albumLikes.bandId, bandId), eq(albumLikes.albumName, cleanAlbum)))

    const likeCount = countRes[0]?.count ?? 0

    revalidatePath("/music")
    return { success: true, liked, likeCount, affectedTrackIds: trackIds }
  } catch (err: any) {
    console.error("toggleLikeAlbum error:", err)
    return { success: false, liked: false, likeCount: 0, affectedTrackIds: [], error: err?.message || "Failed to like album." }
  }
}

/**
 * Update album metadata across all tracks in the album (accessible by band owner or admin).
 */
export async function updateBandAlbum(
  bandId: string,
  currentAlbumName: string,
  input: AlbumUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyBandOwnershipOrAdmin(bandId)

    const cleanCurrent = currentAlbumName.trim()
    const cleanNewName = input.newAlbumName?.trim()

    const updatePayload: any = {
      updatedAt: new Date(),
    }
    if (cleanNewName) {
      updatePayload.albumName = cleanNewName
    }
    if (input.coverArtUrl !== undefined) {
      updatePayload.coverArtUrl = input.coverArtUrl.trim() || null
    }
    if (input.genre !== undefined) {
      updatePayload.genre = input.genre.trim() || null
    }
    if (input.releaseYear !== undefined) {
      updatePayload.releaseYear = input.releaseYear.trim() || null
    }
    if (input.producer !== undefined) {
      updatePayload.producer = input.producer.trim() || null
    }
    if (input.artistName !== undefined) {
      updatePayload.artistName = input.artistName.trim() || null
    }

    await db
      .update(bandTracks)
      .set(updatePayload)
      .where(
        and(
          eq(bandTracks.bandId, bandId),
          eq(bandTracks.albumName, cleanCurrent)
        )
      )

    // If album was renamed, rename in album_likes as well
    if (cleanNewName && cleanNewName !== cleanCurrent) {
      await db
        .update(albumLikes)
        .set({ albumName: cleanNewName })
        .where(
          and(
            eq(albumLikes.bandId, bandId),
            eq(albumLikes.albumName, cleanCurrent)
          )
        )
    }

    revalidatePath("/music")
    revalidatePath("/bands")
    return { success: true }
  } catch (err: any) {
    console.error("updateBandAlbum error:", err)
    return { success: false, error: err?.message || "Failed to update album." }
  }
}

/**
 * Fetch all albums across public tracks with album like counts and tracklists.
 */
export async function getAllPublicAlbums(tracks?: BandTrackItem[]): Promise<BandAlbumItem[]> {
  try {
    const allTracks = tracks || (await getAllPublicTracks({ limit: 500 }))
    const sessionUser = await getSessionUser()
    const viewerId = sessionUser?.id || null
    let isAdmin = false
    if (sessionUser) {
      const pr = await db.select().from(profiles).where(eq(profiles.userId, sessionUser.id)).limit(1)
      isAdmin = Boolean(pr[0]?.isAdmin || pr[0]?.role === "admin")
    }

    const albumMap = new Map<string, BandAlbumItem>()

    for (const t of allTracks) {
      const aName = t.albumName?.trim()
      if (!aName) continue

      const key = `${t.bandId}:::${aName}`
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          albumName: aName,
          bandId: t.bandId,
          bandName: t.bandName,
          bandSlug: t.bandSlug,
          bandLogo: t.bandLogo,
          artistName: t.artistName,
          producer: t.producer,
          coverArtUrl: t.coverArtUrl || t.bandLogo || null,
          releaseYear: t.releaseYear,
          genre: t.genre,
          tracks: [],
          likeCount: 0,
          isLiked: false,
          canEdit: t.canEdit,
        })
      }
      const album = albumMap.get(key)!
      album.tracks.push(t)
      if (!album.coverArtUrl && t.coverArtUrl) {
        album.coverArtUrl = t.coverArtUrl
      }
    }

    const albumList = Array.from(albumMap.values())
    const likesInfo = await getAlbumLikesInfo(
      albumList.map((a) => ({ bandId: a.bandId, albumName: a.albumName })),
      viewerId
    )

    for (const a of albumList) {
      const key = `${a.bandId}:::${a.albumName}`
      const info = likesInfo.get(key)
      if (info) {
        a.likeCount = info.count
        a.isLiked = info.isLiked
      }
    }

    return albumList.sort((a, b) => b.likeCount - a.likeCount || b.tracks.length - a.tracks.length)
  } catch (err) {
    console.error("getAllPublicAlbums error:", err)
    return []
  }
}
