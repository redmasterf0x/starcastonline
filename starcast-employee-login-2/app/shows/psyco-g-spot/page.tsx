import type { Metadata } from "next"
import { ShowLanding } from "@/components/show-landing"

export const metadata: Metadata = {
  title: "The Psyco G Spot w/ Psyco G | StarCast Media Topeka",
  description:
    "Late night unfiltered talk, street culture, comedy, and raw Topeka perspectives with Psyco G on StarCast Media.",
  keywords: [
    "the psyco g spot",
    "psyco g starcast",
    "topeka media company",
    "topeka late night podcast",
    "unfiltered talk show kansas",
    "starcast media",
  ],
  alternates: {
    canonical: "https://starcast.online/shows/psyco-g-spot",
  },
}

export default function PsycoGSpotPage() {
  return (
    <ShowLanding
      title="Psyco G-Spot"
      description="Unfiltered talk, wild stories, and the conversations no one else is having. Tune in to Psyco G-Spot on Starcast Media."
      color="#8B5CF6"
      youtubeUrl="https://www.youtube.com/playlist?list=PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci"
      channelUrl="https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
    />
  )
}
