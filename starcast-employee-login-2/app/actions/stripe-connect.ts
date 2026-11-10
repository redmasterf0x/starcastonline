"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { profiles, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireStaff } from "@/lib/permissions"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"
const returnUrl = `${baseUrl}/production`

type PayoutStatus = {
  connected: boolean
  transfersActive: boolean
  status: "not_connected" | "onboarding" | "active"
}

/** Crew-only guard: staff or admin may link a payout account. */
async function requireCrewProfile() {
  const viewer = await requireStaff()
  if (!viewer.profileId) throw new Error("Profile not found")
  return viewer
}

/** Returns the current payout connection state for the signed-in crew member. */
export async function getPayoutStatus(): Promise<PayoutStatus> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId })
    .from(profiles)
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)
  const stripeAccountId = rows[0]?.stripeAccountId

  if (!stripeAccountId) {
    return { connected: false, transfersActive: false, status: "not_connected" }
  }

  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    const transfersActive = Boolean(account.payouts_enabled)
    const status: PayoutStatus["status"] = transfersActive ? "active" : "onboarding"

    await db.update(profiles).set({ stripeAccountStatus: status }).where(eq(profiles.id, viewer.profileId!))

    return { connected: true, transfersActive, status }
  } catch (err: any) {
    console.error("getPayoutStatus error:", err)
    return { connected: true, transfersActive: false, status: "onboarding" }
  }
}

/**
 * Creates (if needed) the crew member's Stripe Express connected account and returns a
 * one-time onboarding URL to link their payout account (debit card or bank account).
 * Safe to call again to resume an incomplete onboarding.
 */
export async function startPayoutOnboarding(): Promise<{ url: string }> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId, email: user.email, firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)
  let stripeAccountId = rows[0]?.stripeAccountId
  const contactEmail = rows[0]?.email || undefined
  const fullName = `${rows[0]?.firstName || ""} ${rows[0]?.lastName || ""}`.trim() || undefined

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: contactEmail,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        name: fullName ? `${fullName} (Starcast Crew)` : "Starcast Media Crew Member",
        url: baseUrl,
        mcc: "7922", // Theatrical producers / entertainment services
      },
      metadata: {
        profile_id: viewer.profileId!,
        user_id: viewer.userId,
      },
    })
    stripeAccountId = account.id
    await db
      .update(profiles)
      .set({ stripeAccountId, stripeAccountStatus: "onboarding" })
      .where(eq(profiles.id, viewer.profileId!))
  }

  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
    collection_options: {
      fields: "currently_due",
    },
  })

  return { url: link.url }
}

/** Returns a one-time login link to the crew member's Stripe Express dashboard. */
export async function openPayoutDashboard(): Promise<{ url: string }> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId, stripeAccountStatus: profiles.stripeAccountStatus })
    .from(profiles)
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)
  const stripeAccountId = rows[0]?.stripeAccountId
  if (!stripeAccountId) throw new Error("No connected Stripe account")

  try {
    const link = await stripe.accounts.createLoginLink(stripeAccountId)
    return { url: link.url }
  } catch (err: any) {
    // If onboarding wasn't finished, resume onboarding directly into the missing step
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
      collection_options: {
        fields: "currently_due",
      },
    })
    return { url: link.url }
  }
}
