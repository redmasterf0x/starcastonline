import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { bandEvents, bands } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getViewerPermissions } from "@/lib/permissions"
import { isAssignedEventScanner } from "@/app/actions/band-tickets"
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
    .leftJoin(bands, eq(bands.id, bandEvents.bandId))
    .where(eq(bandEvents.id, id))
    .limit(1)

  if (!row) {
    return { title: "Event Not Found" }
  }

  const hostName = row.bandName || row.event.organizerName || "StarCast Event"

  return {
    title: `${row.event.title} — ${hostName} | Tickets`,
    description:
      row.event.description ||
      `Get official QR tickets for ${hostName} — ${row.event.title} at ${row.event.venueName}.`,
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
        ownerUserId: bands.ownerUserId,
      },
    })
    .from(bandEvents)
    .leftJoin(bands, eq(bands.id, bandEvents.bandId))
    .where(eq(bandEvents.id, id))
    .limit(1)

  if (!row) {
    notFound()
  }

  const viewer = await getViewerPermissions().catch(() => null)
  const isCreator = Boolean(
    viewer &&
      ((row.event.ownerUserId && row.event.ownerUserId === viewer.userId) ||
        (row.band?.ownerUserId && row.band.ownerUserId === viewer.userId))
  )
  const isAssignedScanner = viewer ? await isAssignedEventScanner(row.event.id, viewer.userId) : false
  const canScan = Boolean(isCreator || viewer?.isStaff || isAssignedScanner)
  const canEdit = Boolean(isCreator || viewer?.isAdmin)

  return (
    <EventBuyClient
      event={row.event}
      band={{
        id: row.band?.id || "",
        name: row.band?.name || row.event.organizerName || "StarCast Event",
        slug: row.band?.slug || null,
        logoUrl: row.band?.logoUrl || null,
      }}
      canScan={canScan}
      canEdit={canEdit}
    />
  )
}
