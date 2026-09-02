"use server"

import { stripe } from "@/lib/stripe"
import { getPackageById } from "@/lib/products"
import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export interface SponsorFormData {
  packageId: string
  companyName: string
  companyEmail: string
  contactName: string
  contactPhone?: string
  websiteUrl?: string
  socialFacebook?: string
  socialInstagram?: string
  socialTwitter?: string
  socialLinkedin?: string
  commercialUrl?: string
  logoUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.starcast.online"

export async function createSponsorCheckout(formData: SponsorFormData) {
  const pkg = getPackageById(formData.packageId)
  if (!pkg) return { error: "Invalid package selected" }

  const [sponsor] = await db
    .insert(sponsors)
    .values({
      packageId: pkg.id,
      packageName: pkg.name,
      amountCents: pkg.priceInCents,
      status: "pending",
      name: formData.companyName,
      companyName: formData.companyName,
      companyEmail: formData.companyEmail,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone ?? null,
      websiteUrl: formData.websiteUrl ?? null,
      socialFacebook: formData.socialFacebook ?? null,
      socialInstagram: formData.socialInstagram ?? null,
      socialTwitter: formData.socialTwitter ?? null,
      socialLinkedin: formData.socialLinkedin ?? null,
      commercialUrl: formData.commercialUrl ?? null,
      logoUrl: formData.logoUrl ?? null,
    })
    .returning()

  if (!sponsor) return { error: "Failed to create sponsor record" }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe API 2026-03-25 (stripe v21+) renamed "embedded" -> "embedded_page".
      // Sending the old value returns a 400 and the checkout never loads.
      ui_mode: "embedded_page",
      payment_method_types: ["card"],
      // Build the line item from our own catalog price (price_data) instead of a
      // hardcoded Stripe price ID. Price IDs are per-mode (a test-mode ID is
      // invalid in live mode and vice-versa), so inlining the amount here makes
      // the same code charge correctly whether the active key is test or live.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pkg.priceInCents,
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
          },
        },
      ],
      customer_email: formData.companyEmail,
      // Automatic capture (the default): the card is actually charged and funds
      // are collected as soon as the customer completes checkout. (The previous
      // "manual" capture only authorized a hold that expired without collecting.)
      payment_intent_data: {
        metadata: {
          sponsor_id: sponsor.id,
          package_id: pkg.id,
          company_name: formData.companyName,
        },
      },
      metadata: {
        sponsor_id: sponsor.id,
        package_id: pkg.id,
        company_name: formData.companyName,
      },
      return_url: `${baseUrl}/sponsors/success?session_id={CHECKOUT_SESSION_ID}`,
    })

    await db
      .update(sponsors)
      .set({ stripeSessionId: session.id })
      .where(eq(sponsors.id, sponsor.id))

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error: any) {
    await db.delete(sponsors).where(eq(sponsors.id, sponsor.id)).catch(() => {})
    return { error: error?.message || "Failed to create checkout session" }
  }
}

export async function verifySponsorPayment(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      const sponsorId = session.metadata?.sponsor_id
      if (!sponsorId) return { success: false, error: "No sponsor_id in session" }

      const [updated] = await db
        .update(sponsors)
        .set({
          status: "paid",
          stripeCustomerId: session.customer as string,
        })
        .where(eq(sponsors.id, sponsorId))
        .returning()

      if (updated) {
        await fetch(`${baseUrl}/api/email/send-sponsor-thanks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: updated.companyEmail,
            companyName: updated.companyName,
            packageName: updated.packageName,
          }),
        }).catch(() => {})
      }

      // The success page reads snake_case fields, so normalize the Drizzle row
      // (camelCase) before returning — otherwise it renders "$NaN" and blanks.
      const sponsor = updated
        ? {
            id: updated.id,
            package_name: updated.packageName,
            company_name: updated.companyName,
            company_email: updated.companyEmail,
            amount_cents: updated.amountCents,
            status: updated.status,
          }
        : null

      return { success: true, sponsor }
    }

    return { success: false, error: "Payment not completed" }
  } catch (error: any) {
    return { success: false, error: "Failed to verify payment" }
  }
}
