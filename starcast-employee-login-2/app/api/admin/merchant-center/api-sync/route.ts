import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "@/lib/require-admin-route"
import {
  testGoogleMerchantConnection,
  buildGoogleMerchantPayloads,
  syncAllProductsToGoogleMerchant,
  MERCHANT_CENTER_ID,
} from "@/lib/google-merchant-api"

export const dynamic = "force-dynamic"

function isAuthorized(req: NextRequest, adminCheck: { ok: boolean }) {
  if (adminCheck.ok) return true
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return true
  }
  return false
}

/**
 * GET: Diagnostic inspection and payload preview.
 */
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdminRoute()
  if (!isAuthorized(req, adminCheck)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [connection, payloadsData] = await Promise.all([
      testGoogleMerchantConnection(),
      buildGoogleMerchantPayloads(),
    ])

    return NextResponse.json({
      merchantCenterId: MERCHANT_CENTER_ID,
      connection,
      summary: {
        totalProducts: payloadsData.productCount,
        totalVariantsReadyForSync: payloadsData.variantCount,
      },
      previewPayloads: payloadsData.payloads.slice(0, 3),
      instructions: [
        "1. In Google Cloud Console (project starcastonline-live), ensure 'Google Content API for Shopping' (shoppingcontent.googleapis.com) or 'Merchant API' is enabled.",
        "2. In Google Merchant Center (merchants.google.com), go to Settings (gear) > People and access.",
        `3. Verify that your service account email (or admin email) has 'Admin' access to Merchant Center ID ${MERCHANT_CENTER_ID}.`,
        "4. Trigger POST /api/admin/merchant-center/api-sync to push all products and variants directly into Google Merchant Center via API.",
      ],
    })
  } catch (err: any) {
    console.error("Error inspecting Google Merchant API status:", err)
    return NextResponse.json(
      { error: err.message || "Failed to inspect Merchant API status" },
      { status: 500 }
    )
  }
}

/**
 * POST: Execute live synchronization of all store products to Google Merchant Center.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdminRoute()
  if (!isAuthorized(req, adminCheck)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncAllProductsToGoogleMerchant()
    return NextResponse.json(result, { status: result.success ? 200 : 207 })
  } catch (err: any) {
    console.error("Error executing Google Merchant API sync:", err)
    return NextResponse.json(
      {
        success: false,
        merchantId: MERCHANT_CENTER_ID,
        error: err.message || "Failed to execute Merchant API sync",
      },
      { status: 500 }
    )
  }
}

