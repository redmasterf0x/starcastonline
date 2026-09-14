import type { Metadata } from "next"
import { listPublicBands } from "@/app/actions/band-pages"
import { BandsDirectoryClient } from "./bands-directory-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Soundstage Bands & Artists Directory | StarCast Online",
  description:
    "Explore independent musicians, soundstage resident acts, and live music broadcasts on StarCast Online. Follow bands, listen to tracks, and catch studio sessions.",
  openGraph: {
    title: "StarCast Bands & Soundstage Directory",
    description: "Discover independent artists and bands broadcasting live on StarCast Online.",
  },
}

export default async function BandsPage() {
  let initialBands: any[] = []
  try {
    initialBands = await listPublicBands()
  } catch (err) {
    console.error("Failed to load initial bands for directory:", err)
  }

  return <BandsDirectoryClient initialBands={initialBands} />
}
