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

    // 3. If blob not found, return 404 so browser onError triggers seamlessly
    return new NextResponse("File Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch (err) {
    console.error("Error retrieving blob:", err)
    return new NextResponse("Error retrieving file", { status: 500 })
  }
}
