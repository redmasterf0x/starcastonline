import type { Metadata } from "next"
import { ShowLanding } from "@/components/show-landing"

export const metadata: Metadata = {
  title: "Hollywood: After Babylon | StarCast Media Topeka",
  description:
    "Hollywood: After Babylon with Nic Nassuet — investigative entertainment journalism exploring cinema history, occult Hollywood lore, and media industry truths on StarCast Media.",
  keywords: [
    "hollywood after babylon",
    "nic nassuet starcast",
    "cinema history podcast",
    "topeka media company",
    "entertainment journalism topeka",
    "starcast media",
  ],
  alternates: {
    canonical: "https://starcast.online/shows/hollywood-after-babylon",
  },
}

export default function HollywoodAfterBabylonPage() {
  return (
    <ShowLanding
      title="Hollywood After Babylon"
      description="Deep dives into the golden age of Hollywood, its scandals, legends, and untold stories. Only on Starcast Media."
      color="#f4b25c"
      youtubeUrl="https://www.youtube.com/playlist?list=PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB"
      channelUrl="https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw"
    />
  )
}
