"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
  import { authClient } from "@/lib/auth-client"
  import {
    getProductionViewer,
    listProductions,
    listProductionRequests,
    listCrewMembers,
    createProduction,
    updateProduction,
    deleteProduction,
    submitProductionRequest,
    approveProductionRequest,
    rejectProductionRequest,
  } from "@/app/actions/production"
import { getPayoutStatus, startPayoutOnboarding, openPayoutDashboard } from "@/app/actions/stripe-connect"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Calendar,
  List,
  Clock,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
} from "lucide-react"

interface Production {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  status: string
  is_recurring: boolean
  recurrence_frequency: string | null
  recurrence_end_date: string | null
  created_at: string
}

interface ProductionRequest {
  id: string
  title: string
  description: string | null
  requested_date: string
  location: string | null
  requested_by: string
  status: string
  is_recurring: boolean
  recurrence_frequency: string | null
  recurrence_end_date: string | null
  created_at: string
  requester?: {
    first_name: string
    last_name: string
  }
}

interface CrewMember {
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  profile_pic?: string
  location?: string
}

const recurrenceOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const

function formatDateTimeLocal(dateString: string | null) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateLocal(dateString: string | null) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addClampedMonths(date: Date, months: number, anchorDay: number) {
  const result = new Date(date)
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(anchorDay, lastDay))
  return result
}

function nextOccurrence(date: Date, frequency: string, anchorDay: number) {
  if (frequency === "daily" || frequency === "weekly") {
    const result = new Date(date)
    result.setDate(result.getDate() + (frequency === "daily" ? 1 : 7))
    return result
  }
  if (frequency === "monthly" || frequency === "quarterly") {
    return addClampedMonths(date, frequency === "monthly" ? 1 : 3, anchorDay)
  }
  const result = new Date(date)
  const month = result.getMonth()
  result.setFullYear(result.getFullYear() + 1)
  if (result.getMonth() !== month) result.setDate(0)
  return result
}

function expandProductionOccurrences(production: Production) {
  if (!production.is_recurring || !production.recurrence_frequency || !production.recurrence_end_date) return [production]

  const recurrenceEnd = new Date(`${formatDateLocal(production.recurrence_end_date)}T23:59:59`)
  const occurrences: Production[] = []
  const originalStart = new Date(production.start_date)
  const duration = production.end_date ? new Date(production.end_date).getTime() - originalStart.getTime() : null
  let occurrenceStart = originalStart

  for (let index = 0; index < 500 && occurrenceStart <= recurrenceEnd; index += 1) {
    occurrences.push({
      ...production,
      id: index === 0 ? production.id : `${production.id}--occurrence-${index}`,
      start_date: occurrenceStart.toISOString(),
      end_date: duration === null ? null : new Date(occurrenceStart.getTime() + duration).toISOString(),
    })
    occurrenceStart = nextOccurrence(occurrenceStart, production.recurrence_frequency, originalStart.getDate())
  }
  return occurrences
}

export default function ProductionPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  const [canManageCalendar, setCanManageCalendar] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [productions, setProductions] = useState<Production[]>([])
  const [crewCounts, setCrewCounts] = useState<Record<string, number>>({})
  const [requests, setRequests] = useState<ProductionRequest[]>([])
  const [allCrew, setAllCrew] = useState<CrewMember[]>([])
  const [selectedCrew, setSelectedCrew] = useState<{ user_id: string; role: string }[]>([])
  
  const [addDialog, setAddDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [requestDialog, setRequestDialog] = useState(false)
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)

  const [payoutsDialog, setPayoutsDialog] = useState(false)
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutsActionLoading, setPayoutsActionLoading] = useState(false)
  const [payoutStatus, setPayoutStatus] = useState<{
    connected: boolean
    transfersActive: boolean
    status: "not_connected" | "onboarding" | "active"
  } | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    status: "upcoming",
    is_recurring: false,
    recurrence_frequency: "",
    recurrence_end_date: ""
  })

  useEffect(() => {
    const init = async () => {
      await checkUserRole()
      await fetchProductions()
      await fetchRequests()
      await fetchAllCrew()
    }
    init()
  }, [])

  const checkUserRole = async () => {
  const viewer = await getProductionViewer()
  if (viewer) {
      setIsAdmin(viewer.is_admin || false)
      setIsCrew(viewer.is_employee || false)
      setCanManageCalendar(viewer.can_manage_calendar || false)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  const openPayoutsDialog = async () => {
    setPayoutsDialog(true)
    setPayoutsLoading(true)
    try {
      const status = await getPayoutStatus()
      setPayoutStatus(status)
    } catch {
      toast({ title: "Couldn't load payout status", variant: "destructive" })
    } finally {
      setPayoutsLoading(false)
    }
  }

  const handleConnectPayouts = async () => {
    setPayoutsActionLoading(true)
    try {
      const { url } = await startPayoutOnboarding()
      window.location.href = url
    } catch {
      toast({ title: "Couldn't start Stripe onboarding", variant: "destructive" })
      setPayoutsActionLoading(false)
    }
  }

  const handleOpenDashboard = async () => {
    setPayoutsActionLoading(true)
    try {
      const { url } = await openPayoutDashboard()
      window.location.href = url
    } catch {
      toast({ title: "Couldn't open your Stripe dashboard", variant: "destructive" })
      setPayoutsActionLoading(false)
    }
  }

  const fetchProductions = async () => {
    try {
      const { productions: data, crewCounts: counts } = await listProductions()
      setProductions(data as any[])
      setCrewCounts(counts)
    } catch {
      setProductions([])
    }
  }

  const fetchRequests = async () => {
    try {
      const data = await listProductionRequests()
      setRequests(data as any[])
    } catch {
      setRequests([])
    }
  }

  const fetchAllCrew = async () => {
    try {
      const data = await listCrewMembers()
      setAllCrew(data as any[])
    } catch {
      setAllCrew([])
    }
  }

  const validateForm = () => {
    if (!formData.title.trim() || !formData.start_date) {
      toast({ title: "Missing information", description: "Add a title and start date.", variant: "destructive" })
      return false
    }
    if (formData.is_recurring && (!formData.recurrence_frequency || !formData.recurrence_end_date)) {
      toast({ title: "Repeat details required", description: "Choose a frequency and repeat end date.", variant: "destructive" })
      return false
    }
    if (formData.is_recurring && new Date(`${formData.recurrence_end_date}T23:59:59`) < new Date(formData.start_date)) {
      toast({ title: "Invalid repeat end date", description: "The repeat end date must be on or after the start date.", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSaveProduction = async () => {
    if (!validateForm()) return

    let newProduction: { id: string; title: string; start_date: string | null; location: string | null }
    try {
      newProduction = await createProduction(
        {
          title: formData.title,
          description: formData.description || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          location: formData.location || null,
          status: formData.status,
          is_recurring: formData.is_recurring,
          recurrence_frequency: formData.recurrence_frequency,
          recurrence_end_date: formData.recurrence_end_date,
        },
        selectedCrew.map((c) => ({ user_id: c.user_id, role: c.role })),
      )
    } catch {
      toast({ title: "Error", description: "Failed to save production", variant: "destructive" })
      return
    }

    // Send notification emails to assigned crew
    if (selectedCrew.length > 0) {
      // Send notification email to each crew member
      await Promise.all(
        selectedCrew.map((c) => {
          const member = allCrew.find((m) => m.user_id === c.user_id)
          if (!member) return Promise.resolve()
          return fetch("/api/email/production-assigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: member.email,
              phone: member.phone || null,
              firstName: member.first_name,
              productionTitle: newProduction.title,
              productionDate: newProduction.start_date,
              productionLocation: newProduction.location,
              role: c.role || null,
            }),
          })
        })
      )
    }

    toast({ title: "Success", description: `Production created${selectedCrew.length > 0 ? ` and ${selectedCrew.length} crew member${selectedCrew.length > 1 ? "s" : ""} notified` : ""}` })
    setAddDialog(false)
    setSelectedCrew([])
    resetForm()
    fetchProductions()
  }

  const handleUpdateProduction = async () => {
    if (!selectedProduction || !validateForm()) return

    try {
      await updateProduction(selectedProduction.id, {
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        location: formData.location || null,
        status: formData.status,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.recurrence_frequency,
        recurrence_end_date: formData.recurrence_end_date,
      })
      toast({ title: "Success", description: "Production updated successfully" })
      setEditDialog(false)
      setSelectedProduction(null)
      fetchProductions()
    } catch {
      toast({ title: "Error", description: "Failed to update production", variant: "destructive" })
    }
  }

  const handleDeleteProduction = async () => {
    if (!selectedProduction) return

    try {
      await deleteProduction(selectedProduction.id)
      toast({ title: "Success", description: "Production deleted successfully" })
      setDeleteDialog(false)
      setSelectedProduction(null)
      fetchProductions()
    } catch {
      toast({ title: "Error", description: "Failed to delete production", variant: "destructive" })
    }
  }

  const handleSubmitRequest = async () => {
    if (!validateForm()) return
    try {
      await submitProductionRequest({
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date,
        location: formData.location || null,
        status: "pending",
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.recurrence_frequency,
        recurrence_end_date: formData.recurrence_end_date,
      })
      toast({ title: "Success", description: "Request submitted successfully" })
      setRequestDialog(false)
      resetForm()
      fetchRequests()
    } catch {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" })
    }
  }

  const handleApproveRequest = async (request: ProductionRequest) => {
    try {
      await approveProductionRequest({
        id: request.id,
        title: request.title,
        description: request.description,
        requested_date: request.requested_date,
        location: request.location,
        is_recurring: request.is_recurring,
        recurrence_frequency: request.recurrence_frequency,
        recurrence_end_date: request.recurrence_end_date,
      })
      toast({ title: "Success", description: "Request approved and production created" })
      fetchProductions()
      fetchRequests()
    } catch {
      toast({ title: "Error", description: "Failed to approve request", variant: "destructive" })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectProductionRequest(requestId)
      toast({ title: "Success", description: "Request rejected" })
      fetchRequests()
    } catch {
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" })
    }
  }

  const openEditDialog = (prod: Production) => {
    setSelectedProduction(prod)
    setFormData({
      title: prod.title,
      description: prod.description || "",
      start_date: formatDateTimeLocal(prod.start_date),
      end_date: formatDateTimeLocal(prod.end_date),
      location: prod.location || "",
      status: prod.status,
      is_recurring: prod.is_recurring,
      recurrence_frequency: prod.recurrence_frequency || "",
      recurrence_end_date: formatDateLocal(prod.recurrence_end_date),
    })
    setEditDialog(true)
  }

  const openDeleteDialog = (prod: Production) => {
    setSelectedProduction(prod)
    setDeleteDialog(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      location: "",
      status: "upcoming",
      is_recurring: false,
      recurrence_frequency: "",
      recurrence_end_date: ""
    })
    setSelectedProduction(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "border-blue-500 text-blue-400 bg-blue-950/30"
      case "in-progress": return "border-green-500 text-green-400 bg-green-950/30"
      case "completed": return "border-gray-500 text-gray-400 bg-gray-950/30"
      case "cancelled": return "border-red-500 text-red-400 bg-red-950/30"
      default: return "border-[#20205a] text-[#9a9fc4]"
    }
  }

  // ---- Month grid calendar helpers ----
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const calendarProductions = productions.flatMap(expandProductionOccurrences)

  const productionsForDay = (day: Date) =>
    calendarProductions.filter((production) => isSameDay(new Date(production.start_date), day))

  // Build a 6-row (42 cell) grid covering the visible month, padded with
  // leading/trailing days so the grid always starts on Sunday.
  const buildCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = firstOfMonth.getDay() // 0 = Sunday
    const gridStart = new Date(year, month, 1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }

  const goToMonth = (delta: number) =>
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))

  // Open the Add dialog pre-filled with the clicked day (default 9:00 AM call time).
  const openAddForDate = (day: Date) => {
    if (!canManageCalendar) return
    const pad = (n: number) => String(n).padStart(2, "0")
    const dateStr = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T09:00`
    resetForm()
    setFormData((prev) => ({ ...prev, start_date: dateStr }))
    setSelectedCrew([])
    setAddDialog(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-[#9a9fc4]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader isLoggedIn={true} isAdmin={isAdmin} isCrew={isCrew} onSignOut={handleSignOut} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#f5f7ff] mb-2">Productions</h1>
            <p className="text-sm sm:text-base text-[#9a9fc4]">
              {canManageCalendar ? "Manage upcoming shows and projects" : "Upcoming shows and projects for crew members"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canManageCalendar && (
              <Button
                onClick={() => {
                  resetForm()
                  setAddDialog(true)
                }}
                className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Production</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
            {isCrew && !canManageCalendar && (
              <Button
                onClick={() => {
                  resetForm()
                  setRequestDialog(true)
                }}
                className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Request Production</span>
                <span className="sm:hidden">Request</span>
              </Button>
            )}
            {isCrew && (
              <Button
                onClick={openPayoutsDialog}
                variant="outline"
                className="border-[#22b573]/45 bg-[#0c0c3f]/55 text-[#7fe0ae] hover:border-[#22b573]/70 hover:bg-[#22b573]/10 hover:text-[#f5f7ff]"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Money
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
  <Button
    onClick={() => setViewMode("list")}
    variant={viewMode === "list" ? "default" : "outline"}
            className={viewMode === "list" 
              ? "bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              : "border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/20 bg-transparent"}
          >
            <List className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">List View</span>
            <span className="sm:hidden">List</span>
          </Button>
  <Button
    onClick={() => setViewMode("calendar")}
    variant={viewMode === "calendar" ? "default" : "outline"}
            className={viewMode === "calendar" 
              ? "bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              : "border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/20 bg-transparent"}
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </Button>
        </div>

        {/* Crew Panel */}
        <Card className="border-[#20205a] bg-[#0c0c3f]/50 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#f5f7ff] text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ea6f2a]" />
              Crew Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allCrew.length === 0 ? (
              <p className="text-[#9a9fc4] text-sm">No crew members found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allCrew.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#05052d]/50 border border-[#20205a]/50 hover:border-[#ea6f2a]/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/profile/${member.user_id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ea6f2a]/20 to-[#20205a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {member.profile_pic ? (
                        <img src={member.profile_pic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-[#f5f7ff] font-medium">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#f5f7ff] font-medium text-sm truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      {member.location && (
                        <p className="text-[#9a9fc4] text-xs truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {member.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {canManageCalendar && requests.filter(r => r.status === "pending").length > 0 && (
          <Card className="border-[#20205a] bg-[#0c0c3f]/50 mb-6">
            <CardHeader>
              <CardTitle className="text-[#f5f7ff]">Pending Requests ({requests.filter(r => r.status === "pending").length})</CardTitle>
              <CardDescription className="text-[#9a9fc4]">Production requests from crew members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.filter(r => r.status === "pending").map((req) => (
                <div key={req.id} className="p-4 bg-transparent rounded-lg border border-[#20205a]">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-[#f5f7ff] font-medium mb-1">{req.title}</h3>
                      <p className="text-xs text-[#9a9fc4] mb-2">
                        Requested by {req.requester?.first_name} {req.requester?.last_name} • {formatDate(req.created_at)}
                      </p>
                      {req.description && (
                        <p className="text-sm text-[#9a9fc4] mb-2">{req.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-[#9a9fc4]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(req.requested_date)} at {formatTime(req.requested_date)}
                        </span>
                        {req.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {req.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRequest(req)}
                        size="sm"
                        className="bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700"
                      >
                        <CheckCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(req.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent"
                      >
                        <XCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {viewMode === "list" && (
          <div className="space-y-4">
            {productions.length === 0 ? (
              <Card className="border-[#20205a] bg-[#0c0c3f]/50">
                <CardContent className="py-12 text-center">
                  <p className="text-[#9a9fc4]">No upcoming productions</p>
                </CardContent>
              </Card>
            ) : (
              productions.map((prod) => (
                <Card key={prod.id} className="border-[#20205a] bg-[#0c0c3f]/50">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 w-full">
                        <CardTitle className="text-[#f5f7ff] text-lg sm:text-xl mb-2">{prod.title}</CardTitle>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-[#9a9fc4] mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(prod.start_date)} at {formatTime(prod.start_date)}</span>
                          </div>
                          {prod.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{prod.location}</span>
                            </div>
                          )}
                          {prod.is_recurring && prod.recurrence_frequency && prod.recurrence_end_date && (
                            <div className="flex items-center gap-1 text-[#f08a4a]">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="capitalize">Repeats {prod.recurrence_frequency} through {formatDate(prod.recurrence_end_date)}</span>
                            </div>
                          )}
                        </div>
                        {prod.description && (
                          <p className="text-sm text-[#9a9fc4] whitespace-pre-wrap">{prod.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(prod.status)}`}>
                          {prod.status}
                        </span>
                        {canManageCalendar && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => openEditDialog(prod)}
                              size="sm"
                              variant="ghost"
                              className="text-[#ea6f2a] hover:bg-[#ea6f2a]/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => openDeleteDialog(prod)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}

        {viewMode === "calendar" && (
          <section className="overflow-hidden rounded-2xl border border-[#20efe0]/20 bg-[#080936]/75 shadow-[0_0_40px_rgba(32,239,224,0.07),0_20px_60px_rgba(5,5,45,0.3)] backdrop-blur-sm">
            {/* Calendar toolbar */}
            <div className="flex flex-col gap-3 border-b border-[#20efe0]/10 bg-[#121344]/65 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-[#20efe0] shadow-[0_0_14px_rgba(32,239,224,0.65)]" aria-hidden="true" />
                <div>
                  <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#20efe0]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#20efe0] shadow-[0_0_8px_rgba(32,239,224,0.8)]" />
                    Schedule grid online
                  </div>
                  <h2 className="text-xl font-bold text-[#f5f7ff] sm:text-2xl">
                    {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => goToMonth(-1)}
                  variant="outline"
                  size="sm"
                  className="border-[#6374b5]/45 bg-[#0c0c3f]/55 text-[#d4d8ee] hover:border-[#20efe0]/45 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff]"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCalendarMonth(new Date())}
                  variant="outline"
                  size="sm"
                  className="border-[#6374b5]/45 bg-[#0c0c3f]/55 text-[#d4d8ee] hover:border-[#20efe0]/45 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff]"
                >
                  Today
                </Button>
                <Button
                  onClick={() => goToMonth(1)}
                  variant="outline"
                  size="sm"
                  className="border-[#6374b5]/45 bg-[#0c0c3f]/55 text-[#d4d8ee] hover:border-[#20efe0]/45 hover:bg-[#20efe0]/10 hover:text-[#f5f7ff]"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-px border-b border-[#20efe0]/10 bg-[#0e1040] px-2 sm:px-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aeb8dd] sm:text-xs">
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d[0]}</span>
                </div>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-px bg-[#2a326b]/70 p-px">
              {buildCalendarDays().map((day, i) => {
                const inMonth = day.getMonth() === calendarMonth.getMonth()
                const isToday = isSameDay(day, new Date())
                const dayProds = productionsForDay(day)
                return (
                  <div
                    key={i}
                    onClick={() => openAddForDate(day)}
                    className={`relative flex min-h-[84px] flex-col gap-1 overflow-hidden p-1.5 transition-all sm:min-h-[120px] sm:p-2 ${
                      inMonth ? "bg-[#0c0d3d]" : "bg-[#07082c]"
                    } ${isToday ? "z-10 ring-1 ring-inset ring-[#20efe0]/75 shadow-[inset_0_0_24px_rgba(32,239,224,0.09),0_0_18px_rgba(32,239,224,0.13)]" : ""} ${canManageCalendar ? "cursor-pointer hover:z-10 hover:bg-[#15174c] hover:shadow-[inset_0_0_20px_rgba(32,239,224,0.05)]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-[#20efe0] text-[#05052d] shadow-[0_0_14px_rgba(32,239,224,0.55)]"
                            : inMonth
                              ? "text-[#f5f7ff]"
                              : "text-[#9a9fc4]/40"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {canManageCalendar && inMonth && (
                        <Plus className="w-3 h-3 text-[#9a9fc4]/50" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayProds.slice(0, 3).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (canManageCalendar) openEditDialog(productions.find((item) => item.id === prod.id.split("--occurrence-")[0]) ?? prod)
                          }}
                          className={`truncate rounded border px-1.5 py-1 text-left text-[10px] leading-tight shadow-[0_0_10px_rgba(234,111,42,0.07)] transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#20efe0] sm:text-xs ${getStatusColor(prod.status)}`}
                          title={`${prod.title} — ${formatTime(prod.start_date)}${crewCounts[prod.id] ? ` · ${crewCounts[prod.id]} crew` : ""}`}
                        >
                          <span className="font-medium">{formatTime(prod.start_date)}</span>{" "}
                          <span className="truncate">{prod.title}</span>
                          {crewCounts[prod.id] ? (
                            <span className="hidden sm:inline-flex items-center gap-0.5 ml-1 opacity-80">
                              <Users className="w-2.5 h-2.5" />
                              {crewCounts[prod.id]}
                            </span>
                          ) : null}
                        </button>
                      ))}
                      {dayProds.length > 3 && (
                        <span className="text-[10px] text-[#9a9fc4] pl-1">+{dayProds.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {canManageCalendar && (
              <p className="border-t border-[#20efe0]/10 bg-[#0e1040]/80 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#9fa8cf] sm:text-xs sm:normal-case sm:tracking-normal">
                Click any day to schedule a show. Click a show to edit it or assign crew.
              </p>
            )}
          </section>
        )}
      </main>

      <Footer />

      <Dialog open={addDialog} onOpenChange={(open) => { setAddDialog(open); if (!open) { setSelectedCrew([]); resetForm() } }}>
        <DialogContent className="bg-transparent border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Add Production</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">Create a new production event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-title" className="text-[#f5f7ff]">Title</Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="add-description" className="text-[#f5f7ff]">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="add-start-date" className="text-[#f5f7ff]">Start Date & Time</Label>
              <Input
                id="add-start-date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="add-location" className="text-[#f5f7ff]">Location</Label>
              <Input
                id="add-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="add-status" className="text-[#f5f7ff]">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-transparent border-[#20205a]">
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                className="w-4 h-4 bg-[#0c0c3f] border-[#20205a] rounded"
              />
              <Label htmlFor="add-recurring" className="text-[#f5f7ff]">Repeat</Label>
            </div>
            {formData.is_recurring && (
              <>
                <div>
                  <Label htmlFor="add-frequency" className="text-[#f5f7ff]">Frequency</Label>
                  <Select value={formData.recurrence_frequency} onValueChange={(value) => setFormData({...formData, recurrence_frequency: value})}>
                    <SelectTrigger className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-transparent border-[#20205a]">
                      {recurrenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-recurrence-end" className="text-[#f5f7ff]">Repeat End Date</Label>
                  <Input
                    id="add-recurrence-end"
                    type="date"
                    min={formData.start_date.slice(0, 10)}
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({...formData, recurrence_end_date: e.target.value})}
                    className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
              </>
            )}

            {/* Crew Assignment */}
            <div>
              <Label className="text-[#f5f7ff] mb-2 block">Assign Crew <span className="text-[#9a9fc4] font-normal text-xs">(optional — they'll get an email notification)</span></Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {allCrew.map((member) => {
                  const assigned = selectedCrew.find((c) => c.user_id === member.user_id)
                  return (
                    <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-md border border-[#20205a] bg-transparent">
                      <input
                        type="checkbox"
                        id={`crew-${member.user_id}`}
                        checked={!!assigned}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCrew((prev) => [...prev, { user_id: member.user_id, role: "" }])
                          } else {
                            setSelectedCrew((prev) => prev.filter((c) => c.user_id !== member.user_id))
                          }
                        }}
                        className="w-4 h-4 accent-[#ea6f2a] flex-shrink-0"
                      />
                      <label htmlFor={`crew-${member.user_id}`} className="text-[#f5f7ff] text-sm flex-1 cursor-pointer">
                        {member.first_name} {member.last_name}
                        <span className="text-[#9a9fc4] text-xs ml-2">{member.email}</span>
                      </label>
                      {assigned && (
                        <Input
                          placeholder="Role (optional)"
                          value={assigned.role}
                          onChange={(e) => setSelectedCrew((prev) =>
                            prev.map((c) => c.user_id === member.user_id ? { ...c, role: e.target.value } : c)
                          )}
                          className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] text-xs h-7 w-32 flex-shrink-0"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProduction} className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]">
              Create Production{selectedCrew.length > 0 ? ` & Notify ${selectedCrew.length} Crew` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-transparent border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Edit Production</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-[#f5f7ff]">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-[#f5f7ff]">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="edit-start-date" className="text-[#f5f7ff]">Start Date & Time</Label>
              <Input
                id="edit-start-date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="edit-location" className="text-[#f5f7ff]">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="edit-status" className="text-[#f5f7ff]">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-transparent border-[#20205a]">
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-recurring"
                checked={formData.is_recurring}
                onChange={(event) => setFormData({ ...formData, is_recurring: event.target.checked })}
                className="h-4 w-4 accent-[#ea6f2a]"
              />
              <Label htmlFor="edit-recurring" className="text-[#f5f7ff]">Repeat</Label>
            </div>
            {formData.is_recurring && (
              <div className="grid gap-4 rounded-lg border border-[#20205a] bg-[#0c0c3f]/50 p-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-frequency" className="text-[#f5f7ff]">Frequency</Label>
                  <Select value={formData.recurrence_frequency} onValueChange={(value) => setFormData({ ...formData, recurrence_frequency: value })}>
                    <SelectTrigger id="edit-frequency" className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c0c3f] border-[#20205a]">
                      {recurrenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-recurrence-end" className="text-[#f5f7ff]">Repeat End Date</Label>
                  <Input
                    id="edit-recurrence-end"
                    type="date"
                    min={formData.start_date.slice(0, 10)}
                    value={formData.recurrence_end_date}
                    onChange={(event) => setFormData({ ...formData, recurrence_end_date: event.target.value })}
                    className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateProduction} className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]">
              Update Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-transparent border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Delete Production</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Are you sure you want to delete this production? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-[#20205a] text-[#9a9fc4] bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleDeleteProduction} className="bg-red-900 hover:bg-red-800 text-[#f5f7ff]">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="bg-transparent border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Request Production</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">Submit a request for admin approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="req-title" className="text-[#f5f7ff]">Title</Label>
              <Input
                id="req-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="req-description" className="text-[#f5f7ff]">Description</Label>
              <Textarea
                id="req-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="req-start-date" className="text-[#f5f7ff]">Requested Date & Time</Label>
              <Input
                id="req-start-date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div>
              <Label htmlFor="req-location" className="text-[#f5f7ff]">Location</Label>
              <Input
                id="req-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="req-recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                className="w-4 h-4 bg-[#0c0c3f] border-[#20205a] rounded"
              />
              <Label htmlFor="req-recurring" className="text-[#f5f7ff]">Repeat</Label>
            </div>
            {formData.is_recurring && (
              <>
                <div>
                  <Label htmlFor="req-frequency" className="text-[#f5f7ff]">Frequency</Label>
                  <Select value={formData.recurrence_frequency} onValueChange={(value) => setFormData({...formData, recurrence_frequency: value})}>
                    <SelectTrigger className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-transparent border-[#20205a]">
                      {recurrenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="req-recurrence-end" className="text-[#f5f7ff]">Repeat End Date</Label>
                  <Input
                    id="req-recurrence-end"
                    type="date"
                    min={formData.start_date.slice(0, 10)}
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({...formData, recurrence_end_date: e.target.value})}
                    className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitRequest} className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payoutsDialog} onOpenChange={setPayoutsDialog}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#22b573]" />
              Payouts
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Link a Stripe account so the studio can pay you for your work.
            </DialogDescription>
          </DialogHeader>

          {payoutsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#9a9fc4] animate-spin" />
            </div>
          ) : payoutStatus?.status === "active" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-[#22b573]/40 bg-[#22b573]/10 px-4 py-3">
                <CheckCircle className="w-4 h-4 text-[#22b573]" />
                <p className="text-sm font-semibold text-[#7fe0ae]">Payouts active</p>
              </div>
              <p className="text-sm text-[#9a9fc4]">
                Your Stripe account is connected and ready to receive payouts from Starcast.
              </p>
              <Button
                onClick={handleOpenDashboard}
                disabled={payoutsActionLoading}
                className="w-full bg-[#22b573] hover:bg-[#28c982] text-[#05052d]"
              >
                {payoutsActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Manage on Stripe
              </Button>
            </div>
          ) : payoutStatus?.status === "onboarding" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-[#f2a04a]/40 bg-[#f2a04a]/10 px-4 py-3">
                <Clock className="w-4 h-4 text-[#f2a04a]" />
                <p className="text-sm font-semibold text-[#f2a04a]">Onboarding incomplete</p>
              </div>
              <p className="text-sm text-[#9a9fc4]">
                Finish setting up your Stripe account to start receiving payouts.
              </p>
              <Button
                onClick={handleConnectPayouts}
                disabled={payoutsActionLoading}
                className="w-full bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              >
                {payoutsActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Resume Onboarding
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#9a9fc4]">
                You haven&apos;t connected a Stripe account yet. Connect one to receive payouts from Starcast.
              </p>
              <Button
                onClick={handleConnectPayouts}
                disabled={payoutsActionLoading}
                className="w-full bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
              >
                {payoutsActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Connect with Stripe
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
