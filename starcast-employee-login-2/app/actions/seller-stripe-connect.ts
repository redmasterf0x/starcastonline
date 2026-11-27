"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { profiles, bands } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { requireViewer } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"
const sellerCentralUrl = `${baseUrl}/tickets/seller-central`

export type SellerStripeStatus = {
  connected: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  status: "not_connected" | "onboarding" | "active"
  stripeAccountId: string | null
}

/**
 * Internal helper safe to call during Server Component render (does NOT call revalidatePath).
 * Checks profiles.stripeAccountId (syncing from an owned band's Stripe account if already linked)
 * and verifies live status with Stripe.
 */
export async function resolveSellerStripeStatusForUser(userId: string): Promise<SellerStripeStatus> {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1)

    if (!profile) {
      return {
        connected: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        status: "not_connected",
        stripeAccountId: null,
      }
    }

    let stripeAccountId = profile.stripeAccountId
    let cachedStatus = profile.stripeAccountStatus

    // If the user already linked Stripe on one of their band pages, sync it automatically so they never onboard twice
    if (!stripeAccountId) {
      const ownedBandsWithStripe = await db
        .select({
          stripeAccountId: bands.stripeAccountId,
          stripeAccountStatus: bands.stripeAccountStatus,
        })
        .from(bands)
        .where(and(eq(bands.ownerUserId, userId), sql`${bands.stripeAccountId} IS NOT NULL`))

      const activeBand =
        ownedBandsWithStripe.find((b) => b.stripeAccountStatus === "active") || ownedBandsWithStripe[0]

      if (activeBand?.stripeAccountId) {
        stripeAccountId = activeBand.stripeAccountId
        cachedStatus = activeBand.stripeAccountStatus || "onboarding"
        await db
          .update(profiles)
          .set({
            stripeAccountId,
            stripeAccountStatus: cachedStatus,
          })
          .where(eq(profiles.id, profile.id))
      }
    }

    if (!stripeAccountId) {
      return {
        connected: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        status: "not_connected",
        stripeAccountId: null,
      }
    }

    try {
      const account = await stripe.accounts.retrieve(stripeAccountId)
      const payoutsEnabled = Boolean(account.payouts_enabled)
      const detailsSubmitted = Boolean(account.details_submitted)
      const status: SellerStripeStatus["status"] = payoutsEnabled ? "active" : "onboarding"

      if (profile.stripeAccountStatus !== status) {
        await db
          .update(profiles)
          .set({ stripeAccountStatus: status })
          .where(eq(profiles.id, profile.id))
      }

      return {
        connected: true,
        payoutsEnabled,
        detailsSubmitted,
        status,
        stripeAccountId,
      }
    } catch (stripeErr: any) {
      console.warn("Could not retrieve Seller Stripe account via API:", stripeErr?.message)
      return {
        connected: true,
        payoutsEnabled: cachedStatus === "active",
        detailsSubmitted: cachedStatus === "active",
        status: cachedStatus === "active" ? "active" : "onboarding",
        stripeAccountId,
      }
    }
  } catch (err: any) {
    console.error("resolveSellerStripeStatusForUser error:", err)
    return {
      connected: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      status: "not_connected",
      stripeAccountId: null,
    }
  }
}

/** Returns the current Stripe Connect payout status for the signed-in seller */
export async function getSellerStripeStatus(): Promise<SellerStripeStatus> {
  const viewer = await requireViewer()
  return resolveSellerStripeStatusForUser(viewer.userId)
}

/** Starts or resumes Stripe Connect Express onboarding directly from Ticket Seller Central */
export async function startSellerStripeOnboarding(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const viewer = await requireViewer()

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, viewer.userId))
      .limit(1)

    if (!profile) {
      return { success: false, error: "Profile not found." }
    }

    const approvedBands = await db
      .select({
        id: bands.id,
        name: bands.name,
        stripeAccountId: bands.stripeAccountId,
      })
      .from(bands)
      .where(and(eq(bands.ownerUserId, viewer.userId), eq(bands.ticketingStatus, "approved")))

    const isApproved =
      profile.ticketingStatus === "approved" || approvedBands.length > 0 || viewer.isAdmin

    if (!isApproved) {
      return {
        success: false,
        error: "Your Ticket Seller application must be approved before linking Stripe.",
      }
    }

    let stripeAccountId =
      profile.stripeAccountId || approvedBands.find((b) => b.stripeAccountId)?.stripeAccountId || null

    if (!stripeAccountId) {
      const displayName =
        profile.sellerOrganizerName?.trim() ||
        approvedBands[0]?.name ||
        `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
        profile.username ||
        profile.email ||
        "StarCast Ticket Seller"

      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: profile.email || undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: displayName,
          url: `${baseUrl}/tickets`,
          mcc: "7922", // Theatrical producers / live events / ticket agencies
        },
        metadata: {
          user_id: viewer.userId,
          profile_id: profile.id,
          role: "ticket_seller",
        },
      })

      stripeAccountId = account.id
    }

    await db
      .update(profiles)
      .set({
        stripeAccountId,
        stripeAccountStatus: profile.stripeAccountStatus === "active" ? "active" : "onboarding",
      })
      .where(eq(profiles.id, profile.id))

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${sellerCentralUrl}?stripe=refresh`,
      return_url: `${sellerCentralUrl}?stripe=success`,
      type: "account_onboarding",
    })

    revalidatePath("/tickets/seller-central")
    return { success: true, url: accountLink.url }
  } catch (err: any) {
    console.error("startSellerStripeOnboarding error:", err)
    return { success: false, error: err?.message || "Failed to start Stripe onboarding" }
  }
}

/** Opens the seller's Stripe Express Payout Dashboard */
export async function openSellerStripeDashboard(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const viewer = await requireViewer()

    const status = await resolveSellerStripeStatusForUser(viewer.userId)
    if (!status.stripeAccountId) {
      return { success: false, error: "No Stripe payout account linked yet." }
    }

    const loginLink = await stripe.accounts.createLoginLink(status.stripeAccountId)
    return { success: true, url: loginLink.url }
  } catch (err: any) {
    console.error("openSellerStripeDashboard error:", err)
    return { success: false, error: err?.message || "Failed to open Stripe dashboard" }
  }
}
