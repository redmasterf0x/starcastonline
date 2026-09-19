import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTrackBySlug } from "@/app/actions/band-tracks"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { SongPlayerView } from "@/components/music/song-player-view"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const { track } = await getTrackBySlug(decoded)

  if (!track) {
    return { title: "Song | StarCast Music" }
  }

  const artist = track.artistName || track.bandName || "StarCast Artist"
  const title = `${track.title} by ${artist} | StarCast Music`
  const description =
    track.description?.slice(0, 160) ||
    track.lyrics?.slice(0, 160) ||
    `Stream "${track.title}" by ${artist} for free on StarCast Online.`

  const cover = track.coverArtUrl || track.bandLogo

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  }
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const { track, relatedTracks, comments } = await getTrackBySlug(decoded)

  if (!track) notFound()

  // Get current session for user commenting
  const session = await auth.api.getSession({ headers: await headers() })
  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image || undefined,
      }
    : null

  return (
    <SongPlayerView
      track={track}
      relatedTracks={relatedTracks}
      initialComments={comments}
      currentUser={currentUser}
    />
  )
}
