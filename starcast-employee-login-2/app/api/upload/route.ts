import { getStore } from "@netlify/blobs"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"

// Uploads a file to Postgres and Netlify Blobs, returning its public URL.
// Used for band logos, band banners, profile avatars, and sponsor logos.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string | null) ?? "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const pathname = `${folder}/${Date.now()}-${sanitizedName}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || "application/octet-stream"
    const base64Data = buffer.toString("base64")

    // 1. Store in Neon Postgres uploaded_blobs table for persistent cross-cloud hosting
    try {
      await db
        .insert(uploadedBlobs)
        .values({
          pathname,
          contentType,
          data: base64Data,
        })
        .onConflictDoUpdate({
          target: uploadedBlobs.pathname,
          set: { contentType, data: base64Data },
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
