import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicBand, getBandPosts } from "@/app/actions/band-pages"
import { BandPageClient } from "./band-page-client"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const band = await getPublicBand(decodeURIComponent(slug))
  if (!band) {
    return { title: "Band | Starcast Media" }
  }
  const description = band.bio?.slice(0, 160) || `Follow ${band.name} on Starcast Media.`
  return {
    title: `${band.name} | Starcast Media`,
    description,
    openGraph: {
      title: band.name,
      description,
      images: band.logo_url ? [{ url: band.logo_url }] : undefined,
    },
  }
}

export default async function BandPage({ params }: Props) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const band = await getPublicBand(decoded)
  if (!band) notFound()

  const posts = await getBandPosts(band.id)

  return <BandPageClient band={band} initialPosts={posts} />
}
