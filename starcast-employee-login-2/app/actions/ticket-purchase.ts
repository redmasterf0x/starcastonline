"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { bandEvents, bands, bandTicketOrders, bandTicketInstances } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://starcast.online"

export type BuyTicketInput = {
  eventId: string
  quantity: number
  buyerName: string
  buyerEmail: string
  buyerUserId?: string
}

export async function createTicketCheckoutSession(input: BuyTicketInput) {
  try {
    const quantity = Math.max(1, Math.min(10, input.quantity || 1))
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

    if (event.remainingInventory < quantity) {
      return {
        success: false,
        error:
          event.remainingInventory <= 0
            ? "Sorry, this event is completely sold out!"
            : `Only ${event.remainingInventory} tickets left!`,
      }
    }

    const [band] = await db.select().from(bands).where(eq(bands.id, event.bandId)).limit(1)
    if (!band) return { success: false, error: "Band not found" }

    const unitPriceCents = event.priceCents || 0
    const totalCents = unitPriceCents * quantity
    // Optional standard StarCast fee: 0 for now or configurable
    const platformFeeCents = 0

    // FREE TICKET FLOW
    if (totalCents === 0) {
      // Decrement inventory atomically
      const [updatedEvent] = await db
        .update(bandEvents)
        .set({
          remainingInventory: sql`${bandEvents.remainingInventory} - ${quantity}`,
          status: sql`CASE WHEN ${bandEvents.remainingInventory} - ${quantity} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
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

      // Create Order
      const [order] = await db
        .insert(bandTicketOrders)
        .values({
          eventId: event.id,
          bandId: band.id,
          buyerUserId: input.buyerUserId || null,
          buyerEmail: input.buyerEmail.trim().toLowerCase(),
          buyerName: input.buyerName.trim(),
          quantity,
          unitPriceCents: 0,
          totalCents: 0,
          platformFeeCents: 0,
          status: "paid",
        })
        .returning()

      // Create Ticket Instances
      const instancesToInsert = []
      const currentSold = event.totalInventory - event.remainingInventory
      for (let i = 0; i < quantity; i++) {
        instancesToInsert.push({
          orderId: order.id,
          eventId: event.id,
          bandId: band.id,
          ticketNumber: currentSold + i + 1,
          qrToken: crypto.randomUUID(),
          holderName: input.buyerName.trim(),
          holderEmail: input.buyerEmail.trim().toLowerCase(),
          status: "valid" as const,
        })
      }

      const createdInstances = await db.insert(bandTicketInstances).values(instancesToInsert).returning()

      revalidatePath(`/bands/${band.slug}`)
      revalidatePath("/portal")

      return {
        success: true,
        free: true,
        redirectUrl: `/tickets/${createdInstances[0].qrToken}`,
        firstToken: createdInstances[0].qrToken,
      }
    }

    // PAID STRIPE CHECKOUT FLOW
    const [pendingOrder] = await db
      .insert(bandTicketOrders)
      .values({
        eventId: event.id,
        bandId: band.id,
        buyerUserId: input.buyerUserId || null,
        buyerEmail: input.buyerEmail.trim().toLowerCase(),
        buyerName: input.buyerName.trim(),
        quantity,
        unitPriceCents,
        totalCents,
        platformFeeCents,
        status: "pending",
      })
      .returning()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: unitPriceCents,
            product_data: {
              name: `Ticket: ${band.name} - ${event.title}`,
              description: `${event.venueName} • ${new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })} at ${event.startTime || "8:00 PM"}`,
              images: event.flyerUrl ? [event.flyerUrl] : undefined,
            },
          },
        },
      ],
      customer_email: input.buyerEmail.trim().toLowerCase(),
      metadata: {
        order_id: pendingOrder.id,
        event_id: event.id,
        band_id: band.id,
        quantity: String(quantity),
        buyer_name: input.buyerName.trim(),
        buyer_email: input.buyerEmail.trim().toLowerCase(),
      },
      payment_intent_data: {
        metadata: {
          order_id: pendingOrder.id,
          event_id: event.id,
          band_id: band.id,
          buyer_name: input.buyerName.trim(),
        },
      },
      success_url: `${baseUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/bands/${band.slug || band.id}?ticket_cancelled=1`,
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

    // If already fulfilled, return existing ticket instance
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

    // Atomically decrement inventory
    const [event] = await db
      .update(bandEvents)
      .set({
        remainingInventory: sql`GREATEST(0, ${bandEvents.remainingInventory} - ${order.quantity})`,
        status: sql`CASE WHEN ${bandEvents.remainingInventory} - ${order.quantity} <= 0 THEN 'sold_out' ELSE ${bandEvents.status} END`,
        updatedAt: new Date(),
      })
      .where(eq(bandEvents.id, order.eventId))
      .returning()

    // Mark order paid
    await db
      .update(bandTicketOrders)
      .set({
        status: "paid",
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        updatedAt: new Date(),
      })
      .where(eq(bandTicketOrders.id, order.id))

    // Generate ticket instances with unique QR tokens
    const instancesToInsert = []
    const startNum = event ? (event.totalInventory - event.remainingInventory - order.quantity + 1) : 1
    for (let i = 0; i < order.quantity; i++) {
      instancesToInsert.push({
        orderId: order.id,
        eventId: order.eventId,
        bandId: order.bandId,
        ticketNumber: Math.max(1, startNum + i),
        qrToken: crypto.randomUUID(),
        holderName: order.buyerName,
        holderEmail: order.buyerEmail,
        status: "valid" as const,
      })
    }

    const createdInstances = await db.insert(bandTicketInstances).values(instancesToInsert).returning()

    revalidatePath("/portal")
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
