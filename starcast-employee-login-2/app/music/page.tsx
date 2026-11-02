import type { Metadata } from "next"
import { getAllPublicTracks, getAllPublicAlbums } from "@/app/actions/band-tracks"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { MusicHubClient } from "./music-hub-client"

export const metadata: Metadata = {
  title: "Music Hub — Stream Songs, Beats & Albums | StarCast Online",
  description:
    "Listen to free original music, singles, beats, and albums released by bands, producers, and solo artists on StarCast Online. Like albums and songs, and stream in high quality.",
  openGraph: {
    title: "StarCast Music Hub — Stream Original Tracks & Albums",
    description: "Stream original music from artists, producers, and bands for free on StarCast Online.",
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

  const tracks = await getAllPublicTracks({ limit: 500 })
  const albums = await getAllPublicAlbums(tracks)

  return (
    <MusicHubClient
      initialTracks={tracks}
      initialAlbums={albums}
      currentUser={currentUser}
    />
  )
}
