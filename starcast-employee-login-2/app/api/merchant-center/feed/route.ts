import { NextResponse } from "next/server"
import { getShopifyProducts, type ShopifyProduct } from "@/lib/shopify"

export const dynamic = "force-dynamic"
export const revalidate = 1800 // Revalidate every 30 minutes

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://starcast.online"
const BRAND_NAME = "StarCast Supply Co."

function escapeXml(unsafe: string): string {
  if (!unsafe) return ""
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function cleanDescription(desc: string): string {
  if (!desc) return "Official StarCast Media merchandise and apparel."
  return desc
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function mapGoogleCategory(category: ShopifyProduct["category"]): { id: string; name: string } {
  switch (category) {
    case "T-Shirts":
      return { id: "212", name: "Apparel & Accessories > Clothing > Shirts & Tops" }
    case "Headwear":
      return { id: "173", name: "Apparel & Accessories > Clothing Accessories > Hats" }
    case "Outerwear":
      return { id: "5598", name: "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets" }
    case "Accessories":
      return { id: "167", name: "Apparel & Accessories > Clothing Accessories" }
    default:
      return { id: "1604", name: "Apparel & Accessories > Clothing" }
  }
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return `${SITE_URL}/images/spacemanlogo.png`
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export async function GET() {
  try {
    const products = await getShopifyProducts()

    const itemsXml = products
      .flatMap((product) => {
        const productUrl = `${SITE_URL}/merch/${product.handle}`
        const primaryImg = resolveImageUrl(product.primaryImage)
        const additionalImgs = (product.images || [])
          .filter((img) => img !== product.primaryImage)
          .slice(0, 5)
          .map((img) => resolveImageUrl(img))

        const googleCategory = mapGoogleCategory(product.category)
        const description = cleanDescription(product.description)
        const availability = product.availableForSale ? "in_stock" : "out_of_stock"

        // If product has distinct variants (e.g. sizes or colors), output each variant
        // linked together with <g:item_group_id> so Google Merchant Center understands options.
        if (product.variants && product.variants.length > 1) {
          return product.variants.map((v) => {
            const variantId = v.id.replace(/[^a-zA-Z0-9_-]/g, "") || `${product.handle}-${v.title}`
            const variantPrice = (v.price || product.rawPrice || 0).toFixed(2)
            const currency = v.currencyCode || product.currencyCode || "USD"
            const variantImg = resolveImageUrl(v.image || product.primaryImage)
            const variantAvailability = v.availableForSale ? "in_stock" : "out_of_stock"

            const sizeOpt = v.selectedOptions.find(
              (o) => o.name.toLowerCase().includes("size")
            )?.value
            const colorOpt = v.selectedOptions.find(
              (o) => o.name.toLowerCase().includes("color") || o.name.toLowerCase().includes("colour")
            )?.value

            return `
    <item>
      <g:id>${escapeXml(`${product.handle}-${variantId}`)}</g:id>
      <g:item_group_id>${escapeXml(product.handle)}</g:item_group_id>
      <title><![CDATA[${product.title}${v.title && v.title !== "Default Title" ? ` - ${v.title}` : ""}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(variantImg)}</g:image_link>
      ${additionalImgs.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${variantAvailability}</g:availability>
      <g:price>${variantPrice} ${currency}</g:price>
      <g:brand><![CDATA[${BRAND_NAME}]]></g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${googleCategory.id}</g:google_product_category>
      <g:product_type><![CDATA[StarCast Merch > ${product.category}]]></g:product_type>
      ${sizeOpt ? `<g:size><![CDATA[${sizeOpt}]]></g:size>` : ""}
      ${colorOpt ? `<g:color><![CDATA[${colorOpt}]]></g:color>` : ""}
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
    </item>`
          })
        }

        // Single product without variants
        const price = (product.rawPrice || product.minPrice || 0).toFixed(2)
        const currency = product.currencyCode || "USD"

        return [
          `
    <item>
      <g:id>${escapeXml(product.handle)}</g:id>
      <g:item_group_id>${escapeXml(product.handle)}</g:item_group_id>
      <title><![CDATA[${product.title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(primaryImg)}</g:image_link>
      ${additionalImgs.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${availability}</g:availability>
      <g:price>${price} ${currency}</g:price>
      <g:brand><![CDATA[${BRAND_NAME}]]></g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${googleCategory.id}</g:google_product_category>
      <g:product_type><![CDATA[StarCast Merch > ${product.category}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
    </item>`,
        ]
      })
      .join("")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:c="http://base.google.com/cns/1.0">
  <channel>
    <title>StarCast Supply Co. | Official Merchandise Feed</title>
    <link>${SITE_URL}/merch</link>
    <description>Official merchandise, apparel, caps, and broadcast gear from StarCast Media.</description>
    ${itemsXml}
  </channel>
</rss>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error generating Google Merchant Center feed:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Failed to generate product feed</description></channel></rss>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    )
  }
}

