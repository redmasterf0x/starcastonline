"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useShopifyCart } from "./cart-context"
import { Button } from "@/components/ui/button"

export function CartDrawer() {
  const {
    items,
    totalQuantity,
    subtotal,
    currencyCode,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    proceedToCheckout,
    isCheckingOut,
    isSyncing,
  } = useShopifyCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
      />

      {/* Slide-out Panel */}
      <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#0c0c3f] via-[#07072a] to-[#050524] border-l border-[#20205a] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#20205a]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#f5f7ff] flex items-center gap-2">
                Your Supply Cart
                {totalQuantity > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#ea6f2a] text-white">
                    {totalQuantity}
                  </span>
                )}
              </h3>
              <p className="text-[11px] font-mono text-[#9a9fc4]">
                StarCast Supply Co. // Shopify Checkout
              </p>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-[#05052d] border border-[#20205a] text-[#9a9fc4] hover:text-white hover:border-white/30 flex items-center justify-center transition-all"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#20205a]/40 border border-[#20205a] flex items-center justify-center mx-auto text-[#9a9fc4]">
                <ShoppingBag className="w-8 h-8 opacity-50" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#f5f7ff]">Your cart is empty</h4>
                <p className="text-xs text-[#9a9fc4] mt-1 max-w-xs mx-auto">
                  Grab official tees, hoodies, snapbacks, and broadcast gear from StarCast Supply.
                </p>
              </div>
              <Button
                onClick={closeCart}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl text-xs h-10 px-5"
              >
                Explore Merch
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="rounded-2xl border border-[#20205a]/80 bg-[#05052d]/80 p-3.5 flex gap-3.5 items-center relative group hover:border-[#ea6f2a]/40 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0c0c3f] border border-[#20205a] shrink-0">
                  <Image
                    src={item.image || "/images/spacemanlogo.png"}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#f5f7ff] truncate">
                    {item.productTitle}
                  </h4>
                  {item.variantTitle && item.variantTitle !== "Default Title" && (
                    <p className="text-xs text-[#20efe0] font-medium mt-0.5">
                      {item.variantTitle}
                    </p>
                  )}
                  <p className="text-sm font-black text-[#ffd166] mt-1 font-mono">
                    ${(item.price * item.quantity).toFixed(2)} {currencyCode}
                  </p>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-[#9a9fc4] hover:text-red-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center border border-[#20205a] rounded-lg bg-[#0c0c3f] text-xs">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="px-2 py-1 text-[#9a9fc4] hover:text-white transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 py-1 font-mono font-bold text-white min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="px-2 py-1 text-[#9a9fc4] hover:text-white transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[#20205a] bg-[#05052d]/95 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#9a9fc4]">
                <span>Items Subtotal</span>
                <span className="font-mono text-sm font-bold text-[#f5f7ff]">
                  ${subtotal.toFixed(2)} {currencyCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#9a9fc4]">
                <span>Taxes &amp; Shipping</span>
                <span className="text-[11px] text-[#20efe0]">
                  Calculated at Shopify checkout
                </span>
              </div>
            </div>

            <Button
              onClick={proceedToCheckout}
              disabled={isCheckingOut || isSyncing}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ea6f2a] via-[#f7803b] to-[#ea6f2a] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#ea6f2a]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Shopify...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Checkout With Shopify</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7f84ad]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#20efe0]" />
              <span>Direct encrypted checkout powered by Shopify</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CartFloatingButton() {
  const { totalQuantity, openCart } = useShopifyCart()

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#ea6f2a] to-[#f7803b] text-white font-bold shadow-[0_0_25px_rgba(234,111,42,0.4)] hover:scale-105 active:scale-95 transition-all"
      aria-label="Open cart"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="text-xs uppercase tracking-wider font-extrabold">Cart</span>
      {totalQuantity > 0 && (
        <span className="w-5 h-5 rounded-full bg-black/60 text-[#ffd166] text-xs font-mono font-black flex items-center justify-center">
          {totalQuantity}
        </span>
      )}
    </button>
  )
}
