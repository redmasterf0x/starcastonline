import { redirect } from "next/navigation"
import { headers } from "next/headers"
import QRCode from "qrcode"
import { auth } from "@/lib/auth"
import { getEventPrintTicketsData } from "@/app/actions/band-tickets"
import { PrintTicketsClient } from "./print-tickets-client"

export const dynamic = "force-dynamic"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"

export default async function PrintEventTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) {
    redirect(`/login?redirect=/portal/events/${id}/print`)
  }

  const data = await getEventPrintTicketsData(id)
  if (!data.success || !data.event) {
    redirect("/tickets/seller-central")
  }

  const ticketsWithQr = await Promise.all(
    (data.tickets || []).map(async (t) => {
      const verifyUrl = `${baseUrl}/tickets/${t.qrToken}`
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 220,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      })
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        ticketTier: t.ticketTier || "general",
        qrToken: t.qrToken,
        holderName: t.holderName,
        status: t.status,
        qrDataUrl,
      }
    })
  )

  return (
    <PrintTicketsClient
      event={{
        id: data.event.id,
        title: data.event.title,
        venueName: data.event.venueName,
        venueAddress: data.event.venueAddress,
        eventDate: data.event.eventDate.toISOString(),
        doorsOpenTime: data.event.doorsOpenTime,
        startTime: data.event.startTime,
        priceCents: data.event.priceCents,
        vipEnabled: data.event.vipEnabled,
        vipPriceCents: data.event.vipPriceCents,
        totalInventory: data.event.totalInventory,
        remainingInventory: data.event.remainingInventory,
        ageRestriction: data.event.ageRestriction,
      }}
      organizerName={data.organizerName || "StarCast Event"}
      tickets={ticketsWithQr}
    />
  )
}
