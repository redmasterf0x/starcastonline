import type { Metadata } from "next"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  RotateCcw,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Package,
  ShoppingBag,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Return & Refund Policy | StarCast Online Store",
  description:
    "Official StarCast Supply Co. 30-day return and refund policy. Learn about return eligibility, free return shipping labels, damaged item replacements, and refund processing.",
  alternates: {
    canonical: "https://starcast.online/return-policy",
  },
}

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/return-policy" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Navigation Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ffd166]">
          <Link href="/" className="hover:text-[#ea6f2a] transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> StarCast Home
          </Link>
          <span className="text-[#20205a]">/</span>
          <Link href="/merch" className="hover:text-[#ea6f2a] transition-colors inline-flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Merch Store
          </Link>
          <span className="text-[#20205a]">/</span>
          <span className="text-[#20efe0]">Return Policy</span>
        </div>

        {/* Header Hero */}
        <header className="mb-10 pb-8 border-b border-[#20205a]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/40 text-[#ea6f2a] text-xs font-mono uppercase mb-4">
            <RotateCcw className="w-4 h-4" />
            StarCast Supply Co. Customer Guarantee
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7ff] tracking-tight mb-3">
            Store <span className="text-[#ffd166]">Return &amp; Refund</span> Policy
          </h1>
          <p className="text-sm text-[#9a9fc4]">
            Last updated: September 29, 2026 &middot; StarCast Live Media LLC &middot; Topeka, Kansas
          </p>
        </header>

        {/* Highlight Callout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-2xl border border-[#20efe0]/30 bg-[#20efe0]/10 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#20efe0] text-sm">
              <Clock className="w-4 h-4" /> 30-Day Window
            </div>
            <p className="text-xs text-[#dbe0fb]">
              You have 30 days after receiving your item to request a return.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[#ffd166]/30 bg-[#ffd166]/10 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#ffd166] text-sm">
              <Truck className="w-4 h-4" /> Free Return Shipping
            </div>
            <p className="text-xs text-[#dbe0fb]">
              Return shipping is free. Once approved, we provide a prepaid return label.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[#ea6f2a]/30 bg-[#ea6f2a]/10 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#ea6f2a] text-sm">
              <ShieldCheck className="w-4 h-4" /> 100% Direct Refunds
            </div>
            <p className="text-xs text-[#dbe0fb]">
              Approved refunds are credited to your original payment method in 10 business days.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[#c4c7da]">
          {/* Main 30-day intro */}
          <section className="space-y-3">
            <p>
              We have a <strong>30-day return policy</strong>, which means you have 30 days after receiving your item to request a return.
            </p>
            <p>
              To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.
            </p>
          </section>

          {/* How to start a return */}
          <section className="space-y-3 p-5 rounded-2xl bg-[#0c0c3f] border border-[#20205a]">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#20efe0]" /> How to Start a Return
            </h2>
            <p>
              To start a return, you can contact us at{" "}
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="text-[#ffd166] hover:text-[#ea6f2a] underline font-medium font-mono"
              >
                starcastlivemedia@gmail.com
              </a>
              .
            </p>
            <p>
              Please note that returns will need to be sent to the return address provided on your return instructions and prepaid shipping label (StarCast Live Media LLC &middot; Topeka, KS, United States).
            </p>
            <p>
              If your return is accepted, we’ll send you a return shipping label, as well as instructions on how and where to send your package. <strong>Items sent back to us without first requesting a return will not be accepted.</strong>
            </p>
            <p>
              You can always contact us for any return question at{" "}
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="text-[#ffd166] hover:text-[#ea6f2a] underline font-medium font-mono"
              >
                starcastlivemedia@gmail.com
              </a>
              .
            </p>
          </section>

          {/* Damages and issues */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#ea6f2a]" /> Damages and Issues
            </h2>
            <p>
              Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we can evaluate the issue and make it right.
            </p>
          </section>

          {/* Exceptions / Non-returnable items */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" /> Exceptions / Non-Returnable Items
            </h2>
            <p>
              Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              Unfortunately, we cannot accept returns on sale items or gift cards.
            </div>
          </section>

          {/* Exchanges */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#20efe0]" /> Exchanges
            </h2>
            <p>
              The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
            </p>
            <p>
              Contact us at{" "}
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="text-[#ffd166] hover:text-[#ea6f2a] underline font-medium font-mono"
              >
                starcastlivemedia@gmail.com
              </a>{" "}
              to ask about exchange options before returning your item.
            </p>
          </section>

          {/* European Union 14-day cooling off period */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ffd166]" /> European Union 14-Day Cooling Off Period
            </h2>
            <p>
              Notwithstanding the above, if the merchandise is being shipped into the European Union, you have the right to cancel or return your order within 14 days, for any reason and without a justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.
            </p>
            <p>
              To request a return under this right, follow the instructions under How to start a return. To request a cancellation, contact us at{" "}
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="text-[#ffd166] hover:text-[#ea6f2a] underline font-medium font-mono"
              >
                starcastlivemedia@gmail.com
              </a>
              .
            </p>
          </section>

          {/* Refunds */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Refunds
            </h2>
            <p>
              We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method within 10 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.
            </p>
            <p>
              If more than 15 business days have passed since we’ve approved your return, please contact us at{" "}
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="text-[#ffd166] hover:text-[#ea6f2a] underline font-medium font-mono"
              >
                starcastlivemedia@gmail.com
              </a>
              .
            </p>
          </section>

          {/* Summary Return Terms Table / Breakdown */}
          <section className="mt-12 pt-8 border-t border-[#20205a] space-y-4">
            <h2 className="text-2xl font-black text-[#f5f7ff] tracking-tight">Return Terms Summary</h2>
            <p className="text-sm text-[#9a9fc4]">
              Return eligibility, timing, shipping, and fees may depend on where your order was delivered and the items in your order. Review the terms that apply to your purchase below:
            </p>

            <div className="overflow-hidden rounded-2xl border border-[#20205a] bg-[#0c0c3f]/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#20205a]">
                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#20efe0] font-mono">
                    Orders delivered to all locations
                  </h3>
                  <ul className="text-sm space-y-2 text-[#c4c7da]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ea6f2a] font-bold">&bull;</span>
                      <span>You may request a return within <strong>30 days</strong> after the item is delivered.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ea6f2a] font-bold">&bull;</span>
                      <span><strong>Return shipping is free</strong>, and we will provide a return label.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#ffd166] font-mono">
                    Return Eligibility Requirements
                  </h3>
                  <p className="text-sm text-[#c4c7da]">
                    Where returns are accepted under the terms above, items must be returned in the same condition in which they were received, unworn or unused, with tags, and in their original packaging. You will also need the receipt or proof of purchase.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Box */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0c3f] to-[#05052d] border border-[#20205a] space-y-3 mt-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#ea6f2a]" /> Have questions about a return?
            </h3>
            <p className="text-sm text-[#9a9fc4]">
              Our support team is ready to assist you with sizing, exchanges, or returns. Reach out directly with your order number.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="mailto:starcastlivemedia@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea6f2a] hover:bg-[#d05d1d] text-white font-bold text-sm transition-colors shadow-lg shadow-[#ea6f2a]/20"
              >
                <Mail className="w-4 h-4" /> Email starcastlivemedia@gmail.com
              </a>
              <Link
                href="/merch"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#20205a] hover:border-white/40 text-[#c4c7da] hover:text-white text-sm transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Back to Store
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

