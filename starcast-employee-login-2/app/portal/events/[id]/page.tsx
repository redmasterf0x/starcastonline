import { redirect, notFound } from "next/navigation"
import { getEventScannerData } from "@/app/actions/band-tickets"
import { EventScannerClient } from "./event-scanner-client"

export const dynamic = "force-dynamic"

export default async function SellerEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getEventScannerData(id)

  if (!res.success || !res.event || !res.band) {
    if (res.error === "Unauthorized") {
      redirect(`/login?redirect=/portal/events/${id}`)
    }
    if (res.error === "Event not found") {
      notFound()
    }
    redirect("/portal")
  }

  return (
    <EventScannerClient
      event={res.event}
      band={res.band}
      initialInstances={res.instances || []}
      canEdit={Boolean(res.canEdit)}
      canManageScanners={Boolean(res.canManageScanners)}
      isScannerOnly={Boolean(res.isScannerOnly)}
      initialScanners={res.scanners || []}
      initialCashSales={res.cashSales || { ticketsCount: 0, totalCents: 0, orders: [] }}
    />
  )
}
