import { getStore } from "@netlify/blobs"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params
    const fullKey = resolvedParams.key.join("/")
    const store = getStore("uploads")

    const { data, metadata } = await store.getWithMetadata(fullKey, {
      type: "arrayBuffer",
    })

    if (!data) {
      return new NextResponse("File Not Found", { status: 404 })
    }

    const contentType =
      (metadata as Record<string, any>)?.contentType || "application/octet-stream"

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err) {
    console.error("Error retrieving blob:", err)
    return new NextResponse("Error retrieving file", { status: 500 })
  }
}

