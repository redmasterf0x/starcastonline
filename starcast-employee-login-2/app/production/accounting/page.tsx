"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getCrewAccountingDetails,
  startPayoutOnboarding,
  openPayoutDashboard,
  type CrewAccountingData,
} from "@/app/actions/stripe-connect"
import { getProductionViewer } from "@/app/actions/production"
import { authClient } from "@/lib/auth-client"
import {
  DollarSign,
  Download,
  Building,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Receipt,
  Loader2,
  RefreshCw,
} from "lucide-react"

export default function ProductionAccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<CrewAccountingData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const viewer = await getProductionViewer()
      if (!viewer) {
        router.push("/login?redirect=/production/accounting")
        return
      }
      if (!viewer.is_employee && !viewer.is_admin) {
        router.push("/dashboard")
        return
      }
      setIsAdmin(viewer.is_admin || false)
      setIsCrew(viewer.is_employee || false)

      const accounting = await getCrewAccountingDetails()
      setData(accounting)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  const handleOpenStripe = async () => {
    setActionLoading(true)
    try {
      if (data?.status === "active") {
        const { url } = await openPayoutDashboard()
        window.location.href = url
      } else {
        const { url } = await startPayoutOnboarding()
        window.location.href = url
      }
    } catch (e) {
      console.error(e)
      setActionLoading(false)
    }
  }

  // Export to CSV for Tax reporting / bookkeeping
  const handleExportCSV = () => {
    if (!data) return

    const rows: string[][] = [
      ["Starcast Media - Crew Earnings & Payout Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Stripe Account ID: ${data.stripeAccountId || "N/A"}`],
      [`Status: ${data.status}`],
      [],
      ["--- Payout History ---"],
      ["Payout ID", "Created Date", "Arrival Date", "Destination", "Status", "Amount (USD)"],
      ...data.payouts.map((p) => [
        p.id,
        new Date(p.created).toLocaleDateString(),
        p.arrivalDate ? new Date(p.arrivalDate).toLocaleDateString() : "Pending",
        p.destinationLast4 ? `****${p.destinationLast4}` : "Bank/Card",
        p.status,
        `$${(p.amountCents / 100).toFixed(2)}`,
      ]),
      [],
      ["--- Ledger Transactions ---"],
      ["Transaction ID", "Date", "Description", "Type", "Gross (USD)", "Fee (USD)", "Net (USD)"],
      ...data.transactions.map((t) => [
        t.id,
        new Date(t.created).toLocaleDateString(),
        t.description || "Production Crew Payout",
        t.type,
        `$${(t.amountCents / 100).toFixed(2)}`,
        `$${(t.feeCents / 100).toFixed(2)}`,
        `$${(t.netCents / 100).toFixed(2)}`,
      ]),
    ]

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `starcast_crew_accounting_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#20efe0] animate-spin" />
      </div>
    )
  }

  const primaryBank = data?.bankDetails?.[0]

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader isLoggedIn={true} isAdmin={isAdmin} isCrew={isCrew} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back navigation & header */}
        <div className="mb-8">
          <Link
            href="/production"
            className="inline-flex items-center gap-2 text-sm text-[#9a9fc4] hover:text-[#20efe0] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Production Schedule
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#f5f7ff] flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-[#22b573]" />
                Crew Accounting &amp; Payouts
              </h1>
              <p className="text-sm sm:text-base text-[#9a9fc4] mt-1">
                Tax records, payout history, and external bank account management.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
                className="border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Refresh
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-[#20205a] hover:bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/30 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export for Taxes (CSV)
              </Button>
            </div>
          </div>
        </div>

        {/* Payout Connection Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Payout Status */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#9a9fc4] text-xs uppercase tracking-wider font-mono">
                Payout Account Status
              </CardDescription>
              <CardTitle className="text-xl text-[#f5f7ff] flex items-center gap-2">
                {data?.status === "active" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#22b573]" />
                    <span className="text-[#7fe0ae]">Active &amp; Ready</span>
                  </>
                ) : data?.status === "onboarding" ? (
                  <>
                    <Clock className="w-5 h-5 text-[#f2a04a]" />
                    <span className="text-[#f2a04a]">Onboarding Incomplete</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">Not Connected</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#9a9fc4] mb-4">
                {data?.status === "active"
                  ? "Your payout method is verified. Starcast payments will deposit directly into your linked bank or debit card."
                  : "Complete your payout details so production staff can send earnings to your account."}
              </p>
              <Button
                onClick={handleOpenStripe}
                disabled={actionLoading}
                className={`w-full text-xs font-semibold ${
                  data?.status === "active"
                    ? "bg-[#22b573] hover:bg-[#28c982] text-[#05052d]"
                    : "bg-[#ea6f2a] hover:bg-[#f2a04a] text-white"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                )}
                {data?.status === "active" ? "Update Bank / Card on Stripe" : "Complete Payout Setup"}
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Linked Payout Method */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#9a9fc4] text-xs uppercase tracking-wider font-mono">
                Linked Payout Method
              </CardDescription>
              <CardTitle className="text-xl text-[#f5f7ff] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#20efe0]" />
                {primaryBank ? primaryBank.bankName : "No Account Linked"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryBank ? (
                <div className="space-y-1">
                  <p className="text-sm font-mono text-[#f5f7ff]">
                    Account ending in <span className="text-[#20efe0] font-bold">••••{primaryBank.last4}</span>
                  </p>
                  <p className="text-xs text-[#9a9fc4]">Verification: {primaryBank.status}</p>
                </div>
              ) : (
                <p className="text-xs text-[#9a9fc4]">
                  Link a bank account (Chime, Stride, Chase, etc.) or debit card to receive disbursements.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Payout Balance */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#9a9fc4] text-xs uppercase tracking-wider font-mono">
                Current Balance
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-[#f5f7ff]">
                ${((data?.availableBalanceCents || 0) / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-[#9a9fc4]">
                <span>Pending clearance:</span>
                <span className="font-mono text-[#f5f7ff]">
                  ${((data?.pendingBalanceCents || 0) / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-[#9a9fc4]/70 mt-2">
                Balances automatically transfer according to your Stripe daily payout schedule.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payout & Accounting History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payouts list */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#f5f7ff] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#22b573]" />
                  Payout Disbursements
                </CardTitle>
                <span className="text-xs text-[#9a9fc4]">
                  {data?.payouts.length || 0} recorded
                </span>
              </div>
              <CardDescription className="text-[#9a9fc4]">
                Direct transfers sent from Starcast to your personal account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.payouts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#20205a] rounded-xl">
                  <Receipt className="w-8 h-8 text-[#9a9fc4]/40 mx-auto mb-2" />
                  <p className="text-[#9a9fc4] text-sm">No payouts have been issued yet.</p>
                  <p className="text-xs text-[#9a9fc4]/60 mt-1">
                    When you are paid for crew assignments, completed transfers will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#20205a]/60 bg-[#05052d]/60"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#f5f7ff]">
                          ${(p.amountCents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-[#9a9fc4]">
                          {new Date(p.created).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {p.arrivalDate &&
                            ` • Arrived ${new Date(p.arrivalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                          p.status === "paid"
                            ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                            : p.status === "in_transit"
                            ? "bg-blue-950/50 text-blue-300 border-blue-500/40"
                            : "bg-amber-950/50 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ledger / Itemized Transactions */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#f5f7ff] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#20efe0]" />
                  Itemized Ledger
                </CardTitle>
                <span className="text-xs text-[#9a9fc4]">
                  {data?.transactions.length || 0} entries
                </span>
              </div>
              <CardDescription className="text-[#9a9fc4]">
                Individual line-item production earnings and tax breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.transactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#20205a] rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-[#9a9fc4]/40 mx-auto mb-2" />
                  <p className="text-[#9a9fc4] text-sm">No transaction ledger records found.</p>
                  <p className="text-xs text-[#9a9fc4]/60 mt-1">
                    Export your ledger at tax time to hand off to your CPA or accountant.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#20205a]/60 bg-[#05052d]/60"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#f5f7ff]">
                          {t.description || "Crew Service Compensation"}
                        </p>
                        <p className="text-xs text-[#9a9fc4]">
                          {new Date(t.created).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-[#7fe0ae]">
                          +${(t.netCents / 100).toFixed(2)}
                        </p>
                        {t.feeCents > 0 && (
                          <p className="text-[10px] text-[#9a9fc4]">
                            Fee: ${(t.feeCents / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
