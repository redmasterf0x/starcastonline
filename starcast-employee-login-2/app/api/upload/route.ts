import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"
import { scanAudioForCopyrightAndDuplicates } from "@/lib/audio-fingerprint"

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const MAX_GENERAL_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "svg", "heic", "heif", "bmp", "ico",
  "mp3", "wav", "m4a", "ogg", "flac", "aac", "weba", "webm",
  "pdf", "txt"
])

// Uploads a file to Postgres and Firebase Storage, returning its public URL.
// When audio is uploaded, performs real-time acoustic fingerprinting, internal duplicate/collision
// detection, and copyright compliance checks (StarCast Audio Shield).
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

    // Real-Time Audio Fingerprinting & Copyright Pre-Upload Compliance
    let audioScan = null
    if (isAudio) {
      try {
        const extractedBandId = folder.startsWith("bands/") ? folder.split("/")[1] : undefined
        audioScan = await scanAudioForCopyrightAndDuplicates(buffer, {
          bandId: extractedBandId,
          title: file.name,
        })

        // If an exact unauthorized master collision with another band is detected, quarantine & reject upload
        if (audioScan.status === "quarantined") {
          return NextResponse.json(
            {
              error:
                audioScan.matchDetails.notes ||
                "Copyright collision: this exact audio master is already registered by another artist on StarCast Online.",
              audioScan,
            },
            { status: 409 }
          )
        }
      } catch (scanErr) {
        console.warn("Audio fingerprint scan encountered non-fatal error:", scanErr)
      }
    }

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

    return NextResponse.json({
      url: `/api/blobs/${pathname}`,
      audioScan: audioScan
        ? {
            audioHash: audioScan.audioHash,
            fingerprint: audioScan.fingerprint,
            fingerprintAlgorithm: audioScan.fingerprintAlgorithm,
            durationSeconds: audioScan.durationSeconds,
            proofOfMasterHash: audioScan.proofOfMasterHash,
            status: audioScan.status,
            matchDetails: audioScan.matchDetails,
          }
        : undefined,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
