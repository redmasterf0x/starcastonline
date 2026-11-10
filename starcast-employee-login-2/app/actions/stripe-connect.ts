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
      individual: {
        first_name: rows[0]?.firstName || undefined,
        last_name: rows[0]?.lastName || undefined,
        email: contactEmail,
      },
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        product_description: "Starcast Media production crew member payouts",
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

export type CrewAccountingData = {
  connected: boolean
  status: "not_connected" | "onboarding" | "active"
  stripeAccountId: string | null
  payoutsEnabled: boolean
  bankDetails: {
    id: string
    bankName: string
    last4: string
    status: string
  }[]
  availableBalanceCents: number
  pendingBalanceCents: number
  payouts: {
    id: string
    amountCents: number
    status: string
    arrivalDate: string | null
    created: string
    destinationLast4: string | null
  }[]
  transactions: {
    id: string
    amountCents: number
    netCents: number
    feeCents: number
    description: string | null
    created: string
    type: string
  }[]
}

/** Fetches accounting, payout history, bank account details, and balance for the signed-in crew member */
export async function getCrewAccountingDetails(): Promise<CrewAccountingData> {
  const viewer = await requireCrewProfile()

  const rows = await db
    .select({ stripeAccountId: profiles.stripeAccountId, stripeAccountStatus: profiles.stripeAccountStatus })
    .from(profiles)
    .where(eq(profiles.id, viewer.profileId!))
    .limit(1)

  const stripeAccountId = rows[0]?.stripeAccountId

  if (!stripeAccountId) {
    return {
      connected: false,
      status: "not_connected",
      stripeAccountId: null,
      payoutsEnabled: false,
      bankDetails: [],
      availableBalanceCents: 0,
      pendingBalanceCents: 0,
      payouts: [],
      transactions: [],
    }
  }

  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    const payoutsEnabled = Boolean(account.payouts_enabled)
    const status: CrewAccountingData["status"] = payoutsEnabled ? "active" : "onboarding"

    if (rows[0]?.stripeAccountStatus !== status) {
      await db.update(profiles).set({ stripeAccountStatus: status }).where(eq(profiles.id, viewer.profileId!))
    }

    // External accounts (Chime / Stride Bank, etc.)
    const bankDetails = (account.external_accounts?.data || []).map((b: any) => ({
      id: b.id,
      bankName: b.bank_name || b.brand || "Bank Account",
      last4: b.last4,
      status: b.status || "verified",
    }))

    // Balance
    let availableBalanceCents = 0
    let pendingBalanceCents = 0
    try {
      const balance = await stripe.balance.retrieve({}, { stripeAccount: stripeAccountId })
      availableBalanceCents = balance.available?.reduce((acc, b) => acc + b.amount, 0) || 0
      pendingBalanceCents = balance.pending?.reduce((acc, b) => acc + b.amount, 0) || 0
    } catch (e: any) {
      console.warn("Could not retrieve balance:", e?.message)
    }

    // Payouts
    let payoutsList: any[] = []
    try {
      const payoutsRes = await stripe.payouts.list({ limit: 50 }, { stripeAccount: stripeAccountId })
      payoutsList = payoutsRes.data.map((p) => ({
        id: p.id,
        amountCents: p.amount,
        status: p.status,
        arrivalDate: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString() : null,
        created: new Date(p.created * 1000).toISOString(),
        destinationLast4: (p as any).destination_last4 || null,
      }))
    } catch (e: any) {
      console.warn("Could not retrieve payouts:", e?.message)
    }

    // Transactions
    let transactionsList: any[] = []
    try {
      const txRes = await stripe.balanceTransactions.list({ limit: 100 }, { stripeAccount: stripeAccountId })
      transactionsList = txRes.data.map((t) => ({
        id: t.id,
        amountCents: t.amount,
        netCents: t.net,
        feeCents: t.fee,
        description: t.description || null,
        created: new Date(t.created * 1000).toISOString(),
        type: t.type,
      }))
    } catch (e: any) {
      console.warn("Could not retrieve transactions:", e?.message)
    }

    return {
      connected: true,
      status,
      stripeAccountId,
      payoutsEnabled,
      bankDetails,
      availableBalanceCents,
      pendingBalanceCents,
      payouts: payoutsList,
      transactions: transactionsList,
    }
  } catch (err: any) {
    console.error("getCrewAccountingDetails error:", err)
    return {
      connected: true,
      status: "onboarding",
      stripeAccountId,
      payoutsEnabled: false,
      bankDetails: [],
      availableBalanceCents: 0,
      pendingBalanceCents: 0,
      payouts: [],
      transactions: [],
    }
  }
}

/**
 * Securely links or updates a crew member's bank account on-site using server-side tokenization.
 * Bank routing and account numbers are tokenized immediately and attached to their Stripe connected account.
 * No bank credentials or account numbers are ever stored in the Starcast database.
 */
export async function linkCrewBankAccountOnSite(input: {
  routingNumber: string
  accountNumber: string
  accountHolderName: string
}): Promise<{ success: boolean; bankName?: string; last4?: string; error?: string }> {
  try {
    const viewer = await requireCrewProfile()

    const cleanRouting = input.routingNumber?.replace(/\D/g, "")
    const cleanAccount = input.accountNumber?.replace(/\D/g, "")
    const cleanHolder = input.accountHolderName?.trim()

    if (!cleanRouting || cleanRouting.length !== 9) {
      return { success: false, error: "Please enter a valid 9-digit US bank routing number." }
    }
    if (!cleanAccount || cleanAccount.length < 4 || cleanAccount.length > 17) {
      return { success: false, error: "Please enter a valid bank account number." }
    }
    if (!cleanHolder) {
      return { success: false, error: "Account holder name is required." }
    }

    const rows = await db
      .select({
        stripeAccountId: profiles.stripeAccountId,
        email: user.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(profiles)
      .innerJoin(user, eq(user.id, profiles.userId))
      .where(eq(profiles.id, viewer.profileId!))
      .limit(1)

    let stripeAccountId = rows[0]?.stripeAccountId

    // Create connected individual account if it doesn't exist yet
    if (!stripeAccountId) {
      const contactEmail = rows[0]?.email || undefined
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: contactEmail,
        business_type: "individual",
        individual: {
          first_name: rows[0]?.firstName || undefined,
          last_name: rows[0]?.lastName || undefined,
          email: contactEmail,
        },
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: "Starcast Media production crew member payouts",
          mcc: "7922",
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

    // 1. Create a secure token with Stripe in-memory (never logged or saved to DB)
    const token = await stripe.tokens.create({
      bank_account: {
        country: "US",
        currency: "usd",
        routing_number: cleanRouting,
        account_number: cleanAccount,
        account_holder_name: cleanHolder,
        account_holder_type: "individual",
      },
    })

    // 2. Attach bank account token to the crew member's Stripe connected account as the default payout destination
    const externalAccount = await stripe.accounts.createExternalAccount(stripeAccountId, {
      external_account: token.id,
      default_for_currency: true,
    })

    // 3. Update status in database
    await db
      .update(profiles)
      .set({ stripeAccountStatus: "active" })
      .where(eq(profiles.id, viewer.profileId!))

    return {
      success: true,
      bankName: (externalAccount as any).bank_name || "Bank Account",
      last4: (externalAccount as any).last4,
    }
  } catch (err: any) {
    console.error("linkCrewBankAccountOnSite error:", err)
    return {
      success: false,
      error: err?.message || "Failed to link bank account. Please check your routing and account numbers.",
    }
  }
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
