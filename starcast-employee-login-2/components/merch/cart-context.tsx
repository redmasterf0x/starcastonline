"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  actionCreateCart,
  actionAddToCart,
  actionUpdateCartLine,
  actionRemoveCartLines,
  actionGetCart,
  actionGetCheckoutUrl,
} from "@/app/actions/shopify-cart"
import { buildShopifyPermalink, type ShopifyCart } from "@/lib/shopify"
import { toast } from "sonner"

export interface LocalCartItem {
  variantId: string
  lineId?: string
  productId: string
  productTitle: string
  productHandle: string
  variantTitle: string
  price: number
  currencyCode?: string
  image: string
  quantity: number
  selectedOptions?: { name: string; value: string }[]
}

interface CartContextValue {
  items: LocalCartItem[]
  totalQuantity: number
  subtotal: number
  currencyCode: string
  isOpen: boolean
  isSyncing: boolean
  isCheckingOut: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (item: Omit<LocalCartItem, "quantity">, quantity?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => void
  proceedToCheckout: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "starcast_shopify_cart_v1"
const CART_ID_KEY = "starcast_shopify_cart_id"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [cartId, setCartId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEY)
      if (savedItems) {
        setItems(JSON.parse(savedItems))
      }
      const savedCartId = localStorage.getItem(CART_ID_KEY)
      if (savedCartId) {
        setCartId(savedCartId)
      }
    } catch {}
  }, [])

  // Save to LocalStorage whenever items change
  const saveItems = (newItems: LocalCartItem[]) => {
    setItems(newItems)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
    } catch {}
  }

  const saveCartId = (id: string | null) => {
    setCartId(id)
    try {
      if (id) {
        localStorage.setItem(CART_ID_KEY, id)
      } else {
        localStorage.removeItem(CART_ID_KEY)
      }
    } catch {}
  }

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const currencyCode = items[0]?.currencyCode || "USD"

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen((prev) => !prev)

  // Add Item to Cart
  const addItem = async (
    itemData: Omit<LocalCartItem, "quantity">,
    quantity: number = 1
  ) => {
    const existingIndex = items.findIndex((i) => i.variantId === itemData.variantId)
    let nextItems: LocalCartItem[]

    if (existingIndex > -1) {
      nextItems = [...items]
      nextItems[existingIndex].quantity += quantity
    } else {
      nextItems = [...items, { ...itemData, quantity }]
    }

    saveItems(nextItems)
    openCart()
    toast.success(`Added ${itemData.productTitle} to your cart!`)

    // Background sync with Shopify Storefront Cart
    setIsSyncing(true)
    try {
      if (!cartId) {
        const lines = nextItems.map((i) => ({
          merchandiseId: i.variantId,
          quantity: i.quantity,
        }))
        const newCart = await actionCreateCart(lines)
        if (newCart?.id) {
          saveCartId(newCart.id)
        }
      } else {
        const updated = await actionAddToCart(cartId, [
          { merchandiseId: itemData.variantId, quantity },
        ])
        if (updated?.id) {
          saveCartId(updated.id)
        }
      }
    } catch (err) {
      console.warn("Shopify cart sync error:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Update item quantity
  const updateQuantity = async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(variantId)
      return
    }

    const nextItems = items.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    )
    saveItems(nextItems)

    if (cartId) {
      setIsSyncing(true)
      try {
        const item = items.find((i) => i.variantId === variantId)
        if (item?.lineId) {
          await actionUpdateCartLine(cartId, item.lineId, quantity)
        }
      } catch (err) {
        console.warn("Shopify cart line update error:", err)
      } finally {
        setIsSyncing(false)
      }
    }
  }

  // Remove item
  const removeItem = async (variantId: string) => {
    const itemToRemove = items.find((i) => i.variantId === variantId)
    const nextItems = items.filter((i) => i.variantId !== variantId)
    saveItems(nextItems)

    if (cartId && itemToRemove?.lineId) {
      setIsSyncing(true)
      try {
        await actionRemoveCartLines(cartId, [itemToRemove.lineId])
      } catch (err) {
        console.warn("Shopify cart line removal error:", err)
      } finally {
        setIsSyncing(false)
      }
    }
  }

  const clearCart = () => {
    saveItems([])
    saveCartId(null)
  }

  // Proceed to Shopify checkout
  const proceedToCheckout = async () => {
    if (items.length === 0) return

    setIsCheckingOut(true)
    try {
      const fallbackLines = items.map((i) => ({
        merchandiseId: i.variantId,
        quantity: i.quantity,
      }))

      let checkoutUrl: string | null = null

      if (cartId) {
        const cart = await actionGetCart(cartId)
        if (cart?.checkoutUrl) {
          checkoutUrl = cart.checkoutUrl
        }
      }

      if (!checkoutUrl) {
        // Try creating fresh cart
        const freshCart = await actionCreateCart(fallbackLines)
        if (freshCart?.checkoutUrl) {
          checkoutUrl = freshCart.checkoutUrl
        }
      }

      // Final fallback: Shopify Cart Permalink
      if (!checkoutUrl) {
        checkoutUrl = buildShopifyPermalink(fallbackLines)
      }

      // Redirect user to secure Shopify Checkout
      window.location.href = checkoutUrl
    } catch (err) {
      console.error("Checkout redirection error:", err)
      // Ultimate fallback
      const fallbackUrl = buildShopifyPermalink(
        items.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity }))
      )
      window.location.href = fallbackUrl
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        subtotal,
        currencyCode,
        isOpen,
        isSyncing,
        isCheckingOut,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        proceedToCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useShopifyCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useShopifyCart must be used within a CartProvider")
  }
  return context
}
