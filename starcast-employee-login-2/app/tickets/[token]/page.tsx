import { notFound } from "next/navigation"
import { getTicketByToken } from "@/app/actions/band-tickets"
import { TicketClient } from "./ticket-client"
import QRCode from "qrcode"

export const dynamic = "force-dynamic"

export default async function DigitalTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ purchased?: string }>
}) {
  const { token } = await params
  const { purchased } = await searchParams

  const data = await getTicketByToken(token)

  if (!data) {
    notFound()
  }

  // Generate QR code data URL server-side
  let qrDataUrl = ""
  try {
    qrDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: {
        dark: "#05051f",
        light: "#ffffff",
      },
    })
  } catch (err) {
    console.error("Failed to generate QR code:", err)
  }

  return (
    <TicketClient
      ticket={data.instance}
      event={data.event}
      band={data.band}
      order={data.order}
      qrDataUrl={qrDataUrl}
      isNewPurchase={purchased === "1"}
    />
  )
}
