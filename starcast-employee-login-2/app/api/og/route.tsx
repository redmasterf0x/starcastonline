import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") || "Starcast Media"
  const author = searchParams.get("author") || ""
  const hasImage = searchParams.get("hasImage") === "true"

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #000000 0%, #05052d 50%, #0c0c3f 100%)",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,114,43,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,58,95,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#ea6f2a",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            STARCAST
          </div>
          <div
            style={{
              width: "2px",
              height: "24px",
              background: "#20205a",
            }}
          />
          <div
            style={{
              fontSize: "18px",
              color: "#9a9fc4",
            }}
          >
            Media
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? "48px" : title.length > 40 ? "56px" : "64px",
              fontWeight: "bold",
              color: "#f5f7ff",
              lineHeight: 1.2,
              marginBottom: "24px",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {author && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ea6f2a 0%, #20205a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f5f7ff",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {author.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  color: "#9a9fc4",
                }}
              >
                {author}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "#20205a",
            }}
          >
            starcast.online
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(212,114,43,0.2)",
              borderRadius: "20px",
              border: "1px solid rgba(212,114,43,0.3)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#ea6f2a",
                fontWeight: "600",
              }}
            >
              READ ARTICLE
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
