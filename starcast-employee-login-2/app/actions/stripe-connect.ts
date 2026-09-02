"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { profiles, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireStaff } from "@/lib/permissions"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.starcast.online"
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

  const account = await stripe.v2.core.accounts.retrieve(stripeAccountId, {
    include: ["configuration.recipient"],
  })

  const transfersActive =
    account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active"
  const status: PayoutStatus["status"] = transfersActive ? "active" : "onboarding"

  await db.update(profiles).set({ stripeAccountStatus: status }).where(eq(profiles.id, viewer.profileId!))

  return { connected: true, transfersActive, status }
}

/**
 * Creates (if needed) the crew member's Stripe recipient account and returns a
 * one-time onboarding URL to collect the info Stripe needs before payouts can
 * be sent. Safe to call again to resume an incomplete onboarding.
 */
export async function startPayoutOnboarding(): Promise<{ url: string }> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId, email: user.email })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)
  let stripeAccountId = rows[0]?.stripeAccountId
  const contactEmail = rows[0]?.email

  if (!stripeAccountId) {
    const account = await stripe.v2.core.accounts.create({
      dashboard: "express",
      contact_email: contactEmail,
      identity: { country: "US" },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
    })
    stripeAccountId = account.id
    await db
      .update(profiles)
      .set({ stripeAccountId, stripeAccountStatus: "onboarding" })
      .where(eq(profiles.id, viewer.profileId!))
  }

  const link = await stripe.v2.core.accountLinks.create({
    account: stripeAccountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        return_url: returnUrl,
        refresh_url: returnUrl,
      },
    },
  })

  return { url: link.url }
}

/** Returns a one-time login link to the crew member's Stripe Express dashboard. */
export async function openPayoutDashboard(): Promise<{ url: string }> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId })
    .from(profiles)
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)
  const stripeAccountId = rows[0]?.stripeAccountId
  if (!stripeAccountId) throw new Error("No connected Stripe account")

  const link = await stripe.v2.core.accountLinks.create({
    account: stripeAccountId,
    use_case: {
      type: "account_update",
      account_update: {
        configurations: ["recipient"],
        return_url: returnUrl,
        refresh_url: returnUrl,
      },
    },
  })
  return { url: link.url }
}
