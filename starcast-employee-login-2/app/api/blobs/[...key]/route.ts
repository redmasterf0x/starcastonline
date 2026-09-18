import { getStore } from "@netlify/blobs"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params
    const rawKey = resolvedParams.key.join("/")
    const decodedKey = decodeURIComponent(rawKey)
    const baseFilename = rawKey.split("/").pop() || ""
    const decodedBase = decodeURIComponent(baseFilename)

    // Build comprehensive candidate keys to handle any path format variation
    const candidates = Array.from(
      new Set([
        rawKey,
        decodedKey,
        rawKey.replace(/^\/+/, ""),
        decodedKey.replace(/^\/+/, ""),
        `/${rawKey.replace(/^\/+/, "")}`,
        `/${decodedKey.replace(/^\/+/, "")}`,
        `bands/banners/${baseFilename}`,
        `bands/banners/${decodedBase}`,
        `bands/logos/${baseFilename}`,
        `bands/logos/${decodedBase}`,
        `articles/${baseFilename}`,
        `articles/${decodedBase}`,
        `uploads/${baseFilename}`,
        `uploads/${decodedBase}`,
      ])
    )

    // 1. Check Neon Postgres uploaded_blobs table
    try {
      const rows = await db
        .select()
        .from(uploadedBlobs)
        .where(inArray(uploadedBlobs.pathname, candidates))
        .limit(1)

      if (rows.length > 0 && rows[0].data) {
        const buffer = Buffer.from(rows[0].data, "base64")
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": rows[0].contentType || "image/jpeg",
            "Content-Length": buffer.length.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }
    } catch (dbErr) {
      console.warn("DB blob lookup error:", dbErr)
    }

    // 2. Fallback to Netlify Blobs if active
    try {
      const store = getStore("uploads")
      for (const k of [rawKey, decodedKey, rawKey.replace(/^\/+/, "")]) {
        const { data, metadata } = await store.getWithMetadata(k, {
          type: "arrayBuffer",
        })

        if (data) {
          const contentType =
            (metadata as Record<string, any>)?.contentType || "image/jpeg"

          return new NextResponse(data, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          })
        }
      }
    } catch {
      // Netlify Blobs not active or not found
    }

    // 3. Graceful SVG fallback for missing band images / avatars
    const isBanner = rawKey.includes("banner")
    const svgFallback = isBanner
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06062e"/>
              <stop offset="50%" stop-color="#121248"/>
              <stop offset="100%" stop-color="#ea6f2a" stop-opacity="0.8"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <text x="50%" y="50%" fill="#ffd166" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="36" text-anchor="middle" dy=".3em">STARCAST SOUNDSTAGE</text>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
          <rect width="100%" height="100%" fill="#05052d"/>
          <circle cx="150" cy="150" r="120" fill="#0c0c3f" stroke="#ea6f2a" stroke-width="4"/>
          <text x="150" y="155" fill="#ffd166" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="70" text-anchor="middle" dy=".3em">★</text>
        </svg>`

    return new NextResponse(svgFallback, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("Error retrieving blob:", err)
    return new NextResponse("Error retrieving file", { status: 500 })
  }
}
