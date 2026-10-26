import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05051f 0%, #07072d 50%, #0c0c3f 100%)",
          padding: "60px 70px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient Cosmic Orbs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234, 111, 42, 0.28) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(32, 239, 224, 0.25) 0%, transparent 70%)",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 900,
                color: "#ea6f2a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              STARCAST
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 900,
                color: "#ffd166",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ONLINE
            </div>
            <div
              style={{
                width: "2px",
                height: "26px",
                background: "#20205a",
                margin: "0 6px",
              }}
            />
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#20efe0",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                background: "rgba(32, 239, 224, 0.12)",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid rgba(32, 239, 224, 0.3)",
              }}
            >
              LIVE TRIVIA
            </div>
          </div>

          <div
            style={{
              fontSize: "16px",
              color: "#ffd166",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            5 QUESTIONS • EARN RANKS
          </div>
        </div>

        {/* Main Center Hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            zIndex: 10,
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              fontSize: "66px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            Take the StarCast Quiz
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#cbd0f2",
              lineHeight: 1.35,
              maxWidth: "880px",
            }}
          >
            Test your show knowledge across The Observation Deck, Hollywood: After Babylon, Star Talk, hosts &amp; Topeka lore!
          </div>

          {/* Feature categories pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {["🎲 The Observation Deck", "🎬 Hollywood: After Babylon", "🎙️ Star Talk", "🎸 Live Soundstages"].map(
              (tag) => (
                <div
                  key={tag}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#f5f7ff",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    padding: "8px 16px",
                    borderRadius: "14px",
                  }}
                >
                  {tag}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom CTA / Branding Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
            borderTop: "1px solid rgba(32, 32, 90, 0.8)",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "20px",
              color: "#9a9fc4",
              fontWeight: 600,
            }}
          >
            <span>starcast.online/quiz</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(90deg, #ea6f2a 0%, #ffd166 100%)",
              color: "#05051f",
              fontWeight: 900,
              fontSize: "18px",
              padding: "12px 28px",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(234, 111, 42, 0.35)",
            }}
          >
            PLAY QUIZ NOW →
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
