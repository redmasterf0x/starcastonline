import type { Metadata } from "next"
import { ShowLanding } from "@/components/show-landing"

export const metadata: Metadata = {
  title: "Star Talk | StarCast Media Topeka",
  description:
    "Star Talk on StarCast Media — in-depth spotlight conversations with creators, innovators, athletes, and personalities shaping Topeka, KS culture and beyond.",
  keywords: [
    "star talk topeka",
    "star talk starcast",
    "topeka interviews",
    "topeka media company",
    "topeka talk show",
    "kansas podcast",
  ],
  alternates: {
    canonical: "https://starcast.online/shows/star-talk",
  },
}

export default function StarTalkPage() {
  return (
    <ShowLanding
      title="Star Talk"
      description="Conversations with the people shaping culture, sports, and entertainment. Real talk, real stories, only on Starcast Media."
      color="#3B82F6"
      youtubeUrl="https://www.youtube.com/playlist?list=PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM"
      channelUrl="https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
      platforms={{
        spotify: "https://open.spotify.com/show/5gfZgUVxAdXLbZ1Ffb4uod",
      }}
    />
  )
}
