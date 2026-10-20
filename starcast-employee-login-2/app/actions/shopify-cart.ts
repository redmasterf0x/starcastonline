"use server"

import {
  createShopifyCart,
  addLinesToShopifyCart,
  updateShopifyCartLine,
  removeShopifyCartLines,
  getShopifyCart,
  buildShopifyPermalink,
  type ShopifyCart,
} from "@/lib/shopify"

export async function actionCreateCart(
  lines: { merchandiseId: string; quantity: number }[] = []
): Promise<ShopifyCart | null> {
  try {
    return await createShopifyCart(lines)
  } catch (err) {
    console.error("actionCreateCart error:", err)
    return null
  }
}

export async function actionAddToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart | null> {
  try {
    return await addLinesToShopifyCart(cartId, lines)
  } catch (err) {
    console.error("actionAddToCart error:", err)
    return null
  }
}

export async function actionUpdateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  try {
    return await updateShopifyCartLine(cartId, lineId, quantity)
  } catch (err) {
    console.error("actionUpdateCartLine error:", err)
    return null
  }
}

export async function actionRemoveCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  try {
    return await removeShopifyCartLines(cartId, lineIds)
  } catch (err) {
    console.error("actionRemoveCartLines error:", err)
    return null
  }
}

export async function actionGetCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    return await getShopifyCart(cartId)
  } catch (err) {
    console.error("actionGetCart error:", err)
    return null
  }
}

export async function actionGetCheckoutUrl(
  cartId: string | null,
  fallbackItems: { merchandiseId: string; quantity: number }[] = []
): Promise<string> {
  if (cartId) {
    const cart = await getShopifyCart(cartId)
    if (cart?.checkoutUrl) {
      return cart.checkoutUrl
    }
  }

  if (fallbackItems.length > 0) {
    return buildShopifyPermalink(fallbackItems)
  }

  return "/merch"
}
