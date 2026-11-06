import type { Metadata } from "next"
import { getAllPublicTracks, getAllPublicAlbums } from "@/app/actions/band-tracks"
import { listPublicBands } from "@/app/actions/band-pages"
import { getMyBands } from "@/app/actions/bands"
import { getViewerPermissions } from "@/lib/permissions"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { MusicHubClient } from "./music-hub-client"

export const metadata: Metadata = {
  title: "Music — Songs, Albums, Artists, Bands, Producers & DJs | StarCast Online",
  description:
    "Stream free original songs, beats, and albums, and explore official Artist Pages, Band Pages, Producer Pages, and DJ Pages on StarCast Online.",
  openGraph: {
    title: "StarCast Music — Songs, Albums, Artists, Bands, Producers & DJs",
    description:
      "Stream original music and follow Artists, Bands, Producers, and DJs on StarCast Online.",
  },
}

export const dynamic = "force-dynamic"

export default async function MusicPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; type?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const session = await auth.api.getSession({ headers: await headers() })
  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image || undefined,
      }
    : null

  const [tracks, publicBands, myBands, perms] = await Promise.all([
    getAllPublicTracks({ limit: 500 }),
    listPublicBands().catch(() => []),
    session?.user ? getMyBands().catch(() => []) : Promise.resolve([]),
    getViewerPermissions().catch(() => null),
  ])

  const albums = await getAllPublicAlbums(tracks)

  const initialTab =
    resolvedParams.tab === "artists" ||
    resolvedParams.tab === "bands" ||
    resolvedParams.tab === "albums" ||
    resolvedParams.tab === "producers"
      ? resolvedParams.tab === "bands"
        ? "artists"
        : (resolvedParams.tab as "artists" | "albums" | "producers")
      : "all"

  return (
    <MusicHubClient
      initialTracks={tracks}
      initialAlbums={albums}
      initialBands={publicBands}
      myBands={myBands}
      currentUser={currentUser}
      isAdmin={Boolean(perms?.isAdmin)}
      initialTab={initialTab}
      initialActType={resolvedParams.type || "all"}
    />
  )
}
