"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { bands, bandEvents, bandTicketOrders, bandTicketInstances } from "@/lib/db/schema"
import { eq, and, desc, gte, sql, asc } from "drizzle-orm"
import { requireViewer, requireStaff } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export type CreateEventInput = {
  title: string
  description?: string
  venueName: string
  venueAddress?: string
  eventDate: string // ISO string
  doorsOpenTime?: string // e.g. "7:00 PM"
  startTime?: string // e.g. "8:00 PM"
  priceCents: number // e.g. 1500 for $15.00
  totalInventory: number // e.g. 20
  ageRestriction?: string // "All Ages" | "18+" | "21+"
  flyerUrl?: string
}

export type UpdateEventInput = Partial<CreateEventInput> & {
  status?: "draft" | "active" | "sold_out" | "past" | "cancelled"
}

// ---------------------------------------------------------------------------
// 1. Ticketing Feature Application & Admin Review
// ---------------------------------------------------------------------------

/** Submit an application for a band to unlock ticketing & Stripe payouts */
export async function applyForBandTicketing(bandId: string, notes: string = "") {
  try {
    const viewer = await requireViewer()
    const rows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
    const band = rows[0]
    if (!band) return { success: false, error: "Band not found" }
    if (band.ownerUserId !== viewer.userId && !viewer.isStaff) {
      return { success: false, error: "Unauthorized" }
    }

    await db
      .update(bands)
      .set({
        ticketingStatus: "applied",
        ticketingApplicationNotes: notes.trim() || null,
        ticketingAppliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bands.id, bandId))

    revalidatePath("/portal")
    revalidatePath("/admin")
    return { success: true }
  } catch (err: any) {
    console.error("applyForBandTicketing error:", err)
    return { success: false, error: err?.message || "Failed to submit application" }
  }
}

/** Admin review: approve or reject a band's ticketing application */
export async function adminReviewTicketingApplication(bandId: string, approved: boolean, reason?: string) {
  try {
    await requireStaff()
    const status = approved ? "approved" : "rejected"

    await db
      .update(bands)
      .set({
        ticketingStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(bands.id, bandId))

    revalidatePath("/admin")
    revalidatePath("/portal")
    return { success: true, status }
  } catch (err: any) {
    console.error("adminReviewTicketingApplication error:", err)
    return { success: false, error: err?.message || "Failed to review application" }
  }
}

/** Admin list: retrieve all pending and reviewed ticketing applications */
export async function adminListTicketingApplications() {
  try {
    await requireStaff()
    const rows = await db
      .select({
        id: bands.id,
        name: bands.name,
        slug: bands.slug,
        ownerUserId: bands.ownerUserId,
        contactEmail: bands.contactEmail,
        ticketingStatus: bands.ticketingStatus,
        ticketingApplicationNotes: bands.ticketingApplicationNotes,
        ticketingAppliedAt: bands.ticketingAppliedAt,
        stripeAccountId: bands.stripeAccountId,
        stripeAccountStatus: bands.stripeAccountStatus,
        createdAt: bands.createdAt,
      })
      .from(bands)
      .where(sql`${bands.ticketingStatus} != 'none'`)
      .orderBy(desc(bands.ticketingAppliedAt))

    return rows
  } catch (err: any) {
    console.error("adminListTicketingApplications error:", err)
    return []
  }
}

// ---------------------------------------------------------------------------
// 2. Event Ticket Creation ("POST a ticket") & Management
// ---------------------------------------------------------------------------

/** Create a new event ticket listing with inventory and 24h post-event escrow */
export async function createBandEvent(bandId: string, input: CreateEventInput) {
  try {
    const viewer = await requireViewer()
    const [band] = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
    if (!band) return { success: false, error: "Band not found" }
    if (band.ownerUserId !== viewer.userId && !viewer.isStaff) {
      return { success: false, error: "Unauthorized to post tickets for this band" }
    }

    if (band.ticketingStatus !== "approved") {
      return { success: false, error: "This band is not approved for ticketing yet. Please submit an application first." }
    }

    if (!input.title?.trim()) {
      return { success: false, error: "Event title is required" }
    }
    if (!input.venueName?.trim()) {
      return { success: false, error: "Venue name is required" }
    }

    const eventDate = new Date(input.eventDate)
    if (isNaN(eventDate.getTime())) {
      return { success: false, error: "Valid event date and time is required" }
    }

    const totalInventory = Math.max(1, input.totalInventory || 20)
    const priceCents = Math.max(0, input.priceCents || 0)

    // Calculate escrow release date: exactly 24 hours after the event time
    const escrowReleaseDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)

    // Optionally create Stripe product & price for this event if priced
    let stripeProductId: string | null = null
    let stripePriceId: string | null = null

    if (priceCents > 0) {
      try {
        const product = await stripe.products.create({
          name: `${band.name} - ${input.title.trim()}`,
          description: input.description?.slice(0, 500) || `Ticket for ${input.title} at ${input.venueName}`,
          metadata: {
            band_id: band.id,
            band_name: band.name,
            venue: input.venueName,
          },
        })
        stripeProductId = product.id

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceCents,
          currency: "usd",
        })
        stripePriceId = price.id
      } catch (stripeErr: any) {
        console.warn("Stripe product creation warning:", stripeErr?.message)
      }
    }

    const [newEvent] = await db
      .insert(bandEvents)
      .values({
        bandId: band.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        venueName: input.venueName.trim(),
        venueAddress: input.venueAddress?.trim() || null,
        eventDate,
        doorsOpenTime: input.doorsOpenTime?.trim() || "7:00 PM",
        startTime: input.startTime?.trim() || "8:00 PM",
        priceCents,
        totalInventory,
        remainingInventory: totalInventory,
        ageRestriction: input.ageRestriction || "All Ages",
        flyerUrl: input.flyerUrl?.trim() || null,
        status: "active",
        escrowStatus: "held",
        escrowReleaseDate,
        stripeProductId,
        stripePriceId,
      })
      .returning()

    revalidatePath("/portal")
    if (band.slug) revalidatePath(`/bands/${band.slug}`)

    return { success: true, event: newEvent }
  } catch (err: any) {
    console.error("createBandEvent error:", err)
    return { success: false, error: err?.message || "Failed to post ticket event" }
  }
}

/** Update an existing event */
export async function updateBandEvent(eventId: string, input: UpdateEventInput) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const [band] = await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1)
    if (!band || (band.ownerUserId !== viewer.userId && !viewer.isStaff)) {
      return { success: false, error: "Unauthorized" }
    }

    let eventDate = event.eventDate
    let escrowReleaseDate = event.escrowReleaseDate
    if (input.eventDate) {
      const parsed = new Date(input.eventDate)
      if (!isNaN(parsed.getTime())) {
        eventDate = parsed
        escrowReleaseDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    // If total inventory changed, adjust remaining inventory appropriately
    let remainingInventory = event.remainingInventory
    let totalInventory = event.totalInventory
    if (input.totalInventory !== undefined && input.totalInventory !== event.totalInventory) {
      const diff = input.totalInventory - event.totalInventory
      totalInventory = Math.max(1, input.totalInventory)
      remainingInventory = Math.max(0, event.remainingInventory + diff)
    }

    const [updated] = await db
      .update(bandEvents)
      .set({
        title: input.title !== undefined ? input.title.trim() : event.title,
        description: input.description !== undefined ? (input.description.trim() || null) : event.description,
        venueName: input.venueName !== undefined ? input.venueName.trim() : event.venueName,
        venueAddress: input.venueAddress !== undefined ? (input.venueAddress.trim() || null) : event.venueAddress,
        eventDate,
        doorsOpenTime: input.doorsOpenTime !== undefined ? input.doorsOpenTime : event.doorsOpenTime,
        startTime: input.startTime !== undefined ? input.startTime : event.startTime,
        priceCents: input.priceCents !== undefined ? input.priceCents : event.priceCents,
        totalInventory,
        remainingInventory,
        ageRestriction: input.ageRestriction !== undefined ? input.ageRestriction : event.ageRestriction,
        flyerUrl: input.flyerUrl !== undefined ? input.flyerUrl : event.flyerUrl,
        status: input.status || event.status,
        escrowReleaseDate,
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))
      .returning()

    revalidatePath("/portal")
    if (band.slug) revalidatePath(`/bands/${band.slug}`)

    return { success: true, event: updated }
  } catch (err: any) {
    console.error("updateBandEvent error:", err)
    return { success: false, error: err?.message || "Failed to update event" }
  }
}

/** Cancel an event and mark for refund */
export async function cancelBandEvent(eventId: string, reason?: string) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const [band] = await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1)
    if (!band || (band.ownerUserId !== viewer.userId && !viewer.isStaff)) {
      return { success: false, error: "Unauthorized" }
    }

    await db
      .update(bandEvents)
      .set({
        status: "cancelled",
        escrowStatus: "refunded",
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))

    // Mark all ticket instances as cancelled
    await db
      .update(bandTicketInstances)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(bandTicketInstances.eventId, eventId))

    revalidatePath("/portal")
    if (band.slug) revalidatePath(`/bands/${band.slug}`)

    return { success: true }
  } catch (err: any) {
    console.error("cancelBandEvent error:", err)
    return { success: false, error: err?.message || "Failed to cancel event" }
  }
}

/** Fetch all events for a specific band (portal view) */
export async function getBandEvents(bandId: string) {
  try {
    const rows = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.bandId, bandId))
      .orderBy(desc(bandEvents.eventDate))

    return rows
  } catch (err: any) {
    console.error("getBandEvents error:", err)
    return []
  }
}

/** Fetch active upcoming events for public display on a band page */
export async function getPublicBandEvents(bandSlugOrId: string) {
  try {
    // Find band by slug or ID
    const [band] = await db
      .select({ id: bands.id, name: bands.name, slug: bands.slug })
      .from(bands)
      .where(sql`${bands.slug} = ${bandSlugOrId} OR ${bands.id}::text = ${bandSlugOrId}`)
      .limit(1)

    if (!band) return []

    const rows = await db
      .select()
      .from(bandEvents)
      .where(
        and(
          eq(bandEvents.bandId, band.id),
          sql`${bandEvents.status} IN ('active', 'sold_out')`
        )
      )
      .orderBy(asc(bandEvents.eventDate))

    return rows.map((ev) => ({
      ...ev,
      bandName: band.name,
      bandSlug: band.slug,
    }))
  } catch (err: any) {
    console.error("getPublicBandEvents error:", err)
    return []
  }
}

/** Fetch single event details */
export async function getBandEventById(eventId: string) {
  try {
    const [event] = await db
      .select({
        event: bandEvents,
        band: bands,
      })
      .from(bandEvents)
      .innerJoin(bands, eq(bands.id, bandEvents.bandId))
      .where(eq(bandEvents.id, eventId))
      .limit(1)

    if (!event) return null

    return {
      ...event.event,
      band: event.band,
    }
  } catch (err: any) {
    console.error("getBandEventById error:", err)
    return null
  }
}

// ---------------------------------------------------------------------------
// 3. Ticket Instances, Printable Ticket Data & Door Scanner
// ---------------------------------------------------------------------------

/** Get printable ticket data by its unique QR verification token */
export async function getTicketByToken(qrToken: string) {
  try {
    const rows = await db
      .select({
        instance: bandTicketInstances,
        event: bandEvents,
        band: bands,
        order: bandTicketOrders,
      })
      .from(bandTicketInstances)
      .innerJoin(bandEvents, eq(bandEvents.id, bandTicketInstances.eventId))
      .innerJoin(bands, eq(bands.id, bandTicketInstances.bandId))
      .innerJoin(bandTicketOrders, eq(bandTicketOrders.id, bandTicketInstances.orderId))
      .where(eq(bandTicketInstances.qrToken, qrToken))
      .limit(1)

    if (rows.length === 0) return null
    return rows[0]
  } catch (err: any) {
    console.error("getTicketByToken error:", err)
    return null
  }
}

/** Fetch attendee guestlist and check-in statuses for a band's event (Door Check-In) */
export async function getEventTicketGuestlist(eventId: string) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const [band] = await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1)
    if (!band || (band.ownerUserId !== viewer.userId && !viewer.isStaff)) {
      return { success: false, error: "Unauthorized" }
    }

    const tickets = await db
      .select({
        id: bandTicketInstances.id,
        ticketNumber: bandTicketInstances.ticketNumber,
        qrToken: bandTicketInstances.qrToken,
        holderName: bandTicketInstances.holderName,
        holderEmail: bandTicketInstances.holderEmail,
        status: bandTicketInstances.status,
        checkedInAt: bandTicketInstances.checkedInAt,
        createdAt: bandTicketInstances.createdAt,
      })
      .from(bandTicketInstances)
      .where(eq(bandTicketInstances.eventId, eventId))
      .orderBy(asc(bandTicketInstances.ticketNumber))

    return {
      success: true,
      event,
      tickets,
      totalSold: tickets.length,
      checkedInCount: tickets.filter((t) => t.status === "checked_in").length,
    }
  } catch (err: any) {
    console.error("getEventTicketGuestlist error:", err)
    return { success: false, error: err?.message || "Failed to load guest list" }
  }
}

/** Door Check-In: check in a fan via QR code token or ticket ID */
export async function checkInTicket(tokenOrId: string, eventId?: string) {
  try {
    const viewer = await requireViewer()

    const [ticket] = await db
      .select({
        instance: bandTicketInstances,
        event: bandEvents,
        band: bands,
      })
      .from(bandTicketInstances)
      .innerJoin(bandEvents, eq(bandEvents.id, bandTicketInstances.eventId))
      .innerJoin(bands, eq(bands.id, bandTicketInstances.bandId))
      .where(
        sql`${bandTicketInstances.qrToken} = ${tokenOrId} OR ${bandTicketInstances.id}::text = ${tokenOrId}`
      )
      .limit(1)

    if (!ticket) {
      return { success: false, error: "Invalid ticket QR code / token" }
    }

    if (eventId && ticket.instance.eventId !== eventId) {
      return { success: false, error: "Ticket is for a different event!" }
    }

    if (ticket.band.ownerUserId !== viewer.userId && !viewer.isStaff) {
      return { success: false, error: "Unauthorized to check in tickets for this event" }
    }

    if (ticket.instance.status === "checked_in") {
      return {
        success: false,
        alreadyCheckedIn: true,
        error: `Ticket #${ticket.instance.ticketNumber} was already scanned & checked in at ${new Date(
          ticket.instance.checkedInAt!
        ).toLocaleTimeString()}!`,
        ticket: ticket.instance,
      }
    }

    if (ticket.instance.status === "cancelled" || ticket.instance.status === "refunded") {
      return {
        success: false,
        error: `This ticket is ${ticket.instance.status} and cannot be used for entry.`,
        ticket: ticket.instance,
      }
    }

    const [updated] = await db
      .update(bandTicketInstances)
      .set({
        status: "checked_in",
        checkedInAt: new Date(),
        checkedInByUserId: viewer.userId,
        updatedAt: new Date(),
      })
      .where(eq(bandTicketInstances.id, ticket.instance.id))
      .returning()

    revalidatePath("/portal")
    return {
      success: true,
      ticket: updated,
      holderName: ticket.instance.holderName,
      ticketNumber: ticket.instance.ticketNumber,
      eventTitle: ticket.event.title,
    }
  } catch (err: any) {
    console.error("checkInTicket error:", err)
    return { success: false, error: err?.message || "Failed to check in ticket" }
  }
}

// ---------------------------------------------------------------------------
// 4. Escrow Payouts & 24h Post-Event Release
// ---------------------------------------------------------------------------

/** Release held ticket escrow payout to the band's connected Stripe account */
export async function releaseEscrowPayout(eventId: string) {
  try {
    await requireStaff()

    const [row] = await db
      .select({
        event: bandEvents,
        band: bands,
      })
      .from(bandEvents)
      .innerJoin(bands, eq(bands.id, bandEvents.bandId))
      .where(eq(bandEvents.id, eventId))
      .limit(1)

    if (!row) return { success: false, error: "Event not found" }
    const { event, band } = row

    if (event.escrowStatus === "released") {
      return { success: false, error: "Escrow funds have already been released for this event." }
    }

    if (event.status === "cancelled") {
      return { success: false, error: "Cannot release escrow for a cancelled event." }
    }

    const now = new Date()
    const releaseDate = event.escrowReleaseDate || new Date(event.eventDate.getTime() + 24 * 60 * 60 * 1000)

    if (now < releaseDate) {
      const hoursRemaining = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      return {
        success: false,
        error: `Escrow hold is still active. Releases 24 hours post-event (${hoursRemaining} hours remaining).`,
      }
    }

    if (!band.stripeAccountId) {
      return { success: false, error: `Band "${band.name}" has not connected a Stripe payout account yet.` }
    }

    // Calculate total net ticket revenue
    const orders = await db
      .select()
      .from(bandTicketOrders)
      .where(and(eq(bandTicketOrders.eventId, eventId), eq(bandTicketOrders.status, "paid")))

    const totalCents = orders.reduce((acc, o) => acc + (o.totalCents - o.platformFeeCents), 0)

    if (totalCents <= 0) {
      await db
        .update(bandEvents)
        .set({ escrowStatus: "released", updatedAt: new Date() })
        .where(eq(bandEvents.id, eventId))
      return { success: true, message: "No funds to transfer (free or zero sales). Escrow marked released." }
    }

    // Execute transfer from StarCast platform to the band's connected Stripe account
    const transfer = await stripe.transfers.create({
      amount: totalCents,
      currency: "usd",
      destination: band.stripeAccountId,
      description: `Ticket proceeds: ${event.title} (${orders.length} orders)`,
      metadata: {
        event_id: event.id,
        band_id: band.id,
        event_title: event.title,
      },
    })

    await db
      .update(bandEvents)
      .set({
        escrowStatus: "released",
        stripeTransferId: transfer.id,
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))

    revalidatePath("/admin")
    revalidatePath("/portal")

    return {
      success: true,
      transferId: transfer.id,
      amountTransferredCents: totalCents,
      message: `Successfully transferred $${(totalCents / 100).toFixed(2)} to ${band.name}!`,
    }
  } catch (err: any) {
    console.error("releaseEscrowPayout error:", err)
    return { success: false, error: err?.message || "Failed to release escrow payout" }
  }
}

/** Admin: retrieve all events currently holding funds in escrow */
export async function adminListHeldEscrows() {
  try {
    await requireStaff()
    const rows = await db
      .select({
        event: bandEvents,
        band: bands,
      })
      .from(bandEvents)
      .innerJoin(bands, eq(bands.id, bandEvents.bandId))
      .orderBy(asc(bandEvents.eventDate))

    return rows.map((r) => ({
      ...r.event,
      bandName: r.band.name,
      bandSlug: r.band.slug,
      stripeAccountId: r.band.stripeAccountId,
      stripeAccountStatus: r.band.stripeAccountStatus,
    }))
  } catch (err: any) {
    console.error("adminListHeldEscrows error:", err)
    return []
  }
}
