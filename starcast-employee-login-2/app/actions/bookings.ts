"use server"

import { db } from "@/lib/db"
import { bands, bookings } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireViewer, requireStaff } from "@/lib/permissions"

/** Default studio rate (USD/hour) used when a new booking is created. */
const DEFAULT_HOURLY_RATE = 40

function hoursBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100)
}

function serialize(b: typeof bookings.$inferSelect, bandName?: string) {
  return {
    id: b.id,
    band_id: b.bandId,
    band_name: bandName ?? "",
    created_by_user_id: b.createdByUserId,
    title: b.title ?? "",
    starts_at: b.startsAt.toISOString(),
    ends_at: b.endsAt.toISOString(),
    status: b.status,
    hourly_rate_charged: Number(b.hourlyRateCharged),
    hours: Number(b.hours),
    total_amount: Number(b.totalAmount),
    notes: b.notes ?? "",
    checked_in_at: b.checkedInAt ? b.checkedInAt.toISOString() : null,
    checked_out_at: b.checkedOutAt ? b.checkedOutAt.toISOString() : null,
    created_at: b.createdAt.toISOString(),
  }
}

async function attachBandNames(rows: (typeof bookings.$inferSelect)[]) {
  const bandIds = [...new Set(rows.map((r) => r.bandId))]
  const bandRows = bandIds.length
    ? await db.select({ id: bands.id, name: bands.name }).from(bands).where(inArray(bands.id, bandIds))
    : []
  const nameMap = new Map(bandRows.map((b) => [b.id, b.name]))
  return rows.map((r) => serialize(r, nameMap.get(r.bandId)))
}

/** Bookings for one band (owner or staff). */
export async function getBookingsForBand(bandId: string) {
  const viewer = await requireViewer()
  const bandRows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found")
  if (band.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bandId, bandId))
    .orderBy(desc(bookings.startsAt))
  return rows.map((r) => serialize(r, band.name))
}

/** All bookings (staff/admin operational view). */
export async function listAllBookings() {
  await requireStaff()
  const rows = await db.select().from(bookings).orderBy(desc(bookings.startsAt))
  return attachBandNames(rows)
}

/** Upcoming bookings from now forward (staff dashboard). */
export async function listUpcomingBookings() {
  await requireStaff()
  const rows = await db
    .select()
    .from(bookings)
    .where(gte(bookings.startsAt, new Date()))
    .orderBy(bookings.startsAt)
  return attachBandNames(rows)
}

/**
 * Create a booking request. Owner of the band (or staff on their behalf).
 * The studio rate is SNAPSHOTTED onto the booking so later rate changes never
 * rewrite historical bookings.
 */
export async function createBooking(input: {
  bandId: string
  title?: string
  startsAt: string
  endsAt: string
  notes?: string
}) {
  const viewer = await requireViewer()
  const bandRows = await db.select().from(bands).where(eq(bands.id, input.bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found")
  if (band.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")

  // Bands must sign the YouTube content agreement before they can book.
  if (!band.youtubeAgreementSigned && !viewer.isStaff) {
    throw new Error("You must sign the YouTube content agreement before booking.")
  }

  const start = new Date(input.startsAt)
  const end = new Date(input.endsAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Invalid date/time")
  if (end <= start) throw new Error("End time must be after start time")

  const hrs = hoursBetween(start, end)
  const rate = DEFAULT_HOURLY_RATE
  const total = Math.round(hrs * rate * 100) / 100

  const [row] = await db
    .insert(bookings)
    .values({
      bandId: input.bandId,
      createdByUserId: viewer.userId,
      title: input.title?.trim() || null,
      startsAt: start,
      endsAt: end,
      status: viewer.isStaff ? "confirmed" : "requested",
      hourlyRateCharged: String(rate),
      hours: String(hrs),
      totalAmount: String(total),
      notes: input.notes?.trim() || null,
    })
    .returning()
  revalidatePath("/portal")
  revalidatePath("/staff")
  revalidatePath("/admin")
  return serialize(row, band.name)
}

/** Staff/admin update a booking's status (confirm, cancel, complete). */
export async function setBookingStatus(bookingId: string, status: string) {
  await requireStaff()
  const allowed = ["requested", "confirmed", "checked_in", "completed", "cancelled"]
  if (!allowed.includes(status)) throw new Error("Invalid status")
  await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, bookingId))
  revalidatePath("/staff")
  revalidatePath("/admin")
  revalidatePath("/portal")
  return { success: true }
}

/** Staff/admin check a band in for their session. */
export async function checkInBooking(bookingId: string) {
  await requireStaff()
  await db
    .update(bookings)
    .set({ status: "checked_in", checkedInAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
  revalidatePath("/staff")
  revalidatePath("/admin")
  return { success: true }
}

/** Staff/admin check a band out (marks the session completed). */
export async function checkOutBooking(bookingId: string) {
  await requireStaff()
  await db
    .update(bookings)
    .set({ status: "completed", checkedOutAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
  revalidatePath("/staff")
  revalidatePath("/admin")
  return { success: true }
}

/**
 * Staff/admin adjust the price on a booking (flexible pricing). This edits the
 * snapshot on THIS booking only. Recomputes total from hours × rate unless an
 * explicit totalAmount override is supplied.
 */
export async function adjustBookingPrice(
  bookingId: string,
  input: { hourlyRate?: number; hours?: number; totalAmount?: number },
) {
  await requireStaff()
  const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  const b = rows[0]
  if (!b) throw new Error("Booking not found")

  const rate = input.hourlyRate ?? Number(b.hourlyRateCharged)
  const hrs = input.hours ?? Number(b.hours)
  if (rate < 0 || hrs < 0) throw new Error("Values must be non-negative")
  const total =
    input.totalAmount != null ? input.totalAmount : Math.round(rate * hrs * 100) / 100
  if (total < 0) throw new Error("Total must be non-negative")

  await db
    .update(bookings)
    .set({
      hourlyRateCharged: String(rate),
      hours: String(hrs),
      totalAmount: String(total),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
  revalidatePath("/staff")
  revalidatePath("/admin")
  return { success: true }
}

/** Admin-only: permanently delete a booking. */
export async function deleteBooking(bookingId: string) {
  const viewer = await requireViewer()
  if (!viewer.isAdmin) throw new Error("Forbidden")
  await db.delete(bookings).where(eq(bookings.id, bookingId))
  revalidatePath("/admin")
  revalidatePath("/staff")
  return { success: true }
}
