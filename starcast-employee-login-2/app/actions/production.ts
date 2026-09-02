"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  productions,
  productionCrew,
  productionRequests,
  profiles,
} from "@/lib/db/schema"
import { desc, asc, eq } from "drizzle-orm"

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

async function requireCrew() {
  const userId = await requireUserId()
  const rows = await db
    .select({
      isEmployee: profiles.isEmployee,
      isAdmin: profiles.isAdmin,
      canManageCalendar: profiles.canManageCalendar,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
  const p = rows[0]
  if (!p || (!p.isEmployee && !p.isAdmin)) throw new Error("Forbidden")
  return { userId, isAdmin: p.isAdmin, canManageCalendar: p.isAdmin || p.canManageCalendar }
}

/**
 * Requires the viewer to be staff AND have permission to add/edit calendar
 * events. Admins always pass. Used for every calendar mutation.
 */
async function requireCalendarManager() {
  const crew = await requireCrew()
  if (!crew.canManageCalendar) throw new Error("Forbidden")
  return crew
}

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null
}

/** Current viewer's role flags for the production page. */
export async function getProductionViewer() {
  const session = await getSession()
  if (!session?.user) return null
  const rows = await db
    .select({
      isEmployee: profiles.isEmployee,
      isAdmin: profiles.isAdmin,
      canManageCalendar: profiles.canManageCalendar,
    })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)
  const p = rows[0]
  return {
    userId: session.user.id,
    is_admin: p?.isAdmin ?? false,
    is_employee: p?.isEmployee ?? false,
    can_manage_calendar: (p?.isAdmin ?? false) || (p?.canManageCalendar ?? false),
  }
}

/** All productions plus a crew-count map keyed by production id. */
export async function listProductions() {
  await requireCrew()
  const rows = await db.select().from(productions).orderBy(asc(productions.startDate))
  const crewRows = await db
    .select({ productionId: productionCrew.productionId })
    .from(productionCrew)

  const crewCounts: Record<string, number> = {}
  for (const c of crewRows) {
    crewCounts[c.productionId] = (crewCounts[c.productionId] ?? 0) + 1
  }

  const mapped = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    start_date: iso(p.startDate) ?? "",
    end_date: iso(p.endDate),
    location: p.location,
    status: p.status,
    is_recurring: p.isRecurring,
    recurrence_frequency: p.recurrenceFrequency,
    recurrence_end_date: iso(p.recurrenceEndDate),
  }))

  return { productions: mapped, crewCounts }
}

/** Production requests with the requester's name joined in. */
export async function listProductionRequests() {
  await requireCrew()
  const rows = await db
    .select({
      id: productionRequests.id,
      title: productionRequests.title,
      description: productionRequests.description,
      requested_date: productionRequests.requestedDate,
      location: productionRequests.location,
      requested_by: productionRequests.userId,
      status: productionRequests.status,
      is_recurring: productionRequests.isRecurring,
      recurrence_frequency: productionRequests.recurrenceFrequency,
      recurrence_end_date: productionRequests.recurrenceEndDate,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(productionRequests)
    .leftJoin(profiles, eq(profiles.userId, productionRequests.userId))
    .orderBy(desc(productionRequests.createdAt))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    requested_date: iso(r.requested_date),
    location: r.location,
    requested_by: r.requested_by,
    status: r.status,
    is_recurring: r.is_recurring,
    recurrence_frequency: r.recurrence_frequency,
    recurrence_end_date: iso(r.recurrence_end_date),
    requester:
      r.firstName || r.lastName
        ? { first_name: r.firstName ?? "", last_name: r.lastName ?? "" }
        : null,
  }))
}

/** All crew members (employees) for the assignment picker. */
export async function listCrewMembers() {
  await requireCrew()
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.isEmployee, true))
    .orderBy(asc(profiles.firstName))
  return rows.map((p) => ({
    user_id: p.userId,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone,
    profile_pic: p.profilePic,
    location: p.location,
  }))
}

const recurrenceFrequencies = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const
const MAX_RECURRENCE_OCCURRENCES = 500

type RecurrenceFrequency = (typeof recurrenceFrequencies)[number]

type ProductionInput = {
  title: string
  description?: string | null
  start_date: string
  end_date?: string | null
  location?: string | null
  status: string
  is_recurring?: boolean
  recurrence_frequency?: string | null
  recurrence_end_date?: string | null
}

function getApproximateOccurrenceCount(start: Date, end: Date, frequency: RecurrenceFrequency) {
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000)
  if (frequency === "daily") return days + 1
  if (frequency === "weekly") return Math.floor(days / 7) + 1
  if (frequency === "monthly") return Math.floor(days / 28) + 1
  if (frequency === "quarterly") return Math.floor(days / 84) + 1
  return Math.floor(days / 365) + 1
}

function validateProductionInput(input: ProductionInput) {
  if (!input.title.trim()) throw new Error("A title is required")
  const start = new Date(input.start_date)
  if (Number.isNaN(start.getTime())) throw new Error("A valid start date is required")
  if (!input.is_recurring) return

  if (!recurrenceFrequencies.includes(input.recurrence_frequency as RecurrenceFrequency)) {
    throw new Error("Select a valid repeat frequency")
  }
  if (!input.recurrence_end_date) throw new Error("A repeat end date is required")

  const recurrenceEnd = new Date(`${input.recurrence_end_date}T23:59:59`)
  if (Number.isNaN(recurrenceEnd.getTime()) || recurrenceEnd < start) {
    throw new Error("The repeat end date must be on or after the start date")
  }
  if (getApproximateOccurrenceCount(start, recurrenceEnd, input.recurrence_frequency as RecurrenceFrequency) > MAX_RECURRENCE_OCCURRENCES) {
    throw new Error(`Repeating schedules are limited to ${MAX_RECURRENCE_OCCURRENCES} occurrences`)
  }
}

/** Create a production and its crew assignments. Returns the new production row. */
export async function createProduction(
  input: ProductionInput,
  crew: { user_id: string; role?: string | null }[],
) {
  await requireCalendarManager()
  validateProductionInput(input)
  const [row] = await db
    .insert(productions)
    .values({
      title: input.title,
      description: input.description || null,
      startDate: new Date(input.start_date),
      endDate: input.end_date ? new Date(input.end_date) : null,
      location: input.location || null,
      status: input.status,
      isRecurring: input.is_recurring ?? false,
      recurrenceFrequency: input.is_recurring ? input.recurrence_frequency || null : null,
      recurrenceEndDate:
        input.is_recurring && input.recurrence_end_date
          ? new Date(input.recurrence_end_date)
          : null,
    })
    .returning()

  if (crew.length > 0) {
    await db.insert(productionCrew).values(
      crew.map((c) => ({
        productionId: row.id,
        userId: c.user_id,
        role: c.role || null,
        notifiedAt: new Date(),
      })),
    )
  }

  return {
    id: row.id,
    title: row.title,
    start_date: iso(row.startDate),
    location: row.location,
  }
}

/** Update an existing production. */
export async function updateProduction(id: string, input: ProductionInput) {
  await requireCalendarManager()
  validateProductionInput(input)
  await db
    .update(productions)
    .set({
      title: input.title,
      description: input.description || null,
      startDate: new Date(input.start_date),
      endDate: input.end_date ? new Date(input.end_date) : null,
      location: input.location || null,
      status: input.status,
      isRecurring: input.is_recurring ?? false,
      recurrenceFrequency: input.is_recurring ? input.recurrence_frequency || null : null,
      recurrenceEndDate:
        input.is_recurring && input.recurrence_end_date
          ? new Date(input.recurrence_end_date)
          : null,
    })
    .where(eq(productions.id, id))
}

/** Delete a production and its crew assignments. */
export async function deleteProduction(id: string) {
  await requireCalendarManager()
  await db.delete(productionCrew).where(eq(productionCrew.productionId, id))
  await db.delete(productions).where(eq(productions.id, id))
}

/** Submit a new production request (any signed-in user). */
export async function submitProductionRequest(input: ProductionInput) {
  const userId = await requireUserId()
  validateProductionInput(input)
  await db.insert(productionRequests).values({
    userId,
    title: input.title,
    description: input.description || null,
    requestedDate: input.start_date ? new Date(input.start_date) : null,
    location: input.location || null,
    isRecurring: input.is_recurring ?? false,
    recurrenceFrequency: input.is_recurring ? input.recurrence_frequency || null : null,
    recurrenceEndDate:
      input.is_recurring && input.recurrence_end_date
        ? new Date(input.recurrence_end_date)
        : null,
  })
}

/** Approve a request: create the production and mark the request approved. */
export async function approveProductionRequest(request: {
  id: string
  title: string
  description?: string | null
  requested_date?: string | null
  location?: string | null
  is_recurring?: boolean
  recurrence_frequency?: string | null
  recurrence_end_date?: string | null
}) {
  await requireCalendarManager()
  const input: ProductionInput = {
    title: request.title,
    description: request.description,
    start_date: request.requested_date || "",
    location: request.location,
    status: "upcoming",
    is_recurring: request.is_recurring,
    recurrence_frequency: request.recurrence_frequency,
    recurrence_end_date: request.recurrence_end_date,
  }
  validateProductionInput(input)
  await db.insert(productions).values({
    title: request.title,
    description: request.description || null,
    startDate: new Date(input.start_date),
    location: request.location || null,
    status: "upcoming",
    isRecurring: request.is_recurring ?? false,
    recurrenceFrequency: request.is_recurring ? request.recurrence_frequency || null : null,
    recurrenceEndDate:
      request.is_recurring && request.recurrence_end_date
        ? new Date(request.recurrence_end_date)
        : null,
  })
  await db
    .update(productionRequests)
    .set({ status: "approved" })
    .where(eq(productionRequests.id, request.id))
}

/** Reject a production request. */
export async function rejectProductionRequest(requestId: string) {
  await requireCalendarManager()
  await db
    .update(productionRequests)
    .set({ status: "rejected" })
    .where(eq(productionRequests.id, requestId))
}
