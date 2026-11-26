import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { bandEvents, bands } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { EventBuyClient } from "./event-buy-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const [row] = await db
    .select({
      event: bandEvents,
      bandName: bands.name,
    })
    .from(bandEvents)
    .innerJoin(bands, eq(bands.id, bandEvents.bandId))
    .where(eq(bandEvents.id, id))
    .limit(1)

  if (!row) {
    return { title: "Event Not Found" }
  }

  return {
    title: `${row.event.title} — ${row.bandName} | Tickets`,
    description:
      row.event.description ||
      `Get official QR tickets for ${row.bandName} — ${row.event.title} at ${row.event.venueName}.`,
  }
}

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [row] = await db
    .select({
      event: bandEvents,
      band: {
        id: bands.id,
        name: bands.name,
        slug: bands.slug,
        logoUrl: bands.logoUrl,
      },
    })
    .from(bandEvents)
    .innerJoin(bands, eq(bands.id, bandEvents.bandId))
    .where(eq(bandEvents.id, id))
    .limit(1)

  if (!row) {
    notFound()
  }

  return <EventBuyClient event={row.event} band={row.band} />
}
