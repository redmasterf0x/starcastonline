import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getViewerPermissions } from "@/lib/permissions"
import { db } from "@/lib/db"
import { bandEvents, bands, bandTicketInstances, bandTicketOrders, profiles } from "@/lib/db/schema"
import { eq, and, gte, asc, desc, or, ilike, sql } from "drizzle-orm"
import { Ticket, Calendar, MapPin, ArrowRight, Music, QrCode, LogIn, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Top City Tickets",
  description:
    "Top City Tickets — Browse upcoming live events, view your saved or purchased QR tickets, and buy passes on StarCast Online.",
}

export default async function TicketsPage() {
  const now = new Date()
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

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
    .leftJoin(bands, eq(bands.id, bandEvents.bandId))
    .where(
      and(
        eq(bandEvents.status, "active"),
        sql`COALESCE(${bandEvents.eventEndDate}, ${bandEvents.eventDate} + interval '1 hour') >= ${now}`
      )
    )
    .orderBy(asc(bandEvents.eventDate))

  let isApprovedSeller = false
  let myTickets: Array<{
    instance: typeof bandTicketInstances.$inferSelect
    event: typeof bandEvents.$inferSelect
    band: { id: string; name: string; slug: string | null } | null
    order: { totalCents: number; unitPriceCents: number }
  }> = []

  if (session?.user) {
    const [viewer, [userProfile], approvedRows] = await Promise.all([
      getViewerPermissions().catch(() => null),
      db
        .select({ ticketingStatus: profiles.ticketingStatus })
        .from(profiles)
        .where(eq(profiles.userId, session.user.id))
        .limit(1),
      db
        .select({ id: bands.id })
        .from(bands)
        .where(and(eq(bands.ownerUserId, session.user.id), eq(bands.ticketingStatus, "approved")))
        .limit(1),
    ])
    isApprovedSeller =
      userProfile?.ticketingStatus === "approved" ||
      approvedRows.length > 0 ||
      Boolean(viewer?.isAdmin)

    const matchConditions = [eq(bandTicketOrders.buyerUserId, session.user.id)]
    if (session.user.email) {
      matchConditions.push(ilike(bandTicketInstances.holderEmail, session.user.email))
      matchConditions.push(ilike(bandTicketOrders.buyerEmail, session.user.email))
    }

    myTickets = await db
      .select({
        instance: bandTicketInstances,
        event: bandEvents,
        band: {
          id: bands.id,
          name: bands.name,
          slug: bands.slug,
        },
        order: {
          totalCents: bandTicketOrders.totalCents,
          unitPriceCents: bandTicketOrders.unitPriceCents,
        },
      })
      .from(bandTicketInstances)
      .innerJoin(bandTicketOrders, eq(bandTicketOrders.id, bandTicketInstances.orderId))
      .innerJoin(bandEvents, eq(bandEvents.id, bandTicketInstances.eventId))
      .leftJoin(bands, eq(bands.id, bandTicketInstances.bandId))
      .where(and(eq(bandTicketOrders.status, "paid"), or(...matchConditions)))
      .orderBy(desc(bandTicketInstances.createdAt))
  }

  return (
    <div className="public-shell min-h-[calc(100vh-5rem)] px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Page Header — Top City Tickets Branded Face */}
        <div className="relative overflow-hidden rounded-3xl border border-[#20efe0]/45 bg-gradient-to-br from-[#3a0b5c]/90 via-[#1f0a4a]/95 to-[#062940]/95 p-6 sm:p-8 shadow-[0_12px_40px_rgba(232,69,214,0.22),0_4px_24px_rgba(32,239,224,0.18)]">
          <div
            className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full opacity-35 blur-3xl"
            style={{ background: "radial-gradient(circle, #e845d6 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full opacity-35 blur-3xl"
            style={{ background: "radial-gradient(circle, #20efe0 0%, transparent 70%)" }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/top-city-tickets-horizontal.webp"
                  alt="Top City Tickets"
                  className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_18px_rgba(32,239,224,0.28)]"
                />
                <h1 className="sr-only">Top City Tickets</h1>
              </div>
              <p className="text-xs sm:text-sm text-[#cbd0f2] max-w-lg">
                Official live show &amp; event passes with instant QR delivery &bull;{" "}
                <span className="text-[#9a9fc4]">Powered by StarCast Online</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
              {isApprovedSeller ? (
                <Button
                  asChild
                  className="bg-[#ffd166] hover:bg-[#f5c242] text-[#05051f] font-extrabold rounded-xl h-10 px-4 text-xs shadow-md"
                >
                  <Link href="/tickets/seller-central">Ticket Seller Central &rarr;</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#20efe0]/40 bg-[#05052d]/80 text-[#f5f7ff] hover:bg-[#20205a]/70 rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  <Link href="/tickets/seller-central">Ticket Seller Central &rarr;</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── MY TICKETS SECTION ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#f5f7ff] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#20efe0]" />
              My Tickets
              {session?.user && myTickets.length > 0 && (
                <Badge className="bg-[#20efe0]/15 text-[#20efe0] border-[#20efe0]/40 text-xs font-mono ml-1">
                  {myTickets.length}
                </Badge>
              )}
            </h2>
          </div>

          {!session?.user ? (
            <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/65 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-bold text-[#f5f7ff]">Sign in to view your tickets</p>
                <p className="text-xs sm:text-sm text-[#9a9fc4]">
                  Any free passes you save or paid tickets you buy will appear here with your QR code ready for the door.
                </p>
              </div>
              <Button
                asChild
                className="bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] font-extrabold rounded-xl h-10 px-5 text-xs shrink-0"
              >
                <Link href="/login?redirect=/tickets">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign In
                </Link>
              </Button>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#20205a] bg-[#0c0c3f]/40 p-6 text-center space-y-1.5">
              <p className="text-sm font-bold text-[#f5f7ff]">You have no saved or purchased tickets yet</p>
              <p className="text-xs text-[#9a9fc4]">
                When you claim a free ticket or buy a pass, your QR tickets will be saved right here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTickets.map(({ instance, event, band, order }) => {
                const isCheckedIn = instance.status === "checked_in"
                const isCancelled = instance.status === "cancelled" || instance.status === "refunded"
                const isFree = (order.unitPriceCents ?? event.priceCents ?? 0) === 0
                return (
                  <div
                    key={instance.id}
                    className="rounded-3xl border border-[#20efe0]/35 bg-gradient-to-br from-[#0c0c3f] to-[#081036] p-5 flex flex-col justify-between gap-4 shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#ffd166] uppercase tracking-wider truncate">
                          {band?.name || event.organizerName || "StarCast Event"}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {instance.ticketTier === "vip" && (
                            <Badge className="bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/50 text-[10px] font-extrabold">
                              ★ VIP TABLE
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="border-[#20205a] bg-[#05052d] text-[#cbd0f2] text-[10px] font-mono"
                          >
                            {isFree ? "FREE" : `$${((order.unitPriceCents ?? event.priceCents) / 100).toFixed(2)}`}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              isCheckedIn
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                                : isCancelled
                                ? "border-red-500/40 text-red-400 bg-red-500/10 text-[10px]"
                                : "border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-[10px]"
                            }
                          >
                            {isCheckedIn ? "Checked In" : isCancelled ? instance.status : "Valid Pass"}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="text-lg font-extrabold text-[#f5f7ff] leading-snug">
                        {event.title}
                      </h3>

                      <div className="space-y-1 text-xs text-[#cbd0f2]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#ffd166] shrink-0" />
                          <span>
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              timeZone: "America/Chicago",
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            &bull; {event.startTime || "8:00 PM"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#20efe0] shrink-0" />
                          <span>{event.venueName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#20205a]/70">
                      <span className="text-xs font-mono text-[#9a9fc4] flex items-center gap-1.5">
                        {isCheckedIn && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        Ticket #{instance.ticketNumber}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#20efe0] hover:bg-[#19cbbd] text-[#05051f] font-extrabold rounded-xl h-9 px-4 text-xs"
                      >
                        <Link href={`/tickets/${instance.qrToken}`}>
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          View QR Ticket
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── UPCOMING EVENTS / TICKETS ON SALE ── */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#f5f7ff]">
            Upcoming Tickets
          </h2>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-[#20205a] bg-gradient-to-b from-[#0c0c3f]/90 to-[#05052d]/90 p-10 sm:p-14 text-center space-y-5 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/top-city-tickets-stacked.webp"
                alt="Top City Tickets"
                className="h-28 w-auto mx-auto object-contain opacity-90 drop-shadow-[0_4px_16px_rgba(232,69,214,0.25)]"
              />
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff]">
                  There are no tickets available right now
                </h3>
                <p className="text-sm text-[#9a9fc4] max-w-md mx-auto">
                  No upcoming Top City Tickets shows are currently on sale. Check back soon or explore local bands and artists on StarCast.
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
                    className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/80 overflow-hidden flex flex-col justify-between hover:border-[#ea6f2a]/50 transition-colors shadow-lg"
                  >
                    {event.flyerUrl && (
                      <Link href={`/events/${event.id}`} className="block w-full h-44 bg-[#05052d] overflow-hidden border-b border-[#20205a]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.flyerUrl}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    )}

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#ffd166] uppercase tracking-wider truncate">
                            {band?.name || event.organizerName || "StarCast Event"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {event.vipEnabled && (
                              <Badge className="bg-[#ffd166]/20 text-[#ffd166] border border-[#ffd166]/50 text-[10px] font-extrabold">
                                ★ VIP Table + Bar &amp; Food
                              </Badge>
                            )}
                            {event.recurrenceFrequency && event.recurrenceFrequency !== "one_time" && (
                              <Badge variant="outline" className="border-[#20efe0]/40 text-[#20efe0] bg-[#20efe0]/10 text-[10px] capitalize">
                                {event.recurrenceFrequency}
                              </Badge>
                            )}
                            <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border-[#ea6f2a]/40 font-mono text-xs">
                              {priceLabel}
                            </Badge>
                          </div>
                        </div>

                        <Link href={`/events/${event.id}`} className="block group">
                          <h3 className="text-xl font-extrabold text-[#f5f7ff] group-hover:text-[#ffd166] transition-colors leading-snug">
                            {event.title}
                          </h3>
                        </Link>

                        <div className="space-y-1.5 text-xs sm:text-sm text-[#cbd0f2]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#ffd166] shrink-0" />
                            <span>
                              {new Date(event.eventDate).toLocaleDateString("en-US", {
                                timeZone: "America/Chicago",
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
                          <Link href={`/events/${event.id}`}>
                            Get Tickets <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
