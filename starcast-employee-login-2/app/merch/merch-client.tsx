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
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { type PrintifyProduct } from "@/lib/printify"
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

interface MerchClientProps {
  initialProducts: PrintifyProduct[]
  shopTitle?: string
}

const CATEGORIES = ["All", "T-Shirts", "Headwear", "Outerwear", "Accessories", "Gear"] as const
type Category = (typeof CATEGORIES)[number]

export function MerchClient({ initialProducts, shopTitle = "StarCast Supply Company" }: MerchClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category>("All")
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured")
  const [selectedProduct, setSelectedProduct] = useState<PrintifyProduct | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

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

  const openProductModal = (product: PrintifyProduct) => {
    setSelectedProduct(product)
    setActiveImageIndex(0)
    setSelectedSize(product.sizes[0] || null)
    setSelectedColor(product.colors[0] || null)
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
            <span>OFFICIAL MERCHANDISE DISPATCH // {shopTitle.toUpperCase()}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#f5f7ff] sm:text-5xl lg:text-6xl">
            StarCast{" "}
            <span className="bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] bg-clip-text text-transparent">
              Supply Co.
            </span>
          </h1>

          <p className="mt-4 text-base text-[#9a9fc4] sm:text-lg leading-relaxed">
            Official StarCast broadcast apparel, snapbacks, custom varsity jackets, and accessories. Crafted on-demand with premium fabrics and printed with archival precision.
          </p>

          {/* Quick Perks / Trust Signals */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-[#c5caea]">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-[#20efe0]" />
              <span>Official Printify Fulfillment</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <Truck className="h-4 w-4 text-[#ffd166]" />
              <span>Direct Worldwide Shipping</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#20205a] bg-[#05052d]/80 px-3 py-1.5">
              <RotateCcw className="h-4 w-4 text-[#ea6f2a]" />
              <span>On-Demand Production</span>
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
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] ?? 0
            if (cat !== "All" && count === 0) return null
            const isActive = selectedCategory === cat

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "border border-[#ea6f2a] bg-[#ea6f2a] text-white shadow-[0_0_15px_rgba(234,111,42,0.35)]"
                    : "border border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-[#ea6f2a]/50 hover:bg-[#121248] hover:text-[#f5f7ff]"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-black/20 text-white" : "bg-[#20205a]/60 text-[#7f84ad]"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── PRODUCT COUNT HEADER ── */}
      <div className="flex items-center justify-between border-b border-[#20205a]/60 pb-3 text-xs text-[#7f84ad]">
        <span>
          Showing <strong className="text-[#ffd166]">{filteredProducts.length}</strong> items
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        <span>Prices in USD</span>
      </div>

      {/* ── PRODUCTS GRID ── */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#20205a] bg-[#0c0c3f]/40 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ea6f2a]/10 border border-[#ea6f2a]/30 text-[#ea6f2a] mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-[#f5f7ff]">No merchandise found</h3>
          <p className="mt-2 text-sm text-[#7f84ad] max-w-sm">
            We couldn't find any gear matching your search or filters. Try adjusting your keywords or clearing the category filter.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("All")
            }}
            className="mt-6 bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/90 via-[#0c0c3f]/70 to-[#050522] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#ea6f2a]/70 hover:shadow-[0_12px_30px_rgba(234,111,42,0.18)]"
            >
              {/* Product Media Area */}
              <div
                className="relative aspect-square w-full overflow-hidden bg-[#050519] cursor-pointer"
                onClick={() => openProductModal(product)}
              >
                {/* Product primary image */}
                <Image
                  src={product.primaryImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Secondary image preview on hover if available */}
                {product.secondaryImage && (
                  <Image
                    src={product.secondaryImage}
                    alt={`${product.title} alternate angle`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    loading="lazy"
                  />
                )}

                {/* Category Badge Top-Left */}
                <div className="absolute left-3 top-3">
                  <Badge
                    variant="outline"
                    className="border-[#20205a] bg-[#05051f]/85 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-[#c5caea] backdrop-blur-md"
                  >
                    {product.category}
                  </Badge>
                </div>

                {/* Price Tag Top-Right */}
                <div className="absolute right-3 top-3">
                  <span className="rounded-full border border-[#ffd166]/40 bg-[#05051f]/90 px-2.5 py-1 text-xs font-black text-[#ffd166] shadow-sm backdrop-blur-md">
                    {product.price}
                  </span>
                </div>

                {/* Quick view hover action button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-full border border-white/20 bg-[#0c0c3f]/90 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-[#ea6f2a] hover:border-[#ea6f2a]"
                  >
                    <Eye className="h-3.5 w-3.5" /> Quick View
                  </Button>
                </div>
              </div>

              {/* Product Info & Action */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3
                    onClick={() => openProductModal(product)}
                    className="cursor-pointer text-base font-bold text-[#f5f7ff] line-clamp-2 transition-colors hover:text-[#ea6f2a]"
                    title={product.title}
                  >
                    {product.title}
                  </h3>

                  {/* Sizes & Colors preview */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#7f84ad]">
                    {product.sizes.length > 0 && (
                      <span className="rounded bg-[#05052d] px-1.5 py-0.5 border border-[#20205a]">
                        {product.sizes.length} {product.sizes.length === 1 ? "size" : "sizes"}
                      </span>
                    )}
                    {product.colors.length > 0 && (
                      <span className="rounded bg-[#05052d] px-1.5 py-0.5 border border-[#20205a]">
                        {product.colors.length} {product.colors.length === 1 ? "color" : "colors"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#20205a]/60 flex items-center gap-2">
                  <Button
                    onClick={() => openProductModal(product)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#20205a] bg-[#05052d]/60 text-xs text-[#c5caea] hover:bg-[#05052d] hover:text-white"
                  >
                    Details
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-[#ea6f2a] hover:bg-[#bc3f00] text-xs font-bold text-white shadow-md shadow-[#ea6f2a]/20"
                  >
                    <a href={product.checkoutUrl} target="_blank" rel="noopener noreferrer">
                      Buy Now <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
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
          <DialogContent className="w-[96vw] max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] md:max-h-[88vh] overflow-y-auto border border-[#20205a] bg-[#0a0a28]/98 p-6 sm:p-8 md:p-10 text-[#f5f7ff] shadow-2xl backdrop-blur-2xl">
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
                      SKU: {selectedProduct.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7ff] leading-snug">
                    {selectedProduct.title}
                  </h2>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#ffd166] drop-shadow-[0_0_12px_rgba(255,209,102,0.3)]">
                      {selectedProduct.price}
                    </span>
                    <span className="text-xs text-[#7f84ad]">USD (on-demand fulfillment)</span>
                  </div>

                  {/* Sizes (if available) */}
                  {selectedProduct.sizes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                        Available Sizes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedSize === size
                                ? "border-[#ffd166] bg-[#ffd166]/15 text-[#ffd166]"
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
                        Available Colors
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                              selectedColor === color
                                ? "border-[#20efe0] bg-[#20efe0]/15 text-[#20efe0]"
                                : "border-[#20205a] bg-[#0c0c3f]/80 text-[#9a9fc4] hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-[#c5caea] uppercase tracking-wider">
                        Item Description
                      </span>
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-[#20205a]/60 bg-[#05052d]/60 p-3 text-xs text-[#9a9fc4] leading-relaxed whitespace-pre-line scrollbar-thin">
                        {selectedProduct.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkout Section */}
                <div className="space-y-3 pt-4 border-t border-[#20205a]">
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-[#ea6f2a] via-[#f7803b] to-[#ea6f2a] text-sm sm:text-base font-bold text-white shadow-xl shadow-[#ea6f2a]/25 hover:from-[#f7803b] hover:to-[#ea6f2a]"
                  >
                    <a href={selectedProduct.checkoutUrl} target="_blank" rel="noopener noreferrer">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Order on StarCast Store <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>

                  <p className="text-center text-[11px] text-[#7f84ad]">
                    Order handled securely by StarCast Supply Co. via Printify. Fast production &amp; tracking provided upon checkout.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
