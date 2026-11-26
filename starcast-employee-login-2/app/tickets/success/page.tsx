import { Suspense } from "react"
import Loading from "@/app/loading"
import { TicketSuccessClient } from "./ticket-success-client"

export const dynamic = "force-dynamic"

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TicketSuccessClient />
    </Suspense>
  )
}
