import { getStore } from "@netlify/blobs"
import { type NextRequest, NextResponse } from "next/server"

// Uploads a file to Netlify Blobs and returns its public URL.
// Used for profile avatars and sponsor logos.
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
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const store = getStore("uploads")
      await store.set(pathname, buffer, {
        metadata: { contentType: file.type || "application/octet-stream" },
      })
      return NextResponse.json({ url: `/api/blobs/${pathname}` })
    } catch (blobErr) {
      console.warn("Netlify Blobs environment not active, using base64 data URL fallback:", blobErr)
      const base64 = buffer.toString("base64")
      const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`
      return NextResponse.json({ url: dataUrl })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
