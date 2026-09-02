"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Music, CalendarClock, DollarSign, TrendingUp, Check, X, LogIn, LogOut,
  Pencil, Trash2, RefreshCw, Ticket, BadgeCheck,
} from "lucide-react"
import { listAllBands, setBandPass } from "@/app/actions/bands"
import {
  listAllBookings, setBookingStatus, checkInBooking, checkOutBooking,
  adjustBookingPrice, deleteBooking,
} from "@/app/actions/bookings"
import {
  listPayments, logPayment, updatePayment, deletePayment, getRevenueSummary,
} from "@/app/actions/payments"

type Band = Awaited<ReturnType<typeof listAllBands>>[number]
type Booking = Awaited<ReturnType<typeof listAllBookings>>[number]
type Payment = Awaited<ReturnType<typeof listPayments>>[number]
type Revenue = Awaited<ReturnType<typeof getRevenueSummary>>

type Section = "bookings" | "bands" | "payments" | "revenue"

const money = (n: number) => `$${n.toFixed(2)}`
const dt = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-900/30 text-yellow-400 border-yellow-700/40",
  confirmed: "bg-blue-900/30 text-blue-300 border-blue-700/40",
  checked_in: "bg-green-900/30 text-green-400 border-green-700/40",
  completed: "bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]",
  cancelled: "bg-red-900/30 text-red-400 border-red-700/40",
}
const PAY_STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-900/30 text-green-400 border-green-700/40",
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-700/40",
  refunded: "bg-red-900/30 text-red-400 border-red-700/40",
  void: "bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]",
}

/**
 * Shared studio management surface used by both the admin panel and the staff
 * operational dashboard.
 * - `canDelete` gates admin-only destructive actions (delete booking/payment).
 * - `canViewRevenue` gates the admin-only revenue analytics tab.
 */
export function StudioManager({
  canDelete = false,
  canViewRevenue = false,
}: {
  canDelete?: boolean
  canViewRevenue?: boolean
}) {
  const [section, setSection] = useState<Section>("bookings")
  const [loading, setLoading] = useState(true)
  const [bands, setBands] = useState<Band[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [error, setError] = useState("")

  // Dialog state
  const [priceDialog, setPriceDialog] = useState<Booking | null>(null)
  const [rateInput, setRateInput] = useState("")
  const [hoursInput, setHoursInput] = useState("")
  const [payDialog, setPayDialog] = useState<{ mode: "new" | "edit"; payment?: Payment } | null>(null)
  const [payForm, setPayForm] = useState<PayForm>(emptyPayForm)
  const [passDialog, setPassDialog] = useState<Band | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError("")
    try {
      const [b, bk, p] = await Promise.all([listAllBands(), listAllBookings(), listPayments()])
      setBands(b)
      setBookings(bk)
      setPayments(p)
      if (canViewRevenue) setRevenue(await getRevenueSummary())
    } catch (e: any) {
      setError(e?.message || "Failed to load studio data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sections: { id: Section; label: string; icon: any; show: boolean }[] = [
    { id: "bookings", label: "Bookings", icon: CalendarClock, show: true },
    { id: "bands", label: "Bands", icon: Music, show: true },
    { id: "payments", label: "Payments", icon: DollarSign, show: true },
    { id: "revenue", label: "Revenue", icon: TrendingUp, show: canViewRevenue },
  ]

  return (
    <div className="space-y-6">
      {/* Section switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {sections.filter((s) => s.show).map((s) => {
          const Icon = s.icon
          const active = section === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                active
                  ? "bg-[#ea6f2a] text-[#05052d] border-[#ea6f2a]"
                  : "bg-[#0c0c3f]/60 text-[#9a9fc4] border-[#20205a]/50 hover:text-[#f5f7ff]"
              }`}
            >
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          )
        })}
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          className="ml-auto text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* BOOKINGS */}
      {section === "bookings" && (
        <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
          <CardHeader>
            <CardTitle className="text-[#f5f7ff]">Bookings ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-[#9a9fc4] text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((bk) => (
                  <div key={bk.id} className="p-4 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#f5f7ff]">{bk.band_name || "Unknown band"}</p>
                          <Badge className={`border ${STATUS_COLORS[bk.status] || ""}`}>
                            {bk.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {bk.title && <p className="text-sm text-[#9a9fc4]">{bk.title}</p>}
                        <p className="text-sm text-[#9a9fc4] mt-1">
                          {dt(bk.starts_at)} → {dt(bk.ends_at)}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="text-[#9a9fc4]">{bk.hours}h @ {money(bk.hourly_rate_charged)}/hr = </span>
                          <span className="text-[#ea6f2a] font-semibold">{money(bk.total_amount)}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bk.status === "requested" && (
                          <Button size="sm" onClick={() => act(() => setBookingStatus(bk.id, "confirmed"))} className="bg-blue-600 hover:bg-blue-700 h-8">
                            <Check className="w-4 h-4 mr-1" /> Confirm
                          </Button>
                        )}
                        {(bk.status === "confirmed" || bk.status === "requested") && (
                          <Button size="sm" onClick={() => act(() => checkInBooking(bk.id))} className="bg-green-600 hover:bg-green-700 h-8">
                            <LogIn className="w-4 h-4 mr-1" /> Check In
                          </Button>
                        )}
                        {bk.status === "checked_in" && (
                          <Button size="sm" onClick={() => act(() => checkOutBooking(bk.id))} className="bg-[#ea6f2a] hover:bg-[#bc3f00] h-8">
                            <LogOut className="w-4 h-4 mr-1" /> Check Out
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPriceDialog(bk); setRateInput(String(bk.hourly_rate_charged)); setHoursInput(String(bk.hours)) }}
                          className="h-8 border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Price
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPayDialog({ mode: "new" }); setPayForm({ ...emptyPayForm, bandId: bk.band_id, bookingId: bk.id, amount: String(bk.total_amount) }) }}
                          className="h-8 border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                        >
                          <DollarSign className="w-4 h-4 mr-1" /> Log Pay
                        </Button>
                        {bk.status !== "cancelled" && (
                          <Button size="sm" variant="outline" onClick={() => act(() => setBookingStatus(bk.id, "cancelled"))} className="h-8 border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="outline" onClick={() => act(() => deleteBooking(bk.id))} className="h-8 border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BANDS */}
      {section === "bands" && (
        <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
          <CardHeader>
            <CardTitle className="text-[#f5f7ff]">Bands ({bands.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bands.length === 0 ? (
              <p className="text-[#9a9fc4] text-center py-8">No bands registered yet</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {bands.map((b) => (
                  <div key={b.id} className="p-4 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#f5f7ff] truncate">{b.name}</p>
                        {b.genre && <p className="text-xs text-[#9a9fc4]">{b.genre}</p>}
                        <p className="text-xs text-[#9a9fc4] mt-1">{b.contact_email || "no email"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {b.has_active_pass ? (
                          <Badge className="border bg-green-900/30 text-green-400 border-green-700/40">
                            <Ticket className="w-3 h-3 mr-1" /> Pass
                          </Badge>
                        ) : (
                          <Badge className="border bg-[#20205a]/50 text-[#9a9fc4] border-[#20205a]">No pass</Badge>
                        )}
                        {b.youtube_agreement_signed && (
                          <Badge className="border bg-blue-900/30 text-blue-300 border-blue-700/40">
                            <BadgeCheck className="w-3 h-3 mr-1" /> Agreement
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPassDialog(b)}
                        className="h-8 border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                      >
                        <Ticket className="w-4 h-4 mr-1" /> Manage Pass
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PAYMENTS */}
      {section === "payments" && (
        <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#f5f7ff]">Payment Ledger ({payments.length})</CardTitle>
            <Button
              size="sm"
              onClick={() => { setPayDialog({ mode: "new" }); setPayForm(emptyPayForm) }}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
            >
              <DollarSign className="w-4 h-4 mr-1" /> Log Payment
            </Button>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-[#9a9fc4] text-center py-8">No payments logged yet</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#f5f7ff]">{money(p.amount)}</span>
                        <Badge className={`border ${PAY_STATUS_COLORS[p.status] || ""}`}>{p.status}</Badge>
                        <span className="text-xs text-[#9a9fc4] capitalize">{p.method}</span>
                        <span className="text-xs text-[#9a9fc4]">· {p.kind}</span>
                      </div>
                      <p className="text-xs text-[#9a9fc4] mt-0.5">
                        {p.band_name || "—"} · {p.paid_at ? `paid ${dt(p.paid_at)}` : `logged ${dt(p.created_at)}`}
                      </p>
                      {p.note && <p className="text-xs text-[#9a9fc4] italic mt-0.5">{p.note}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setPayDialog({ mode: "edit", payment: p }); setPayForm({ bandId: p.band_id, bookingId: p.booking_id || "", amount: String(p.amount), method: p.method, status: p.status, kind: p.kind, note: p.note }) }}
                        className="h-8 border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button size="sm" variant="outline" onClick={() => act(() => deletePayment(p.id))} className="h-8 border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REVENUE (admin only) */}
      {section === "revenue" && canViewRevenue && revenue && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardContent className="pt-6">
                <p className="text-sm text-[#9a9fc4]">Total Collected</p>
                <p className="text-3xl font-bold text-[#ea6f2a]">{money(revenue.total_collected)}</p>
              </CardContent>
            </Card>
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardContent className="pt-6">
                <p className="text-sm text-[#9a9fc4]">Outstanding (Pending)</p>
                <p className="text-3xl font-bold text-yellow-400">{money(revenue.total_pending)}</p>
              </CardContent>
            </Card>
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardContent className="pt-6">
                <p className="text-sm text-[#9a9fc4]">Total Records</p>
                <p className="text-3xl font-bold text-[#f5f7ff]">{revenue.payment_count}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
            <CardHeader><CardTitle className="text-[#f5f7ff] text-lg">Collected by Method</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(revenue.by_method).length === 0 ? (
                <p className="text-[#9a9fc4] text-center py-4">No collected payments yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(revenue.by_method).map(([method, amt]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-[#05052d]/50 rounded-lg border border-[#20205a]/30">
                      <span className="text-[#f5f7ff] capitalize">{method}</span>
                      <span className="text-[#ea6f2a] font-semibold">{money(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price dialog */}
      <Dialog open={!!priceDialog} onOpenChange={(o) => !o && setPriceDialog(null)}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader><DialogTitle>Adjust Booking Price</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-[#9a9fc4]">Hourly rate ($)</label>
              <Input type="number" min="0" step="0.01" value={rateInput} onChange={(e) => setRateInput(e.target.value)} className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
            </div>
            <div>
              <label className="text-sm text-[#9a9fc4]">Hours</label>
              <Input type="number" min="0" step="0.25" value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
            </div>
            <p className="text-sm text-[#9a9fc4]">
              New total: <span className="text-[#ea6f2a] font-semibold">{money((parseFloat(rateInput) || 0) * (parseFloat(hoursInput) || 0))}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPriceDialog(null)} className="text-[#9a9fc4]">Cancel</Button>
            <Button
              onClick={() => priceDialog && act(() => adjustBookingPrice(priceDialog.id, { hourlyRate: parseFloat(rateInput) || 0, hours: parseFloat(hoursInput) || 0 }), () => setPriceDialog(null))}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader><DialogTitle>{payDialog?.mode === "edit" ? "Edit Payment" : "Log Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {payDialog?.mode === "new" && (
              <div>
                <label className="text-sm text-[#9a9fc4]">Band</label>
                <Select value={payForm.bandId} onValueChange={(v) => setPayForm((f) => ({ ...f, bandId: v }))}>
                  <SelectTrigger className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"><SelectValue placeholder="Select a band" /></SelectTrigger>
                  <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                    {bands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#9a9fc4]">Amount ($)</label>
                <Input type="number" min="0" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
              </div>
              <div>
                <label className="text-sm text-[#9a9fc4]">Method</label>
                <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#9a9fc4]">Status</label>
                <Select value={payForm.status} onValueChange={(v) => setPayForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#9a9fc4]">Kind</label>
                <Select value={payForm.kind} onValueChange={(v) => setPayForm((f) => ({ ...f, kind: v }))}>
                  <SelectTrigger className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#9a9fc4]">Note</label>
              <Textarea value={payForm.note || ""} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog(null)} className="text-[#9a9fc4]">Cancel</Button>
            <Button
              onClick={() => {
                if (!payDialog) return
                if (payDialog.mode === "new") {
                  if (!payForm.bandId) { setError("Select a band"); return }
                  act(() => logPayment({
                    bandId: payForm.bandId,
                    bookingId: payForm.bookingId || null,
                    amount: parseFloat(payForm.amount) || 0,
                    method: payForm.method,
                    status: payForm.status,
                    kind: payForm.kind,
                    note: payForm.note ?? undefined,
                  }), () => setPayDialog(null))
                } else if (payDialog.payment) {
                  act(() => updatePayment(payDialog.payment!.id, {
                    amount: parseFloat(payForm.amount) || 0,
                    method: payForm.method,
                    status: payForm.status,
                    kind: payForm.kind,
                    note: payForm.note ?? undefined,
                  }), () => setPayDialog(null))
                }
              }}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass dialog */}
      <PassDialog band={passDialog} onClose={() => setPassDialog(null)} onSaved={refresh} onError={setError} />
    </div>
  )

  // helper closures ---------------------------------------------------------
  async function act(fn: () => Promise<any>, after?: () => void) {
    try {
      await fn()
      after?.()
      await refresh()
    } catch (e: any) {
      setError(e?.message || "Action failed")
    }
  }
}

type PayForm = {
  bandId: string
  bookingId: string
  amount: string
  method: string
  status: string
  kind: string
  note: string | null
}

const emptyPayForm: PayForm = { bandId: "", bookingId: "", amount: "", method: "cash", status: "pending", kind: "booking", note: "" }

function PassDialog({
  band, onClose, onSaved, onError,
}: {
  band: Band | null
  onClose: () => void
  onSaved: () => void
  onError: (m: string) => void
}) {
  const [active, setActive] = useState(false)
  const [expires, setExpires] = useState("")

  useEffect(() => {
    if (band) {
      setActive(band.has_active_pass)
      setExpires(band.pass_expires_at ? band.pass_expires_at.slice(0, 10) : "")
    }
  }, [band])

  return (
    <Dialog open={!!band} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
        <DialogHeader><DialogTitle>Manage Pass — {band?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#f5f7ff]">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-[#ea6f2a]" />
            Active studio pass
          </label>
          <div>
            <label className="text-sm text-[#9a9fc4]">Expires (optional)</label>
            <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#9a9fc4]">Cancel</Button>
          <Button
            onClick={async () => {
              if (!band) return
              try {
                await setBandPass(band.id, active, expires ? new Date(expires).toISOString() : null)
                onClose()
                onSaved()
              } catch (e: any) {
                onError(e?.message || "Failed to update pass")
              }
            }}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00]"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
