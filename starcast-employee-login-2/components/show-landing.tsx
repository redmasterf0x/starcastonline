import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Youtube, ChevronLeft } from "lucide-react"
import Link from "next/link"

export type PlatformLink = "apple" | "spotify" | "youtube" | "redcircle"

interface ShowLandingProps {
  title: string
  description: string
  color: string
  youtubeUrl: string
  channelUrl: string
  platforms?: {
    apple?: string
    spotify?: string
    redcircle?: string
  }
}

export function ShowLanding({ title, description, color, youtubeUrl, channelUrl, platforms }: ShowLandingProps) {
  return (
    <div className="min-h-screen bg-[#05052d] flex flex-col">
      <ResponsiveHeader currentPage="/" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Shows</span>
        </Link>

        <div className="relative rounded-2xl border border-[#20205a] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#070738] via-[#0c0c3f] to-[#070738]" />
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />

          <div className="relative p-8 md:p-12 text-center flex flex-col items-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.3em] mb-4"
              style={{ color }}
            >
              Starcast Media
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f5f7ff] text-balance mb-5">
              {title}
            </h1>
            <p className="text-[#9a9fc4] text-base md:text-lg max-w-xl text-pretty mb-8 leading-relaxed">
              {description}
            </p>

            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold px-7 py-3.5 rounded-full transition-all hover:scale-105 shadow-lg shadow-[#FF0000]/20"
            >
              <Youtube className="w-5 h-5" />
              Watch all episodes on YouTube
            </a>

            {/* Other platforms */}
            <div className="flex items-center gap-2 mt-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9a9fc4]/60 mr-1">
                Also on
              </span>

              {platforms?.apple && (
                <a
                  href={platforms.apple}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Listen on Apple Podcasts"
                  title="Apple Podcasts"
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white bg-[#9933CC] hover:bg-[#8a2eb8] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 4.32a4.62 4.62 0 0 1 4.62 4.62c0 1.5-.72 2.84-1.84 3.68a.6.6 0 0 1-.96-.49v-.3c0-.2.1-.38.25-.5a3.06 3.06 0 0 0 1.07-2.34 3.13 3.13 0 0 0-6.26 0c0 .96.43 1.82 1.11 2.39.13.1.2.26.2.43v.32a.6.6 0 0 1-.96.48 4.62 4.62 0 0 1-1.85-3.68A4.62 4.62 0 0 1 12 4.32zm0 2.83a1.8 1.8 0 0 1 1.06 3.26.4.4 0 0 0-.16.32v.16c.6.27 1.02.87 1.02 1.57 0 .13-.01.32-.05.55l-.5 3.04a1.4 1.4 0 0 1-1.37 1.17 1.4 1.4 0 0 1-1.37-1.17l-.5-3.04a3.5 3.5 0 0 1-.05-.55c0-.7.42-1.3 1.02-1.57v-.16a.4.4 0 0 0-.16-.32A1.8 1.8 0 0 1 12 7.15z" />
                  </svg>
                </a>
              )}

              {platforms?.spotify && (
                <a
                  href={platforms.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Listen on Spotify"
                  title="Spotify"
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white bg-[#1DB954] hover:bg-[#22b573] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </a>
              )}

              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe on YouTube"
                title="YouTube"
                className="flex items-center justify-center w-10 h-10 rounded-lg text-white bg-[#FF0000] hover:bg-[#cc0000] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>

              {platforms?.redcircle && (
                <a
                  href={platforms.redcircle}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="More platforms on RedCircle"
                  title="RedCircle — all platforms"
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white bg-[#ED2553] hover:bg-[#d11e48] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3.5" fill="#fff" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
