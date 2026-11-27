"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getGooglePayClientConfig,
  completeGooglePayTicketPurchase,
  createTicketCheckoutSession,
} from "@/app/actions/ticket-purchase"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    google?: {
      payments?: {
        api?: {
          PaymentsClient: new (options: {
            environment: "TEST" | "PRODUCTION"
          }) => {
            isReadyToPay: (req: unknown) => Promise<{ result: boolean }>
            loadPaymentData: (req: unknown) => Promise<any>
          }
        }
      }
    }
  }
}

interface GooglePayTicketButtonProps {
  eventId: string
  eventTitle: string
  ticketTier: "general" | "vip"
  quantity: number
  totalCents: number
  buyerName: string
  buyerEmail: string
  buyerUserId?: string
  disabled?: boolean
  onError: (msg: string) => void
  onPopulateBuyer?: (info: { name?: string; email?: string }) => void
}

let googlePayScriptPromise: Promise<boolean> | null = null

function loadGooglePayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.google?.payments?.api?.PaymentsClient) return Promise.resolve(true)
  if (googlePayScriptPromise) return googlePayScriptPromise

  googlePayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://pay.google.com/gp/p/js/pay.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(true))
      existing.addEventListener("error", () => resolve(false))
      return
    }
    const script = document.createElement("script")
    script.src = "https://pay.google.com/gp/p/js/pay.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })

  return googlePayScriptPromise
}

export function GooglePayTicketButton({
  eventId,
  eventTitle,
  ticketTier,
  quantity,
  totalCents,
  buyerName,
  buyerEmail,
  buyerUserId,
  disabled = false,
  onError,
  onPopulateBuyer,
}: GooglePayTicketButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [directApiReady, setDirectApiReady] = useState(false)
  const [gpayConfig, setGpayConfig] = useState<{
    stripePublishableKey: string | null
    googlePayMerchantId: string | null
    environment: "TEST" | "PRODUCTION"
    merchantName: string
  } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [cfg, scriptLoaded] = await Promise.all([
          getGooglePayClientConfig(),
          loadGooglePayScript(),
        ])
        if (!mounted) return
        setGpayConfig(cfg)

        // Direct Google Pay JS API requires Stripe publishable key, and in PRODUCTION a Google Pay Merchant ID
        const canUseDirectSheet =
          scriptLoaded &&
          Boolean(cfg.stripePublishableKey) &&
          (cfg.environment === "TEST" || Boolean(cfg.googlePayMerchantId))

        if (canUseDirectSheet && window.google?.payments?.api?.PaymentsClient) {
          const client = new window.google.payments.api.PaymentsClient({
            environment: cfg.environment,
          })
          const ready = await client.isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
              {
                type: "CARD",
                parameters: {
                  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                  allowedCardNetworks: ["AMEX", "DISCOVER", "MASTERCARD", "VISA"],
                },
              },
            ],
          })
          if (mounted && ready.result) {
            setDirectApiReady(true)
          }
        }
      } catch {
        // Fallback to Stripe Checkout w/ Google Pay enabled
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleGooglePayClick() {
    if (busy || disabled || totalCents <= 0) return
    onError("")

    // Path 1: Direct 1-tap Google Pay JS API (`google.payments.api.PaymentsClient`) tokenized to Stripe
    if (
      directApiReady &&
      gpayConfig?.stripePublishableKey &&
      window.google?.payments?.api?.PaymentsClient
    ) {
      setBusy(true)
      try {
        const client = new window.google.payments.api.PaymentsClient({
          environment: gpayConfig.environment,
        })

        const paymentDataRequest: Record<string, unknown> = {
          apiVersion: 2,
          apiVersionMinor: 0,
          emailRequired: true,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["AMEX", "DISCOVER", "MASTERCARD", "VISA"],
                billingAddressRequired: true,
                billingAddressParameters: {
                  format: "MIN",
                },
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "stripe",
                  "stripe:version": "2020-08-27",
                  "stripe:publishableKey": gpayConfig.stripePublishableKey,
                },
              },
            },
          ],
          merchantInfo: {
            ...(gpayConfig.googlePayMerchantId
              ? { merchantId: gpayConfig.googlePayMerchantId }
              : {}),
            merchantName: gpayConfig.merchantName,
          },
          transactionInfo: {
            totalPriceStatus: "FINAL",
            totalPriceLabel: `${quantity}x ${ticketTier === "vip" ? "VIP " : ""}${eventTitle}`,
            totalPrice: (totalCents / 100).toFixed(2),
            currencyCode: "USD",
            countryCode: "US",
          },
        }

        const paymentData = await client.loadPaymentData(paymentDataRequest)
        const rawToken = paymentData?.paymentMethodData?.tokenizationData?.token
        const parsedToken =
          typeof rawToken === "string" && rawToken.trim().startsWith("{")
            ? JSON.parse(rawToken)
            : { id: rawToken }
        const stripeTokenId: string | undefined = parsedToken?.id

        if (!stripeTokenId) {
          throw new Error("Google Pay did not return a payment token.")
        }

        const walletEmail: string =
          buyerEmail.trim() || paymentData?.email || ""
        const walletName: string =
          buyerName.trim() ||
          paymentData?.paymentMethodData?.info?.billingAddress?.name ||
          "Ticket Holder"

        onPopulateBuyer?.({ name: walletName, email: walletEmail })

        const res = await completeGooglePayTicketPurchase({
          eventId,
          ticketTier,
          quantity,
          buyerName: walletName,
          buyerEmail: walletEmail,
          buyerUserId,
          stripeTokenId,
        })

        if (!res.success || !res.redirectUrl) {
          onError(res.error || "Google Pay payment could not be completed.")
          setBusy(false)
          return
        }

        router.push(res.redirectUrl)
        return
      } catch (err: any) {
        // User closing the Google Pay sheet returns statusCode === "CANCELED"
        if (err?.statusCode === "CANCELED") {
          setBusy(false)
          return
        }
        onError(err?.message || "Google Pay checkout failed.")
        setBusy(false)
        return
      }
    }

    // Path 2: Seamless fallback via Stripe Checkout with Google Pay & Wallet dynamic payment methods enabled
    if (!buyerName.trim()) {
      onError("Please enter your full name below before checking out with Google Pay.")
      const el = document.getElementById("buyer-name")
      el?.focus()
      return
    }
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      onError("Please enter your email address below so we can send your QR pass.")
      const el = document.getElementById("buyer-email")
      el?.focus()
      return
    }

    setBusy(true)
    try {
      const res = await createTicketCheckoutSession({
        eventId,
        ticketTier,
        quantity,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerUserId,
        paymentOption: "google_pay",
      })
      if (!res.success || !res.checkoutUrl) {
        onError(res.error || "Unable to start Google Pay checkout.")
        setBusy(false)
        return
      }
      window.location.href = res.checkoutUrl
    } catch (err: any) {
      onError(err?.message || "Unable to start Google Pay checkout.")
      setBusy(false)
    }
  }

  if (totalCents <= 0) return null

  return (
    <button
      type="button"
      onClick={handleGooglePayClick}
      disabled={disabled || busy}
      aria-label="Buy with Google Pay"
      className="w-full h-12 rounded-xl bg-black hover:bg-[#1a1a1a] active:scale-[0.99] border border-white/25 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {busy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Opening Google Pay...</span>
        </>
      ) : (
        <>
          <span className="text-sm font-medium tracking-tight">Pay with</span>
          {/* Official Google Pay G + Pay mark */}
          <span className="inline-flex items-center gap-1 font-bold text-base tracking-tight">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span className="text-white font-semibold">Pay</span>
          </span>
          <span className="text-white/75 text-xs font-mono ml-0.5">
            &bull; ${(totalCents / 100).toFixed(2)}
          </span>
        </>
      )}
    </button>
  )
}
