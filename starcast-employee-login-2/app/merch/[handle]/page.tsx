import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { getShopifyProducts, getShopifyProductByHandle } from "@/lib/shopify"
import { ProductDetail } from "@/components/merch/product-detail"
import { CartProvider } from "@/components/merch/cart-context"
import { CartDrawer, CartFloatingButton } from "@/components/merch/cart-drawer"

type Props = {
  params: Promise<{ handle: string }>
}

export const revalidate = 300 // Revalidate every 5 minutes

export async function generateStaticParams() {
  try {
    const products = await getShopifyProducts()
    return products.map((product) => ({
      handle: product.handle,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const decodedHandle = decodeURIComponent(handle)
  const product = await getShopifyProductByHandle(decodedHandle)

  if (!product) {
    return {
      title: "Product Not Found | StarCast Supply",
      description: "Official merchandise and gear from StarCast Media.",
    }
  }

  const ogImage = product.primaryImage?.startsWith("http")
    ? product.primaryImage
    : `https://starcast.online${product.primaryImage}`

  return {
    title: `${product.title} | StarCast Supply Official Merch`,
    description: product.description || `Buy ${product.title} at StarCast Supply Company. Official broadcast merchandise.`,
    openGraph: {
      title: `${product.title} — Official StarCast Merchandise`,
      description: product.description,
      url: `https://starcast.online/merch/${product.handle}`,
      siteName: "StarCast Supply Co.",
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: [ogImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const decodedHandle = decodeURIComponent(handle)

  const [product, allProducts] = await Promise.all([
    getShopifyProductByHandle(decodedHandle),
    getShopifyProducts(),
  ])

  if (!product) {
    notFound()
  }

  // Filter related products (same category or others, excluding current)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .filter((p) => p.category === product.category || product.category === "All")
    .slice(0, 4)

  return (
    <CartProvider>
      <div className="public-shell min-h-screen text-[#f5f7ff] bg-[#05051f]">
        <div className="relative z-10">
          <ResponsiveHeader currentPage="/merch" />

          <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-20">
            <ProductDetail product={product} relatedProducts={relatedProducts} />
          </main>

          <Footer />

          {/* Slide-out cart drawer & floating button */}
          <CartDrawer />
          <CartFloatingButton />
        </div>
      </div>
    </CartProvider>
  )
}
