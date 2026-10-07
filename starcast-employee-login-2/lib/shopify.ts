export type ShopifyProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: number
  selectedOptions: {
    name: string
    value: string
  }[]
}

export type ShopifyProduct = {
  id: string
  handle: string
  title: string
  description: string
  category: "All" | "T-Shirts" | "Headwear" | "Outerwear" | "Accessories" | "Gear"
  tags: string[]
  images: string[]
  primaryImage: string
  secondaryImage?: string
  price: string
  rawPrice: number
  minPrice: number
  maxPrice: number
  variantsCount: number
  sizes: string[]
  colors: string[]
  checkoutUrl: string
  availableForSale: boolean
  variants: ShopifyProductVariant[]
}

export type ShopifyStoreInfo = {
  name: string
  domain: string
  storeUrl: string
}

function getStoreDomain(): string {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    "wzcs0f-rt.myshopify.com"
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function getStorefrontToken(): string | null {
  return (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    null
  )
}

function getApiVersion(): string {
  return process.env.SHOPIFY_API_VERSION || "2024-10"
}

export function getShopifyStoreUrl(): string {
  if (process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL) {
    return process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL.replace(/\/$/, "")
  }
  return `https://${getStoreDomain()}`
}

function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
}

function categorize(title: string, tags: string[], productType?: string): ShopifyProduct["category"] {
  const combined = `${title} ${tags.join(" ")} ${productType || ""}`.toLowerCase()

  if (combined.match(/\b(hat|cap|trucker|snapback|beanie|headwear|visor)\b/)) {
    return "Headwear"
  }
  if (combined.match(/\b(tee|t-shirt|shirt|tank|long sleeve|short sleeve|jersey)\b/)) {
    return "T-Shirts"
  }
  if (combined.match(/\b(jacket|hoodie|sweatshirt|outerwear|fleece|pullover|coat|varsity|windbreaker)\b/)) {
    return "Outerwear"
  }
  if (combined.match(/\b(necklace|jewelry|ring|bracelet|sticker|bag|backpack|tote|mug|tumbler|bottle|keychain|patch|pin|accessory|accessories)\b/)) {
    return "Accessories"
  }
  return "Gear"
}

// Fallback backup catalog when offline or loading fails
const FALLBACK_STARCAST_PRODUCTS: ShopifyProduct[] = [
  {
    id: "demo-varsity-jacket",
    handle: "starcast-signature-varsity-jacket",
    title: "StarCast Signature Cosmic Varsity Jacket",
    description: "Archival embroidered heavy-blend varsity jacket with metallic silver broadcast patches, ribbed collar and cuffs, and quilted thermal cosmic lining.",
    category: "Outerwear",
    tags: ["outerwear", "jacket", "varsity", "featured", "premium"],
    images: ["/images/spacemanlogo.png"],
    primaryImage: "/images/spacemanlogo.png",
    price: "$89.00",
    rawPrice: 89.0,
    minPrice: 89.0,
    maxPrice: 89.0,
    variantsCount: 4,
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Deep Cosmic Navy / Silver"],
    checkoutUrl: `${getShopifyStoreUrl()}/products/starcast-signature-varsity-jacket`,
    availableForSale: true,
    variants: [
      { id: "v-varsity-s", title: "S", availableForSale: true, price: 89.0, selectedOptions: [{ name: "Size", value: "S" }] },
      { id: "v-varsity-m", title: "M", availableForSale: true, price: 89.0, selectedOptions: [{ name: "Size", value: "M" }] },
      { id: "v-varsity-l", title: "L", availableForSale: true, price: 89.0, selectedOptions: [{ name: "Size", value: "L" }] },
      { id: "v-varsity-xl", title: "XL", availableForSale: true, price: 89.0, selectedOptions: [{ name: "Size", value: "XL" }] },
    ],
  },
  {
    id: "demo-mission-tee",
    handle: "starcast-orbital-broadcast-tee",
    title: "StarCast Orbital Broadcast Heavyweight Tee",
    description: "6.5 oz heavyweight 100% combed ringspun cotton tee featuring high-density gradient solar flare graphics and custom StarCast woven hem label.",
    category: "T-Shirts",
    tags: ["t-shirt", "tee", "orbital", "apparel"],
    images: ["/images/spacemanlogo.png"],
    primaryImage: "/images/spacemanlogo.png",
    price: "$34.00",
    rawPrice: 34.0,
    minPrice: 34.0,
    maxPrice: 34.0,
    variantsCount: 5,
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Obsidian Black", "Solar Flare Orange"],
    checkoutUrl: `${getShopifyStoreUrl()}/products/starcast-orbital-broadcast-tee`,
    availableForSale: true,
    variants: [
      { id: "v-tee-s", title: "S", availableForSale: true, price: 34.0, selectedOptions: [{ name: "Size", value: "S" }] },
      { id: "v-tee-m", title: "M", availableForSale: true, price: 34.0, selectedOptions: [{ name: "Size", value: "M" }] },
      { id: "v-tee-l", title: "L", availableForSale: true, price: 34.0, selectedOptions: [{ name: "Size", value: "L" }] },
      { id: "v-tee-xl", title: "XL", availableForSale: true, price: 34.0, selectedOptions: [{ name: "Size", value: "XL" }] },
    ],
  },
]

export async function getShopifyStoreInfo(): Promise<ShopifyStoreInfo> {
  const domain = getStoreDomain()
  return {
    name: "StarCast Supply",
    domain,
    storeUrl: getShopifyStoreUrl(),
  }
}

/**
 * Fetches products from Shopify's standard public storefront REST endpoint (products.json)
 */
async function fetchProductsFromRest(): Promise<ShopifyProduct[] | null> {
  const domain = getStoreDomain()
  const storeUrl = getShopifyStoreUrl()
  const endpoint = `https://${domain}/products.json?limit=250`

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 180 }, // Revalidate every 3 minutes
      headers: {
        "User-Agent": "StarCast-Storefront/1.0",
      },
    })

    if (!res.ok) {
      console.warn(`Shopify products.json returned ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json()
    if (!data?.products || !Array.isArray(data.products) || data.products.length === 0) {
      return null
    }

    return data.products.map((item: any) => {
      const images: string[] = Array.isArray(item.images)
        ? item.images.map((img: any) => (typeof img === "string" ? img : img.src)).filter(Boolean)
        : []

      const primaryImage = images[0] || item.image?.src || "/images/spacemanlogo.png"
      const secondaryImage = images[1] || undefined

      const variants: ShopifyProductVariant[] = Array.isArray(item.variants)
        ? item.variants.map((v: any) => ({
            id: String(v.id),
            title: v.title || "Default",
            availableForSale: v.available !== false,
            price: parseFloat(v.price || "0"),
            selectedOptions: [
              ...(v.option1 ? [{ name: "Option 1", value: v.option1 }] : []),
              ...(v.option2 ? [{ name: "Option 2", value: v.option2 }] : []),
              ...(v.option3 ? [{ name: "Option 3", value: v.option3 }] : []),
            ],
          }))
        : []

      const prices = variants.map((v) => v.price).filter((p) => p > 0)
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      const formattedPrice =
        minPrice === maxPrice || maxPrice === 0
          ? `$${minPrice.toFixed(2)}`
          : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`

      const tags: string[] = Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === "string"
        ? item.tags.split(",").map((t: string) => t.trim())
        : []

      const category = categorize(item.title || "", tags, item.product_type)

      // Extract unique sizes and colors
      const sizesSet = new Set<string>()
      const colorsSet = new Set<string>()

      if (Array.isArray(item.options)) {
        for (const opt of item.options) {
          const name = (opt.name || "").toLowerCase()
          if (name.includes("size")) {
            opt.values?.forEach((v: any) => sizesSet.add(String(v)))
          } else if (name.includes("color") || name.includes("colour")) {
            opt.values?.forEach((v: any) => colorsSet.add(String(v)))
          }
        }
      }

      // Fallback extraction from variant titles if options empty
      if (sizesSet.size === 0 && variants.length > 0) {
        variants.forEach((v) => {
          if (v.title && v.title !== "Default Title") {
            sizesSet.add(v.title)
          }
        })
      }

      const checkoutUrl = `${storeUrl}/products/${item.handle}`

      return {
        id: String(item.id),
        handle: item.handle,
        title: item.title || "StarCast Product",
        description: stripHtml(item.body_html || ""),
        category,
        tags,
        images: images.length > 0 ? images : [primaryImage],
        primaryImage,
        secondaryImage,
        price: formattedPrice,
        rawPrice: minPrice,
        minPrice,
        maxPrice,
        variantsCount: variants.length,
        sizes: Array.from(sizesSet),
        colors: Array.from(colorsSet),
        checkoutUrl,
        availableForSale: variants.some((v) => v.availableForSale),
        variants,
      }
    })
  } catch (err) {
    console.error("Failed to fetch products from Shopify REST endpoint:", err)
    return null
  }
}

/**
 * Fetches all live products from StarCast's Shopify Store
 */
export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  // 1. Try public Storefront REST catalog (works out-of-the-box)
  const restProducts = await fetchProductsFromRest()
  if (restProducts && restProducts.length > 0) {
    return restProducts
  }

  // 2. Fallback to backup StarCast catalog
  return FALLBACK_STARCAST_PRODUCTS
}
