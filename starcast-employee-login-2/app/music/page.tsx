import type { Metadata } from "next"
import { getAllPublicTracks, getAllPublicAlbums } from "@/app/actions/band-tracks"
import { listPublicBands } from "@/app/actions/band-pages"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { MusicHubClient } from "./music-hub-client"

export const metadata: Metadata = {
  title: "Music Hub — Stream Songs, Beats & Bands | StarCast Online",
  description:
    "Listen to free original music, singles, beats, and albums released by bands, producers, and solo artists on StarCast Online. Follow your favorite acts, like albums and songs, and stream in high quality.",
  openGraph: {
    title: "StarCast Music Hub — Stream Original Tracks & Bands",
    description: "Stream original music from local artists, producers, and bands for free on StarCast Online.",
  },
}

export const dynamic = "force-dynamic"

export default async function MusicPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image || undefined,
      }
    : null

  const [tracks, bands] = await Promise.all([
    getAllPublicTracks({ limit: 500 }),
    listPublicBands().catch(() => []),
  ])

  const albums = await getAllPublicAlbums(tracks)

  return (
    <MusicHubClient
      initialTracks={tracks}
      initialAlbums={albums}
      initialBands={bands}
      currentUser={currentUser}
    />
  )
}
