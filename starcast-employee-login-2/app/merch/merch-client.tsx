"use client"

import React, { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Store,
  Check,
  Plus,
  Minus,
  Lock,
} from "lucide-react"
import {
  type ShopifyProduct,
  type ShopifyProductVariant,
  buildShopifyPermalink,
} from "@/lib/shopify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  CartProvider,
  useShopifyCart,
} from "@/components/merch/cart-context"
import { CartDrawer, CartFloatingButton } from "@/components/merch/cart-drawer"

interface MerchClientProps {
  initialProducts: ShopifyProduct[]
  shopTitle?: string
  storeUrl?: string
}

const CATEGORIES = ["All", "T-Shirts", "Headwear", "Outerwear", "Accessories", "Gear"] as const
type Category = (typeof CATEGORIES)[number]

function MerchCatalog({
  initialProducts,
  shopTitle = "StarCast Supply Company",
  storeUrl = "https://wzcs0f-rt.myshopify.com",
}: MerchClientProps) {
  const { addItem, openCart, totalQuantity } = useShopifyCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category>("All")
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured")
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: initialProducts.length }
    for (const p of initialProducts) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }
    return counts
  }, [initialProducts])

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Category filter
        if (selectedCategory !== "All" && product.category !== selectedCategory) {
          return false
        }
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const matchTitle = product.title.toLowerCase().includes(query)
          const matchDesc = product.description.toLowerCase().includes(query)
          const matchTags = product.tags.some((t) => t.toLowerCase().includes(query))
          if (!matchTitle && !matchDesc && !matchTags) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return a.rawPrice - b.rawPrice
        }
        if (sortBy === "price-desc") {
          return b.rawPrice - a.rawPrice
        }
        if (sortBy === "name") {
          return a.title.localeCompare(b.title)
        }
        return 0 // "featured" maintains API order
      })
  }, [initialProducts, selectedCategory, searchQuery, sortBy])

  const openProductModal = (product: ShopifyProduct) => {
    setSelectedProduct(product)
    setActiveImageIndex(0)
    setSelectedSize(product.sizes[0] || null)
    setSelectedColor(product.colors[0] || null)
    setModalQuantity(1)
  }

  // Find exact active variant in modal
  const activeVariant: ShopifyProductVariant | null = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants || selectedProduct.variants.length === 0) {
      return null
    }

    if (selectedProduct.variants.length === 1) {
      return selectedProduct.variants[0]
    }

    const match = selectedProduct.variants.find((v) => {
      let matchSize = true
      let matchColor = true
      if (selectedSize) {
        matchSize =
          v.selectedOptions?.some(
            (o) => o.name.toLowerCase().includes("size") && o.value === selectedSize
          ) || v.title.includes(selectedSize)
      }
      if (selectedColor) {
        matchColor =
          v.selectedOptions?.some(
            (o) =>
              (o.name.toLowerCase().includes("color") || o.name.toLowerCase().includes("colour")) &&
              o.value === selectedColor
          ) || v.title.includes(selectedColor)
      }
      return matchSize && matchColor
    })

    return match || selectedProduct.variants[0]
  }, [selectedProduct, selectedSize, selectedColor])

  // Direct checkout link for active modal variant
  const activeVariantCheckoutUrl = useMemo(() => {
    if (!selectedProduct) return storeUrl
    if (activeVariant?.id) {
      return buildShopifyPermalink([{ merchandiseId: activeVariant.id, quantity: modalQuantity }])
    }
    return selectedProduct.checkoutUrl
  }, [selectedProduct, activeVariant, modalQuantity, storeUrl])

  const handleModalAddToCart = () => {
    if (!selectedProduct) return
    const targetVariant = activeVariant || selectedProduct.variants[0] || {
      id: selectedProduct.id,
      title: "Default",
      availableForSale: true,
      price: selectedProduct.rawPrice,
      selectedOptions: [],
    }

    addItem(
      {
        variantId: targetVariant.id,
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productHandle: selectedProduct.handle,
        variantTitle: targetVariant.title,
        price: targetVariant.price || selectedProduct.rawPrice,
        currencyCode: selectedProduct.currencyCode || "USD",
        image: targetVariant.image || selectedProduct.primaryImage,
        selectedOptions: targetVariant.selectedOptions,
      },
      modalQuantity
    )

    setSelectedProduct(null)
  }

  const handleQuickAdd = (product: ShopifyProduct, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetVariant = product.variants[0] || {
      id: product.id,
      title: "Default",
      availableForSale: true,
      price: product.rawPrice,
      selectedOptions: [],
    }

    addItem(
      {
        variantId: targetVariant.id,
        productId: product.id,
        productTitle: product.title,
        productHandle: product.handle,
        variantTitle: targetVariant.title,
        price: targetVariant.price || product.rawPrice,
        currencyCode: product.currencyCode || "USD",
        image: targetVariant.image || product.primaryImage,
        selectedOptions: targetVariant.selectedOptions,
      },
      1
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#20205a]/80 bg-gradient-to-br from-[#0c0c3f] via-[#05051f] to-[#121244] p-8 sm:p-12 shadow-2xl">
        {/* Glow backdrop elements */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#ea6f2a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#20efe0]/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[#ffd166]/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          {/* Dispatch Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ea6f2a]/40 bg-[#ea6f2a]/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-[#ea6f2a] uppercase shadow-[0_0_15px_rgba(234,111,42,0.2)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>OFFICIAL SHOPIFY STOREFRONT // {shopTitle.toUpperCase()}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#f5f7ff] sm:text-5xl lg:text-6xl">
            StarCast{" "}
            <span className="bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] bg-clip-text text-transparent">
              Supply Co.
            </span>
          </h1>

          <p className="mt-4 text-base text-[#9a9fc4] sm:text-lg leading-relaxed">
            Official StarCast broadcast apparel, snapbacks, custom varsity jackets, and cosmic accessories. Powered by the live Shopify Storefront API with instant cart checkout and express worldwide delivery.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={openCart}
              className="bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] hover:opacity-95 text-black font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-[#ffd166]/20 gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>View Cart {totalQuantity > 0 ? `(${totalQuantity})` : ""}</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-[#20205a] bg-[#0c0c3f]/80 text-[#cbd0f2] hover:text-white hover:bg-[#20205a] font-bold px-5 py-2.5 rounded-xl"
            >
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <Store className="h-4 w-4 mr-2 text-[#20efe0]" />
                Shopify Portal <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
              </a>
            </Button>
          </div>

          {/* Quick Perks / Trust Signals */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-[#c5caea]">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-[#20efe0]" />
              <span>Shopify Storefront GraphQL</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <Truck className="h-4 w-4 text-[#ffd166]" />
              <span>Direct Express Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <RotateCcw className="h-4 w-4 text-[#ea6f2a]" />
              <span>Official 100% Broadcast Merch</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f84ad]" />
            <Input
              type="text"
              placeholder="Search shirts, caps, hoodies, gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-[#20205a] bg-[#0c0c3f]/80 pl-10 pr-9 text-sm text-[#f5f7ff] placeholder:text-[#646894] focus:border-[#ea6f2a] focus:ring-[#ea6f2a]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f84ad] hover:text-[#f5f7ff]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#7f84ad] flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 rounded-xl border border-[#20205a] bg-[#0c0c3f]/90 px-3 py-1.5 text-xs font-semibold text-[#f5f7ff] focus:border-[#ea6f2a] focus:outline-none"
            >
              <option value="featured">Featured / Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/30"
                    : "border border-[#20205a] bg-[#0c0c3f]/60 text-[#9a9fc4] hover:border-white/20 hover:text-white"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-black/30 text-white" : "bg-[#20205a]/60 text-[#7f84ad]"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── PRODUCT GRID ── */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/40 p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-[#7f84ad]" />
          <h3 className="mt-4 text-xl font-bold text-[#f5f7ff]">No merchandise found</h3>
          <p className="mt-1 text-sm text-[#7f84ad]">
            Try adjusting your search terms or selecting a different category.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("All")
            }}
            variant="outline"
            className="mt-6 border-[#20205a] bg-[#0c0c3f] text-xs font-semibold text-[#f5f7ff]"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => openProductModal(product)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#20205a]/80 bg-[#0c0c3f]/60 hover:border-[#ea6f2a]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,111,42,0.15)] cursor-pointer"
            >
              {/* Product Thumbnail Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#050519]">
                <Image
                  src={product.primaryImage}
                  alt={product.title}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Category Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-[#20205a] bg-[#05052d]/90 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ea6f2a]"
                  >
                    {product.category}
                  </Badge>
                </div>

                {/* Quick View Overlay Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
                    <Eye className="w-3.5 h-3.5" />
                    Quick View
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors line-clamp-2 leading-snug">
                    {product.title}
                  </h3>

                  {product.description && (
                    <p className="mt-1.5 text-xs text-[#9a9fc4] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-black text-[#ffd166] font-mono">
                      {product.price}
                    </span>
                    {product.variantsCount > 1 && (
                      <span className="text-[11px] text-[#7f84ad]">
                        {product.variantsCount} options
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#20205a]/60 flex items-center gap-2">
                  <Button
                    onClick={(e) => handleQuickAdd(product, e)}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] text-black hover:opacity-90 text-xs font-black h-9 rounded-xl shadow-md gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      openProductModal(product)
                    }}
                    variant="outline"
                    size="sm"
                    className="border-[#20205a] bg-[#05052d]/60 text-xs text-[#c5caea] hover:bg-[#05052d] hover:text-white h-9 rounded-xl px-3"
                  >
                    Options
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── QUICK VIEW / PRODUCT DETAIL MODAL ── */}
      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        {selectedProduct && (
          <DialogContent className="w-[96vw] max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto border border-[#20205a] bg-[#0a0a28]/98 p-6 sm:p-8 md:p-10 text-[#f5f7ff] shadow-2xl backdrop-blur-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedProduct.title}</DialogTitle>
              <DialogDescription>Product details and direct ordering options</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 items-start">
              {/* Left Column: Image Gallery */}
              <div className="space-y-4">
                {/* Main Large Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#20205a] bg-[#050519]">
                  <Image
                    src={selectedProduct.images[activeImageIndex] || selectedProduct.primaryImage}
                    alt={selectedProduct.title}
                    fill
                    className="object-contain p-4"
                    priority
                  />

                  {/* Prev/Next arrows if multiple images */}
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0 ? selectedProduct.images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white hover:bg-[#ea6f2a]"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === selectedProduct.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-2 text-white hover:bg-[#ea6f2a]"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-[#050519] transition-all ${
                          activeImageIndex === idx
                            ? "border-[#ea6f2a] ring-2 ring-[#ea6f2a]/40"
                            : "border-[#20205a] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={img} alt={`View ${idx + 1}`} fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Information & Actions */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Category & Shop Header */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-[#ea6f2a]/50 bg-[#ea6f2a]/10 text-xs font-mono font-bold tracking-widest uppercase text-[#ea6f2a]"
                    >
                      {selectedProduct.category}
                    </Badge>
                    <span className="text-xs text-[#7f84ad] font-mono">
                      {activeVariant ? `SKU: ${activeVariant.title}` : `HANDLE: ${selectedProduct.handle}`}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] leading-snug">
                    {selectedProduct.title}
                  </h2>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#ffd166] drop-shadow-[0_0_12px_rgba(255,209,102,0.3)] font-mono">
                      ${(activeVariant?.price || selectedProduct.rawPrice).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#7f84ad]">
                      {selectedProduct.currencyCode || "USD"} (Shopify Storefront)
                    </span>
                  </div>

                  {/* Sizes (if available) */}
                  {selectedProduct.sizes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                          Select Size: <span className="text-[#ffd166]">{selectedSize || "Default"}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedSize === size
                                ? "border-[#ffd166] bg-[#ffd166]/20 text-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,0.2)]"
                                : "border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors (if available) */}
                  {selectedProduct.colors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                        Select Color: <span className="text-[#20efe0]">{selectedColor}</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                              selectedColor === color
                                ? "border-[#20efe0] bg-[#20efe0]/20 text-[#20efe0] shadow-[0_0_10px_rgba(32,239,224,0.2)]"
                                : "border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                      Quantity
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#20205a] rounded-xl bg-[#0c0c3f] p-1">
                        <button
                          onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9a9fc4] hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center font-mono font-bold text-white text-sm">
                          {modalQuantity}
                        </span>
                        <button
                          onClick={() => setModalQuantity((q) => q + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9a9fc4] hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                        Item Description
                      </span>
                      <div className="max-h-36 overflow-y-auto rounded-xl border border-[#20205a]/60 bg-[#05052d]/60 p-3 text-xs text-[#9a9fc4] leading-relaxed whitespace-pre-line scrollbar-thin">
                        {selectedProduct.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkout & Add to Cart Section */}
                <div className="space-y-2.5 pt-4 border-t border-[#20205a]">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      onClick={handleModalAddToCart}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[#ffd166]/20 hover:opacity-95 transition-all gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Supply Cart</span>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#ea6f2a]/60 bg-[#ea6f2a]/10 hover:bg-[#ea6f2a]/20 text-[#ea6f2a] hover:text-white font-extrabold text-xs sm:text-sm transition-all gap-2"
                    >
                      <a href={activeVariantCheckoutUrl} target="_blank" rel="noopener noreferrer">
                        <Lock className="w-4 h-4 text-[#ea6f2a]" />
                        <span>Instant Checkout</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
                      </a>
                    </Button>
                  </div>

                  <div className="pt-1 text-center">
                    <Link
                      href={`/merch/${selectedProduct.handle}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[#20efe0] hover:text-white font-semibold transition-colors"
                    >
                      <span>Open Dedicated Product Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <p className="text-center text-[11px] text-[#7f84ad]">
                    Processed securely by Shopify with multi-currency support and encrypted checkout.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <CartDrawer />
      <CartFloatingButton />
    </div>
  )
}

export function MerchClient(props: MerchClientProps) {
  return (
    <CartProvider>
      <MerchCatalog {...props} />
    </CartProvider>
  )
}
