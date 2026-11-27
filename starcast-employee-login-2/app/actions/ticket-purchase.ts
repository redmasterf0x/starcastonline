"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { bandEvents, bands, bandTicketOrders, bandTicketInstances } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { sendTicketConfirmationEmail } from "@/lib/email"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"

export type BuyTicketInput = {
  eventId: string
  quantity: number
  buyerName: string
  buyerEmail: string
  buyerUserId?: string
  ticketTier?: "general" | "vip"
  paymentOption?: "stripe" | "google_pay"
}

/** Public client configuration for the Google Pay JS API (`google.payments.api.PaymentsClient`) */
export async function getGooglePayClientConfig() {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    null
  const googlePayMerchantId =
    process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID?.trim() ||
    process.env.GOOGLE_PAY_MERCHANT_ID?.trim() ||
    null
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || ""
  const isLive =
    (publishableKey && publishableKey.startsWith("pk_live_")) ||
    (!publishableKey && secretKey.startsWith("sk_live_"))

  return {
    stripePublishableKey: publishableKey,
    googlePayMerchantId,
    environment: (isLive ? "PRODUCTION" : "TEST") as "TEST" | "PRODUCTION",
    merchantName: "Top City Tickets • StarCast",
  }
}

export async function createTicketCheckoutSession(input: BuyTicketInput) {
  try {
    const quantity = Math.max(1, Math.min(10, input.quantity || 1))
    const tier: "general" | "vip" = input.ticketTier === "vip" ? "vip" : "general"

    if (!input.buyerName?.trim()) {
      return { success: false, error: "Your name is required." }
    }
    if (!input.buyerEmail?.trim() || !input.buyerEmail.includes("@")) {
      return { success: false, error: "A valid email address is required." }
    }

    const [event] = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.id, input.eventId))
      .limit(1)

    if (!event) return { success: false, error: "Event not found" }
    if (event.status !== "active") {
      return { success: false, error: "This event is no longer active for ticket sales." }
    }

    if (tier === "vip" && !event.vipEnabled) {
      return { success: false, error: "VIP passes are not available for this event." }
    }

    const availablePool = tier === "vip" ? event.vipRemainingInventory : event.remainingInventory
    if (availablePool < quantity) {
      return {
        success: false,
        error:
          availablePool <= 0
            ? tier === "vip"
              ? "Sorry, all VIP Table passes are sold out!"
              : "Sorry, General Admission tickets are sold out!"
            : `Only ${availablePool} ${tier === "vip" ? "VIP " : ""}ticket(s) left!`,
      }
    }

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    const organizerLabel = band?.name || event.organizerName || "StarCast Event"

    const authSession = await auth.api.getSession({ headers: await headers() }).catch(() => null)
    const resolvedBuyerUserId = input.buyerUserId || authSession?.user?.id || null

    const unitPriceCents = tier === "vip" ? event.vipPriceCents || 0 : event.priceCents || 0
    const totalCents = unitPriceCents * quantity
    // StarCast retains a 10% platform & escrow service fee on paid online ticket sales
    const platformFeeCents = totalCents > 0 ? Math.round(totalCents * 0.1) : 0

    // Count existing issued tickets for sequential ticket numbering
    const [{ count: existingIssued }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bandTicketInstances)
      .where(eq(bandTicketInstances.eventId, event.id))

    // FREE TICKET FLOW
    if (totalCents === 0) {
      const [updatedEvent] =
        tier === "vip"
          ? await db
              .update(bandEvents)
              .set({
                vipRemainingInventory: sql`${bandEvents.vipRemainingInventory} - ${quantity}`,
                status: sql`CASE WHEN (${bandEvents.vipRemainingInventory} - ${quantity}) <= 0 AND ${bandEvents.remainingInventory} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(bandEvents.id, event.id),
                  sql`${bandEvents.vipRemainingInventory} >= ${quantity}`
                )
              )
              .returning()
          : await db
              .update(bandEvents)
              .set({
                remainingInventory: sql`${bandEvents.remainingInventory} - ${quantity}`,
                status: sql`CASE WHEN (${bandEvents.remainingInventory} - ${quantity}) <= 0 AND (NOT ${bandEvents.vipEnabled} OR ${bandEvents.vipRemainingInventory} <= 0) THEN 'sold_out' ELSE ${bandEvents.status} END`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(bandEvents.id, event.id),
                  sql`${bandEvents.remainingInventory} >= ${quantity}`
                )
              )
              .returning()

      if (!updatedEvent) {
        return { success: false, error: "Tickets sold out while processing. Please try again." }
      }

      const [order] = await db
        .insert(bandTicketOrders)
        .values({
          eventId: event.id,
          bandId: band?.id || null,
          buyerUserId: resolvedBuyerUserId,
          buyerEmail: input.buyerEmail.trim().toLowerCase(),
          buyerName: input.buyerName.trim(),
          ticketTier: tier,
          quantity,
          unitPriceCents: 0,
          totalCents: 0,
          platformFeeCents: 0,
          status: "paid",
        })
        .returning()

      const instancesToInsert = []
      const baseNum = existingIssued || 0
      for (let i = 0; i < quantity; i++) {
        instancesToInsert.push({
          orderId: order.id,
          eventId: event.id,
          bandId: band?.id || null,
          ticketNumber: baseNum + i + 1,
          ticketTier: tier,
          qrToken: crypto.randomUUID(),
          holderName: input.buyerName.trim(),
          holderEmail: input.buyerEmail.trim().toLowerCase(),
          status: "valid" as const,
        })
      }

      const createdInstances = await db.insert(bandTicketInstances).values(instancesToInsert).returning()

      await sendTicketConfirmationEmail({
        to: input.buyerEmail.trim().toLowerCase(),
        buyerName: input.buyerName.trim(),
        bandName: organizerLabel,
        eventTitle: event.title,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        eventDate: event.eventDate,
        doorsOpenTime: event.doorsOpenTime,
        startTime: event.startTime,
        totalCents: 0,
        ticketTier: tier,
        vipTableBarService: event.vipTableBarService,
        vipFoodService: event.vipFoodService,
        vipPerksNote: event.vipPerksNote,
        tickets: createdInstances.map((t) => ({
          ticketNumber: t.ticketNumber,
          qrToken: t.qrToken,
        })),
      })

      if (band?.slug) revalidatePath(`/bands/${band.slug}`)
      revalidatePath(`/events/${event.id}`)
      revalidatePath("/tickets")
      revalidatePath("/portal")

      return {
        success: true,
        free: true,
        redirectUrl: `/tickets/${createdInstances[0].qrToken}?purchased=1`,
        firstToken: createdInstances[0].qrToken,
      }
    }

    // PAID STRIPE CHECKOUT FLOW
    const [pendingOrder] = await db
      .insert(bandTicketOrders)
      .values({
        eventId: event.id,
        bandId: band?.id || null,
        buyerUserId: resolvedBuyerUserId,
        buyerEmail: input.buyerEmail.trim().toLowerCase(),
        buyerName: input.buyerName.trim(),
        ticketTier: tier,
        quantity,
        unitPriceCents,
        totalCents,
        platformFeeCents,
        status: "pending",
      })
      .returning()

    const vipPerksSummary =
      tier === "vip"
        ? ` • Includes ${[
            event.vipTableBarService ? "Table Bar Service" : "",
            event.vipFoodService ? "Food Service" : "",
          ]
            .filter(Boolean)
            .join(" & ")}`
        : ""

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(input.paymentOption === "google_pay" ? {} : { payment_method_types: ["card"] }),
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: unitPriceCents,
            product_data: {
              name:
                tier === "vip"
                  ? `★ VIP Table Pass: ${organizerLabel} - ${event.title}`
                  : `Ticket: ${organizerLabel} - ${event.title}`,
              description: `${event.venueName} • ${new Date(event.eventDate).toLocaleDateString("en-US", {
                timeZone: "America/Chicago",
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })} at ${event.startTime || "8:00 PM"}${vipPerksSummary}`,
              images: event.flyerUrl ? [event.flyerUrl] : undefined,
            },
          },
        },
      ],
      customer_email: input.buyerEmail.trim().toLowerCase(),
      metadata: {
        order_id: pendingOrder.id,
        event_id: event.id,
        band_id: band?.id || "",
        ticket_tier: tier,
        quantity: String(quantity),
        buyer_name: input.buyerName.trim(),
        buyer_email: input.buyerEmail.trim().toLowerCase(),
      },
      payment_intent_data: {
        metadata: {
          order_id: pendingOrder.id,
          event_id: event.id,
          band_id: band?.id || "",
          ticket_tier: tier,
          buyer_name: input.buyerName.trim(),
        },
      },
      success_url: `${baseUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/${event.id}?ticket_cancelled=1`,
    })

    await db
      .update(bandTicketOrders)
      .set({ stripeSessionId: session.id })
      .where(eq(bandTicketOrders.id, pendingOrder.id))

    return {
      success: true,
      free: false,
      checkoutUrl: session.url,
      sessionId: session.id,
    }
  } catch (err: any) {
    console.error("createTicketCheckoutSession error:", err)
    return { success: false, error: err?.message || "Failed to start ticket checkout" }
  }
}

/** Verify paid checkout session and fulfill the tickets atomically */
export async function verifyAndFulfillTicketOrder(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return { success: false, error: "Payment not completed or still processing" }
    }

    const orderId = session.metadata?.order_id
    if (!orderId) return { success: false, error: "Order ID missing from session" }

    const [order] = await db
      .select()
      .from(bandTicketOrders)
      .where(eq(bandTicketOrders.id, orderId))
      .limit(1)

    if (!order) return { success: false, error: "Order record not found" }

    if (order.status === "paid") {
      const instances = await db
        .select()
        .from(bandTicketInstances)
        .where(eq(bandTicketInstances.orderId, order.id))

      return {
        success: true,
        alreadyFulfilled: true,
        tickets: instances,
        firstToken: instances[0]?.qrToken,
      }
    }

    const tier: "general" | "vip" = order.ticketTier === "vip" ? "vip" : "general"

    const [{ count: existingIssued }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bandTicketInstances)
      .where(eq(bandTicketInstances.eventId, order.eventId))

    // Atomically decrement the appropriate inventory pool
    const [event] =
      tier === "vip"
        ? await db
            .update(bandEvents)
            .set({
              vipRemainingInventory: sql`GREATEST(0, ${bandEvents.vipRemainingInventory} - ${order.quantity})`,
              status: sql`CASE WHEN (${bandEvents.vipRemainingInventory} - ${order.quantity}) <= 0 AND ${bandEvents.remainingInventory} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
              updatedAt: new Date(),
            })
            .where(eq(bandEvents.id, order.eventId))
            .returning()
        : await db
            .update(bandEvents)
            .set({
              remainingInventory: sql`GREATEST(0, ${bandEvents.remainingInventory} - ${order.quantity})`,
              status: sql`CASE WHEN (${bandEvents.remainingInventory} - ${order.quantity}) <= 0 AND (NOT ${bandEvents.vipEnabled} OR ${bandEvents.vipRemainingInventory} <= 0) THEN 'sold_out' ELSE ${bandEvents.status} END`,
              updatedAt: new Date(),
            })
            .where(eq(bandEvents.id, order.eventId))
            .returning()

    await db
      .update(bandTicketOrders)
      .set({
        status: "paid",
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        updatedAt: new Date(),
      })
      .where(eq(bandTicketOrders.id, order.id))

    const instancesToInsert = []
    const baseNum = existingIssued || 0
    for (let i = 0; i < order.quantity; i++) {
      instancesToInsert.push({
        orderId: order.id,
        eventId: order.eventId,
        bandId: order.bandId,
        ticketNumber: baseNum + i + 1,
        ticketTier: tier,
        qrToken: crypto.randomUUID(),
        holderName: order.buyerName,
        holderEmail: order.buyerEmail,
        status: "valid" as const,
      })
    }

    const createdInstances = await db.insert(bandTicketInstances).values(instancesToInsert).returning()

    if (event) {
      const band = order.bandId
        ? (await db.select().from(bands).where(eq(bands.id, order.bandId)).limit(1))[0] || null
        : null
      await sendTicketConfirmationEmail({
        to: order.buyerEmail,
        buyerName: order.buyerName,
        bandName: band?.name || event.organizerName || "StarCast Event",
        eventTitle: event.title,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        eventDate: event.eventDate,
        doorsOpenTime: event.doorsOpenTime,
        startTime: event.startTime,
        totalCents: order.totalCents,
        ticketTier: tier,
        vipTableBarService: event.vipTableBarService,
        vipFoodService: event.vipFoodService,
        vipPerksNote: event.vipPerksNote,
        tickets: createdInstances.map((t) => ({
          ticketNumber: t.ticketNumber,
          qrToken: t.qrToken,
        })),
      })
    }

    return {
      success: true,
      tickets: createdInstances,
      firstToken: createdInstances[0]?.qrToken,
    }
  } catch (err: any) {
    console.error("verifyAndFulfillTicketOrder error:", err)
    return { success: false, error: err?.message || "Failed to verify ticket purchase" }
  }
}

/**
 * Direct 1-tap Google Pay API (`google.payments.api.PaymentsClient`) server fulfillment:
 * Confirms a Stripe PaymentIntent using the Google Pay gateway card token (`tok_...`)
 * and atomically issues the buyer's QR tickets.
 */
export async function completeGooglePayTicketPurchase(input: {
  eventId: string
  ticketTier?: "general" | "vip"
  quantity: number
  buyerName: string
  buyerEmail: string
  buyerUserId?: string
  stripeTokenId: string
}) {
  try {
    const quantity = Math.max(1, Math.min(10, input.quantity || 1))
    const tier: "general" | "vip" = input.ticketTier === "vip" ? "vip" : "general"

    if (!input.stripeTokenId?.trim()) {
      return { success: false, error: "Missing Google Pay payment token." }
    }
    if (!input.buyerEmail?.trim() || !input.buyerEmail.includes("@")) {
      return { success: false, error: "A valid email address is required for ticket delivery." }
    }

    const [event] = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.id, input.eventId))
      .limit(1)

    if (!event) return { success: false, error: "Event not found." }
    if (event.status !== "active") {
      return { success: false, error: "This event is no longer active for ticket sales." }
    }
    if (tier === "vip" && !event.vipEnabled) {
      return { success: false, error: "VIP passes are not available for this event." }
    }

    const availablePool = tier === "vip" ? event.vipRemainingInventory : event.remainingInventory
    if (availablePool < quantity) {
      return {
        success: false,
        error:
          availablePool <= 0
            ? "Sorry, tickets just sold out!"
            : `Only ${availablePool} ticket(s) remaining!`,
      }
    }

    const unitPriceCents = tier === "vip" ? event.vipPriceCents || 0 : event.priceCents || 0
    const totalCents = unitPriceCents * quantity
    const platformFeeCents = totalCents > 0 ? Math.round(totalCents * 0.1) : 0

    const band = event.bandId
      ? (await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1))[0] || null
      : null
    const organizerLabel = band?.name || event.organizerName || "StarCast Event"

    const authSession = await auth.api.getSession({ headers: await headers() }).catch(() => null)
    const resolvedBuyerUserId = input.buyerUserId || authSession?.user?.id || null
    const cleanName = input.buyerName?.trim() || "Ticket Holder"
    const cleanEmail = input.buyerEmail.trim().toLowerCase()

    // Confirm charge via Stripe PaymentIntent using the Google Pay gateway token
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      payment_method_data: {
        type: "card",
        card: {
          token: input.stripeTokenId.trim(),
        },
      } as any,
      receipt_email: cleanEmail,
      description: `${tier === "vip" ? "VIP Table Pass" : "Ticket"} (Google Pay): ${organizerLabel} - ${event.title}`,
      metadata: {
        event_id: event.id,
        band_id: band?.id || "",
        ticket_tier: tier,
        quantity: String(quantity),
        buyer_name: cleanName,
        buyer_email: cleanEmail,
        wallet: "google_pay_api",
      },
    })

    if (paymentIntent.status !== "succeeded") {
      return {
        success: false,
        error: `Google Pay charge requires additional verification (${paymentIntent.status}). Please use standard checkout below.`,
      }
    }

    const [{ count: existingIssued }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bandTicketInstances)
      .where(eq(bandTicketInstances.eventId, event.id))

    const [updatedEvent] =
      tier === "vip"
        ? await db
            .update(bandEvents)
            .set({
              vipRemainingInventory: sql`GREATEST(0, ${bandEvents.vipRemainingInventory} - ${quantity})`,
              status: sql`CASE WHEN (${bandEvents.vipRemainingInventory} - ${quantity}) <= 0 AND ${bandEvents.remainingInventory} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
              updatedAt: new Date(),
            })
            .where(eq(bandEvents.id, event.id))
            .returning()
        : await db
            .update(bandEvents)
            .set({
              remainingInventory: sql`GREATEST(0, ${bandEvents.remainingInventory} - ${quantity})`,
              status: sql`CASE WHEN (${bandEvents.remainingInventory} - ${quantity}) <= 0 AND (NOT ${bandEvents.vipEnabled} OR ${bandEvents.vipRemainingInventory} <= 0) THEN 'sold_out' ELSE ${bandEvents.status} END`,
              updatedAt: new Date(),
            })
            .where(eq(bandEvents.id, event.id))
            .returning()

    const [order] = await db
      .insert(bandTicketOrders)
      .values({
        eventId: event.id,
        bandId: band?.id || null,
        buyerUserId: resolvedBuyerUserId,
        buyerEmail: cleanEmail,
        buyerName: cleanName,
        ticketTier: tier,
        quantity,
        unitPriceCents,
        totalCents,
        platformFeeCents,
        stripeSessionId: "google-pay-api",
        stripePaymentIntentId: paymentIntent.id,
        status: "paid",
      })
      .returning()

    const baseNum = existingIssued || 0
    const instancesToInsert = []
    for (let i = 0; i < quantity; i++) {
      instancesToInsert.push({
        orderId: order.id,
        eventId: event.id,
        bandId: band?.id || null,
        ticketNumber: baseNum + i + 1,
        ticketTier: tier,
        qrToken: crypto.randomUUID(),
        holderName: cleanName,
        holderEmail: cleanEmail,
        status: "valid" as const,
      })
    }

    const createdInstances = await db.insert(bandTicketInstances).values(instancesToInsert).returning()

    await sendTicketConfirmationEmail({
      to: cleanEmail,
      buyerName: cleanName,
      bandName: organizerLabel,
      eventTitle: (updatedEvent || event).title,
      venueName: (updatedEvent || event).venueName,
      venueAddress: (updatedEvent || event).venueAddress,
      eventDate: (updatedEvent || event).eventDate,
      doorsOpenTime: (updatedEvent || event).doorsOpenTime,
      startTime: (updatedEvent || event).startTime,
      totalCents,
      ticketTier: tier,
      vipTableBarService: (updatedEvent || event).vipTableBarService,
      vipFoodService: (updatedEvent || event).vipFoodService,
      vipPerksNote: (updatedEvent || event).vipPerksNote,
      tickets: createdInstances.map((t) => ({
        ticketNumber: t.ticketNumber,
        qrToken: t.qrToken,
      })),
    })

    if (band?.slug) revalidatePath(`/bands/${band.slug}`)
    revalidatePath(`/events/${event.id}`)
    revalidatePath("/tickets")
    revalidatePath("/tickets/seller-central")

    return {
      success: true,
      redirectUrl: `/tickets/${createdInstances[0].qrToken}?purchased=1`,
      firstToken: createdInstances[0].qrToken,
    }
  } catch (err: any) {
    console.error("completeGooglePayTicketPurchase error:", err)
    return {
      success: false,
      error: err?.message || "Failed to process Google Pay payment.",
    }
  }
}
