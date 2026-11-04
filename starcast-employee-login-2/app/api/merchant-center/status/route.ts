import { NextResponse } from "next/server"
import { getShopifyProducts, getShopifyStoreDomain } from "@/lib/shopify"

export const dynamic = "force-dynamic"

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://starcast.online"
  const shopifyDomain = getShopifyStoreDomain()

  try {
    const products = await getShopifyProducts()

    return NextResponse.json({
      status: "ready",
      merchantCenter: {
        feedUrl: `${siteUrl}/google-merchant-feed.xml`,
        alternateFeedUrl: `${siteUrl}/api/merchant-center/feed`,
        format: "RSS 2.0 / Google Merchant Center XML (xmlns:g)",
        productsCount: products.length,
        brand: "StarCast Supply Co.",
        targetMarket: "US",
        currency: "USD",
        shopifyDomain,
      },
      verification: {
        metaMethod: "GOOGLE_SITE_VERIFICATION environment variable",
        fileMethod: `${siteUrl}/google[code].html (automatically handled)`,
      },
      youtubeShoppingSetup: [
        "1. In Google Merchant Center, verify and claim domain 'https://starcast.online'.",
        "2. Go to 'Data sources' > Add Product Data > 'Add products from a file' > 'Scheduled fetch'.",
        `3. Set File URL to: ${siteUrl}/google-merchant-feed.xml`,
        "4. In YouTube Studio > Earn > Shopping > Click 'Connect Store' and link your Google Merchant Center ID.",
        "5. Products will automatically tag and display beneath videos, livestreams, and the channel Store tab.",
      ],
      sampleProducts: products.slice(0, 3).map((p) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        price: p.price,
        category: p.category,
        availableForSale: p.availableForSale,
        variantsCount: p.variantsCount,
        productUrl: `${siteUrl}/merch/${p.handle}`,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to load merchandise products for Merchant Center feed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
