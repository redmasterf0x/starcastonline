import Link from "next/link"
import { redirect } from "next/navigation"
import { verifyAndFulfillTicketOrder } from "@/app/actions/ticket-purchase"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Ticket, ArrowRight, Sparkles, Printer } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TicketSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/")
  }

  const result = await verifyAndFulfillTicketOrder(sessionId)

  if (!result.success || !result.firstToken) {
    return (
      <div className="public-shell min-h-screen text-[#f5f7ff] flex flex-col justify-between">
        <ResponsiveHeader />
        <main className="public-container public-section py-20 flex flex-col items-center text-center">
          <div className="public-panel max-w-lg p-8 rounded-2xl border border-red-500/40 bg-[#0c0c3f]/80">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Order Verification</h1>
            <p className="text-[#9a9fc4] mb-6">
              {result.error || "We could not immediately verify your ticket order. Please check your email or contact support."}
            </p>
            <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white">
              <Link href="/bands">Explore Bands</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Redirect directly to the digital ticket page
  redirect(`/tickets/${result.firstToken}?purchased=1`)
}
