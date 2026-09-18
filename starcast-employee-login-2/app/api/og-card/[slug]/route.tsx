import { ImageResponse } from "next/og"
import { getArticleBySlug } from "@/app/actions/articles"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"

export const runtime = "nodejs"

function cleanText(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, "") // strip markdown images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip markdown links
    .replace(/[#*`_~]/g, "") // strip markdown format symbols
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
}

async function resolveImageDataUrl(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null

  // 1. If it's already a data URL
  if (imageUrl.startsWith("data:")) {
    return imageUrl
  }

  // 2. Check if it refers to an internal /api/blobs/ path
  let blobKey: string | null = null
  if (imageUrl.includes("/api/blobs/")) {
    blobKey = imageUrl.split("/api/blobs/")[1]
  } else if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("/")) {
    blobKey = imageUrl
  }

  if (blobKey) {
    try {
      const decodedKey = decodeURIComponent(blobKey)
      const rows = await db
        .select()
        .from(uploadedBlobs)
        .where(or(eq(uploadedBlobs.pathname, blobKey), eq(uploadedBlobs.pathname, decodedKey)))
        .limit(1)

      if (rows.length > 0 && rows[0].data) {
        const mime = rows[0].contentType || "image/jpeg"
        return `data:${mime};base64,${rows[0].data}`
      }
    } catch (err) {
      console.warn("OG card: Failed to load blob from DB", err)
    }
  }

  // 3. If it's an absolute HTTP/HTTPS URL
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(imageUrl, { signal: controller.signal })
      clearTimeout(timeout)

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/jpeg"
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        return `data:${contentType};base64,${base64}`
      }
    } catch (fetchErr) {
      console.warn("OG card: Failed to fetch external image", fetchErr)
    }
  }

  return null
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = "StarCast Article"
  let authorName = "StarCast Media"
  let rawImageUrl: string | null = null
  let excerpt = ""

  try {
    const decodedSlug = decodeURIComponent(slug)
    const matched = await getArticleBySlug(decodedSlug)

    if (matched && matched.approved) {
      title = cleanText(matched.title) || "StarCast Article"
      authorName =
        cleanText(`${matched.authorFirstName || ""} ${matched.authorLastName || ""}`) || "StarCast Media"
      
      const rawExcerpt = cleanText(matched.excerpt || matched.content)
      excerpt = rawExcerpt.length > 150 ? rawExcerpt.slice(0, 147) + "..." : rawExcerpt

      // Check direct thumbnailUrl first, then images array
      if (matched.thumbnailUrl) {
        rawImageUrl = matched.thumbnailUrl
      } else {
        const images = matched.images as ({ url: string } | string)[] | null
        if (images && images.length > 0) {
          const firstImg = images[0]
          rawImageUrl = typeof firstImg === "string" ? firstImg : firstImg?.url || null
        }
      }
    }
  } catch {
    // fallback to defaults
  }

  // Resolve image to base64 Data URL for zero-latency Satori rendering
  const imageDataUrl = await resolveImageDataUrl(rawImageUrl)

  // Dynamic font sizing based on headline length
  const titleFontSize = title.length > 70 ? 36 : title.length > 45 ? 44 : 52

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #05051f 0%, #05052d 45%, #0c0c3f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Subtle background glow accents */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-80px",
            width: "360px",
            height: "360px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(234, 111, 42, 0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: imageDataUrl ? "40%" : "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(32, 239, 224, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Left text panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 48px 48px 54px",
            flex: imageDataUrl ? "0 0 58%" : "1",
            zIndex: 10,
          }}
        >
          {/* Top: Brand pill */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "rgba(234, 111, 42, 0.18)",
                border: "1px solid rgba(234, 111, 42, 0.45)",
              }}
            >
              <div
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "9999px",
                  background: "#ea6f2a",
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#ea6f2a",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                STARCAST ONLINE
              </span>
            </div>
          </div>

          {/* Middle: Headline + First bit of article */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "auto 0" }}>
            <div
              style={{
                fontSize: titleFontSize,
                fontWeight: 900,
                color: "#f5f7ff",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                display: "-webkit-box",
                overflow: "hidden",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </div>

            {excerpt && (
              <div
                style={{
                  fontSize: 20,
                  color: "#9a9fc4",
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  overflow: "hidden",
                }}
              >
                {excerpt}
              </div>
            )}
          </div>

          {/* Bottom: Author / Broadcast branding */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "4px",
                height: "36px",
                background: "linear-gradient(to bottom, #ea6f2a, #ffd166)",
                borderRadius: "2px",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#f5f7ff" }}>
                By {authorName}
              </span>
              <span style={{ fontSize: 13, color: "#ea6f2a", fontWeight: 600, letterSpacing: "1px" }}>
                STARCAST MEDIA NETWORK
              </span>
            </div>
          </div>
        </div>

        {/* Right image panel (Thumbnail) */}
        {imageDataUrl && (
          <div
            style={{
              flex: "0 0 42%",
              display: "flex",
              position: "relative",
              overflow: "hidden",
              borderLeft: "1px solid rgba(32, 32, 90, 0.6)",
            }}
          >
            <img
              src={imageDataUrl}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            {/* Smooth dark cosmic gradient blend over the left edge of the photo */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "120px",
                height: "100%",
                background: "linear-gradient(to right, #05052d, transparent)",
              }}
            />
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  )
}
