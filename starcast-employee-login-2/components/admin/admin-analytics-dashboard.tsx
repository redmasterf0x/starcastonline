"use client"

import { useEffect, useState, useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  Music,
  Calendar,
  Sparkles,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { adminGetAnalyticsOverview } from "@/app/actions/admin"

interface AnalyticsData {
  profiles: Array<{ id: string; createdAt: string; isAdmin: boolean; isEmployee: boolean; role: string; socialBanned: boolean }>
  bookings: Array<{ id: string; startsAt: string; createdAt: string; status: string; totalAmount: number; hours: number }>
  bands: Array<{ id: string; name: string; type: string; ticketingStatus: string; hasActivePass: boolean; musicCatalogEnabled: boolean; createdAt: string }>
  sponsors: Array<{ id: string; packageName: string; amountCents: number; status: string; createdAt: string }>
  posts: Array<{ id: string; createdAt: string }>
  articles: Array<{ id: string; approved: boolean; createdAt: string }>
}

type TimeRange = "30d" | "90d" | "all"
type ChartFocus = "all" | "growth" | "finance" | "roster"

const BRAND_COLORS = {
  orange: "#ea6f2a",
  cyan: "#20efe0",
  amber: "#ffd166",
  green: "#22b573",
  blue: "#3b82f6",
  purple: "#a855f7",
  muted: "#9a9fc4",
  navy: "#20205a",
}

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [chartFocus, setChartFocus] = useState<ChartFocus>("all")

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await adminGetAnalyticsOverview()
      setData(res as AnalyticsData)
    } catch (err) {
      console.error("Failed to load analytics overview", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter window based on timeRange
  const cutoffDate = useMemo(() => {
    if (timeRange === "all") return new Date(0)
    const now = new Date()
    const days = timeRange === "30d" ? 30 : 90
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  }, [timeRange])

  // Aggregate time-series trends (grouped into buckets)
  const timeSeriesData = useMemo(() => {
    if (!data) return []

    // Map by YYYY-MM-DD (or YYYY-MM for "all")
    const buckets: Record<string, { date: string; members: number; bookings: number; posts: number; revenue: number }> = {}

    const isAll = timeRange === "all"
    const formatDate = (iso: string) => {
      const d = new Date(iso)
      if (isAll) {
        return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      }
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    // Initialize buckets based on days
    const daysCount = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 180
    const now = new Date()
    for (let i = daysCount - 1; i >= 0; i -= isAll ? 15 : 2) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = formatDate(d.toISOString())
      if (!buckets[key]) {
        buckets[key] = { date: key, members: 0, bookings: 0, posts: 0, revenue: 0 }
      }
    }

    // Members
    data.profiles.forEach((p) => {
      const d = new Date(p.createdAt)
      if (d >= cutoffDate) {
        const key = formatDate(p.createdAt)
        if (!buckets[key]) buckets[key] = { date: key, members: 0, bookings: 0, posts: 0, revenue: 0 }
        buckets[key].members += 1
      }
    })

    // Bookings & Revenue
    data.bookings.forEach((b) => {
      const d = new Date(b.createdAt)
      if (d >= cutoffDate) {
        const key = formatDate(b.createdAt)
        if (!buckets[key]) buckets[key] = { date: key, members: 0, bookings: 0, posts: 0, revenue: 0 }
        buckets[key].bookings += 1
        buckets[key].revenue += Number(b.totalAmount || 0)
      }
    })

    // Posts
    data.posts.forEach((p) => {
      const d = new Date(p.createdAt)
      if (d >= cutoffDate) {
        const key = formatDate(p.createdAt)
        if (!buckets[key]) buckets[key] = { date: key, members: 0, bookings: 0, posts: 0, revenue: 0 }
        buckets[key].posts += 1
      }
    })

    return Object.values(buckets)
  }, [data, cutoffDate, timeRange])

  // Key KPI Computations
  const stats = useMemo(() => {
    if (!data) return { totalUsers: 0, totalRevenue: 0, studioRevenue: 0, sponsorRevenue: 0, totalBookings: 0, totalBands: 0, passHolders: 0, paidSponsors: 0 }

    const totalUsers = data.profiles.length
    const studioRevenue = data.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    const sponsorRevenue = data.sponsors
      .filter((s) => s.status === "paid" || s.status === "active")
      .reduce((sum, s) => sum + (s.amountCents || 0) / 100, 0)
    const totalRevenue = studioRevenue + sponsorRevenue

    const totalBookings = data.bookings.length
    const totalBands = data.bands.length
    const passHolders = data.bands.filter((b) => b.hasActivePass).length
    const paidSponsors = data.sponsors.filter((s) => s.status === "paid" || s.status === "active").length

    return {
      totalUsers,
      totalRevenue,
      studioRevenue,
      sponsorRevenue,
      totalBookings,
      totalBands,
      passHolders,
      paidSponsors,
    }
  }, [data])

  // Distribution Data: Membership roles
  const roleDistribution = useMemo(() => {
    if (!data) return []
    let admins = 0
    let staff = 0
    let community = 0

    data.profiles.forEach((p) => {
      if (p.isAdmin) admins += 1
      else if (p.isEmployee || p.role === "staff") staff += 1
      else community += 1
    })

    return [
      { name: "Community Members", value: community || 1, color: BRAND_COLORS.cyan },
      { name: "Staff & Crew", value: staff, color: BRAND_COLORS.orange },
      { name: "Administrators", value: admins, color: BRAND_COLORS.amber },
    ].filter((item) => item.value > 0)
  }, [data])

  // Distribution Data: Bands vs Solo Artists
  const bandRosterDistribution = useMemo(() => {
    if (!data || data.bands.length === 0) {
      return [
        { name: "Bands & Groups", value: 1, color: BRAND_COLORS.orange },
        { name: "Solo Artists", value: 0, color: BRAND_COLORS.cyan },
      ]
    }
    const bandsCount = data.bands.filter((b) => b.type === "band").length
    const artistsCount = data.bands.filter((b) => b.type === "artist").length

    return [
      { name: "Bands / Groups", value: bandsCount, color: BRAND_COLORS.orange },
      { name: "Solo Artists", value: artistsCount, color: BRAND_COLORS.cyan },
    ].filter((item) => item.value > 0)
  }, [data])

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="bg-[#0c0c3f]/95 border border-[#20205a] rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs font-bold text-[#ffd166] uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-[#f5f7ff]">
                {entry.name.includes("Revenue") ? `$${Number(entry.value).toLocaleString()}` : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-[#0c0c3f]/40 border border-[#20205a]/40 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[320px] text-center">
        <RefreshCw className="w-8 h-8 text-[#ea6f2a] animate-spin mb-3" />
        <p className="text-[#f5f7ff] font-medium text-sm">Aggregating StarCast Live Telemetry & Visuals...</p>
        <p className="text-[#9a9fc4] text-xs mt-1">Connecting to database telemetry & active GCP workspace</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Visual Suite Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#ea6f2a]/15 text-[#ea6f2a] border border-[#ea6f2a]/30">
              Live Network Telemetry
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20efe0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20efe0]"></span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f5f7ff] mt-1 flex items-center gap-2">
            Network Analytics & Visual Velocity
          </h2>
          <p className="text-xs text-[#9a9fc4]">
            Real-time activity trends, studio volume, financial velocity, and community rosters.
          </p>
        </div>

        {/* Controls: Focus Toggle, Time Window & Refresh */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Time Filter */}
          <div className="flex items-center bg-[#05052d]/80 border border-[#20205a]/60 rounded-xl p-1 text-xs">
            {(["30d", "90d", "all"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  timeRange === r
                    ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/20"
                    : "text-[#9a9fc4] hover:text-[#f5f7ff]"
                }`}
              >
                {r === "30d" ? "30 Days" : r === "90d" ? "90 Days" : "All-Time"}
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#20205a]/60 hover:bg-[#20205a] text-[#f5f7ff] border border-[#20205a]/80 transition-all ml-auto sm:ml-0"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#20efe0] ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 hover:border-[#ea6f2a]/40 rounded-2xl p-5 backdrop-blur-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9a9fc4] uppercase tracking-wider">Total Members</span>
            <div className="w-8 h-8 rounded-xl bg-[#ea6f2a]/15 text-[#ea6f2a] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#f5f7ff]">{stats.totalUsers}</span>
            <span className="text-xs text-[#20efe0] flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-[#9a9fc4] mt-2">
            {roleDistribution.find((r) => r.name.includes("Community"))?.value || 0} active community profiles
          </p>
        </div>

        {/* Financial Velocity */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 hover:border-[#ffd166]/40 rounded-2xl p-5 backdrop-blur-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9a9fc4] uppercase tracking-wider">Total Volume</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffd166]/15 text-[#ffd166] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#ffd166]">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-[#9a9fc4] mt-2">
            ${stats.studioRevenue.toFixed(0)} studio + ${stats.sponsorRevenue.toFixed(0)} sponsors
          </p>
        </div>

        {/* Studio & Passes */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 hover:border-[#20efe0]/40 rounded-2xl p-5 backdrop-blur-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9a9fc4] uppercase tracking-wider">Studio Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-[#20efe0]/15 text-[#20efe0] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#f5f7ff]">{stats.totalBookings}</span>
            <span className="text-xs text-[#20efe0] font-medium">{stats.passHolders} VIP Passes</span>
          </div>
          <p className="text-[11px] text-[#9a9fc4] mt-2">Studio production sessions logged</p>
        </div>

        {/* Bands & Artists */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 hover:border-purple-400/40 rounded-2xl p-5 backdrop-blur-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9a9fc4] uppercase tracking-wider">Roster Profiles</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#f5f7ff]">{stats.totalBands}</span>
            <span className="text-xs text-purple-400 font-medium">Original Music</span>
          </div>
          <p className="text-[11px] text-[#9a9fc4] mt-2">Active bands & featured solo artists</p>
        </div>
      </div>

      {/* Main Interactive Chart: Platform Growth Velocity */}
      <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#ea6f2a]" />
              Platform Velocity & Engagement Trajectory
            </h3>
            <p className="text-xs text-[#9a9fc4]">
              Trends across member registrations, studio bookings, and community pulse.
            </p>
          </div>

          {/* Sub-Filters */}
          <div className="flex items-center gap-2 text-xs bg-[#05052d]/60 border border-[#20205a]/40 p-1 rounded-xl">
            {[
              { id: "all", label: "All Signals" },
              { id: "growth", label: "Signups & Posts" },
              { id: "finance", label: "Revenue" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setChartFocus(f.id as ChartFocus)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartFocus === f.id
                    ? "bg-[#20205a] text-[#f5f7ff] shadow-sm"
                    : "text-[#9a9fc4] hover:text-[#f5f7ff]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Flame Orange Gradient */}
                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.orange} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={BRAND_COLORS.orange} stopOpacity={0.0} />
                </linearGradient>
                {/* Electric Cyan Gradient */}
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.cyan} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={BRAND_COLORS.cyan} stopOpacity={0.0} />
                </linearGradient>
                {/* Neon Amber Gradient */}
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.amber} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={BRAND_COLORS.amber} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#20205a" opacity={0.35} />
              <XAxis dataKey="date" stroke="#9a9fc4" fontSize={11} tickLine={false} axisLine={{ stroke: "#20205a" }} />
              <YAxis stroke="#9a9fc4" fontSize={11} tickLine={false} axisLine={{ stroke: "#20205a" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, color: "#9a9fc4" }}
              />

              {chartFocus !== "finance" && (
                <Area
                  type="monotone"
                  name="New Members"
                  dataKey="members"
                  stroke={BRAND_COLORS.orange}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMembers)"
                />
              )}

              {chartFocus !== "finance" && (
                <Area
                  type="monotone"
                  name="Studio Bookings"
                  dataKey="bookings"
                  stroke={BRAND_COLORS.cyan}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              )}

              {chartFocus === "finance" && (
                <Area
                  type="monotone"
                  name="Estimated Revenue ($)"
                  dataKey="revenue"
                  stroke={BRAND_COLORS.amber}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Visuals Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual 1: Community Distribution Donut */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#f5f7ff] flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#20efe0]" />
                Community & Network Composition
              </h3>
              <span className="text-xs text-[#9a9fc4]">{stats.totalUsers} Total Accounts</span>
            </div>
            <p className="text-xs text-[#9a9fc4] mb-4">
              Breakdown of verified roles across administrators, staff broadcast crew, and active community members.
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0c0c3f" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 10, fontSize: 12, color: "#9a9fc4" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 2: Band & Artist Roster Split */}
        <div className="bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#f5f7ff] flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                Artist & Band Roster Distribution
              </h3>
              <span className="text-xs text-[#9a9fc4]">{stats.totalBands} Registered</span>
            </div>
            <p className="text-xs text-[#9a9fc4] mb-4">
              Profile split between multi-member bands and solo artists featured on StarCast live streaming.
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bandRosterDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bandRosterDistribution.map((entry, index) => (
                    <Cell key={`cell-band-${index}`} fill={entry.color} stroke="#0c0c3f" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 10, fontSize: 12, color: "#9a9fc4" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
