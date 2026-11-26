import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTicketSellerCentralData } from "@/app/actions/band-tickets"
import { SellerCentralClient } from "./seller-central-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ticket Seller Central",
  description:
    "Manage your approved StarCast ticket sales, door cash logs, event scanners, and export tax reports.",
}

export default async function TicketSellerCentralPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) {
    redirect("/login?redirect=/tickets/seller-central")
  }

  const data = await getTicketSellerCentralData()

  return (
    <SellerCentralClient
      isApprovedSeller={Boolean(data.isApprovedSeller)}
      myBands={data.myBands || []}
      approvedBands={data.approvedBands || []}
      events={data.events || []}
      orders={data.orders || []}
    />
  )
}
