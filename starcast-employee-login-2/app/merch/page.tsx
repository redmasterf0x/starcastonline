import { Metadata } from "next"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { getPrintifyProducts, getPrintifyShops } from "@/lib/printify"
import { MerchClient } from "./merch-client"

export const metadata: Metadata = {
  title: "Merchandise & Supply Co. | StarCast Online",
  description:
    "Official StarCast broadcast apparel, custom varsity jackets, snapback caps, mission tees, and cosmic gear. Shipped directly from StarCast Supply Company.",
  openGraph: {
    title: "StarCast Supply Co. | Official Merchandise & Gear",
    description:
      "Official StarCast broadcast apparel, custom varsity jackets, snapback caps, mission tees, and cosmic gear.",
    url: "https://starcast.online/merch",
    siteName: "StarCast Online",
    type: "website",
  },
}

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

export default async function MerchPage() {
  const [products, shops] = await Promise.all([
    getPrintifyProducts(),
    getPrintifyShops().catch(() => []),
  ])

  const shopTitle = shops.find((s) => String(s.id) === "17404247")?.title || "StarCast Supply Company"

  return (
    <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f]">
      <div className="relative z-10">
        <ResponsiveHeader currentPage="/merch" />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-16">
          <MerchClient initialProducts={products} shopTitle={shopTitle} />
        </main>

        <Footer />
      </div>
    </div>
  )
}
