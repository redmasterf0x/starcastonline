import type { Metadata } from "next"
import { ShowLanding } from "@/components/show-landing"

export const metadata: Metadata = {
  title: "The Observation Deck | StarCast Media Topeka",
  description:
    "The flagship talk show of StarCast Media in Topeka, KS. Hosted by Dirty Dave, featuring in-depth interviews with Kansas hip-hop legends, artists, creators, and community leaders.",
  keywords: [
    "the observation deck",
    "the observation deck topeka",
    "dirty dave starcast",
    "topeka media company",
    "topeka podcast",
    "topeka hip hop talk show",
    "starcast media",
  ],
  alternates: {
    canonical: "https://starcast.online/shows/theobservationdeck",
  },
}

export default function ObservationDeckPage() {
  return (
    <ShowLanding
      title="The Observation Deck"
      description="A laid-back talk show hosted by Dirty Dave, sitting down with the creators, artists, and personalities who make Topeka interesting. Chill vibes, real conversations, and the occasional live performance."
      color="#ea6f2a"
      youtubeUrl="https://www.youtube.com/playlist?list=PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp"
      channelUrl="https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
      platforms={{
        apple: "https://podcasts.apple.com/us/podcast/starcast-presents-the-observation-deck/id1896849212",
        spotify: "https://open.spotify.com/show/5gfZgUVxAdXLbZ1Ffb4uod",
        redcircle: "https://redcircle.com/shows/eb95f7c0-6e7e-4a9c-a957-bf52158b3572",
      }}
    />
  )
}
