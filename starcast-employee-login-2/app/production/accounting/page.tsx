"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getCrewAccountingDetails,
  linkCrewBankAccountOnSite,
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
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Receipt,
  Loader2,
  RefreshCw,
  Plus,
  Lock,
} from "lucide-react"

export default function ProductionAccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<CrewAccountingData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)

  // In-page Bank Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [submittingBank, setSubmittingBank] = useState(false)
  const [bankFormError, setBankFormError] = useState<string | null>(null)
  const [bankFormSuccess, setBankFormSuccess] = useState<string | null>(null)
  const [bankFormData, setBankFormData] = useState({
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    confirmAccountNumber: "",
  })

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
      const { url } = await openPayoutDashboard()
      window.location.href = url
    } catch (e) {
      console.error(e)
      setActionLoading(false)
    }
  }

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setBankFormError(null)
    setBankFormSuccess(null)

    if (!bankFormData.accountHolderName.trim()) {
      setBankFormError("Account holder name is required.")
      return
    }
    if (bankFormData.routingNumber.replace(/\D/g, "").length !== 9) {
      setBankFormError("US Bank Routing Number must be exactly 9 digits.")
      return
    }
    if (bankFormData.accountNumber !== bankFormData.confirmAccountNumber) {
      setBankFormError("Account numbers do not match.")
      return
    }
    if (bankFormData.accountNumber.length < 4) {
      setBankFormError("Please enter a valid account number.")
      return
    }

    setSubmittingBank(true)
    try {
      const res = await linkCrewBankAccountOnSite({
        routingNumber: bankFormData.routingNumber,
        accountNumber: bankFormData.accountNumber,
        accountHolderName: bankFormData.accountHolderName,
      })

      if (res.success) {
        setBankFormSuccess(`Successfully linked ${res.bankName} (••••${res.last4})!`)
        setBankFormData({
          accountHolderName: "",
          routingNumber: "",
          accountNumber: "",
          confirmAccountNumber: "",
        })
        await loadData()
        setTimeout(() => {
          setBankModalOpen(false)
          setBankFormSuccess(null)
        }, 1500)
      } else {
        setBankFormError(res.error || "Failed to link bank account.")
      }
    } catch (err: any) {
      setBankFormError(err?.message || "An unexpected error occurred.")
    } finally {
      setSubmittingBank(false)
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
                Direct on-site payout management, earnings ledgers, and CPA tax reporting.
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
                Disbursement Readiness
              </CardDescription>
              <CardTitle className="text-xl text-[#f5f7ff] flex items-center gap-2">
                {data?.status === "active" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#22b573]" />
                    <span className="text-[#7fe0ae]">Payouts Active</span>
                  </>
                ) : data?.status === "onboarding" ? (
                  <>
                    <Clock className="w-5 h-5 text-[#f2a04a]" />
                    <span className="text-[#f2a04a]">Awaiting Bank Info</span>
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
                  ? "Your payout method is verified. Production compensation deposits automatically to your account."
                  : "Link your bank account below so the studio can deposit earnings."}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setBankModalOpen(true)}
                  className="w-full text-xs font-semibold bg-[#22b573] hover:bg-[#28c982] text-[#05052d]"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {primaryBank ? "Update Bank Account" : "Link Bank Account (On-Site)"}
                </Button>
                {data?.status === "active" && (
                  <Button
                    onClick={handleOpenStripe}
                    disabled={actionLoading}
                    variant="ghost"
                    className="w-full text-xs text-[#9a9fc4] hover:text-white"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 mr-1" />}
                    Manage on Stripe Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Linked Payout Method */}
          <Card className="border-[#20205a] bg-[#0c0c3f]/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#9a9fc4] text-xs uppercase tracking-wider font-mono">
                Linked Destination
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
                  <p className="text-xs text-[#7fe0ae] flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Direct ACH Verified
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#9a9fc4]">
                  Link a bank account (Chime, Stride, Chase, etc.) to receive disbursements directly.
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
                Balances automatically transfer according to your daily payout schedule.
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

      {/* ── SECURE IN-PAGE BANK ACCOUNT LINKING MODAL ── */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="bg-[#0b0f33] border-[#20205a] text-[#f5f7ff] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#f5f7ff]">
              <Lock className="w-5 h-5 text-[#22b573]" />
              Secure Payout Account
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Enter your bank details to receive production disbursements. Bank numbers are tokenized securely with 256-bit encryption.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBankAccount} className="space-y-4 py-2">
            {bankFormError && (
              <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{bankFormError}</span>
              </div>
            )}

            {bankFormSuccess && (
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{bankFormSuccess}</span>
              </div>
            )}

            <div>
              <Label htmlFor="accountHolderName" className="text-[#f5f7ff] text-xs">
                Account Holder Legal Name *
              </Label>
              <Input
                id="accountHolderName"
                placeholder="e.g. Ray Starnes"
                value={bankFormData.accountHolderName}
                onChange={(e) =>
                  setBankFormData({ ...bankFormData, accountHolderName: e.target.value })
                }
                required
                className="mt-1 bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>

            <div>
              <Label htmlFor="routingNumber" className="text-[#f5f7ff] text-xs">
                Routing Number (9 Digits) *
              </Label>
              <Input
                id="routingNumber"
                placeholder="e.g. 031101279 (Bancorp) or 084109404 (Stride)"
                value={bankFormData.routingNumber}
                maxLength={9}
                onChange={(e) =>
                  setBankFormData({
                    ...bankFormData,
                    routingNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                required
                className="mt-1 bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber" className="text-[#f5f7ff] text-xs">
                Account Number *
              </Label>
              <Input
                id="accountNumber"
                type="password"
                placeholder="Enter account number"
                value={bankFormData.accountNumber}
                onChange={(e) =>
                  setBankFormData({
                    ...bankFormData,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                required
                className="mt-1 bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="confirmAccountNumber" className="text-[#f5f7ff] text-xs">
                Confirm Account Number *
              </Label>
              <Input
                id="confirmAccountNumber"
                placeholder="Re-enter account number"
                value={bankFormData.confirmAccountNumber}
                onChange={(e) =>
                  setBankFormData({
                    ...bankFormData,
                    confirmAccountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                required
                className="mt-1 bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] font-mono"
              />
            </div>

            <p className="text-[11px] text-[#9a9fc4]/70 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22b573] flex-shrink-0" />
              Direct end-to-end tokenization. Starcast never stores your bank account numbers.
            </p>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submittingBank}
                onClick={() => setBankModalOpen(false)}
                className="border-[#20205a] text-[#9a9fc4] bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingBank}
                className="bg-[#22b573] hover:bg-[#28c982] text-[#05052d] font-semibold"
              >
                {submittingBank ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Bank Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
