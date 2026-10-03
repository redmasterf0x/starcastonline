import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About StarCast Media | Topeka's Premier Media Production Studio",
  description:
    "Learn about StarCast Media (@starcastlivemedia) — Topeka's leading independent media production studio, podcast recording facility, and YouTube broadcast network in Topeka, Kansas.",
  keywords: [
    "about starcast media",
    "topeka media company",
    "topeka recording studio",
    "topeka podcast studio",
    "media production company topeka kansas",
    "topeka soundstage facility",
    "topeka broadcast network",
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
