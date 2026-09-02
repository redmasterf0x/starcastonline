"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { verifySponsorPayment } from "@/app/actions/stripe"
import { CheckCircle, Mail, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SponsorSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [sponsorData, setSponsorData] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      verifySponsorPayment(sessionId).then((result) => {
        if (result.success) {
          setStatus("success")
          setSponsorData(result.sponsor)
        } else {
          setStatus("error")
        }
      })
    } else {
      setStatus("error")
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-[#05052d]">
      <ResponsiveHeader currentPage="/sponsors" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {status === "loading" && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-[#ea6f2a] animate-spin mx-auto mb-4" />
            <p className="text-[#9a9fc4]">Confirming your payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#f5f7ff] mb-4">
              Thank You for Your Sponsorship!
            </h1>

            <p className="text-[#9a9fc4] text-lg mb-8 max-w-lg mx-auto">
              Your payment has been received. We will be in touch at our earliest convenience to discuss next steps.
            </p>

            <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 p-6 mb-8 text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#ea6f2a]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#ea6f2a]" />
                </div>
                <div>
                  <h3 className="text-[#f5f7ff] font-semibold mb-1">Check Your Email</h3>
                  <p className="text-[#9a9fc4] text-sm">
                    We&apos;ve sent a confirmation email to <strong className="text-[#f5f7ff]">{sponsorData?.company_email}</strong> with details about your sponsorship. You&apos;ll also receive a magic link to access your sponsor account.
                  </p>
                </div>
              </div>
            </div>

            {sponsorData && (
              <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 p-6 mb-8 text-left">
                <h3 className="text-[#f5f7ff] font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9a9fc4]">Package</span>
                    <span className="text-[#f5f7ff]">{sponsorData.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9fc4]">Company</span>
                    <span className="text-[#f5f7ff]">{sponsorData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9fc4]">Amount</span>
                    <span className="text-[#ea6f2a] font-semibold">${sponsorData.amount_cents / 100}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-center gap-2 bg-[#20205a] hover:bg-[#2a2a66] text-[#f5f7ff] font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Read Articles
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f5f7ff] mb-4">Something Went Wrong</h1>
            <p className="text-[#9a9fc4] mb-8">
              We couldn&apos;t verify your payment. Please contact us at{" "}
              <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a]">
                starcastlivemedia@gmail.com
              </a>
            </p>
            <Link
              href="/sponsors"
              className="inline-flex items-center justify-center gap-2 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Try Again
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
