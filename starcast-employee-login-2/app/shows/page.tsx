import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ShowRow, type ShowRowData } from "@/components/show-row"
import { getPlaylistVideos } from "@/lib/youtube"

const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`

const ROW_DEFS = [
  {
    id: "performances",
    title: "Performances",
    genre: "Live Performances",
    color: "#ea6f2a",
    playlistId: "PLCpB--79-ESw",
  },
  {
    id: "theobservationdeck",
    title: "The Observation Deck",
    genre: "Talk Show",
    color: "#ea6f2a",
    playlistId: "PLDbbiC-_h16B7OOQUpj9iotFkJUwILcvp",
    showPageHref: "/shows/theobservationdeck",
  },
  {
    id: "hollywood-after-babylon",
    title: "Hollywood After Babylon",
    genre: "Entertainment History",
    color: "#f4b25c",
    playlistId: "PLDbbiC-_h16AHTgcaaQSbgjBCAFPKBVaB",
    showPageHref: "/shows/hollywood-after-babylon",
  },
  {
    id: "star-talk",
    title: "Star Talk",
    genre: "Interviews & Talk",
    color: "#3B82F6",
    playlistId: "PLDbbiC-_h16DYMdZworSvFVy3iEpjKgXM",
    showPageHref: "/shows/star-talk",
  },
  {
    id: "psyco-g-spot",
    title: "StarCast Presents: The Psyco G Spot",
    genre: "Unfiltered Talk",
    color: "#8B5CF6",
    playlistId: "PLDbbiC-_h16AyfackURSCeNzTZAGB-0Ci",
    showPageHref: "/shows/psyco-g-spot",
  },
] as const

export default async function ShowsPage() {
  const rowsWithVideos = await Promise.all(
    ROW_DEFS.map(async (row) => ({
      ...row,
      videos: await getPlaylistVideos(row.playlistId),
    })),
  )

  const rows: ShowRowData[] = rowsWithVideos.map((row) => ({
    id: row.id,
    title: row.title,
    genre: row.genre,
    color: row.color,
    playlistId: row.playlistId,
    playlistUrl: playlistUrl(row.playlistId),
    showPageHref: "showPageHref" in row ? row.showPageHref : undefined,
    videos: row.videos,
  }))

  return (
    <div className="public-shell flex flex-col">
      <ResponsiveHeader currentPage="/shows" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10 md:space-y-12">
        <div className="border-b border-white/10 pb-8 pt-2 md:pt-4">
          <p className="public-eyebrow mb-3">Watch the network</p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[#f5f7ff] md:text-6xl">Shows</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#aeb2ce]">Original talk, documentaries, interviews, and performances from the Starcast Media network.</p>
        </div>

        {rows.map((row) => (
          <ShowRow key={row.id} row={row} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
