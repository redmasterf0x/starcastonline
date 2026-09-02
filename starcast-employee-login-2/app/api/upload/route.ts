import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

// Uploads a file to Vercel Blob (public store) and returns its public URL.
// Used for profile avatars and sponsor logos so images are served by Vercel's CDN.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string | null) ?? "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Namespaced, collision-resistant pathname. addRandomSuffix guards against
    // overwrites when two files share a name.
    const pathname = `${folder}/${Date.now()}-${file.name}`

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Blob upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
