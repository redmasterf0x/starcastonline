"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyAndFulfillTicketOrder } from "@/app/actions/ticket-purchase"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export function TicketSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      router.replace("/tickets")
      return
    }
    if (startedRef.current) return
    startedRef.current = true

    let active = true
    verifyAndFulfillTicketOrder(sessionId)
      .then((result) => {
        if (!active) return
        if (result.success && result.firstToken) {
          router.replace(`/tickets/${result.firstToken}?purchased=1`)
        } else {
          setError(
            result.error ||
              "We could not immediately verify your ticket order. Please check your email or the Tickets page."
          )
        }
      })
      .catch((err: any) => {
        if (!active) return
        setError(
          err?.message ||
            "We could not immediately verify your ticket order. Please check your email or the Tickets page."
        )
      })

    return () => {
      active = false
    }
  }, [sessionId, router])

  if (error) {
    return (
      <div className="public-shell min-h-screen text-[#f5f7ff] flex flex-col justify-between">
        <ResponsiveHeader />
        <main className="public-container public-section py-20 flex flex-col items-center text-center">
          <div className="public-panel max-w-lg p-8 rounded-2xl border border-red-500/40 bg-[#0c0c3f]/80 space-y-4">
            <h1 className="text-2xl font-bold text-red-400">Order Verification</h1>
            <p className="text-[#9a9fc4] text-sm">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl">
                <Link href="/tickets">View My Tickets</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05051f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ea6f2a 0%, #20efe0 60%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300 max-w-sm">
        {/* Cosmic Reactor Orbital Ring */}
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
          <div
            className="w-full h-full rounded-full border border-dashed border-[#ea6f2a]/60 animate-spin absolute inset-0"
            style={{ animationDuration: "6s" }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#ea6f2a] shadow-[0_0_12px_#ea6f2a] absolute -top-1.5 left-1/2 -translate-x-1/2 border border-white" />
          </div>
          <div className="w-24 h-24 rounded-full bg-[#ea6f2a]/20 animate-ping absolute inset-0 m-auto" />
          <div className="w-24 h-24 rounded-full border-2 border-[#ea6f2a]/40 absolute inset-0 m-auto" />
          <div className="relative z-10 w-6 h-6 rounded-full bg-[#ea6f2a] border-2 border-white/90 shadow-[0_0_24px_#ea6f2a] animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-extrabold text-[#f5f7ff] tracking-tight">
            Generating Your QR Ticket...
          </p>
          <p className="text-xs text-[#9a9fc4]">
            Confirming your payment and emailing your pass. Please wait a moment.
          </p>
        </div>

        {/* Bouncing Cosmic Energy Nodes */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}
