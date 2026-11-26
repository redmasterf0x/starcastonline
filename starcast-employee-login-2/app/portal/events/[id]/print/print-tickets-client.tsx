"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { issuePhysicalPrintTickets } from "@/app/actions/band-tickets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Printer, Plus, Loader2, QrCode, Scissors } from "lucide-react"

interface PrintableTicket {
  id: string
  ticketNumber: number
  qrToken: string
  holderName: string
  status: string
  qrDataUrl: string
}

interface PrintTicketsClientProps {
  event: {
    id: string
    title: string
    venueName: string
    venueAddress: string | null
    eventDate: string
    doorsOpenTime: string | null
    startTime: string | null
    priceCents: number
    totalInventory: number
    remainingInventory: number
    ageRestriction: string | null
  }
  organizerName: string
  tickets: PrintableTicket[]
}

export function PrintTicketsClient({
  event,
  organizerName,
  tickets,
}: PrintTicketsClientProps) {
  const router = useRouter()
  const [qty, setQty] = useState(10)
  const [label, setLabel] = useState("Physical Pre-Sale Ticket")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlyValid, setOnlyValid] = useState(true)

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const visibleTickets = onlyValid ? tickets.filter((t) => t.status === "valid") : tickets

  async function handleMintBatch(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await issuePhysicalPrintTickets({
        eventId: event.id,
        quantity: qty,
        label,
      })
      if (!res.success) {
        setError(res.error || "Failed to generate physical tickets.")
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate physical tickets.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05051f] text-[#f5f7ff] print:bg-white print:text-black">
      {/* Screen-only Controls */}
      <div className="print:hidden max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/tickets/seller-central"
              className="inline-flex items-center gap-1.5 text-sm text-[#9a9fc4] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Seller Central
            </Link>
            <Link
              href={`/portal/events/${event.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#20efe0] hover:underline"
            >
              <QrCode className="w-4 h-4" />
              Door Scanner
            </Link>
          </div>

          <Button
            type="button"
            onClick={() => window.print()}
            disabled={visibleTickets.length === 0}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-extrabold rounded-xl h-10 px-5 text-sm shadow-lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print {visibleTickets.length} Physical Ticket{visibleTickets.length === 1 ? "" : "s"}
          </Button>
        </div>

        <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Print Physical Pre-Sale Tickets
              </h1>
              <p className="text-xs sm:text-sm text-[#9a9fc4]">
                {organizerName} &mdash; <strong className="text-white">{event.title}</strong> ({formattedDate}) &bull;{" "}
                <span className="font-mono text-[#20efe0]">
                  {event.remainingInventory} / {event.totalInventory} inventory remaining
                </span>
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-[#cbd0f2] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyValid}
                onChange={(e) => setOnlyValid(e.target.checked)}
                className="rounded border-[#20205a]"
              />
              Hide already-scanned tickets
            </label>
          </div>

          {/* Mint New Physical Batch Form */}
          <form
            onSubmit={handleMintBatch}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-3 border-t border-[#20205a]/70"
          >
            <div className="sm:col-span-3">
              <Label htmlFor="phys-qty" className="text-xs text-[#9a9fc4]">
                Quantity to Generate
              </Label>
              <Input
                id="phys-qty"
                type="number"
                min="1"
                max={Math.max(1, Math.min(200, event.remainingInventory))}
                value={String(qty)}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-5">
              <Label htmlFor="phys-label" className="text-xs text-[#9a9fc4]">
                Ticket Label / Batch Note (printed on stub)
              </Label>
              <Input
                id="phys-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Physical Pre-Sale Ticket"
                className="mt-1 h-10 bg-[#05052d] border-[#20205a] text-[#f5f7ff] rounded-xl"
              />
            </div>

            <div className="sm:col-span-4">
              <Button
                type="submit"
                disabled={busy || event.remainingInventory <= 0}
                className="w-full h-10 rounded-xl bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] font-extrabold text-xs"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Plus className="w-4 h-4 mr-1.5" />
                )}
                {event.remainingInventory <= 0 ? "Sold Out" : "Generate Printable Batch"}
              </Button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <p className="text-[11px] text-[#9a9fc4] flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-[#ffd166] shrink-0" />
            Every physical ticket has its own unique QR code, reserves 1 spot from your event inventory, carries 0% online fee, and scans straight into your Door Scanner at the venue.
          </p>
        </div>
      </div>

      {/* Printable Sheet (Screen Preview + Clean Black & White Print Output) */}
      <div className="max-w-5xl mx-auto px-4 pb-12 print:max-w-none print:p-0">
        {visibleTickets.length === 0 ? (
          <div className="print:hidden rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-12 text-center text-sm text-[#9a9fc4]">
            No physical pre-sale tickets generated yet. Enter a quantity above and click{" "}
            <strong className="text-white">Generate Printable Batch</strong> to create cut-out QR tickets.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {visibleTickets.map((t) => (
              <div
                key={t.id}
                className="break-inside-avoid rounded-xl border-2 border-dashed border-[#20efe0]/50 bg-white text-black p-4 flex items-center justify-between gap-3 shadow-md print:border-black print:shadow-none print:rounded-none"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-300 pb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/top-city-tickets-horizontal.webp"
                      alt="Top City Tickets"
                      className="h-6 w-auto object-contain"
                    />
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border border-black rounded">
                      #{t.ticketNumber}
                    </span>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 truncate">
                    {organizerName}
                  </p>
                  <h2 className="text-base font-black leading-tight text-black line-clamp-2">
                    {event.title}
                  </h2>

                  <div className="text-[11px] text-gray-800 space-y-0.5 pt-0.5">
                    <p className="font-bold">
                      {formattedDate} &bull; Show {event.startTime || "8:00 PM"}
                    </p>
                    <p className="truncate">
                      {event.venueName}
                      {event.venueAddress ? ` — ${event.venueAddress}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200 text-[11px]">
                    <span className="font-black">
                      {event.priceCents > 0 ? `$${(event.priceCents / 100).toFixed(2)}` : "FREE PASS"}
                    </span>
                    <span className="text-[10px] text-gray-600 truncate">
                      {event.ageRestriction || "All Ages"} &bull; {t.holderName}
                    </span>
                  </div>
                </div>

                {/* Right QR Stub */}
                <div className="shrink-0 pl-3 border-l-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.qrDataUrl}
                    alt={`Ticket #${t.ticketNumber} QR`}
                    className="w-24 h-24 object-contain"
                  />
                  <span className="text-[9px] font-mono text-gray-600 mt-1">
                    {t.qrToken.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                    Scan at Door
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
