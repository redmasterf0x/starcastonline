export type ShopifyProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: number
  currencyCode?: string
  image?: string
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
  descriptionHtml?: string
  category: "All" | "T-Shirts" | "Headwear" | "Outerwear" | "Accessories" | "Gear"
  tags: string[]
  images: string[]
  primaryImage: string
  secondaryImage?: string
  price: string
  rawPrice: number
  minPrice: number
  maxPrice: number
  currencyCode: string
  variantsCount: number
  sizes: string[]
  colors: string[]
  options?: { name: string; values: string[] }[]
  checkoutUrl: string
  availableForSale: boolean
  variants: ShopifyProductVariant[]
}

export type ShopifyStoreInfo = {
  name: string
  domain: string
  storeUrl: string
}

export type ShopifyCartLine = {
  id: string
  quantity: number
  cost: {
    totalAmount: {
      amount: string
      currencyCode: string
    }
  }
  merchandise: {
    id: string
    title: string
    product: {
      id: string
      title: string
      handle: string
      images?: { edges: { node: { url: string } }[] }
    }
    price: {
      amount: string
      currencyCode: string
    }
    image?: {
      url: string
    }
    selectedOptions: {
      name: string
      value: string
    }[]
  }
}

export type ShopifyCart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: ShopifyCartLine[]
  cost: {
    subtotalAmount: {
      amount: string
      currencyCode: string
    }
    totalAmount: {
      amount: string
      currencyCode: string
    }
  }
}

export function getShopifyStoreDomain(): string {
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
  return `https://${getShopifyStoreDomain()}`
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
  if (combined.match(/\b(tee|t-shirt|shirt|tank|long sleeve|short sleeve|jersey|raglan)\b/)) {
    return "T-Shirts"
  }
  if (combined.match(/\b(jacket|hoodie|sweatshirt|outerwear|fleece|pullover|coat|varsity|windbreaker)\b/)) {
    return "Outerwear"
  }
  if (combined.match(/\b(necklace|jewelry|ring|bracelet|sticker|bag|backpack|tote|mug|tumbler|bottle|keychain|patch|pin|accessory|accessories|sleeve|bikini)\b/)) {
    return "Accessories"
  }
  return "Gear"
}

/**
 * Core GraphQL Fetcher for Shopify Storefront API
 */
async function shopifyGraphQLFetch<T>(
  query: string,
  variables: Record<string, any> = {},
  revalidate: number | false = 180
): Promise<{ data?: T; errors?: any[] } | null> {
  const domain = getShopifyStoreDomain()
  const apiVersion = getApiVersion()
  const token = getStorefrontToken()
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (token) {
    headers["X-Shopify-Storefront-Access-Token"] = token
  }

  try {
    const fetchOptions: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    }

    if (revalidate !== false) {
      fetchOptions.next = { revalidate }
    } else {
      fetchOptions.cache = "no-store"
    }

    const res = await fetch(endpoint, fetchOptions)

    if (!res.ok) {
      console.warn(`Shopify GraphQL returned ${res.status}: ${res.statusText}`)
      return null
    }

    const json = await res.json()
    if (json.errors && json.errors.length > 0) {
      console.warn("Shopify GraphQL errors:", json.errors)
    }

    return json
  } catch (err) {
    console.error("Shopify GraphQL network error:", err)
    return null
  }
}

/**
 * Fallback StarCast backup catalog if store is empty or offline
 */
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
    currencyCode: "USD",
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
    currencyCode: "USD",
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
  const domain = getShopifyStoreDomain()
  try {
    const res = await shopifyGraphQLFetch<{ shop: { name: string } }>(
      `query GetShopInfo { shop { name } }`,
      {},
      600
    )
    if (res?.data?.shop?.name) {
      return {
        name: res.data.shop.name,
        domain,
        storeUrl: getShopifyStoreUrl(),
      }
    }
  } catch {}

  return {
    name: "StarCast Supply",
    domain,
    storeUrl: getShopifyStoreUrl(),
  }
}

/**
 * GraphQL Query to fetch products from Storefront API
 */
const PRODUCTS_GRAPHQL_QUERY = `
  query GetStorefrontProducts($first: Int = 100) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          availableForSale
          productType
          tags
          options {
            name
            values
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`

function mapGraphQLProductNode(node: any): ShopifyProduct {
  const storeUrl = getShopifyStoreUrl()
  const images = (node.images?.edges || [])
    .map((e: any) => e.node?.url)
    .filter(Boolean) as string[]

  const primaryImage = images[0] || "/images/spacemanlogo.png"
  const secondaryImage = images[1] || undefined

  const variants: ShopifyProductVariant[] = (node.variants?.edges || []).map((e: any) => {
    const v = e.node
    return {
      id: v.id,
      title: v.title || "Default",
      availableForSale: v.availableForSale !== false,
      price: parseFloat(v.price?.amount || "0"),
      currencyCode: v.price?.currencyCode || "USD",
      image: v.image?.url,
      selectedOptions: v.selectedOptions || [],
    }
  })

  const minPrice = parseFloat(node.priceRange?.minVariantPrice?.amount || "0")
  const maxPrice = parseFloat(node.priceRange?.maxVariantPrice?.amount || "0")
  const currencyCode = node.priceRange?.minVariantPrice?.currencyCode || "USD"

  const formattedPrice =
    minPrice === maxPrice || maxPrice === 0
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`

  const tags: string[] = Array.isArray(node.tags) ? node.tags : []
  const category = categorize(node.title || "", tags, node.productType)

  const sizesSet = new Set<string>()
  const colorsSet = new Set<string>()

  if (Array.isArray(node.options)) {
    for (const opt of node.options) {
      const name = (opt.name || "").toLowerCase()
      if (name.includes("size")) {
        opt.values?.forEach((v: any) => sizesSet.add(String(v)))
      } else if (name.includes("color") || name.includes("colour")) {
        opt.values?.forEach((v: any) => colorsSet.add(String(v)))
      }
    }
  }

  if (sizesSet.size === 0 && variants.length > 0) {
    variants.forEach((v) => {
      if (v.title && v.title !== "Default Title") {
        sizesSet.add(v.title)
      }
    })
  }

  const checkoutUrl = `${storeUrl}/products/${node.handle}`

  return {
    id: node.id,
    handle: node.handle,
    title: node.title || "StarCast Product",
    description: node.description ? stripHtml(node.description) : "",
    descriptionHtml: node.descriptionHtml,
    category,
    tags,
    images: images.length > 0 ? images : [primaryImage],
    primaryImage,
    secondaryImage,
    price: formattedPrice,
    rawPrice: minPrice,
    minPrice,
    maxPrice,
    currencyCode,
    variantsCount: variants.length,
    sizes: Array.from(sizesSet),
    colors: Array.from(colorsSet),
    options: node.options,
    checkoutUrl,
    availableForSale: node.availableForSale !== false,
    variants,
  }
}

/**
 * Fetches products from Shopify Storefront GraphQL API
 */
async function fetchProductsFromGraphQL(): Promise<ShopifyProduct[] | null> {
  try {
    const res = await shopifyGraphQLFetch<any>(PRODUCTS_GRAPHQL_QUERY, { first: 100 }, 180)
    const edges = res?.data?.products?.edges
    if (edges && Array.isArray(edges) && edges.length > 0) {
      return edges.map((e: any) => mapGraphQLProductNode(e.node))
    }
  } catch (err) {
    console.warn("GraphQL product fetch failed, trying REST fallback:", err)
  }
  return null
}

/**
 * REST Fallback if GraphQL query is disabled or restricted
 */
async function fetchProductsFromRest(): Promise<ShopifyProduct[] | null> {
  const domain = getShopifyStoreDomain()
  const storeUrl = getShopifyStoreUrl()
  const endpoint = `https://${domain}/products.json?limit=250`

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 180 },
      headers: {
        "User-Agent": "StarCast-Storefront/1.0",
      },
    })

    if (!res.ok) return null

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
            id: `gid://shopify/ProductVariant/${v.id}`,
            title: v.title || "Default",
            availableForSale: v.available !== false,
            price: parseFloat(v.price || "0"),
            currencyCode: "USD",
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

      if (sizesSet.size === 0 && variants.length > 0) {
        variants.forEach((v) => {
          if (v.title && v.title !== "Default Title") {
            sizesSet.add(v.title)
          }
        })
      }

      const checkoutUrl = `${storeUrl}/products/${item.handle}`

      return {
        id: `gid://shopify/Product/${item.id}`,
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
        currencyCode: "USD",
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
 * Fetches all live products from StarCast's Shopify Store (GraphQL -> REST -> Fallback)
 */
export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  const gqlProducts = await fetchProductsFromGraphQL()
  if (gqlProducts && gqlProducts.length > 0) {
    return gqlProducts
  }

  const restProducts = await fetchProductsFromRest()
  if (restProducts && restProducts.length > 0) {
    return restProducts
  }

  return FALLBACK_STARCAST_PRODUCTS
}

/**
 * Fetches a single product by handle
 */
export async function getShopifyProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const SINGLE_PRODUCT_QUERY = `
    query GetProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        availableForSale
        productType
        tags
        options {
          name
          values
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              image {
                url
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `

  try {
    const res = await shopifyGraphQLFetch<any>(SINGLE_PRODUCT_QUERY, { handle }, 180)
    if (res?.data?.product) {
      return mapGraphQLProductNode(res.data.product)
    }
  } catch (err) {
    console.warn("GraphQL getProductByHandle error:", err)
  }

  // Fallback: search all products
  const all = await getShopifyProducts()
  return all.find((p) => p.handle === handle) || null
}

// ─── CART API (Shopify Storefront Cart & Checkout) ──────────────────────────

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
              }
              selectedOptions {
                name
                value
              }
              product {
                id
                title
                handle
                images(first: 1) {
                  edges {
                    node {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

function formatCart(cartData: any): ShopifyCart {
  const lines: ShopifyCartLine[] = (cartData.lines?.edges || []).map((e: any) => e.node)
  return {
    id: cartData.id,
    checkoutUrl: cartData.checkoutUrl,
    totalQuantity: cartData.totalQuantity || 0,
    lines,
    cost: {
      subtotalAmount: cartData.cost?.subtotalAmount || { amount: "0.00", currencyCode: "USD" },
      totalAmount: cartData.cost?.totalAmount || { amount: "0.00", currencyCode: "USD" },
    },
  }
}

/**
 * Creates a new Cart in Shopify Storefront API
 */
export async function createShopifyCart(
  lines: { merchandiseId: string; quantity: number }[] = []
): Promise<ShopifyCart | null> {
  const CREATE_CART_MUTATION = `
    ${CART_FRAGMENT}
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const res = await shopifyGraphQLFetch<any>(
    CREATE_CART_MUTATION,
    { input: { lines } },
    false
  )

  if (res?.data?.cartCreate?.cart) {
    return formatCart(res.data.cartCreate.cart)
  }

  // Fallback: Generate direct cart permalink if GraphQL returns user error
  if (lines.length > 0) {
    const permalink = buildShopifyPermalink(lines)
    return {
      id: "fallback-cart",
      checkoutUrl: permalink,
      totalQuantity: lines.reduce((acc, l) => acc + l.quantity, 0),
      lines: [],
      cost: {
        subtotalAmount: { amount: "0.00", currencyCode: "USD" },
        totalAmount: { amount: "0.00", currencyCode: "USD" },
      },
    }
  }

  return null
}

/**
 * Adds line items to an existing Shopify Cart
 */
export async function addLinesToShopifyCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart | null> {
  const ADD_LINES_MUTATION = `
    ${CART_FRAGMENT}
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const res = await shopifyGraphQLFetch<any>(
    ADD_LINES_MUTATION,
    { cartId, lines },
    false
  )

  if (res?.data?.cartLinesAdd?.cart) {
    return formatCart(res.data.cartLinesAdd.cart)
  }

  return null
}

/**
 * Updates a line item quantity in a Shopify Cart
 */
export async function updateShopifyCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  const UPDATE_LINES_MUTATION = `
    ${CART_FRAGMENT}
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const res = await shopifyGraphQLFetch<any>(
    UPDATE_LINES_MUTATION,
    { cartId, lines: [{ id: lineId, quantity }] },
    false
  )

  if (res?.data?.cartLinesUpdate?.cart) {
    return formatCart(res.data.cartLinesUpdate.cart)
  }

  return null
}

/**
 * Removes lines from a Shopify Cart
 */
export async function removeShopifyCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  const REMOVE_LINES_MUTATION = `
    ${CART_FRAGMENT}
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const res = await shopifyGraphQLFetch<any>(
    REMOVE_LINES_MUTATION,
    { cartId, lineIds },
    false
  )

  if (res?.data?.cartLinesRemove?.cart) {
    return formatCart(res.data.cartLinesRemove.cart)
  }

  return null
}

/**
 * Fetches current Cart state by ID
 */
export async function getShopifyCart(cartId: string): Promise<ShopifyCart | null> {
  const GET_CART_QUERY = `
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFragment
      }
    }
  `

  const res = await shopifyGraphQLFetch<any>(GET_CART_QUERY, { cartId }, false)
  if (res?.data?.cart) {
    return formatCart(res.data.cart)
  }

  return null
}

/**
 * Builds a direct Shopify checkout permalink e.g. /cart/{variantId}:{qty}
 */
export function buildShopifyPermalink(
  items: { merchandiseId: string; quantity: number }[]
): string {
  const storeUrl = getShopifyStoreUrl()
  const formattedItems = items
    .map((item) => {
      // Strip "gid://shopify/ProductVariant/" if present
      const rawId = item.merchandiseId.replace(/gid:\/\/shopify\/ProductVariant\//, "")
      return `${rawId}:${item.quantity}`
    })
    .join(",")

  return `${storeUrl}/cart/${formattedItems}`
}
