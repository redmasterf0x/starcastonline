"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { bands } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireViewer } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"
const returnUrl = `${baseUrl}/portal`

export type BandStripeStatus = {
  connected: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  status: "not_connected" | "onboarding" | "active"
  stripeAccountId: string | null
}

/** Check if the caller is the owner of the band or staff/admin */
async function requireBandOwner(bandId: string) {
  const viewer = await requireViewer()
  const rows = await db.select().from(bands).where(eq(bands.id, bandId)).limit(1)
  const band = rows[0]
  if (!band) throw new Error("Band not found")
  if (band.ownerUserId !== viewer.userId && !viewer.isStaff) {
    throw new Error("Unauthorized to manage Stripe for this band")
  }
  return { viewer, band }
}

/** Returns the current Stripe payout account status for a band */
export async function getBandStripeStatus(bandId: string): Promise<BandStripeStatus> {
  try {
    const { band } = await requireBandOwner(bandId)

    if (!band.stripeAccountId) {
      return {
        connected: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        status: "not_connected",
        stripeAccountId: null,
      }
    }

    try {
      const account = await stripe.accounts.retrieve(band.stripeAccountId)
      const payoutsEnabled = Boolean(account.payouts_enabled)
      const detailsSubmitted = Boolean(account.details_submitted)
      const status: BandStripeStatus["status"] = payoutsEnabled ? "active" : "onboarding"

      if (band.stripeAccountStatus !== status) {
        await db
          .update(bands)
          .set({ stripeAccountStatus: status, updatedAt: new Date() })
          .where(eq(bands.id, bandId))
      }

      return {
        connected: true,
        payoutsEnabled,
        detailsSubmitted,
        status,
        stripeAccountId: band.stripeAccountId,
      }
    } catch (stripeErr: any) {
      console.warn("Could not retrieve Stripe account via standard API:", stripeErr?.message)
      return {
        connected: true,
        payoutsEnabled: band.stripeAccountStatus === "active",
        detailsSubmitted: true,
        status: (band.stripeAccountStatus as any) || "onboarding",
        stripeAccountId: band.stripeAccountId,
      }
    }
  } catch (err: any) {
    console.error("getBandStripeStatus error:", err)
    return {
      connected: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      status: "not_connected",
      stripeAccountId: null,
    }
  }
}

/** Starts or resumes Stripe Connect Express onboarding for a band */
export async function startBandStripeOnboarding(bandId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { band } = await requireBandOwner(bandId)

    if (band.ticketingStatus !== "approved") {
      return { success: false, error: "Your band must be approved for ticketing before connecting Stripe." }
    }

    let stripeAccountId = band.stripeAccountId

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: band.contactEmail || undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: band.name,
          url: band.slug ? `${baseUrl}/bands/${band.slug}` : `${baseUrl}/bands`,
          mcc: "7922", // Theatrical producers / bands / ticket agencies
        },
        metadata: {
          band_id: band.id,
          band_name: band.name,
        },
      })

      stripeAccountId = account.id

      await db
        .update(bands)
        .set({
          stripeAccountId,
          stripeAccountStatus: "onboarding",
          updatedAt: new Date(),
        })
        .where(eq(bands.id, bandId))
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${returnUrl}?tab=ticketing&bandId=${bandId}&stripe_refresh=1`,
      return_url: `${returnUrl}?tab=ticketing&bandId=${bandId}&stripe_success=1`,
      type: "account_onboarding",
    })

    revalidatePath("/portal")
    return { success: true, url: accountLink.url }
  } catch (err: any) {
    console.error("startBandStripeOnboarding error:", err)
    return { success: false, error: err?.message || "Failed to start Stripe onboarding" }
  }
}

/** Opens the band owner's Stripe Express dashboard */
export async function openBandStripeDashboard(bandId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { band } = await requireBandOwner(bandId)

    if (!band.stripeAccountId) {
      return { success: false, error: "No Stripe account connected yet" }
    }

    const loginLink = await stripe.accounts.createLoginLink(band.stripeAccountId)
    return { success: true, url: loginLink.url }
  } catch (err: any) {
    console.error("openBandStripeDashboard error:", err)
    return { success: false, error: err?.message || "Failed to open Stripe dashboard" }
  }
}
