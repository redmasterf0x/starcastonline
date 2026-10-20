"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Minus,
  Lock,
  ArrowLeft,
  Sparkles,
  Share2,
} from "lucide-react"
import {
  type ShopifyProduct,
  type ShopifyProductVariant,
  buildShopifyPermalink,
} from "@/lib/shopify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useShopifyCart } from "./cart-context"
import { toast } from "sonner"

interface ProductDetailProps {
  product: ShopifyProduct
  relatedProducts: ShopifyProduct[]
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { addItem, openCart } = useShopifyCart()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors[0] || null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  // Determine active variant based on selected size / color
  const activeVariant: ShopifyProductVariant | undefined = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) return undefined

    // Exact match on options
    const match = product.variants.find((v) => {
      const matchSize = !selectedSize || v.title.includes(selectedSize) || v.selectedOptions.some((o) => o.value === selectedSize)
      const matchColor = !selectedColor || v.title.includes(selectedColor) || v.selectedOptions.some((o) => o.value === selectedColor)
      return matchSize && matchColor
    })

    return match || product.variants[0]
  }, [product.variants, selectedSize, selectedColor])

  const currentPrice = activeVariant?.price ?? product.rawPrice
  const isAvailable = activeVariant ? activeVariant.availableForSale : product.availableForSale

  const activeVariantCheckoutUrl = React.useMemo(() => {
    if (activeVariant?.id) {
      return buildShopifyPermalink([
        { merchandiseId: activeVariant.id, quantity },
      ])
    }
    return product.checkoutUrl
  }, [activeVariant, quantity, product.checkoutUrl])

  const handleAddToCart = async () => {
    if (!activeVariant?.id) {
      toast.error("Please select a valid option")
      return
    }

    try {
      setIsAdding(true)
      await addItem(
        {
          variantId: activeVariant.id,
          productId: product.id,
          productTitle: product.title,
          productHandle: product.handle,
          variantTitle: activeVariant.title !== "Default Title" ? activeVariant.title : "Default",
          price: currentPrice,
          currencyCode: product.currencyCode || "USD",
          image: activeVariant.image || product.primaryImage || "/images/spacemanlogo.png",
          selectedOptions: activeVariant.selectedOptions,
        },
        quantity
      )
      toast.success(`Added ${quantity} × ${product.title} to cart`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Product link copied to clipboard!")
    }
  }

  return (
    <div className="space-y-12">
      {/* Breadcrumbs & Share */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#7f84ad]">
          <Link href="/merch" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-[#454974]" />
          <span className="text-[#ffd166]">{product.category}</span>
          <ChevronRight className="w-3 h-3 text-[#454974]" />
          <span className="text-[#c5caea] truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </nav>

        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="border-[#20205a] bg-[#0c0c3f]/80 text-xs text-[#cbd0f2] hover:text-white rounded-xl gap-1.5 h-8"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[#20205a] bg-gradient-to-b from-[#080826] to-[#040416] shadow-2xl p-6 sm:p-10 flex items-center justify-center">
            <Image
              src={product.images[activeImageIndex] || product.primaryImage}
              alt={product.title}
              fill
              className="object-contain p-6 sm:p-8 hover:scale-105 transition-transform duration-500"
              priority
            />

            {/* Badges */}
            <div className="absolute top-5 left-5 flex flex-col gap-2">
              <Badge
                variant="outline"
                className="border-[#ea6f2a]/60 bg-[#ea6f2a]/15 text-[#ea6f2a] text-xs font-mono font-bold tracking-wider uppercase px-3 py-1 backdrop-blur-md"
              >
                {product.category}
              </Badge>
              {isAvailable ? (
                <Badge
                  variant="outline"
                  className="border-[#20efe0]/50 bg-[#20efe0]/10 text-[#20efe0] text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5"
                >
                  In Stock & Ready
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-red-500/50 bg-red-500/10 text-red-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5"
                >
                  Sold Out
                </Badge>
              )}
            </div>

            {/* Arrows for multi-image */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2.5 text-white hover:bg-[#ea6f2a] transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2.5 text-white hover:bg-[#ea6f2a] transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-[#050519] transition-all p-1.5 ${
                    activeImageIndex === idx
                      ? "border-[#ea6f2a] ring-2 ring-[#ea6f2a]/40 scale-105"
                      : "border-[#20205a] opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.title} preview ${idx + 1}`} fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Options, Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7f84ad]">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
              <span>STARCAST OFFICIAL MERCHANDISE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#f5f7ff] tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Price display */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-[#ffd166] font-mono drop-shadow-[0_0_15px_rgba(255,209,102,0.3)]">
                ${currentPrice.toFixed(2)}
              </span>
              <span className="text-xs text-[#7f84ad] font-mono">
                {product.currencyCode || "USD"} • Shopify Storefront
              </span>
            </div>
          </div>

          {/* Variants: Sizes */}
          {product.sizes.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#20205a]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#c5caea] uppercase tracking-wider">
                  Select Size
                </span>
                <span className="text-[#ffd166] font-mono font-bold">{selectedSize || "Standard"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      selectedSize === size
                        ? "border-[#ffd166] bg-[#ffd166]/20 text-[#ffd166] shadow-[0_0_12px_rgba(255,209,102,0.25)]"
                        : "border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants: Colors */}
          {product.colors.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#20205a]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#c5caea] uppercase tracking-wider">
                  Select Color
                </span>
                <span className="text-[#20efe0] font-mono font-bold">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                      selectedColor === color
                        ? "border-[#20efe0] bg-[#20efe0]/20 text-[#20efe0] shadow-[0_0_12px_rgba(32,239,224,0.25)]"
                        : "border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="space-y-2 pt-2 border-t border-[#20205a]">
            <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#20205a] rounded-xl bg-[#0c0c3f] p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#9a9fc4] hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono font-bold text-white text-base">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#9a9fc4] hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-[#7f84ad]">
                Subtotal:{" "}
                <span className="font-mono font-bold text-white">
                  ${(currentPrice * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout & Cart Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-[#20205a]">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable || isAdding}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] text-black font-black text-sm shadow-xl shadow-[#ffd166]/20 hover:opacity-95 transition-all gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isAdding ? "Adding..." : "Add to Supply Cart"}</span>
              </Button>

              <Button
                asChild
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-[#ea6f2a]/60 bg-[#ea6f2a]/10 hover:bg-[#ea6f2a]/20 text-[#ea6f2a] hover:text-white font-black text-sm transition-all gap-2"
              >
                <a href={activeVariantCheckoutUrl} target="_blank" rel="noopener noreferrer">
                  <Lock className="w-4 h-4 text-[#ea6f2a]" />
                  <span>Shopify Instant Buy</span>
                  <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
                </a>
              </Button>
            </div>

            <p className="text-[11px] text-center text-[#7f84ad]">
              Orders are encrypted & processed securely via Shopify Checkout with direct parcel tracking.
            </p>
          </div>

          {/* Description Block */}
          {product.description && (
            <div className="rounded-2xl border border-[#20205a] bg-[#0a0a28]/80 p-5 space-y-2">
              <h3 className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                Product Specifications
              </h3>
              <p className="text-xs text-[#9a9fc4] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-[#20205a]/80 bg-[#05052d]/60 p-3 text-center space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#20efe0]" />
              <div className="text-[11px] font-bold text-white">Direct Fulfillment</div>
              <div className="text-[10px] text-[#7f84ad]">Official Storefront</div>
            </div>
            <div className="rounded-xl border border-[#20205a]/80 bg-[#05052d]/60 p-3 text-center space-y-1">
              <Truck className="w-5 h-5 mx-auto text-[#ffd166]" />
              <div className="text-[11px] font-bold text-white">Fast Shipping</div>
              <div className="text-[10px] text-[#7f84ad]">Direct tracking email</div>
            </div>
            <div className="rounded-xl border border-[#20205a]/80 bg-[#05052d]/60 p-3 text-center space-y-1">
              <RotateCcw className="w-5 h-5 mx-auto text-[#ea6f2a]" />
              <div className="text-[11px] font-bold text-white">StarCast Quality</div>
              <div className="text-[10px] text-[#7f84ad]">100% Broadcast merch</div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-[#20205a]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
                More from {product.category}
              </h2>
              <p className="text-xs text-[#7f84ad]">Handpicked official gear from our supply room</p>
            </div>
            <Button asChild variant="ghost" className="text-xs font-bold text-[#ea6f2a] hover:text-white">
              <Link href="/merch">View All Merch →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                href={`/merch/${rel.handle}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#20205a] bg-[#0c0c3f]/50 hover:border-[#ea6f2a]/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,111,42,0.15)]"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#050519] p-4">
                  <Image
                    src={rel.primaryImage}
                    alt={rel.title}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge
                    variant="outline"
                    className="absolute top-2.5 left-2.5 border-[#20205a] bg-[#05052d]/90 text-[10px] font-mono text-[#ea6f2a]"
                  >
                    {rel.category}
                  </Badge>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors line-clamp-1">
                    {rel.title}
                  </h4>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-[#ffd166] font-mono">
                      {rel.price}
                    </span>
                    <span className="text-[11px] text-[#20efe0] font-semibold">View Item →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
