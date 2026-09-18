"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Printer,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Check,
  Music,
  ArrowLeft,
  Download,
  Scissors,
} from "lucide-react"

interface TicketClientProps {
  ticket: {
    id: string
    ticketNumber: number
    qrToken: string
    holderName: string
    holderEmail: string
    status: string
    checkedInAt: Date | null
    createdAt: Date
  }
  event: {
    id: string
    title: string
    description: string | null
    venueName: string
    venueAddress: string | null
    eventDate: Date
    doorsOpenTime: string | null
    startTime: string | null
    priceCents: number
    totalInventory: number
    ageRestriction: string | null
    flyerUrl: string | null
    status: string
  }
  band: {
    id: string
    name: string
    slug: string | null
    logoUrl: string | null
    type: string | null
  }
  order: {
    id: string
    buyerName: string
    buyerEmail: string
    quantity: number
    totalCents: number
    createdAt: Date
  }
  qrDataUrl: string
  isNewPurchase?: boolean
}

export function TicketClient({
  ticket,
  event,
  band,
  order,
  qrDataUrl,
  isNewPurchase = false,
}: TicketClientProps) {
  const [copied, setCopied] = useState(false)

  const eventDate = new Date(event.eventDate)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  function handlePrint() {
    window.print()
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isValid = ticket.status === "valid"
  const isCheckedIn = ticket.status === "checked_in"

  return (
    <div className="min-h-screen text-[#f5f7ff] flex flex-col justify-between bg-[#05051f]">
      {/* Screen-only Header */}
      <div className="print:hidden">
        <ResponsiveHeader />
      </div>

      <main className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center">
        {/* Celebration Banner for new purchase */}
        {isNewPurchase && (
          <div className="w-full max-w-2xl mb-6 p-4 rounded-xl bg-[#22b573]/15 border border-[#22b573]/40 text-[#22b573] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 print:hidden">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm sm:text-base">Ticket Confirmed & Reserved!</p>
                <p className="text-xs text-[#f5f7ff]/80">
                  Your entry is secured in the inventory. Print this ticket or show the QR code at the door.
                </p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-[#22b573] hover:bg-[#1a935c] text-black font-semibold shrink-0"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        )}

        {/* Action Toolbar (Screen only) */}
        <div className="w-full max-w-2xl mb-6 flex items-center justify-between print:hidden">
          <Link
            href={band.slug ? `/bands/${band.slug}` : "/bands"}
            className="text-xs sm:text-sm text-[#9a9fc4] hover:text-[#f5f7ff] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {band.name}
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-[#20205a] bg-[#0c0c3f]/60 text-[#f5f7ff] hover:bg-[#20205a]"
            >
              {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-1.5" />}
              {copied ? "Link Copied" : "Share"}
            </Button>

            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/20"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print Ticket
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TICKET CONTAINER (Screen & Print Optimized) */}
        {/* ========================================================================= */}
        <div
          id="printable-ticket"
          className="w-full max-w-2xl rounded-2xl overflow-hidden border border-[#20205a] bg-[#0c0c3f]/80 shadow-2xl backdrop-blur-md transition-all print:border-2 print:border-black print:bg-white print:text-black print:shadow-none print:max-w-none print:rounded-none"
        >
          {/* Top Cosmic Broadcast Header */}
          <div className="relative bg-gradient-to-r from-[#05052d] via-[#10104e] to-[#05052d] border-b border-[#20205a] p-6 sm:p-8 text-center print:bg-white print:border-b-2 print:border-black print:p-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea6f2a] animate-pulse print:hidden" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#ea6f2a] print:text-black font-mono">
                  StarCast Live Soundstage
                </span>
              </div>

              {isValid && (
                <Badge className="bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40 print:bg-transparent print:border-black print:text-black font-mono">
                  ★ OFFICIAL TICKET
                </Badge>
              )}
              {isCheckedIn && (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 print:text-black">
                  ✓ CHECKED IN
                </Badge>
              )}
            </div>

            <p className="text-xs uppercase tracking-wider text-[#9a9fc4] print:text-gray-600 font-semibold mb-1">
              {band.name} Presents
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#f5f7ff] print:text-black mb-2">
              {event.title}
            </h1>

            {event.ageRestriction && (
              <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-[#20205a]/60 text-[#20efe0] font-medium print:bg-gray-100 print:text-black print:border print:border-gray-400">
                {event.ageRestriction}
              </span>
            )}
          </div>

          {/* Ticket Body & QR Section */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center print:p-6 print:grid-cols-3">
            {/* Left 2 Cols: Event & Attendee Details */}
            <div className="md:col-span-2 space-y-4 print:col-span-2">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#20205a]/50 print:border-b print:border-gray-300">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9a9fc4] print:text-gray-500 font-medium">
                    Date
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-[#f5f7ff] print:text-black">
                    {formattedDate}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9a9fc4] print:text-gray-500 font-medium">
                    Showtime
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-[#f5f7ff] print:text-black">
                    {event.startTime || "8:00 PM"}
                    {event.doorsOpenTime ? ` (Doors: ${event.doorsOpenTime})` : ""}
                  </p>
                </div>
              </div>

              <div className="pb-4 border-b border-[#20205a]/50 print:border-b print:border-gray-300">
                <p className="text-[11px] uppercase tracking-wider text-[#9a9fc4] print:text-gray-500 font-medium">
                  Venue & Location
                </p>
                <p className="text-base font-bold text-[#f5f7ff] print:text-black">{event.venueName}</p>
                {event.venueAddress && (
                  <p className="text-xs text-[#9a9fc4] print:text-gray-600">{event.venueAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9a9fc4] print:text-gray-500 font-medium">
                    Ticket Holder
                  </p>
                  <p className="text-sm font-semibold text-[#f5f7ff] print:text-black truncate">
                    {ticket.holderName}
                  </p>
                  <p className="text-xs text-[#9a9fc4] print:text-gray-500 truncate">{ticket.holderEmail}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9a9fc4] print:text-gray-500 font-medium">
                    Ticket Number
                  </p>
                  <p className="text-sm font-mono font-bold text-[#ea6f2a] print:text-black">
                    #{String(ticket.ticketNumber).padStart(3, "0")} / {event.totalInventory}
                  </p>
                  <p className="text-xs text-[#9a9fc4] print:text-gray-500">
                    {event.priceCents > 0 ? `$${(event.priceCents / 100).toFixed(2)} Paid` : "Free Admission"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Scannable QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white text-black border-2 border-[#20efe0]/40 print:border-2 print:border-black print:p-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scannable Ticket QR Code"
                  className="w-40 h-40 object-contain rounded-md"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center font-mono text-xs text-black border border-black">
                  {ticket.qrToken.slice(0, 12)}
                </div>
              )}
              <p className="mt-2 text-[10px] font-mono tracking-wider uppercase text-black font-semibold text-center">
                Scan at Door
              </p>
              <p className="text-[9px] font-mono text-gray-700 text-center truncate max-w-[150px]">
                {ticket.qrToken.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Scissor / Cut Line Divider (Print Only) */}
          <div className="hidden print:flex items-center gap-2 px-6 py-2 text-gray-400 text-[10px] border-t-2 border-dashed border-gray-400">
            <Scissors className="w-3 h-3" />
            <span>Tear / Cut along dashed line for physical door stub</span>
          </div>

          {/* Ticket Footer & Security Terms */}
          <div className="bg-[#05052d]/90 border-t border-[#20205a] p-4 sm:p-6 text-xs text-[#9a9fc4] flex flex-col sm:flex-row items-center justify-between gap-3 print:bg-white print:border-t-2 print:border-black print:text-black print:p-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-[#f5f7ff] print:text-black">
                StarCast Media Verified Event Ticket
              </p>
              <p className="text-[11px] text-[#9a9fc4] print:text-gray-600">
                Present QR code or physical printout for admission. Non-transferable without band approval.
              </p>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="font-mono text-[10px] text-[#20efe0] print:text-black block">
                ID: {ticket.id.slice(0, 8)}
              </span>
              <span className="text-[10px] text-[#9a9fc4] print:text-gray-500">
                Issued: {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Print Stylesheet Overrides */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .public-shell,
            main {
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }
            #printable-ticket {
              margin: 20px auto !important;
              border: 2px solid #000000 !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </main>

      {/* Screen-only Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
