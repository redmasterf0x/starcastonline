"use server"

import { db } from "@/lib/db"
import { bands, payments } from "@/lib/db/schema"
import { desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireViewer, requireStaff, requireAdmin } from "@/lib/permissions"

const METHODS = ["cash", "venmo", "paypal", "stripe", "other"]
const STATUSES = ["pending", "paid", "refunded", "void"]
const KINDS = ["booking", "pass", "other"]

function serialize(p: typeof payments.$inferSelect, bandName?: string) {
  return {
    id: p.id,
    booking_id: p.bookingId,
    band_id: p.bandId,
    band_name: bandName ?? "",
    logged_by_user_id: p.loggedByUserId,
    amount: Number(p.amount),
    method: p.method,
    status: p.status,
    kind: p.kind,
    paid_at: p.paidAt ? p.paidAt.toISOString() : null,
    note: p.note ?? "",
    created_at: p.createdAt.toISOString(),
  }
}

async function attachBandNames(rows: (typeof payments.$inferSelect)[]) {
  const bandIds = [...new Set(rows.map((r) => r.bandId))]
  const bandRows = bandIds.length
    ? await db.select({ id: bands.id, name: bands.name }).from(bands).where(inArray(bands.id, bandIds))
    : []
  const nameMap = new Map(bandRows.map((b) => [b.id, b.name]))
  return rows.map((r) => serialize(r, nameMap.get(r.bandId)))
}

/** Full payment ledger (staff/admin). */
export async function listPayments() {
  await requireStaff()
  const rows = await db.select().from(payments).orderBy(desc(payments.createdAt))
  return attachBandNames(rows)
}

/** Payments for one band (owner sees their own; staff sees any). */
export async function getPaymentsForBand(bandId: string) {
  const viewer = await requireViewer()
  const bandRows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = bandRows[0]
  if (!band) throw new Error("Band not found")
  if (band.ownerUserId !== viewer.userId && !viewer.isStaff) throw new Error("Forbidden")
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.bandId, bandId))
    .orderBy(desc(payments.createdAt))
  return rows.map((r) => serialize(r, band.name))
}

/** Staff/admin log a payment against a band (and optionally a booking). */
export async function logPayment(input: {
  bandId: string
  bookingId?: string | null
  amount: number
  method: string
  status?: string
  kind?: string
  paidAt?: string | null
  note?: string
}) {
  const viewer = await requireStaff()
  if (!input.bandId) throw new Error("Band is required")
  if (!(input.amount >= 0)) throw new Error("Amount must be non-negative")
  const method = METHODS.includes(input.method) ? input.method : "cash"
  const status = input.status && STATUSES.includes(input.status) ? input.status : "pending"
  const kind = input.kind && KINDS.includes(input.kind) ? input.kind : "booking"

  const [row] = await db
    .insert(payments)
    .values({
      bandId: input.bandId,
      bookingId: input.bookingId || null,
      loggedByUserId: viewer.userId,
      amount: String(input.amount),
      method,
      status,
      kind,
      paidAt: input.paidAt ? new Date(input.paidAt) : status === "paid" ? new Date() : null,
      note: input.note?.trim() || null,
    })
    .returning()
  revalidatePath("/staff")
  revalidatePath("/admin")
  revalidatePath("/portal")
  return serialize(row)
}

/** Staff/admin edit any field on a logged payment (flexible adjustments). */
export async function updatePayment(
  paymentId: string,
  input: {
    amount?: number
    method?: string
    status?: string
    kind?: string
    paidAt?: string | null
    note?: string
  },
) {
  await requireStaff()
  const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
  const p = rows[0]
  if (!p) throw new Error("Payment not found")

  const amount = input.amount != null ? input.amount : Number(p.amount)
  if (!(amount >= 0)) throw new Error("Amount must be non-negative")
  const method = input.method && METHODS.includes(input.method) ? input.method : p.method
  const status = input.status && STATUSES.includes(input.status) ? input.status : p.status
  const kind = input.kind && KINDS.includes(input.kind) ? input.kind : p.kind
  const paidAt =
    input.paidAt !== undefined
      ? input.paidAt
        ? new Date(input.paidAt)
        : null
      : status === "paid" && !p.paidAt
        ? new Date()
        : p.paidAt

  await db
    .update(payments)
    .set({
      amount: String(amount),
      method,
      status,
      kind,
      paidAt,
      note: input.note !== undefined ? input.note?.trim() || null : p.note,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
  revalidatePath("/staff")
  revalidatePath("/admin")
  revalidatePath("/portal")
  return { success: true }
}

/** Admin-only: delete a payment record. */
export async function deletePayment(paymentId: string) {
  await requireAdmin()
  await db.delete(payments).where(eq(payments.id, paymentId))
  revalidatePath("/admin")
  revalidatePath("/staff")
  return { success: true }
}

/** Admin-only: revenue analytics summary. */
export async function getRevenueSummary() {
  await requireAdmin()
  const rows = await db.select().from(payments)
  let totalCollected = 0
  let totalPending = 0
  const byMethod: Record<string, number> = {}
  for (const p of rows) {
    const amt = Number(p.amount)
    if (p.status === "paid") {
      totalCollected += amt
      byMethod[p.method] = (byMethod[p.method] ?? 0) + amt
    } else if (p.status === "pending") {
      totalPending += amt
    }
  }
  return {
    total_collected: Math.round(totalCollected * 100) / 100,
    total_pending: Math.round(totalPending * 100) / 100,
    by_method: byMethod,
    payment_count: rows.length,
  }
}
