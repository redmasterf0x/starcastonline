import { getStore } from "@netlify/blobs"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const MAX_GENERAL_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "svg", "heic", "heif", "bmp", "ico",
  "mp3", "wav", "m4a", "ogg", "flac", "aac", "weba", "webm",
  "pdf", "txt"
])

// Uploads a file to Postgres and Netlify Blobs, returning its public URL.
// Used for band logos, band banners, profile avatars, sponsor logos, and post audio/images.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string | null) ?? "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const contentType = file.type || "application/octet-stream"
    const rawExt = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : ""
    const isImage = contentType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg", "heic", "heif", "bmp"].includes(rawExt)
    const isAudio = contentType.startsWith("audio/") || ["mp3", "wav", "m4a", "ogg", "flac", "aac", "weba", "webm"].includes(rawExt)

    // Validate type
    if (!isImage && !isAudio && rawExt && !ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { error: `File type is not supported. Please upload an image (JPG, PNG, WEBP, GIF, SVG) or audio (MP3, WAV, M4A, FLAC).` },
        { status: 400 }
      )
    }

    // Enforce file size limit
    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image file exceeds maximum limit of 10MB (file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 413 }
      )
    }

    if (isAudio && file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Audio file exceeds maximum limit of 50MB (file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 413 }
      )
    }

    if (file.size > MAX_GENERAL_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum limit of 50MB (file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 413 }
      )
    }

    const sanitizedName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_")
    const pathname = `${folder}/${Date.now()}-${sanitizedName}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")

    // 1. Store in Neon Postgres uploaded_blobs table for persistent cross-cloud hosting
    try {
      await db
        .insert(uploadedBlobs)
        .values({
          pathname,
          contentType: contentType || (isImage ? "image/jpeg" : isAudio ? "audio/mpeg" : "application/octet-stream"),
          data: base64Data,
        })
        .onConflictDoUpdate({
          target: uploadedBlobs.pathname,
          set: {
            contentType: contentType || (isImage ? "image/jpeg" : isAudio ? "audio/mpeg" : "application/octet-stream"),
            data: base64Data,
          },
        })
    } catch (dbErr) {
      console.warn("Error storing blob in Postgres:", dbErr)
    }

    // 2. Also attempt Netlify Blobs store if active
    try {
      const store = getStore("uploads")
      await store.set(pathname, arrayBuffer, {
        metadata: { contentType },
      })
    } catch {
      // Netlify blobs not active in current environment (e.g. Firebase App Hosting)
    }

    return NextResponse.json({ url: `/api/blobs/${pathname}` })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
