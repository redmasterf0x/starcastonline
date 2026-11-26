import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { bandEvents, bands } from "@/lib/db/schema"
import { eq, and, gte, asc } from "drizzle-orm"
import { Ticket, Calendar, MapPin, ArrowRight, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Tickets",
  description:
    "Browse upcoming live events and buy official QR tickets for Topeka and Midwest artists on StarCast Online.",
}

export default async function TicketsPage() {
  const now = new Date()
  const events = await db
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
    .where(and(eq(bandEvents.status, "active"), gte(bandEvents.eventDate, now)))
    .orderBy(asc(bandEvents.eventDate))

  return (
    <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#20205a] pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#ffd166]">
              <Ticket className="w-4 h-4 text-[#ea6f2a]" />
              StarCast Box Office
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#f5f7ff] tracking-tight">
              Event Tickets
            </h1>
            <p className="text-sm text-[#9a9fc4]">
              Official live show passes with instant QR delivery.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-[#20205a] bg-[#0c0c3f]/70 text-[#f5f7ff] hover:bg-[#20205a]/50 rounded-xl h-10 px-4 text-xs font-semibold self-start sm:self-auto"
          >
            <Link href="/dashboard">Sell Tickets on StarCast &rarr;</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-[#20205a] bg-gradient-to-b from-[#0c0c3f]/90 to-[#05052d]/90 p-10 sm:p-14 text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/35 flex items-center justify-center mx-auto text-[#ea6f2a]">
              <Ticket className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">
                There are no tickets available right now
              </h2>
              <p className="text-sm text-[#9a9fc4] max-w-md mx-auto">
                No upcoming ticketed shows are currently on sale. Check back soon or explore local bands and artists on StarCast.
              </p>
            </div>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-10 px-5 text-sm"
              >
                <Link href="/bands">
                  <Music className="w-4 h-4 mr-2" />
                  Explore Bands
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map(({ event, band }) => {
              const priceLabel =
                event.priceCents > 0 ? `$${(event.priceCents / 100).toFixed(2)}` : "Free"
              return (
                <div
                  key={event.id}
                  className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/80 p-5 sm:p-6 flex flex-col justify-between gap-5 hover:border-[#ea6f2a]/50 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#ffd166] uppercase tracking-wider">
                        {band.name}
                      </span>
                      <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border-[#ea6f2a]/40 font-mono text-xs">
                        {priceLabel}
                      </Badge>
                    </div>

                    <h2 className="text-xl font-extrabold text-[#f5f7ff] leading-snug">
                      {event.title}
                    </h2>

                    <div className="space-y-1.5 text-xs sm:text-sm text-[#cbd0f2]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#ffd166] shrink-0" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          &bull; {event.startTime || "8:00 PM"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#20efe0] shrink-0" />
                        <span>
                          {event.venueName}
                          {event.venueAddress ? ` — ${event.venueAddress}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#20205a]/70">
                    <span className="text-xs font-mono text-[#9a9fc4]">
                      {event.remainingInventory} of {event.totalInventory} left
                    </span>
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-9 px-4 text-xs"
                    >
                      <Link href={`/bands/${band.slug || band.id}`}>
                        Get Tickets <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
