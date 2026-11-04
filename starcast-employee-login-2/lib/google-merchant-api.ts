import { google } from "googleapis"
import { getShopifyProducts, type ShopifyProduct } from "@/lib/shopify"

export const DEFAULT_MERCHANT_CENTER_ID = "5899246056"
export const MERCHANT_CENTER_ID =
  process.env.GOOGLE_MERCHANT_CENTER_ID || DEFAULT_MERCHANT_CENTER_ID

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://starcast.online"
const BRAND_NAME = "StarCast Supply Co."

/**
 * Returns authenticated GoogleAuth instance for Google Merchant / Content API.
 * Uses custom service account key if provided via env, or falls back to
 * Application Default Credentials (ADC) active on Google Cloud / App Hosting.
 */
export function getGoogleMerchantAuth() {
  const serviceAccountJson =
    process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountJson) {
    try {
      const credentials =
        typeof serviceAccountJson === "string"
          ? JSON.parse(serviceAccountJson)
          : serviceAccountJson

      return new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/content"],
      })
    } catch (err) {
      console.warn(
        "[Google Merchant API] Failed to parse service account key, falling back to ADC:",
        err
      )
    }
  }

  return new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/content"],
  })
}

/**
 * Helper to clean HTML from description and provide default.
 */
function cleanDescription(desc: string): string {
  if (!desc) return "Official StarCast Media merchandise and apparel."
  return desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Maps Shopify category to Google Product Category ID & string.
 */
function mapGoogleCategory(category: ShopifyProduct["category"]): string {
  switch (category) {
    case "T-Shirts":
      return "Apparel & Accessories > Clothing > Shirts & Tops"
    case "Headwear":
      return "Apparel & Accessories > Clothing Accessories > Hats"
    case "Outerwear":
      return "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets"
    case "Accessories":
      return "Apparel & Accessories > Clothing Accessories"
    default:
      return "Apparel & Accessories > Clothing"
  }
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return `${SITE_URL}/images/spacemanlogo.png`
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export interface GoogleMerchantProductPayload {
  offerId: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks?: string[]
  contentLanguage: string
  targetCountry: string
  channel: string
  availability: "in stock" | "out of stock"
  price: {
    value: string
    currency: string
  }
  brand: string
  condition: "new"
  googleProductCategory: string
  productTypes?: string[]
  sizes?: string[]
  color?: string
  itemGroupId?: string
  identifierExists: boolean
}

/**
 * Converts all Shopify products and their variants into Google Merchant Product format.
 */
export async function buildGoogleMerchantPayloads(): Promise<{
  payloads: GoogleMerchantProductPayload[]
  productCount: number
  variantCount: number
}> {
  const shopifyProducts = await getShopifyProducts()
  const payloads: GoogleMerchantProductPayload[] = []

  for (const product of shopifyProducts) {
    const productUrl = `${SITE_URL}/merch/${product.handle}`
    const primaryImg = resolveImageUrl(product.primaryImage)
    const additionalImgs = (product.images || [])
      .filter((img) => img !== product.primaryImage)
      .slice(0, 5)
      .map((img) => resolveImageUrl(img))

    const googleCategory = mapGoogleCategory(product.category)
    const description = cleanDescription(product.description)

    if (product.variants && product.variants.length > 1) {
      // Multiple variants (e.g. sizes/colors)
      for (const v of product.variants) {
        const variantId =
          v.id.replace(/[^a-zA-Z0-9_-]/g, "") || `${product.handle}-${v.title}`
        const variantPrice = (v.price || product.rawPrice || 0).toFixed(2)
        const currency = v.currencyCode || product.currencyCode || "USD"
        const variantImg = resolveImageUrl(v.image || product.primaryImage)
        const availability = v.availableForSale ? "in stock" : "out of stock"

        const sizeOpt = v.selectedOptions.find((o) =>
          o.name.toLowerCase().includes("size")
        )?.value
        const colorOpt = v.selectedOptions.find(
          (o) =>
            o.name.toLowerCase().includes("color") ||
            o.name.toLowerCase().includes("colour")
        )?.value

        payloads.push({
          offerId: `${product.handle}-${variantId}`,
          title: `${product.title}${v.title && v.title !== "Default Title" ? ` - ${v.title}` : ""}`,
          description,
          link: productUrl,
          imageLink: variantImg,
          additionalImageLinks: additionalImgs.length > 0 ? additionalImgs : undefined,
          contentLanguage: "en",
          targetCountry: "US",
          channel: "online",
          availability,
          price: {
            value: variantPrice,
            currency,
          },
          brand: BRAND_NAME,
          condition: "new",
          googleProductCategory: googleCategory,
          productTypes: [`StarCast Merch > ${product.category}`],
          sizes: sizeOpt ? [sizeOpt] : undefined,
          color: colorOpt || undefined,
          itemGroupId: product.handle,
          identifierExists: false,
        })
      }
    } else {
      // Single variant / standalone product
      const priceVal = (product.rawPrice || 0).toFixed(2)
      const currency = product.currencyCode || "USD"
      const availability = product.availableForSale ? "in stock" : "out of stock"

      payloads.push({
        offerId: product.handle,
        title: product.title,
        description,
        link: productUrl,
        imageLink: primaryImg,
        additionalImageLinks: additionalImgs.length > 0 ? additionalImgs : undefined,
        contentLanguage: "en",
        targetCountry: "US",
        channel: "online",
        availability,
        price: {
          value: priceVal,
          currency,
        },
        brand: BRAND_NAME,
        condition: "new",
        googleProductCategory: googleCategory,
        productTypes: [`StarCast Merch > ${product.category}`],
        itemGroupId: product.handle,
        identifierExists: false,
      })
    }
  }

  return {
    payloads,
    productCount: shopifyProducts.length,
    variantCount: payloads.length,
  }
}

/**
 * Checks connection to Google Merchant Center API.
 */
export async function testGoogleMerchantConnection(): Promise<{
  ok: boolean
  merchantId: string
  accountInfo?: any
  error?: string
  clientEmail?: string
}> {
  try {
    const auth = getGoogleMerchantAuth()
    const client = await auth.getClient()
    // Extract service account identity if available
    const credentials = (client as any).credentials || (auth as any).credentials
    const clientEmail = credentials?.client_email || "Application Default Credentials (ADC)"

    const content = google.content({ version: "v2", auth: client as any })
    const response = await content.accounts.get({
      merchantId: MERCHANT_CENTER_ID,
      accountId: MERCHANT_CENTER_ID,
    })

    return {
      ok: true,
      merchantId: MERCHANT_CENTER_ID,
      accountInfo: response.data,
      clientEmail,
    }
  } catch (err: any) {
    const message = err.message || String(err)
    return {
      ok: false,
      merchantId: MERCHANT_CENTER_ID,
      error: message,
    }
  }
}

/**
 * Lists products currently in Google Merchant Center via API.
 */
export async function listGoogleMerchantProducts(maxResults = 50) {
  const auth = getGoogleMerchantAuth()
  const client = await auth.getClient()
  const content = google.content({ version: "v2", auth: client as any })

  const response = await content.products.list({
    merchantId: MERCHANT_CENTER_ID,
    maxResults,
  })

  return response.data.resources || []
}

export interface SyncResult {
  success: boolean
  merchantId: string
  totalAttempted: number
  insertedCount: number
  failedCount: number
  errors: Array<{ offerId: string; message: string }>
  entries?: any[]
  durationMs: number
}

/**
 * Inserts or updates all Shopify products in Google Merchant Center using Content API custombatch.
 */
export async function syncAllProductsToGoogleMerchant(): Promise<SyncResult> {
  const startTime = Date.now()
  const { payloads } = await buildGoogleMerchantPayloads()

  const auth = getGoogleMerchantAuth()
  const client = await auth.getClient()
  const content = google.content({ version: "v2", auth: client as any })

  // Google Content API custombatch max recommended batch size is ~250
  const BATCH_SIZE = 100
  let insertedCount = 0
  let failedCount = 0
  const errors: Array<{ offerId: string; message: string }> = []
  const allEntries: any[] = []

  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const chunk = payloads.slice(i, i + BATCH_SIZE)

    const batchEntries = chunk.map((product, idx) => ({
      batchId: i + idx + 1,
      merchantId: MERCHANT_CENTER_ID,
      method: "insert",
      product,
    }))

    try {
      const response = await content.products.custombatch({
        requestBody: {
          entries: batchEntries,
        },
      })

      const returnedEntries = response.data.entries || []
      for (const entry of returnedEntries) {
        allEntries.push(entry)
        if (entry.errors && entry.errors.errors && entry.errors.errors.length > 0) {
          failedCount++
          const offer = chunk[(entry.batchId ?? 1) - 1 - i]?.offerId || `batch-${entry.batchId}`
          const errorMsg = entry.errors.errors.map((e: any) => e.message).join("; ")
          errors.push({ offerId: offer, message: errorMsg })
        } else {
          insertedCount++
        }
      }
    } catch (err: any) {
      console.error("[Google Merchant API] Batch call error:", err)
      const message = err.message || String(err)
      for (const item of chunk) {
        failedCount++
        errors.push({ offerId: item.offerId, message })
      }
    }
  }

  return {
    success: failedCount === 0,
    merchantId: MERCHANT_CENTER_ID,
    totalAttempted: payloads.length,
    insertedCount,
    failedCount,
    errors,
    entries: allEntries,
    durationMs: Date.now() - startTime,
  }
}

/**
 * Inserts a single product or variant to Google Merchant Center via API.
 */
export async function insertSingleProductToMerchant(
  productPayload: GoogleMerchantProductPayload
) {
  const auth = getGoogleMerchantAuth()
  const client = await auth.getClient()
  const content = google.content({ version: "v2", auth: client as any })

  const response = await content.products.insert({
    merchantId: MERCHANT_CENTER_ID,
    requestBody: productPayload as any,
  })

  return response.data
}

/**
 * Deletes a product by offerId from Google Merchant Center.
 */
export async function deleteProductFromMerchant(offerId: string) {
  const auth = getGoogleMerchantAuth()
  const client = await auth.getClient()
  const content = google.content({ version: "v2", auth: client as any })

  // Full product ID in Google Content API is `online:en:US:offerId`
  const productId = `online:en:US:${offerId}`

  const response = await content.products.delete({
    merchantId: MERCHANT_CENTER_ID,
    productId,
  })

  return response.data
}

