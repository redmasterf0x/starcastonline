"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { bands, bandEvents, bandTicketOrders, bandTicketInstances, bandEventScanners, user } from "@/lib/db/schema"
import { eq, and, desc, gte, sql, asc, ilike, inArray, or } from "drizzle-orm"
import { requireViewer, requireStaff } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export type EventCustomLink = {
  title: string
  url: string
}

export type CreateEventInput = {
  title: string
  description?: string
  organizerName?: string
  venueName: string
  venueAddress?: string
  eventDate: string // ISO string
  doorsOpenTime?: string // e.g. "7:00 PM"
  startTime?: string // e.g. "8:00 PM"
  priceCents: number // e.g. 1500 for $15.00
  totalInventory: number // e.g. 20
  ageRestriction?: string // "All Ages" | "18+" | "21+"
  flyerUrl?: string
  recurrenceFrequency?: "one_time" | "weekly" | "monthly" | "yearly"
  customLinks?: EventCustomLink[]
}

function sanitizeEventLinks(links?: EventCustomLink[]): EventCustomLink[] {
  if (!Array.isArray(links)) return []
  return links
    .map((l) => {
      const title = (l?.title || "").trim().slice(0, 80)
      let url = (l?.url || "").trim().slice(0, 500)
      if (!url) return null
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`
      return { title: title || url, url }
    })
    .filter((l): l is EventCustomLink => Boolean(l))
    .slice(0, 10)
}

function isEventOwner(
  event: { ownerUserId?: string | null },
  band: { ownerUserId?: string | null } | null | undefined,
  userId: string
) {
  return Boolean(
    (event.ownerUserId && event.ownerUserId === userId) ||
      (band?.ownerUserId && band.ownerUserId === userId)
  )
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

/** Create a new event ticket listing (band-linked OR standalone when bandId is null) */
export async function createBandEvent(bandId: string | null, input: CreateEventInput) {
  try {
    const viewer = await requireViewer()

    let band: typeof bands.$inferSelect | null = null
    if (bandId) {
      const [foundBand] = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
      if (!foundBand) return { success: false, error: "Band not found" }
      if (foundBand.ownerUserId !== viewer.userId && !viewer.isAdmin) {
        return { success: false, error: "Unauthorized to post tickets for this band" }
      }
      if (foundBand.ticketingStatus !== "approved" && !viewer.isAdmin) {
        return {
          success: false,
          error: "This band is not approved for ticketing yet. Please submit an application first.",
        }
      }
      band = foundBand
    } else {
      // Standalone event: caller must be an approved ticket seller OR admin
      if (!viewer.isAdmin) {
        const approvedBands = await db
          .select({ id: bands.id })
          .from(bands)
          .where(and(eq(bands.ownerUserId, viewer.userId), eq(bands.ticketingStatus, "approved")))
          .limit(1)
        if (approvedBands.length === 0) {
          return {
            success: false,
            error: "Only admin-approved ticket sellers or admins can post standalone events.",
          }
        }
      }
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
    const organizerLabel = band?.name || input.organizerName?.trim() || "StarCast Event"

    // Calculate escrow release date: exactly 24 hours after the event time
    const escrowReleaseDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)

    // Optionally create Stripe product & price for this event if priced
    let stripeProductId: string | null = null
    let stripePriceId: string | null = null

    if (priceCents > 0) {
      try {
        const product = await stripe.products.create({
          name: `${organizerLabel} - ${input.title.trim()}`,
          description: input.description?.slice(0, 500) || `Ticket for ${input.title} at ${input.venueName}`,
          metadata: {
            band_id: band?.id || "",
            band_name: organizerLabel,
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

    const recurrenceFrequency =
      input.recurrenceFrequency && ["weekly", "monthly", "yearly"].includes(input.recurrenceFrequency)
        ? input.recurrenceFrequency
        : null

    const cleanLinks = sanitizeEventLinks(input.customLinks)

    const [newEvent] = await db
      .insert(bandEvents)
      .values({
        bandId: band?.id || null,
        ownerUserId: band ? band.ownerUserId : viewer.userId,
        organizerName: band ? band.name : input.organizerName?.trim() || "StarCast Event",
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
        recurrenceFrequency,
        customLinks: cleanLinks,
        status: "active",
        escrowStatus: "held",
        escrowReleaseDate,
        stripeProductId,
        stripePriceId,
      })
      .returning()

    revalidatePath("/portal")
    revalidatePath("/tickets")
    revalidatePath("/tickets/seller-central")
    if (band?.slug) revalidatePath(`/bands/${band.slug}`)

    return { success: true, event: newEvent }
  } catch (err: any) {
    console.error("createBandEvent error:", err)
    return { success: false, error: err?.message || "Failed to post ticket event" }
  }
}

/** Update an existing event (creator or admin; price locks once any ticket is sold) */
export async function updateBandEvent(eventId: string, input: UpdateEventInput) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null

    if (!isEventOwner(event, band, viewer.userId) && !viewer.isAdmin) {
      return { success: false, error: "Only the creator of this ticket or an admin can edit it." }
    }

    // Check if any ticket has already been purchased/claimed for this event
    const [{ count: issuedCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bandTicketInstances)
      .where(
        and(
          eq(bandTicketInstances.eventId, eventId),
          sql`${bandTicketInstances.status} != 'cancelled'`
        )
      )

    const soldCount = Math.max(issuedCount || 0, event.totalInventory - event.remainingInventory)
    const hasSoldTickets = soldCount > 0

    const nextPriceCents =
      input.priceCents !== undefined ? Math.max(0, Math.round(input.priceCents)) : event.priceCents

    if (hasSoldTickets && nextPriceCents !== event.priceCents) {
      return {
        success: false,
        error: "Ticket price is locked and cannot be edited after someone has purchased a ticket.",
      }
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

    // If total inventory changed, ensure it never drops below already-sold tickets
    let remainingInventory = event.remainingInventory
    let totalInventory = event.totalInventory
    if (input.totalInventory !== undefined && input.totalInventory !== event.totalInventory) {
      totalInventory = Math.max(Math.max(1, soldCount), input.totalInventory)
      remainingInventory = Math.max(0, totalInventory - soldCount)
    }

    const [updated] = await db
      .update(bandEvents)
      .set({
        title: input.title !== undefined ? input.title.trim() : event.title,
        description: input.description !== undefined ? (input.description.trim() || null) : event.description,
        organizerName:
          input.organizerName !== undefined
            ? input.organizerName.trim() || event.organizerName
            : event.organizerName,
        venueName: input.venueName !== undefined ? input.venueName.trim() : event.venueName,
        venueAddress: input.venueAddress !== undefined ? (input.venueAddress.trim() || null) : event.venueAddress,
        eventDate,
        doorsOpenTime: input.doorsOpenTime !== undefined ? input.doorsOpenTime : event.doorsOpenTime,
        startTime: input.startTime !== undefined ? input.startTime : event.startTime,
        priceCents: nextPriceCents,
        totalInventory,
        remainingInventory,
        ageRestriction: input.ageRestriction !== undefined ? input.ageRestriction : event.ageRestriction,
        flyerUrl: input.flyerUrl !== undefined ? (input.flyerUrl?.trim() || null) : event.flyerUrl,
        recurrenceFrequency:
          input.recurrenceFrequency !== undefined
            ? ["weekly", "monthly", "yearly"].includes(input.recurrenceFrequency)
              ? input.recurrenceFrequency
              : null
            : event.recurrenceFrequency,
        customLinks:
          input.customLinks !== undefined ? sanitizeEventLinks(input.customLinks) : event.customLinks,
        status: input.status || event.status,
        escrowReleaseDate,
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))
      .returning()

    revalidatePath("/portal")
    revalidatePath(`/portal/events/${eventId}`)
    revalidatePath(`/events/${eventId}`)
    revalidatePath("/tickets")
    revalidatePath("/tickets/seller-central")
    if (band?.slug) revalidatePath(`/bands/${band.slug}`)

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

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    if (!isEventOwner(event, band, viewer.userId) && !viewer.isStaff) {
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
    if (band?.slug) revalidatePath(`/bands/${band.slug}`)

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
      .leftJoin(bands, eq(bands.id, bandEvents.bandId))
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
      .leftJoin(bands, eq(bands.id, bandTicketInstances.bandId))
      .innerJoin(bandTicketOrders, eq(bandTicketOrders.id, bandTicketInstances.orderId))
      .where(eq(bandTicketInstances.qrToken, qrToken))
      .limit(1)

    if (rows.length === 0) return null
    const row = rows[0]
    return {
      instance: row.instance,
      event: row.event,
      order: row.order,
      band: row.band || {
        id: "",
        name: row.event.organizerName || "StarCast Event",
        slug: null,
        logoUrl: null,
        type: "event",
      },
    }
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

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    if (!isEventOwner(event, band, viewer.userId) && !viewer.isStaff) {
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

/** Check if a user is assigned as a door scanner for a specific event */
export async function isAssignedEventScanner(eventId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: bandEventScanners.id })
    .from(bandEventScanners)
    .where(and(eq(bandEventScanners.eventId, eventId), eq(bandEventScanners.userId, userId)))
    .limit(1)
  return Boolean(row)
}

/** Add a registered StarCast user as a door scanner for an event by email (creator or admin only) */
export async function addEventScannerByEmail(eventId: string, email: string) {
  try {
    const viewer = await requireViewer()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." }
    }

    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    if (!isEventOwner(event, band, viewer.userId) && !viewer.isAdmin) {
      return { success: false, error: "Only the event creator or an admin can add scanners." }
    }

    const [registeredUser] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(ilike(user.email, cleanEmail))
      .limit(1)

    if (!registeredUser) {
      return {
        success: false,
        error: "No registered StarCast user found with that email. They must sign up first.",
      }
    }

    const existing = await db
      .select()
      .from(bandEventScanners)
      .where(and(eq(bandEventScanners.eventId, eventId), eq(bandEventScanners.userId, registeredUser.id)))
      .limit(1)

    if (existing.length > 0) {
      return { success: false, error: "This user is already a scanner for this event." }
    }

    const [inserted] = await db
      .insert(bandEventScanners)
      .values({
        eventId,
        userId: registeredUser.id,
        email: registeredUser.email.toLowerCase(),
        addedByUserId: viewer.userId,
      })
      .returning()

    revalidatePath(`/portal/events/${eventId}`)
    return { success: true, scanner: { ...inserted, name: registeredUser.name } }
  } catch (err: any) {
    console.error("addEventScannerByEmail error:", err)
    return { success: false, error: err?.message || "Failed to add scanner" }
  }
}

/** Remove a door scanner from an event (creator or admin only) */
export async function removeEventScanner(eventId: string, scannerId: string) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    if (!isEventOwner(event, band, viewer.userId) && !viewer.isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    await db
      .delete(bandEventScanners)
      .where(and(eq(bandEventScanners.id, scannerId), eq(bandEventScanners.eventId, eventId)))

    revalidatePath(`/portal/events/${eventId}`)
    return { success: true }
  } catch (err: any) {
    console.error("removeEventScanner error:", err)
    return { success: false, error: err?.message || "Failed to remove scanner" }
  }
}

/** Seller Event Page & Scanner data: returns event, band, and all issued ticket instances */
export async function getEventScannerData(eventId: string) {
  try {
    const viewer = await requireViewer()
    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null

    const isCreator = isEventOwner(event, band, viewer.userId)
    const isAssigned = await isAssignedEventScanner(eventId, viewer.userId)
    if (!isCreator && !viewer.isStaff && !isAssigned) {
      return { success: false, error: "Unauthorized to manage or scan for this event" }
    }

    const fallbackBand = band || {
      id: "",
      name: event.organizerName || "StarCast Event",
      slug: null,
      logoUrl: null,
      ownerUserId: event.ownerUserId || "",
    }

    const canEdit = isCreator || viewer.isAdmin
    const canManageScanners = isCreator || viewer.isAdmin
    const isScannerOnly = isAssigned && !isCreator && !viewer.isStaff

    const instances = await db
      .select()
      .from(bandTicketInstances)
      .where(eq(bandTicketInstances.eventId, eventId))
      .orderBy(asc(bandTicketInstances.ticketNumber))

    let scanners: Array<{ id: string; userId: string; email: string; name: string | null; createdAt: Date }> = []
    if (canManageScanners) {
      const scannerRows = await db
        .select({
          id: bandEventScanners.id,
          userId: bandEventScanners.userId,
          email: bandEventScanners.email,
          name: user.name,
          createdAt: bandEventScanners.createdAt,
        })
        .from(bandEventScanners)
        .leftJoin(user, eq(user.id, bandEventScanners.userId))
        .where(eq(bandEventScanners.eventId, eventId))
        .orderBy(asc(bandEventScanners.createdAt))
      scanners = scannerRows
    }

    let cashOrders: Array<{
      id: string
      buyerName: string
      quantity: number
      unitPriceCents: number
      totalCents: number
      createdAt: Date
    }> = []
    cashOrders = await db
      .select({
        id: bandTicketOrders.id,
        buyerName: bandTicketOrders.buyerName,
        quantity: bandTicketOrders.quantity,
        unitPriceCents: bandTicketOrders.unitPriceCents,
        totalCents: bandTicketOrders.totalCents,
        createdAt: bandTicketOrders.createdAt,
      })
      .from(bandTicketOrders)
      .where(
        and(
          eq(bandTicketOrders.eventId, eventId),
          eq(bandTicketOrders.stripeSessionId, "cash-door"),
          eq(bandTicketOrders.status, "paid")
        )
      )
      .orderBy(desc(bandTicketOrders.createdAt))

    const cashTicketsCount = cashOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
    const cashTotalCents = cashOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0)

    return {
      success: true,
      event,
      band: fallbackBand,
      instances,
      canEdit,
      canManageScanners,
      isScannerOnly,
      scanners,
      cashSales: {
        ticketsCount: cashTicketsCount,
        totalCents: cashTotalCents,
        orders: cashOrders,
      },
    }
  } catch (err: any) {
    console.error("getEventScannerData error:", err)
    return { success: false, error: err?.message || "Failed to load event scanner data" }
  }
}

/** Door Check-In: check in a fan via QR code token, full ticket URL, ticket ID, or ticket # */
export async function checkInTicket(tokenOrId: string, eventId?: string) {
  try {
    const viewer = await requireViewer()

    let cleanToken = tokenOrId.trim()
    if (cleanToken.includes("/tickets/")) {
      const parts = cleanToken.split("/tickets/")
      cleanToken = (parts[1] || "").split(/[?#]/)[0].trim()
    }

    const numericMatch = cleanToken.match(/^#?(\d+)$/)
    const ticketNum = numericMatch ? parseInt(numericMatch[1], 10) : null

    const [ticket] = await db
      .select({
        instance: bandTicketInstances,
        event: bandEvents,
        band: bands,
      })
      .from(bandTicketInstances)
      .innerJoin(bandEvents, eq(bandEvents.id, bandTicketInstances.eventId))
      .leftJoin(bands, eq(bands.id, bandTicketInstances.bandId))
      .where(
        ticketNum !== null && eventId
          ? and(
              eq(bandTicketInstances.eventId, eventId),
              eq(bandTicketInstances.ticketNumber, ticketNum)
            )
          : sql`${bandTicketInstances.qrToken} = ${cleanToken} OR ${bandTicketInstances.id}::text = ${cleanToken}`
      )
      .limit(1)

    if (!ticket) {
      return { success: false, error: "Invalid ticket QR code / token" }
    }

    if (eventId && ticket.instance.eventId !== eventId) {
      return { success: false, error: "Ticket is for a different event!" }
    }

    const isAssigned = await isAssignedEventScanner(ticket.event.id, viewer.userId)
    if (!isEventOwner(ticket.event, ticket.band, viewer.userId) && !viewer.isStaff && !isAssigned) {
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
    revalidatePath(`/portal/events/${ticket.event.id}`)
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

/** Record a cash ticket sale at the door (creator, staff, or assigned door scanner for that event) */
export async function recordDoorCashSale({
  eventId,
  quantity,
  customTotalCents,
  guestName,
}: {
  eventId: string
  quantity: number
  customTotalCents?: number
  guestName?: string
}) {
  try {
    const viewer = await requireViewer()
    const qty = Math.max(1, Math.min(50, Math.floor(quantity || 1)))

    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null

    const isCreator = isEventOwner(event, band, viewer.userId)
    const isAssigned = await isAssignedEventScanner(eventId, viewer.userId)
    if (!isCreator && !viewer.isStaff && !isAssigned) {
      return { success: false, error: "Unauthorized to record cash sales for this event" }
    }

    if (event.remainingInventory < qty) {
      return {
        success: false,
        error:
          event.remainingInventory <= 0
            ? "No remaining tickets left in inventory."
            : `Only ${event.remainingInventory} ticket(s) remaining.`,
      }
    }

    const [updatedEvent] = await db
      .update(bandEvents)
      .set({
        remainingInventory: sql`${bandEvents.remainingInventory} - ${qty}`,
        status: sql`CASE WHEN ${bandEvents.remainingInventory} - ${qty} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bandEvents.id, event.id),
          sql`${bandEvents.remainingInventory} >= ${qty}`
        )
      )
      .returning()

    if (!updatedEvent) {
      return { success: false, error: "Not enough tickets remaining." }
    }

    const unitPriceCents = event.priceCents || 0
    const totalCents =
      customTotalCents !== undefined && customTotalCents >= 0
        ? Math.round(customTotalCents)
        : unitPriceCents * qty

    const holderLabel = guestName?.trim() || "Door Cash Guest"

    const [order] = await db
      .insert(bandTicketOrders)
      .values({
        eventId: event.id,
        bandId: band?.id || null,
        buyerUserId: viewer.userId,
        buyerEmail: "cash@door.starcast.online",
        buyerName: holderLabel,
        quantity: qty,
        unitPriceCents: qty > 0 ? Math.round(totalCents / qty) : unitPriceCents,
        totalCents,
        platformFeeCents: 0,
        stripeSessionId: "cash-door",
        status: "paid",
      })
      .returning()

    const currentSold = updatedEvent.totalInventory - updatedEvent.remainingInventory - qty
    const instancesToInsert = []
    for (let i = 0; i < qty; i++) {
      instancesToInsert.push({
        orderId: order.id,
        eventId: event.id,
        bandId: band?.id || null,
        ticketNumber: Math.max(1, currentSold + i + 1),
        qrToken: crypto.randomUUID(),
        holderName: holderLabel,
        holderEmail: "cash@door.starcast.online",
        status: "checked_in" as const,
        checkedInAt: new Date(),
        checkedInByUserId: viewer.userId,
      })
    }

    await db.insert(bandTicketInstances).values(instancesToInsert)

    revalidatePath(`/portal/events/${eventId}`)
    revalidatePath("/portal")
    revalidatePath(`/events/${eventId}`)
    revalidatePath("/tickets")

    return {
      success: true,
      order,
      ticketsSold: qty,
      totalCents,
    }
  } catch (err: any) {
    console.error("recordDoorCashSale error:", err)
    return { success: false, error: err?.message || "Failed to record door cash sale" }
  }
}

/** Ticket Seller Central: accessible to all admin-approved ticket sellers AND admins (strictly their own events & standalone events) */
export async function getTicketSellerCentralData() {
  try {
    const viewer = await requireViewer()

    const myBands = await db
      .select({
        id: bands.id,
        name: bands.name,
        slug: bands.slug,
        ticketingStatus: bands.ticketingStatus,
        stripeAccountId: bands.stripeAccountId,
        stripeAccountStatus: bands.stripeAccountStatus,
      })
      .from(bands)
      .where(eq(bands.ownerUserId, viewer.userId))
      .orderBy(asc(bands.name))

    const approvedBands = myBands.filter((b) => b.ticketingStatus === "approved")
    const hasAccess = approvedBands.length > 0 || viewer.isAdmin

    if (!hasAccess) {
      return {
        success: true,
        isApprovedSeller: false,
        isAdmin: viewer.isAdmin,
        myBands,
        approvedBands: [],
        events: [],
        orders: [],
      }
    }

    const approvedBandIds = approvedBands.map((b) => b.id)

    // Fetch strictly events owned by this user (standalone OR via their own approved bands)
    const eventFilter =
      approvedBandIds.length > 0
        ? or(
            eq(bandEvents.ownerUserId, viewer.userId),
            inArray(bandEvents.bandId, approvedBandIds)
          )
        : eq(bandEvents.ownerUserId, viewer.userId)

    const myEvents = await db
      .select()
      .from(bandEvents)
      .where(eventFilter)
      .orderBy(desc(bandEvents.eventDate))

    const myEventIds = myEvents.map((e) => e.id)

    const myOrders =
      myEventIds.length > 0
        ? await db
            .select()
            .from(bandTicketOrders)
            .where(
              and(
                inArray(bandTicketOrders.eventId, myEventIds),
                eq(bandTicketOrders.status, "paid")
              )
            )
            .orderBy(desc(bandTicketOrders.createdAt))
        : []

    const bandNameMap = new Map(myBands.map((b) => [b.id, b.name]))
    const eventMap = new Map(myEvents.map((e) => [e.id, e]))

    const enrichedOrders = myOrders.map((o) => {
      const ev = eventMap.get(o.eventId)
      const isCash = o.stripeSessionId === "cash-door"
      return {
        id: o.id,
        eventId: o.eventId,
        eventTitle: ev?.title || "Event",
        venueName: ev?.venueName || "",
        eventDate: ev?.eventDate ? ev.eventDate.toISOString() : null,
        bandId: o.bandId || "standalone",
        bandName: (o.bandId && bandNameMap.get(o.bandId)) || ev?.organizerName || "Standalone Event",
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        quantity: o.quantity,
        unitPriceCents: o.unitPriceCents,
        totalCents: o.totalCents,
        platformFeeCents: o.platformFeeCents,
        netCents: Math.max(0, o.totalCents - o.platformFeeCents),
        paymentMethod: isCash ? ("cash" as const) : ("stripe" as const),
        stripeRef: isCash ? "DOOR-CASH" : o.stripePaymentIntentId || o.stripeSessionId || "",
        createdAt: o.createdAt.toISOString(),
      }
    })

    const enrichedEvents = myEvents.map((ev) => ({
      id: ev.id,
      bandId: ev.bandId || "standalone",
      bandName: (ev.bandId && bandNameMap.get(ev.bandId)) || ev.organizerName || "Standalone Event",
      isStandalone: !ev.bandId,
      title: ev.title,
      venueName: ev.venueName,
      eventDate: ev.eventDate.toISOString(),
      priceCents: ev.priceCents,
      totalInventory: ev.totalInventory,
      remainingInventory: ev.remainingInventory,
      status: ev.status,
      escrowStatus: ev.escrowStatus,
    }))

    return {
      success: true,
      isApprovedSeller: true,
      isAdmin: viewer.isAdmin,
      myBands,
      approvedBands,
      events: enrichedEvents,
      orders: enrichedOrders,
    }
  } catch (err: any) {
    console.error("getTicketSellerCentralData error:", err)
    return {
      success: false,
      error: err?.message || "Failed to load Ticket Seller Central",
      isApprovedSeller: false,
      myBands: [],
      approvedBands: [],
      events: [],
      orders: [],
    }
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
      .leftJoin(bands, eq(bands.id, bandEvents.bandId))
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

    if (!band?.stripeAccountId) {
      return {
        success: false,
        error: `"${band?.name || event.organizerName || "This organizer"}" has not connected a Stripe payout account yet.`,
      }
    }

    // Calculate net online Stripe ticket revenue (90% seller payout, 10% StarCast platform escrow hold)
    const orders = await db
      .select()
      .from(bandTicketOrders)
      .where(and(eq(bandTicketOrders.eventId, eventId), eq(bandTicketOrders.status, "paid")))

    // Exclude door cash sales (those were collected in person at the door, 0% platform fee)
    const onlineOrders = orders.filter((o) => o.stripeSessionId !== "cash-door")
    const onlineGrossCents = onlineOrders.reduce((acc, o) => acc + o.totalCents, 0)
    const platformFeeCents = onlineOrders.reduce(
      (acc, o) => acc + (o.platformFeeCents > 0 ? o.platformFeeCents : Math.round(o.totalCents * 0.1)),
      0
    )
    const sellerNetCents = Math.max(0, onlineGrossCents - platformFeeCents)

    if (sellerNetCents <= 0) {
      await db
        .update(bandEvents)
        .set({
          escrowStatus: "released",
          platformFeeCents,
          platformEscrowStatus: platformFeeCents > 0 ? "held" : "released",
          updatedAt: new Date(),
        })
        .where(eq(bandEvents.id, eventId))
      return {
        success: true,
        message: "No online funds to transfer (free or cash-only sales). Escrow marked released.",
      }
    }

    // Transfer 90% net online proceeds to the seller's connected Stripe account;
    // the remaining 10% stays in StarCast's platform fee escrow hold for payout to the StarCast owner.
    const transfer = await stripe.transfers.create({
      amount: sellerNetCents,
      currency: "usd",
      destination: band.stripeAccountId,
      description: `Ticket proceeds (90% net of 10% platform fee): ${event.title} (${onlineOrders.length} online orders)`,
      metadata: {
        event_id: event.id,
        band_id: band.id,
        event_title: event.title,
        online_gross_cents: String(onlineGrossCents),
        platform_fee_cents: String(platformFeeCents),
      },
    })

    await db
      .update(bandEvents)
      .set({
        escrowStatus: "released",
        stripeTransferId: transfer.id,
        platformFeeCents,
        platformEscrowStatus: platformFeeCents > 0 ? "held" : "released",
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))

    revalidatePath("/admin")
    revalidatePath("/portal")
    revalidatePath("/tickets/seller-central")

    return {
      success: true,
      transferId: transfer.id,
      amountTransferredCents: sellerNetCents,
      platformFeeCents,
      message: `Transferred $${(sellerNetCents / 100).toFixed(2)} (90% net) to ${band.name}. $${(platformFeeCents / 100).toFixed(2)} (10% fee) moved to StarCast platform escrow hold.`,
    }
  } catch (err: any) {
    console.error("releaseEscrowPayout error:", err)
    return { success: false, error: err?.message || "Failed to release escrow payout" }
  }
}

/** Admin: release the held 10% StarCast platform fee escrow to the StarCast owner's Stripe account */
export async function releasePlatformFeeEscrow(eventId: string) {
  try {
    await requireStaff()

    const [event] = await db.select().from(bandEvents).where(eq(bandEvents.id, eventId)).limit(1)
    if (!event) return { success: false, error: "Event not found" }

    if (event.platformEscrowStatus === "released") {
      return { success: false, error: "Platform fee escrow has already been released for this event." }
    }

    const feeCents = event.platformFeeCents || 0
    if (feeCents <= 0) {
      await db
        .update(bandEvents)
        .set({ platformEscrowStatus: "released", updatedAt: new Date() })
        .where(eq(bandEvents.id, eventId))
      return { success: true, message: "No platform fee balance to disburse." }
    }

    const ownerStripeAccountId = process.env.STARCAST_OWNER_STRIPE_ACCOUNT_ID?.trim()
    let transferId: string | null = null

    if (ownerStripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: feeCents,
        currency: "usd",
        destination: ownerStripeAccountId,
        description: `StarCast 10% Ticket Platform Fee: ${event.title}`,
        metadata: {
          event_id: event.id,
          kind: "platform_fee_10pct",
        },
      })
      transferId = transfer.id
    }

    await db
      .update(bandEvents)
      .set({
        platformEscrowStatus: "released",
        platformTransferId: transferId,
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, eventId))

    revalidatePath("/admin")
    return {
      success: true,
      transferId,
      amountReleasedCents: feeCents,
      message: ownerStripeAccountId
        ? `Disbursed $${(feeCents / 100).toFixed(2)} platform fee to StarCast owner Stripe account.`
        : `Settled $${(feeCents / 100).toFixed(2)} platform fee in StarCast Stripe balance.`,
    }
  } catch (err: any) {
    console.error("releasePlatformFeeEscrow error:", err)
    return { success: false, error: err?.message || "Failed to release platform fee escrow" }
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
      .leftJoin(bands, eq(bands.id, bandEvents.bandId))
      .orderBy(asc(bandEvents.eventDate))

    return rows.map((r) => ({
      ...r.event,
      bandName: r.band?.name || r.event.organizerName || "Standalone Event",
      bandSlug: r.band?.slug || null,
      stripeAccountId: r.band?.stripeAccountId || null,
      stripeAccountStatus: r.band?.stripeAccountStatus || null,
    }))
  } catch (err: any) {
    console.error("adminListHeldEscrows error:", err)
    return []
  }
}
