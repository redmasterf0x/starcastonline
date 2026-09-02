"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, phoneVerifications } from "@/lib/db/schema"
import { and, desc, eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { sendSms, isSmsConfigured } from "@/lib/sms"
import { INTEREST_OPTIONS } from "@/lib/onboarding-options"

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "articles",
  "bands",
  "community",
  "dashboard",
  "login",
  "logout",
  "onboarding",
  "portal",
  "production",
  "profile",
  "shows",
  "signup",
  "sponsors",
  "staff",
  "starcast",
  "studio",
  "support",
  "u",
])

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}

/** Normalize a handle: lowercase, alphanumerics and underscores only. */
function normalizeUsername(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, "")
}

/**
 * Ensure a profile row exists for the signed-in user, seeded from their auth
 * record. Safe to call repeatedly — used right after sign-up and on first
 * login so every member always has a profile page.
 */
export async function ensureProfileForCurrentUser() {
  const user = await requireSession()

  const existing = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      onboardingCompleted: profiles.onboardingCompleted,
    })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)

  if (existing[0]) {
    // Backfill a handle for legacy rows that predate usernames.
    if (!existing[0].username) {
      const username = await generateUniqueUsername(user.email ?? "member")
      await db.update(profiles).set({ username }).where(eq(profiles.id, existing[0].id))
      return { created: false, username, onboardingCompleted: existing[0].onboardingCompleted }
    }
    return {
      created: false,
      username: existing[0].username,
      onboardingCompleted: existing[0].onboardingCompleted,
    }
  }

  // Split the Better Auth `name` into first/last as a starting point.
  const parts = (user.name ?? "").trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? ""
  const lastName = parts.slice(1).join(" ")
  const username = await generateUniqueUsername(user.email ?? "member")

  await db.insert(profiles).values({
    userId: user.id,
    email: user.email,
    firstName,
    lastName,
    username,
    onboardingCompleted: false,
  })

  return { created: true, username, onboardingCompleted: false }
}

/** Build a unique handle from an email local-part, adding a numeric suffix on collision. */
async function generateUniqueUsername(email: string) {
  const base = normalizeUsername(email.split("@")[0] || "member") || "member"
  let candidate = base
  let n = 1
  while (true) {
    const taken = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(sql`lower(${profiles.username}) = ${candidate}`)
      .limit(1)
    if (taken.length === 0 && !RESERVED_USERNAMES.has(candidate)) return candidate
    n += 1
    candidate = `${base}${n}`
  }
}

/** Check whether a handle is available for the signed-in user. */
export async function checkUsernameAvailable(raw: string) {
  const user = await requireSession()
  const username = normalizeUsername(raw)

  if (username.length < 3) return { available: false, reason: "Must be at least 3 characters." }
  if (username.length > 24) return { available: false, reason: "Must be 24 characters or fewer." }
  if (RESERVED_USERNAMES.has(username)) return { available: false, reason: "That handle is reserved." }

  const rows = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = ${username}`)
    .limit(1)

  // Their own current handle counts as available.
  if (rows[0] && rows[0].userId !== user.id) return { available: false, reason: "That handle is taken." }
  return { available: true, reason: null as string | null, username }
}

/** Current onboarding state for the signed-in user. */
export async function getOnboardingState() {
  const user = await requireSession()
  await ensureProfileForCurrentUser()

  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)
  const p = rows[0]
  if (!p) throw new Error("Profile not found")

  return {
    email: p.email,
    username: p.username ?? "",
    firstName: p.firstName,
    lastName: p.lastName,
    bio: p.bio ?? "",
    location: p.location ?? "",
    website: p.website ?? "",
    profilePic: p.profilePic ?? "",
    phone: p.phone ?? "",
    phoneVerified: p.phoneVerified,
    interests: Array.isArray(p.interests) ? (p.interests as string[]) : [],
    onboardingCompleted: p.onboardingCompleted,
    smsAvailable: isSmsConfigured(),
  }
}

/** Persist onboarding fields as the member moves through the wizard. */
export async function saveOnboardingStep(fields: {
  username?: string
  firstName?: string
  lastName?: string
  bio?: string
  location?: string
  website?: string
  profilePic?: string
  interests?: string[]
}) {
  const user = await requireSession()

  // Validate the handle before writing, since it is publicly addressable.
  let username: string | undefined
  if (fields.username !== undefined) {
    const check = await checkUsernameAvailable(fields.username)
    if (!check.available) throw new Error(check.reason ?? "That handle is unavailable.")
    username = normalizeUsername(fields.username)
  }

  await db
    .update(profiles)
    .set({
      ...(username !== undefined && { username }),
      ...(fields.firstName !== undefined && { firstName: fields.firstName.trim() }),
      ...(fields.lastName !== undefined && { lastName: fields.lastName.trim() }),
      ...(fields.bio !== undefined && { bio: fields.bio.trim() }),
      ...(fields.location !== undefined && { location: fields.location.trim() }),
      ...(fields.website !== undefined && { website: fields.website.trim() }),
      ...(fields.profilePic !== undefined && { profilePic: fields.profilePic }),
      ...(fields.interests !== undefined && {
        // Only persist known options so the column can't be stuffed with junk.
        interests: fields.interests.filter((i) => (INTEREST_OPTIONS as readonly string[]).includes(i)),
      }),
    })
    .where(eq(profiles.userId, user.id))

  return { success: true }
}

/** Send a 6-digit SMS code to verify the member's phone number. */
export async function sendPhoneCode(phone: string) {
  const user = await requireSession()
  const clean = phone.replace(/[^\d+]/g, "")
  if (clean.replace(/\D/g, "").length < 10) throw new Error("Enter a valid phone number.")

  if (!isSmsConfigured()) throw new Error("SMS is not configured. You can skip this step.")

  // Basic throttle: at most 3 codes per 15 minutes.
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const recent = await db
    .select({ id: phoneVerifications.id })
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.userId, user.id), sql`${phoneVerifications.createdAt} > ${since}`))
  if (recent.length >= 3) throw new Error("Too many codes requested. Please wait a few minutes.")

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.insert(phoneVerifications).values({ userId: user.id, phone: clean, code, expiresAt })

  const result = await sendSms(clean, `Your Starcast verification code is ${code}. It expires in 10 minutes.`)
  if (!result.ok && !result.skipped) throw new Error("Could not send the code. Check the number and try again.")

  // Store the number now so it shows in the form while awaiting the code.
  await db.update(profiles).set({ phone: clean }).where(eq(profiles.userId, user.id))

  return { sent: true }
}

/** Verify the SMS code and mark the phone as verified. */
export async function verifyPhoneCode(code: string) {
  const user = await requireSession()
  const entered = code.replace(/\D/g, "")

  const rows = await db
    .select()
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.userId, user.id), eq(phoneVerifications.consumed, false)))
    .orderBy(desc(phoneVerifications.createdAt))
    .limit(1)

  const record = rows[0]
  if (!record) throw new Error("No code to verify. Request a new one.")
  if (record.expiresAt.getTime() < Date.now()) throw new Error("That code expired. Request a new one.")
  if (record.attempts >= 5) throw new Error("Too many incorrect attempts. Request a new code.")

  if (record.code !== entered) {
    await db
      .update(phoneVerifications)
      .set({ attempts: record.attempts + 1 })
      .where(eq(phoneVerifications.id, record.id))
    throw new Error("That code is incorrect.")
  }

  await db.update(phoneVerifications).set({ consumed: true }).where(eq(phoneVerifications.id, record.id))
  await db
    .update(profiles)
    .set({ phone: record.phone, phoneVerified: true })
    .where(eq(profiles.userId, user.id))

  return { verified: true }
}

/** Mark onboarding finished and return the member's public handle. */
export async function completeOnboarding() {
  const user = await requireSession()

  const rows = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)
  if (!rows[0]?.username) throw new Error("Choose a handle before finishing.")

  await db.update(profiles).set({ onboardingCompleted: true }).where(eq(profiles.userId, user.id))

  revalidatePath("/dashboard")
  revalidatePath(`/u/${rows[0].username}`)
  return { username: rows[0].username }
}
