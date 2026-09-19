import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicBand, getBandPosts } from "@/app/actions/band-pages"
import { getPublicBandEvents } from "@/app/actions/band-tickets"
import { getBandTracks } from "@/app/actions/band-tracks"
import { BandPageClient } from "./band-page-client"

type Props = {
  params: Promise<{ slug: string }>
}

function cleanText(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const band = await getPublicBand(decodedSlug)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://starcast.online"
  const encodedSlug = encodeURIComponent(slug)
  const canonicalUrl = `${baseUrl}/bands/${encodedSlug}`

  if (!band) {
    return {
      title: "Act Not Found | StarCast Media",
      description: "Discover live artists and bands broadcasting on StarCast Soundstage.",
      alternates: { canonical: canonicalUrl },
    }
  }

  const rawBio = cleanText(band.bio)
  const description =
    rawBio.length > 170
      ? rawBio.slice(0, 167) + "..."
      : rawBio || `Listen to music, get tickets, and follow ${band.name} on the StarCast Soundstage.`

  const dynamicOgUrl = `${baseUrl}/api/og-band/${encodedSlug}`

  const toAbsoluteUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`
  }

  const directBannerUrl = toAbsoluteUrl(band.banner_url)
  const directLogoUrl = toAbsoluteUrl(band.logo_url)

  const images = [
    {
      url: dynamicOgUrl,
      width: 1200,
      height: 630,
      alt: `${band.name} on StarCast Soundstage`,
      type: "image/png",
    },
    ...(directBannerUrl
      ? [
          {
            url: directBannerUrl,
            width: 1200,
            height: 630,
            alt: `${band.name} Banner`,
          },
        ]
      : []),
    ...(directLogoUrl
      ? [
          {
            url: directLogoUrl,
            width: 500,
            height: 500,
            alt: `${band.name} Logo`,
          },
        ]
      : []),
  ]

  return {
    title: { absolute: `${band.name} | StarCast Soundstage` },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${band.name} | StarCast Soundstage`,
      description,
      type: "profile",
      url: canonicalUrl,
      siteName: "StarCast Media",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${band.name} | StarCast Soundstage`,
      description,
      images: [dynamicOgUrl],
    },
  }
}

export default async function BandPage({ params }: Props) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const band = await getPublicBand(decoded)
  if (!band) notFound()

  const [posts, events, tracks] = await Promise.all([
    getBandPosts(band.id),
    getPublicBandEvents(band.id),
    getBandTracks(band.id),
  ])

  return (
    <BandPageClient
      band={band}
      initialPosts={posts}
      initialEvents={events as any}
      initialTracks={tracks}
    />
  )
}
