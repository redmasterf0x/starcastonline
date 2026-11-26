"use client"

import { useMemo, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { BarChart3, TrendingUp } from "lucide-react"

interface SalesOrder {
  id: string
  eventId: string
  eventTitle: string
  bandName: string
  quantity: number
  totalCents: number
  platformFeeCents: number
  netCents: number
  paymentMethod: "stripe" | "cash"
  createdAt: string
}

interface SalesChartProps {
  orders: SalesOrder[]
}

function getCentralDateKey(iso: string, monthly: boolean): { key: string; label: string } {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value || "2026"
  const m = parts.find((p) => p.type === "month")?.value || "01"
  const day = parts.find((p) => p.type === "day")?.value || "01"

  if (monthly) {
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      year: "2-digit",
    }).format(d)
    return { key: `${y}-${m}`, label }
  }

  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
  }).format(d)
  return { key: `${y}-${m}-${day}`, label }
}

export function SellerSalesChart({ orders }: SalesChartProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "events">("timeline")
  const [metric, setMetric] = useState<"revenue" | "tickets">("revenue")

  const timelineData = useMemo(() => {
    if (orders.length === 0) return []
    const timestamps = orders.map((o) => new Date(o.createdAt).getTime())
    const spanDays = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)
    const useMonthly = spanDays > 45

    const buckets = new Map<
      string,
      {
        key: string
        label: string
        stripe: number
        cash: number
        net: number
        tickets: number
      }
    >()

    for (const o of orders) {
      const { key, label } = getCentralDateKey(o.createdAt, useMonthly)
      const existing = buckets.get(key) || {
        key,
        label,
        stripe: 0,
        cash: 0,
        net: 0,
        tickets: 0,
      }
      if (o.paymentMethod === "cash") {
        existing.cash += o.totalCents / 100
      } else {
        existing.stripe += o.totalCents / 100
      }
      existing.net += o.netCents / 100
      existing.tickets += o.quantity
      buckets.set(key, existing)
    }

    return Array.from(buckets.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({
        ...b,
        stripe: Number(b.stripe.toFixed(2)),
        cash: Number(b.cash.toFixed(2)),
        net: Number(b.net.toFixed(2)),
      }))
  }, [orders])

  const eventData = useMemo(() => {
    if (orders.length === 0) return []
    const buckets = new Map<
      string,
      {
        name: string
        fullTitle: string
        stripe: number
        cash: number
        net: number
        tickets: number
      }
    >()

    for (const o of orders) {
      const existing = buckets.get(o.eventId) || {
        name: o.eventTitle.length > 22 ? `${o.eventTitle.slice(0, 20)}…` : o.eventTitle,
        fullTitle: o.eventTitle,
        stripe: 0,
        cash: 0,
        net: 0,
        tickets: 0,
      }
      if (o.paymentMethod === "cash") {
        existing.cash += o.totalCents / 100
      } else {
        existing.stripe += o.totalCents / 100
      }
      existing.net += o.netCents / 100
      existing.tickets += o.quantity
      buckets.set(o.eventId, existing)
    }

    return Array.from(buckets.values())
      .sort((a, b) => b.stripe + b.cash - (a.stripe + a.cash))
      .slice(0, 10)
      .map((b) => ({
        ...b,
        stripe: Number(b.stripe.toFixed(2)),
        cash: Number(b.cash.toFixed(2)),
        net: Number(b.net.toFixed(2)),
      }))
  }, [orders])

  return (
    <section className="rounded-3xl border border-[#20205a] bg-[#0c0c3f]/80 p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#f5f7ff] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#20efe0]" />
            Sales Performance
          </h2>
          <p className="text-xs text-[#9a9fc4]">
            Live breakdown of your Stripe online and door cash ticket sales based on your active filters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-[#05052d] border border-[#20205a] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === "timeline"
                  ? "bg-[#ea6f2a] text-white"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              Over Time
            </button>
            <button
              type="button"
              onClick={() => setViewMode("events")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === "events"
                  ? "bg-[#ea6f2a] text-white"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              By Event
            </button>
          </div>

          <div className="inline-flex rounded-xl bg-[#05052d] border border-[#20205a] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMetric("revenue")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                metric === "revenue"
                  ? "bg-[#20efe0] text-[#05051f]"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              Revenue ($)
            </button>
            <button
              type="button"
              onClick={() => setMetric("tickets")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                metric === "tickets"
                  ? "bg-[#20efe0] text-[#05051f]"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              Tickets
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="h-60 rounded-2xl border border-dashed border-[#20205a] bg-[#05052d]/40 flex flex-col items-center justify-center text-center p-6 gap-2">
          <BarChart3 className="w-8 h-8 text-[#9a9fc4]/50" />
          <p className="text-sm font-semibold text-[#cbd0f2]">No sales data to chart yet</p>
          <p className="text-xs text-[#9a9fc4] max-w-sm">
            Once fans buy tickets online or you log door cash sales, your revenue and ticket volume charts will appear here.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "timeline" && metric === "revenue" ? (
              <AreaChart data={timelineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="stripeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20efe0" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#20efe0" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#20205a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#20205a" }}
                />
                <YAxis
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#05052d",
                    borderColor: "#20205a",
                    borderRadius: "12px",
                    color: "#f5f7ff",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: string) => [`$${Number(value).toFixed(2)}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="stripe"
                  name="Stripe Online"
                  stackId="1"
                  stroke="#20efe0"
                  strokeWidth={2}
                  fill="url(#stripeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cash"
                  name="Door Cash"
                  stackId="1"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#cashGrad)"
                />
              </AreaChart>
            ) : viewMode === "timeline" && metric === "tickets" ? (
              <BarChart data={timelineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20205a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#20205a" }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#05052d",
                    borderColor: "#20205a",
                    borderRadius: "12px",
                    color: "#f5f7ff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar
                  dataKey="tickets"
                  name="Tickets Sold"
                  fill="#ea6f2a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            ) : (
              <BarChart data={eventData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20205a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#20205a" }}
                />
                <YAxis
                  allowDecimals={metric === "revenue"}
                  stroke="#9a9fc4"
                  tick={{ fill: "#9a9fc4", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (metric === "revenue" ? `$${v}` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#05052d",
                    borderColor: "#20205a",
                    borderRadius: "12px",
                    color: "#f5f7ff",
                    fontSize: "12px",
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle || ""}
                  formatter={(value: any, name: string) =>
                    metric === "revenue"
                      ? [`$${Number(value).toFixed(2)}`, name]
                      : [value, name]
                  }
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                {metric === "revenue" ? (
                  <>
                    <Bar
                      dataKey="stripe"
                      name="Stripe Online"
                      stackId="a"
                      fill="#20efe0"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="cash"
                      name="Door Cash"
                      stackId="a"
                      fill="#34d399"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="tickets"
                    name="Tickets Sold"
                    fill="#ffd166"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
