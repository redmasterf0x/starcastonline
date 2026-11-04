"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  Send,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DiagnosticData {
  merchantCenterId: string
  connection: {
    ok: boolean
    merchantId: string
    clientEmail?: string
    error?: string
  }
  summary: {
    totalProducts: number
    totalVariantsReadyForSync: number
  }
  previewPayloads: Array<{
    offerId: string
    title: string
    price: { value: string; currency: string }
    availability: string
    imageLink: string
    googleProductCategory: string
  }>
  instructions: string[]
}

interface SyncResponse {
  success: boolean
  merchantId: string
  totalAttempted: number
  insertedCount: number
  failedCount: number
  errors: Array<{ offerId: string; message: string }>
  durationMs: number
  error?: string
}

export default function AdminMerchantPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null)
  const [copiedFeed, setCopiedFeed] = useState(false)

  async function loadDiagnostics() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/merchant-center/api-sync")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        console.error("Failed to fetch merchant diagnostics", await res.text())
      }
    } catch (err) {
      console.error("Error loading diagnostics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiagnostics()
  }, [])

  async function handleTriggerSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/admin/merchant-center/api-sync", {
        method: "POST",
      })
      const result = await res.json()
      setSyncResult(result)
      // Refresh status
      loadDiagnostics()
    } catch (err: any) {
      setSyncResult({
        success: false,
        merchantId: data?.merchantCenterId || "5899246056",
        totalAttempted: 0,
        insertedCount: 0,
        failedCount: 0,
        errors: [{ offerId: "general", message: err.message || "Failed to trigger sync" }],
        durationMs: 0,
      })
    } finally {
      setSyncing(false)
    }
  }

  const feedUrl = "https://starcast.online/google-merchant-feed.xml"

  function copyFeedUrl() {
    navigator.clipboard.writeText(feedUrl)
    setCopiedFeed(true)
    setTimeout(() => setCopiedFeed(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#05052d] text-[#f5f7ff] flex flex-col selection:bg-[#ea6f2a] selection:text-white">
      <ResponsiveHeader currentPage="/admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ffd166] hover:text-[#ea6f2a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDiagnostics}
              disabled={loading || syncing}
              className="border-[#20205a] bg-[#0c0c3f] text-[#c4c7da] hover:text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
            <a
              href={`https://merchants.google.com/mc/overview?a=${data?.merchantCenterId || "5899246056"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ea6f2a]/40 bg-[#ea6f2a]/10 text-[#ea6f2a] hover:bg-[#ea6f2a]/20 text-xs font-bold transition-colors"
            >
              Open Merchant Center <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Hero Header */}
        <header className="space-y-2 pb-6 border-b border-[#20205a]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20efe0]/15 border border-[#20efe0]/40 text-[#20efe0] text-xs font-mono uppercase">
            <ShoppingBag className="w-4 h-4" /> Google Merchant Center &amp; YouTube Shopping
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Google Merchant API <span className="text-[#ffd166]">Product Hub</span>
          </h1>
          <p className="text-sm text-[#9a9fc4] max-w-3xl">
            Directly push StarCast store merchandise into Google Merchant Center via Google&apos;s Content &amp;
            Merchant API, enabling automatic shopping product tags on YouTube shows, Google Search, and shopping tabs.
          </p>
        </header>

        {/* Grid 1: Account Status & Sync Trigger */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Account & API Connection */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/80 text-[#f5f7ff]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Account &amp; API Status</span>
                {data?.connection?.ok ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10">
                    Action Needed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-[#7f84ad]">
                Merchant Center ID:{" "}
                <span className="font-mono text-[#ffd166] font-bold">
                  {data?.merchantCenterId || "5899246056"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#05052d] border border-[#20205a] space-y-1.5">
                <div className="text-[#7f84ad]">Identity / Service Account:</div>
                <div className="font-mono text-[11px] text-[#20efe0] break-all">
                  {data?.connection?.clientEmail || "Default Google Cloud Service Account"}
                </div>
              </div>

              {data?.connection?.error && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> API Access Notice:
                  </div>
                  <div className="text-[11px] leading-relaxed break-words">
                    {data.connection.error}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-[#9a9fc4]">
                <span>Automated XML Feed:</span>
                <button
                  onClick={copyFeedUrl}
                  className="inline-flex items-center gap-1 text-[#ffd166] hover:underline font-mono text-[11px]"
                >
                  {copiedFeed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedFeed ? "Copied" : "Copy URL"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Catalog Ready for Sync */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/80 text-[#f5f7ff]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#20efe0]" /> Storefront Inventory
              </CardTitle>
              <CardDescription className="text-xs text-[#7f84ad]">
                Live Shopify Storefront products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#05052d] border border-[#20205a]">
                  <div className="text-2xl font-black text-[#ffd166] font-mono">
                    {data?.summary?.totalProducts ?? "..."}
                  </div>
                  <div className="text-[11px] text-[#7f84ad] uppercase font-bold mt-1">
                    Products
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#05052d] border border-[#20205a]">
                  <div className="text-2xl font-black text-[#20efe0] font-mono">
                    {data?.summary?.totalVariantsReadyForSync ?? "..."}
                  </div>
                  <div className="text-[11px] text-[#7f84ad] uppercase font-bold mt-1">
                    Variants (SKUs)
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#9a9fc4] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Target Country:</span>
                  <span className="font-mono font-bold text-white">United States (US)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Currency:</span>
                  <span className="font-mono font-bold text-white">USD ($)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Return Policy:</span>
                  <Link href="/return-policy" className="text-[#20efe0] hover:underline">
                    30-Day Policy Active →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Action Trigger */}
          <Card className="border-[#20205a] bg-gradient-to-br from-[#0c0c3f] to-[#05052d] text-[#f5f7ff] flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-[#ea6f2a]" /> Merchant API Sync
              </CardTitle>
              <CardDescription className="text-xs text-[#7f84ad]">
                Push entire product catalog via Google Content API custombatch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#c4c7da] leading-relaxed">
                Executes a live API synchronization to insert or update all items, prices, images,
                variants, and stock directly in Merchant Center without waiting for feed crawler schedules.
              </p>

              <Button
                onClick={handleTriggerSync}
                disabled={syncing || loading}
                className="w-full bg-[#ea6f2a] hover:bg-[#d05d1d] text-white font-bold text-xs py-5 rounded-xl shadow-lg shadow-[#ea6f2a]/20 transition-all flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pushing Products to Google...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sync Products to Google API Now
                  </>
                )}
              </Button>

              {syncResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    syncResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {syncResult.success ? "Sync Successful!" : "Sync Completed with Notices"}
                  </div>
                  <div className="text-[11px] font-mono">
                    Attempted: {syncResult.totalAttempted} &middot; Inserted:{" "}
                    {syncResult.insertedCount} &middot; Failed: {syncResult.failedCount} (
                    {(syncResult.durationMs / 1000).toFixed(1)}s)
                  </div>
                  {syncResult.errors.length > 0 && (
                    <div className="pt-1 text-[10px] space-y-1 max-h-24 overflow-y-auto">
                      {syncResult.errors.slice(0, 3).map((e, idx) => (
                        <div key={idx} className="font-mono text-red-300">
                          {e.offerId}: {e.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step-by-Step API Setup Instructions */}
        <section className="p-6 rounded-2xl bg-[#0c0c3f]/50 border border-[#20205a] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ffd166]" /> Google Merchant API Configuration Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#c4c7da]">
            <div className="p-4 rounded-xl bg-[#05052d] border border-[#20205a] space-y-2">
              <div className="font-bold text-[#20efe0] flex items-center gap-1.5">
                <span>1.</span> Grant Service Account Access in Merchant Center
              </div>
              <p className="leading-relaxed">
                Log into{" "}
                <a
                  href={`https://merchants.google.com/mc/overview?a=${data?.merchantCenterId || "5899246056"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffd166] hover:underline"
                >
                  Google Merchant Center
                </a>
                , click the <strong>Gear icon (Settings)</strong> &gt; <strong>People and access</strong> &gt;{" "}
                <strong>Add user</strong>. Enter your Google Cloud Service Account email and assign it{" "}
                <strong>Admin</strong> access.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#05052d] border border-[#20205a] space-y-2">
              <div className="font-bold text-[#ffd166] flex items-center gap-1.5">
                <span>2.</span> Enable Shopping Content API in Google Cloud
              </div>
              <p className="leading-relaxed">
                In Google Cloud Console for project <code className="text-[#20efe0]">starcastonline-live</code>,
                ensure the <strong>Google Content API for Shopping</strong> (or <strong>Merchant API</strong>) is
                enabled under APIs &amp; Services.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#05052d] border border-[#20205a] space-y-2">
              <div className="font-bold text-[#ea6f2a] flex items-center gap-1.5">
                <span>3.</span> Connect YouTube Shopping
              </div>
              <p className="leading-relaxed">
                In{" "}
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffd166] hover:underline"
                >
                  YouTube Studio
                </a>{" "}
                &gt; <strong>Earn</strong> &gt; <strong>Shopping</strong>, click <strong>Connect Store</strong> and
                select <strong>Google Merchant Center</strong>, then enter account ID{" "}
                <strong className="text-white font-mono">{data?.merchantCenterId || "5899246056"}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#05052d] border border-[#20205a] space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span>4.</span> Automated Supplemental Feed
              </div>
              <p className="leading-relaxed">
                As a persistent backup, your live XML feed is always serving at{" "}
                <a href={feedUrl} target="_blank" rel="noopener noreferrer" className="text-[#ffd166] hover:underline">
                  {feedUrl}
                </a>
                . You can add it as a Scheduled Fetch in Merchant Center &gt; Data Sources.
              </p>
            </div>
          </div>
        </section>

        {/* Product Payload Preview */}
        {data?.previewPayloads && data.previewPayloads.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#ea6f2a]" /> Sample Merchant API Payloads
                </h2>
                <p className="text-xs text-[#7f84ad]">
                  Showing previews of mapped products and variants formatted for Google Merchant API
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.previewPayloads.map((item) => (
                <div
                  key={item.offerId}
                  className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageLink}
                      alt={item.title}
                      className="w-14 h-14 object-contain rounded-xl bg-[#050519] p-1 border border-[#20205a]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.title}</div>
                      <div className="text-[11px] font-mono text-[#ffd166]">
                        {item.price.currency} ${item.price.value}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] mt-1 border-[#20205a] bg-[#05052d] text-[#20efe0]"
                      >
                        {item.availability}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#20205a] space-y-1 text-[10px] font-mono text-[#7f84ad]">
                    <div>offerId: <span className="text-[#c4c7da]">{item.offerId}</span></div>
                    <div className="truncate">category: <span className="text-[#c4c7da]">{item.googleProductCategory}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

