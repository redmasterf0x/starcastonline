import { ImageResponse } from "next/og"
import { getPublicBand } from "@/app/actions/band-pages"
import { db } from "@/lib/db"
import { uploadedBlobs } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"

export const runtime = "nodejs"

function cleanText(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`_~]/g, "")
    .replace(/\s+/g, " ")
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
      console.warn("OG Band card: Failed to load blob from DB", err)
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
      console.warn("OG Band card: Failed to fetch external image", fetchErr)
    }
  }

  return null
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let name = "StarCast Artist"
  let genre = "Broadcasting Live"
  let bio = ""
  let actType = "SOUNDSTAGE RESIDENT"
  let rawLogoUrl: string | null = null
  let rawBannerUrl: string | null = null
  let followerCount = 0

  try {
    const decodedSlug = decodeURIComponent(slug)
    const band = await getPublicBand(decodedSlug)

    if (band) {
      name = cleanText(band.name) || "StarCast Artist"
      genre = band.genre ? cleanText(band.genre) : "StarCast Soundstage"
      actType = (band.type === "artist" ? "SOLO ARTIST" : band.type === "producer" ? "PRODUCER" : band.type === "dj" ? "DJ / ELECTRONIC" : "BAND / ACT")
      followerCount = band.follower_count || 0

      const rawBio = cleanText(band.bio)
      bio = rawBio.length > 160 ? rawBio.slice(0, 157) + "..." : rawBio

      rawLogoUrl = band.logo_url || null
      rawBannerUrl = band.banner_url || null
    }
  } catch (err) {
    console.error("OG Band card generation error:", err)
  }

  // Resolve images to base64 Data URLs for fast, zero-latency Satori rendering
  const [logoDataUrl, bannerDataUrl] = await Promise.all([
    resolveImageDataUrl(rawLogoUrl),
    resolveImageDataUrl(rawBannerUrl),
  ])

  const nameFontSize = name.length > 30 ? 44 : name.length > 20 ? 52 : 62

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #05051f 0%, #070725 40%, #0c0c3f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Banner image faint background overlay if available */}
        {bannerDataUrl && (
          <img
            src={bannerDataUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.22,
              filter: "blur(4px)",
            }}
          />
        )}

        {/* Dynamic ambient color glows */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(32, 239, 224, 0.22) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-80px",
            width: "480px",
            height: "480px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(234, 111, 42, 0.25) 0%, transparent 70%)",
          }}
        />

        {/* Content Box */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "54px 60px",
            zIndex: 10,
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  background: "rgba(234, 111, 42, 0.2)",
                  border: "1.5px solid rgba(234, 111, 42, 0.6)",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "9999px",
                    background: "#ea6f2a",
                    boxShadow: "0 0 10px #ea6f2a",
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#ea6f2a",
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                  }}
                >
                  STARCAST SOUNDSTAGE
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  background: "rgba(32, 239, 224, 0.12)",
                  border: "1px solid rgba(32, 239, 224, 0.4)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#20efe0",
                  letterSpacing: "1px",
                }}
              >
                {actType}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: 14,
                color: "#20efe0",
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              <span>● LIVE TOPEKA BROADCAST</span>
            </div>
          </div>

          {/* Middle Body with Avatar & Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "36px", margin: "auto 0" }}>
            {/* Logo / Avatar */}
            {logoDataUrl ? (
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "28px",
                  padding: "4px",
                  background: "linear-gradient(135deg, #ea6f2a 0%, #ffd166 50%, #20efe0 100%)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <img
                  src={logoDataUrl}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "24px",
                    objectFit: "cover",
                    background: "#0c0c3f",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "28px",
                  background: "linear-gradient(135deg, #0c0c3f, #121248)",
                  border: "3px solid #20efe0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  fontWeight: 900,
                  color: "#ea6f2a",
                  flexShrink: 0,
                }}
              >
                ★
              </div>
            )}

            {/* Title & Bio Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <div
                style={{
                  fontSize: nameFontSize,
                  fontWeight: 900,
                  color: "#f5f7ff",
                  lineHeight: 1.12,
                  letterSpacing: "-0.03em",
                  textShadow: "0 4px 20px rgba(0,0,0,0.8)",
                }}
              >
                {name}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#ffd166",
                    letterSpacing: "0.5px",
                  }}
                >
                  {genre}
                </span>
                {followerCount > 0 && (
                  <span style={{ fontSize: 16, color: "#9a9fc4" }}>
                    · {followerCount} {followerCount === 1 ? "Follower" : "Followers"}
                  </span>
                )}
              </div>

              {bio && (
                <div
                  style={{
                    fontSize: 18,
                    color: "#dbe0fb",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    overflow: "hidden",
                    opacity: 0.9,
                  }}
                >
                  {bio}
                </div>
              )}
            </div>
          </div>

          {/* Footer Ribbon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(32, 32, 90, 0.7)",
              paddingTop: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "4px",
                  height: "28px",
                  background: "linear-gradient(to bottom, #ea6f2a, #20efe0)",
                  borderRadius: "2px",
                }}
              />
              <span style={{ fontSize: 16, color: "#f5f7ff", fontWeight: 700 }}>
                Listen to Music, Tickets &amp; Soundstage Updates
              </span>
            </div>

            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#20efe0",
                letterSpacing: "1px",
              }}
            >
              starcast.online
            </span>
          </div>
        </div>
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
