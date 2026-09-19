import type { Metadata } from "next"
import { getAllPublicTracks } from "@/app/actions/band-tracks"
import { MusicHubClient } from "./music-hub-client"

export const metadata: Metadata = {
  title: "Music Hub & Soundstage Streaming | StarCast Online",
  description:
    "Listen to free original music, singles, and albums released by Kansas and Midwest artists on StarCast Online. Upload songs, stream in high quality, and support local talent.",
  openGraph: {
    title: "StarCast Music Hub & Soundstage",
    description: "Stream original music from local artists for free on StarCast Online.",
  },
}

export default async function MusicPage() {
  const tracks = await getAllPublicTracks({ limit: 100 })

  return <MusicHubClient initialTracks={tracks} />
}
