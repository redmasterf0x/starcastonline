export type PrintifyProduct = {
  id: string
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
  visible: boolean
}

export type PrintifyShop = {
  id: number
  title: string
  sales_channel?: string
}

function getApiToken(): string | null {
  return (
    process.env.PRINTIFY_API_TOKEN ||
    process.env.PRINTIFY_TOKEN ||
    process.env.PRINTIFY_API_KEY ||
    null
  )
}

function getShopId(): string {
  return process.env.PRINTIFY_SHOP_ID || "17404247" // Default: StarCast Supply Company
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

function categorize(title: string, tags: string[]): PrintifyProduct["category"] {
  const combined = `${title} ${tags.join(" ")}`.toLowerCase()

  if (combined.match(/\b(hat|cap|trucker|snapback|beanie|headwear)\b/)) {
    return "Headwear"
  }
  if (combined.match(/\b(tee|t-shirt|shirt|tank|long sleeve|short sleeve)\b/)) {
    return "T-Shirts"
  }
  if (combined.match(/\b(jacket|hoodie|sweatshirt|outerwear|fleece|pullover|coat|varsity)\b/)) {
    return "Outerwear"
  }
  if (combined.match(/\b(necklace|jewelry|ring|bracelet|sticker|bag|backpack|tote|mug|tumbler|accessory|accessories)\b/)) {
    return "Accessories"
  }
  return "Gear"
}

export async function getPrintifyShops(): Promise<PrintifyShop[]> {
  const token = getApiToken()
  if (!token) return []

  try {
    const res = await fetch("https://api.printify.com/v1/shops.json", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "StarCast-Store/1.0",
      },
      next: { revalidate: 3600 }, // Cache shops for 1 hour
    })

    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error("Failed to fetch Printify shops:", error)
    return []
  }
}

export async function getPrintifyProducts(customShopId?: string): Promise<PrintifyProduct[]> {
  const token = getApiToken()
  const shopId = customShopId || getShopId()

  if (!token) {
    console.warn("PRINTIFY_API_TOKEN is not configured.")
    return []
  }

  try {
    let rawItems: any[] = []
    let page = 1
    let lastPage = 1

    while (page <= lastPage && page <= 5) {
      const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=50&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "StarCast-Store/1.0",
        },
        next: { revalidate: 300 }, // ISR: refresh every 5 minutes
      })

      if (!res.ok) {
        console.error(`Printify API returned status ${res.status} on page ${page}: ${res.statusText}`)
        break
      }

      const payload = await res.json()
      const items = Array.isArray(payload) ? payload : payload.data || []
      rawItems = rawItems.concat(items)

      if (payload.last_page) {
        lastPage = payload.last_page
      } else {
        break
      }
      page++
    }

    return rawItems
      .filter((item) => item.visible !== false) // Only active items
      .map((item) => {
        // Collect images
        const images: string[] = []
        if (Array.isArray(item.images)) {
          // Sort default image first
          const sorted = [...item.images].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
          for (const img of sorted) {
            if (img.src && !images.includes(img.src)) {
              images.push(img.src)
            }
          }
        }

        const primaryImage = images[0] || "/images/spacemanlogo.png"
        const secondaryImage = images[1] || undefined

        // Calculate prices from variants
        const enabledVariants = Array.isArray(item.variants)
          ? item.variants.filter((v: any) => v.is_enabled !== false && v.price > 0)
          : []

        const prices = enabledVariants.map((v: any) => v.price / 100)
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

        const formattedPrice =
          minPrice === maxPrice || maxPrice === 0
            ? `$${minPrice.toFixed(2)}`
            : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`

        // Extract sizes & colors
        const sizesSet = new Set<string>()
        const colorsSet = new Set<string>()

        if (Array.isArray(item.options)) {
          for (const opt of item.options) {
            const name = (opt.name || "").toLowerCase()
            if (name.includes("size")) {
              opt.values?.forEach((v: any) => sizesSet.add(v.title))
            } else if (name.includes("color")) {
              opt.values?.forEach((v: any) => colorsSet.add(v.title))
            }
          }
        }

        // Checkout URL pointing to Printify pop-up store
        const extId = item.external?.id || item.id
        const checkoutUrl =
          item.external?.handle && item.external.handle.startsWith("http")
            ? item.external.handle
            : `https://starcast-supply-company.printify.me/product/${extId}`

        const tags = Array.isArray(item.tags) ? item.tags : []
        const category = categorize(item.title || "", tags)

        return {
          id: String(item.id),
          title: item.title || "StarCast Gear",
          description: stripHtml(item.description || ""),
          category,
          tags,
          images,
          primaryImage,
          secondaryImage,
          price: formattedPrice,
          rawPrice: minPrice,
          minPrice,
          maxPrice,
          variantsCount: enabledVariants.length,
          sizes: Array.from(sizesSet),
          colors: Array.from(colorsSet),
          checkoutUrl,
          visible: Boolean(item.visible),
        }
      })
  } catch (error) {
    console.error("Failed to load Printify products:", error)
    return []
  }
}
