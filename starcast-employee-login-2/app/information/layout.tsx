import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About StarCast Media | Topeka's Premier Media Production Studio & Broadcast Hub",
  description:
    "Learn about StarCast Media (@starcastlivemedia) — Topeka's leading independent media production studio, YouTube broadcast network, 100% artist-owned music catalog, live ticketing, and creator network.",
  keywords: [
    "about starcast media",
    "topeka media company",
    "topeka recording studio",
    "topeka podcast studio",
    "media production company topeka kansas",
    "topeka music studio facility",
    "topeka broadcast network",
    "starcast online legal information",
    "artist owned music streaming",
  ],
  alternates: {
    canonical: "https://starcast.online/information",
  },
}

export default function InformationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
