import { ShowLanding } from "@/components/show-landing"

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
