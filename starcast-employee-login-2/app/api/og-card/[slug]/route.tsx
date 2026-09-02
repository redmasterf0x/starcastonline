import { ImageResponse } from "next/og"
import { getArticleBySlug } from "@/app/actions/articles"

// Plain API route (not the opengraph-image.tsx file convention) to avoid a
// Turbopack dev regression in Next.js 16.2.0 where dynamic, async
// opengraph-image.tsx files crash the entire page with
// "Cannot read properties of undefined (reading 'default')".
// generateMetadata references this route directly instead.
export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = "Starcast Article"
  let authorName = "Starcast"
  let firstImageUrl: string | null = null
  let excerpt = ""

  try {
    const decodedSlug = decodeURIComponent(slug)
    const matched = await getArticleBySlug(decodedSlug)

    if (matched && matched.approved) {
      title = matched.title
      authorName =
        `${matched.authorFirstName || ""} ${matched.authorLastName || ""}`.trim() || "Starcast"
      excerpt = matched.excerpt || matched.content?.slice(0, 120) || ""

      const images = matched.images as ({ url: string } | string)[] | null
      if (images && images.length > 0) {
        const firstImg = images[0]
        firstImageUrl = typeof firstImg === "string" ? firstImg : firstImg?.url || null
      }
    }
  } catch {
    // fallback to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #05052d 0%, #0c0c3f 60%, #20205a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Left text panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            flex: firstImageUrl ? "0 0 55%" : "1",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ea6f2a",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            STARCAST
          </div>
          <div
            style={{
              fontSize: title.length > 60 ? 38 : 48,
              fontWeight: 800,
              color: "#f5f7ff",
              lineHeight: 1.2,
              display: "-webkit-box",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {excerpt && (
            <div style={{ fontSize: 22, color: "#9a9fc4", lineHeight: 1.5, opacity: 0.85 }}>
              {excerpt.length > 100 ? excerpt.slice(0, 100) + "..." : excerpt}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ width: 3, height: 24, background: "#ea6f2a", borderRadius: 2 }} />
            <div style={{ fontSize: 20, color: "#ea6f2a", fontWeight: 600 }}>{authorName}</div>
          </div>
        </div>

        {/* Right image panel */}
        {firstImageUrl && (
          <div
            style={{
              flex: "0 0 45%",
              display: "flex",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={firstImageUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 80,
                height: "100%",
                background: "linear-gradient(to right, #0c0c3f, transparent)",
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
