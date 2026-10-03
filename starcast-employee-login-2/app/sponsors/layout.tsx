import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sponsor & Advertise in Topeka | StarCast Media Advertising Packages",
  description:
    "Promote your business with Topeka's premier media company. High-impact episode sponsorships, YouTube video commercials, soundstage ad placements, and digital marketing across StarCast Media in Topeka, KS.",
  keywords: [
    "topeka advertising",
    "advertise in topeka",
    "topeka media company sponsorships",
    "media advertising topeka",
    "starcast media sponsors",
    "topeka commercial video production",
    "local business marketing topeka ks",
    "kansas advertising agency",
    "podcast advertising topeka",
  ],
  alternates: {
    canonical: "https://starcast.online/sponsors",
  },
}

export default function SponsorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
