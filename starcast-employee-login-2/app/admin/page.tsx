"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  adminListUsers, adminPromoteUser, adminDemoteUser, adminSetPermission,
  adminListPendingArticles, adminListApprovedArticles,
  adminApproveArticle, adminDeleteArticle,
  adminListCommunityPosts, adminPinPost, adminDeletePost,
  adminListCategories, adminCreateCategory, adminDeleteCategory,
  adminListInbox, adminMarkRead, adminMarkReplied, adminGetMessage,
  adminListSponsors, adminSetRole, adminSetSocialBan,
} from "@/app/actions/admin"
import { StudioManager } from "@/components/studio/studio-manager"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { 
  Users, FileText, MessageSquare, Mail, FolderOpen,
  Check, X, Pin, Trash2, Eye, Send, RefreshCw,
  UserPlus, UserMinus, Building2, ExternalLink, Star, Calendar,
  TrendingUp, BarChart3, Settings, ChevronRight, Sparkles, Music,
  Ban, ShieldCheck
} from "lucide-react"

interface User {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  bio?: string
  profile_pic?: string
  location?: string
  website?: string
  role?: "admin" | "staff" | "user"
  is_employee: boolean
  is_admin: boolean
  can_write_articles?: boolean
  can_manage_calendar?: boolean
  username?: string
  social_banned?: boolean
  social_ban_reason?: string
  social_banned_at?: string | null
  created_at: string
}

interface Article {
  id: string
  title: string
  content: string
  subtitle?: string
  excerpt?: string
  tags?: string[]
  approved: boolean
  created_at: string
  employee_id: string
  slug?: string
  employee?: {
    first_name: string
    last_name: string
  }
}

interface CommunityPost {
  id: string
  title: string
  content: string
  pinned: boolean
  created_at: string
  employee_id: string
  star_count?: number
  users?: {
    first_name: string
    last_name: string
    profile_pic?: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

interface InboxMessage {
  id: string
  resend_id: string | null
  from_email: string
  from_name: string | null
  to_email: string
  subject: string
  text_body: string | null
  html_body: string | null
  is_read: boolean
  replied_at: string | null
  created_at: string
}

interface Sponsor {
  id: string
  company_name: string
  company_email: string
  contact_name: string
  package_name: string
  amount_cents: number
  status: string
  created_at: string
}

type AdminTab = "overview" | "members" | "studio" | "content" | "inbox" | "sponsors"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [users, setUsers] = useState<User[]>([])
  const [pendingArticles, setPendingArticles] = useState<Article[]>([])
  const [approvedArticles, setApprovedArticles] = useState<Article[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; user: User | null; action: 'promote' | 'revoke' }>({ open: false, user: null, action: 'promote' })
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const router = useRouter()

  // Derived data
  const teamMembers = users.filter((u) => u.is_employee)
  const regularUsers = users.filter((u) => !u.is_employee)
  const unreadEmails = inboxMessages.filter((m) => !m.is_read).length

  const filteredUsers = memberSearch 
    ? users.filter(u => 
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : users

  const fetchUsers = async () => {
    try { setUsers(await adminListUsers() as any[]) } catch {}
  }
  const fetchPendingArticles = async () => {
    try { setPendingArticles(await adminListPendingArticles() as any[]) } catch {}
  }
  const fetchApprovedArticles = async () => {
    try { setApprovedArticles(await adminListApprovedArticles() as any[]) } catch {}
  }
  const fetchCommunityPosts = async () => {
    try { setCommunityPosts(await adminListCommunityPosts() as any[]) } catch {}
  }
  const fetchCategories = async () => {
    try { setCategories(await adminListCategories() as any[]) } catch {}
  }
  const fetchInbox = async () => {
    try { setInboxMessages(await adminListInbox() as any[]) } catch {}
  }
  const fetchSponsors = async () => {
    try { setSponsors(await adminListSponsors() as any[]) } catch {}
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // adminListUsers() will throw "Forbidden" if not admin, or "Unauthorized" if not logged in
        const data = await adminListUsers()
        setUsers(data as any[])
        await Promise.all([
          fetchPendingArticles(), fetchApprovedArticles(),
          fetchCommunityPosts(), fetchCategories(),
          fetchInbox(), fetchSponsors(),
        ])
        setLoading(false)
      } catch {
        router.push("/")
      }
    }
    checkAuth()
  }, [])

  // Action handlers
  const handleApproveArticle = async (articleId: string) => {
    await adminApproveArticle(articleId)
    fetchPendingArticles(); fetchApprovedArticles()
  }
  const handleRejectArticle = async (articleId: string) => {
    await adminDeleteArticle(articleId); fetchPendingArticles()
  }
  const handleDeleteArticle = async (articleId: string) => {
    await adminDeleteArticle(articleId); fetchApprovedArticles()
  }
  const handlePinPost = async (postId: string, currentPinned: boolean) => {
    await adminPinPost(postId, !currentPinned); fetchCommunityPosts()
  }
  const handleDeletePost = async (postId: string) => {
    await adminDeletePost(postId); fetchCommunityPosts()
  }
  const handlePromoteUser = async (profileId: string) => {
    await adminPromoteUser(profileId); fetchUsers()
  }
  const handleDemoteUser = async (profileId: string) => {
    await adminDemoteUser(profileId); fetchUsers()
  }
  const handleTogglePermission = async (
    profileId: string,
    field: "canWriteArticles" | "canManageCalendar" | "isAdmin",
    value: boolean,
  ) => {
    try {
      await adminSetPermission(profileId, field, value)
      await fetchUsers()
    } catch (err: any) {
      alert(err?.message || "Failed to update permission")
    }
  }
  const handleSetRole = async (profileId: string, role: "admin" | "staff" | "user") => {
    try {
      await adminSetRole(profileId, role)
      await fetchUsers()
    } catch (err: any) {
      alert(err?.message || "Failed to update role")
    }
  }

  // Social ban: blocks likes, comments, posts, DMs and friend requests.
  const [banDialog, setBanDialog] = useState<{ user: User | null; reason: string }>({ user: null, reason: "" })
  const [banSaving, setBanSaving] = useState(false)

  const handleApplyBan = async () => {
    if (!banDialog.user) return
    setBanSaving(true)
    try {
      await adminSetSocialBan(banDialog.user.id, true, banDialog.reason)
      setBanDialog({ user: null, reason: "" })
      await fetchUsers()
    } catch (err: any) {
      alert(err?.message || "Failed to apply social ban")
    } finally {
      setBanSaving(false)
    }
  }

  const handleLiftBan = async (profileId: string) => {
    try {
      await adminSetSocialBan(profileId, false)
      await fetchUsers()
    } catch (err: any) {
      alert(err?.message || "Failed to lift social ban")
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.user) return
    if (confirmDialog.action === "promote") {
      await handlePromoteUser(confirmDialog.user.id)
    } else {
      await handleDemoteUser(confirmDialog.user.id)
    }
    setConfirmDialog({ open: false, user: null, action: "promote" })
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await adminCreateCategory(newCategoryName.trim(), newCategoryIcon)
    setNewCategoryName(""); setNewCategoryIcon(""); setCategoryDialog(false)
    fetchCategories()
  }
  const handleDeleteCategory = async (categoryId: string) => {
    await adminDeleteCategory(categoryId); fetchCategories()
  }
  const handleMarkRead = async (messageId: string) => {
    await adminMarkRead(messageId); fetchInbox()
  }

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    setReplying(true)
    setReplyMessage("")
    try {
      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedMessage.from_email, subject: `Re: ${selectedMessage.subject}`, text: replyText }),
      })
      if (res.ok) {
        await adminMarkReplied(selectedMessage.id)
        setReplyMessage("Reply sent!")
        setReplyText("")
        fetchInbox()
      } else {
        setReplyMessage("Failed to send reply")
      }
    } catch {
      setReplyMessage("Failed to send reply")
    }
    setReplying(false)
  }

  const handleRefreshContent = async (messageId: string) => {
    console.log("[v0] Refreshing content for message:", messageId)
    try {
      const res = await fetch("/api/email/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: messageId }),
      })
      const result = await res.json()
      console.log("[v0] Refresh result:", result)
      
      if (res.ok && result.success) {
        fetchInbox()
        const data = await adminGetMessage(messageId)
        if (data) setSelectedMessage(data)
      } else {
        alert(result.message || result.error || "Failed to fetch content")
      }
    } catch (err: any) {
      console.error("[v0] Refresh error:", err)
      alert("Error fetching content: " + err?.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "members", label: "Members", icon: Users, badge: users.length },
    { id: "studio", label: "Studio", icon: Music },
    { id: "content", label: "Content", icon: FileText, badge: pendingArticles.length },
    { id: "inbox", label: "Inbox", icon: Mail, badge: unreadEmails },
    { id: "sponsors", label: "Sponsors", icon: Building2, badge: sponsors.filter(s => s.status === "paid").length },
  ]

  return (
    <div className="min-h-screen bg-transparent">
      <ResponsiveHeader isLoggedIn isAdmin />
      
      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, user: null, action: 'promote' })}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader>
            <DialogTitle>{confirmDialog.action === 'promote' ? 'Promote to Team Member' : 'Remove from Team'}</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              {confirmDialog.action === 'promote' 
                ? `Make ${confirmDialog.user?.first_name} ${confirmDialog.user?.last_name} a team member?`
                : `Remove ${confirmDialog.user?.first_name} ${confirmDialog.user?.last_name} from the team?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, user: null, action: 'promote' })} className="border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleConfirmAction} className={confirmDialog.action === 'promote' ? "bg-[#ea6f2a] hover:bg-[#bc3f00]" : "bg-red-600 hover:bg-red-700"}>
              {confirmDialog.action === 'promote' ? 'Promote' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">Add a new discussion category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
            <Input value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} placeholder="Icon emoji (e.g., 🎮)" className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]" />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCategory} className="bg-[#ea6f2a] hover:bg-[#bc3f00]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f5f7ff] mb-2">Admin Dashboard</h1>
          <p className="text-[#9a9fc4]">Manage your community, content, and team</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/20"
                  : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className={`min-w-5 h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === tab.id ? "bg-white/20" : "bg-[#ea6f2a]/20 text-[#ea6f2a]"
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Members", value: users.length, icon: Users, color: "text-blue-400" },
                { label: "Team Members", value: teamMembers.length, icon: Sparkles, color: "text-[#ea6f2a]" },
                { label: "Pending Articles", value: pendingArticles.length, icon: FileText, color: "text-yellow-400" },
                { label: "Unread Emails", value: unreadEmails, icon: Mail, color: "text-green-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0c0c3f]/60 border border-[#20205a]/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-[#f5f7ff]">{stat.value}</p>
                  <p className="text-sm text-[#9a9fc4]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6">
              {/* Pending Articles */}
              <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#f5f7ff] text-lg">Pending Articles</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("content")} className="text-[#ea6f2a] hover:text-[#f2a04a] hover:bg-transparent">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingArticles.length === 0 ? (
                    <p className="text-[#9a9fc4] text-center py-6">No pending articles</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingArticles.slice(0, 3).map((article) => (
                        <div key={article.id} className="flex items-center justify-between p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#f5f7ff] truncate">{article.title}</p>
                            <p className="text-xs text-[#9a9fc4]">by {article.employee?.first_name} {article.employee?.last_name}</p>
                          </div>
                          <div className="flex gap-2 ml-3">
                            <Button size="sm" onClick={() => handleApproveArticle(article.id)} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleRejectArticle(article.id)} variant="outline" className="h-8 w-8 p-0 border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Members */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#f5f7ff] text-lg">Recent Members</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("members")} className="text-[#ea6f2a] hover:text-[#f2a04a] hover:bg-transparent">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {users.slice(0, 4).map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.user_id}`}
                      className="flex items-center gap-3 p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30 hover:border-[#ea6f2a]/50 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        user.is_employee ? "bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00]" : "bg-[#20205a]"
                      }`}>
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#f5f7ff] truncate group-hover:text-[#ea6f2a] transition-colors">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-[#9a9fc4] truncate">{user.email}</p>
                      </div>
                      {user.is_employee && (
                        <Sparkles className="w-4 h-4 text-[#ea6f2a] flex-shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === "members" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name or email..."
                className="bg-[#0c0c3f]/60 border-[#20205a]/50 text-[#f5f7ff] pl-4 pr-10 h-12 rounded-xl"
              />
            </div>

            {/* Team Members */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <CardTitle className="text-[#f5f7ff]">Team Members ({teamMembers.length})</CardTitle>
                <CardDescription className="text-[#9a9fc4]">Crew members who can create articles and access production tools</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className="text-[#9a9fc4] text-center py-8">No team members yet</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(memberSearch ? teamMembers.filter(u => filteredUsers.includes(u)) : teamMembers).map((user) => (
                      <div key={user.id} className="p-4 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30 hover:border-[#ea6f2a]/30 transition-all">
                        <div className="flex items-start gap-4">
                          <Link href={`/profile/${user.user_id}`} className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] p-0.5">
                              <div className="w-full h-full rounded-full bg-[#05052d] flex items-center justify-center overflow-hidden">
                                {user.profile_pic ? (
                                  <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg font-bold text-[#f5f7ff]">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/profile/${user.user_id}`} className="font-semibold text-[#f5f7ff] hover:text-[#ea6f2a] transition-colors">
                                {user.first_name} {user.last_name}
                              </Link>
                              {user.is_admin && (
                                <span className="text-[10px] font-bold bg-[#ea6f2a] text-white px-1.5 py-0.5 rounded">ADMIN</span>
                              )}
                            </div>
                            <p className="text-sm text-[#9a9fc4] truncate">{user.email}</p>
                            {user.location && (
                              <p className="text-xs text-[#9a9fc4]/60 mt-1">{user.location}</p>
                            )}
                            {/* Role */}
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider text-[#9a9fc4]/60 mb-1.5">Role</p>
                              <Select
                                value={user.is_admin ? "admin" : (user.role || (user.is_employee ? "staff" : "user"))}
                                onValueChange={(v) => handleSetRole(user.id, v as "admin" | "staff" | "user")}
                              >
                                <SelectTrigger className="h-8 w-32 bg-[#05052d] border-[#20205a] text-[#f5f7ff] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Granular permissions */}
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider text-[#9a9fc4]/60 mb-1.5">Permissions</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(user.id, "canWriteArticles", !user.can_write_articles)}
                                  aria-pressed={!!(user.is_admin || user.can_write_articles)}
                                  disabled={user.is_admin}
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                                    user.is_admin || user.can_write_articles
                                      ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                                      : "bg-transparent text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                                  } ${user.is_admin ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                  <FileText className="w-3 h-3" />
                                  Articles
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(user.id, "canManageCalendar", !user.can_manage_calendar)}
                                  aria-pressed={!!(user.is_admin || user.can_manage_calendar)}
                                  disabled={user.is_admin}
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                                    user.is_admin || user.can_manage_calendar
                                      ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                                      : "bg-transparent text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                                  } ${user.is_admin ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  Calendar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(user.id, "isAdmin", !user.is_admin)}
                                  aria-pressed={user.is_admin}
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                                    user.is_admin
                                      ? "bg-[#ea6f2a] text-white border-[#ea6f2a]"
                                      : "bg-transparent text-[#9a9fc4] border-[#20205a] hover:border-[#ea6f2a]/50"
                                  }`}
                                >
                                  <Settings className="w-3 h-3" />
                                  Admin
                                </button>
                              </div>
                              {user.is_admin && (
                                <p className="text-[10px] text-[#9a9fc4]/60 mt-1.5">Admins have every permission.</p>
                              )}
                            </div>
                          </div>
                          {!user.is_admin && (
                            <Button
                              onClick={() => setConfirmDialog({ open: true, user, action: 'revoke' })}
                              size="sm"
                              variant="outline"
                              className="border-red-800/50 text-red-400 hover:bg-red-950/30 bg-transparent h-8"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Regular Users */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <CardTitle className="text-[#f5f7ff]">Community Members ({regularUsers.length})</CardTitle>
                <CardDescription className="text-[#9a9fc4]">Regular users who can participate in the community</CardDescription>
              </CardHeader>
              <CardContent>
                {regularUsers.length === 0 ? (
                  <p className="text-[#9a9fc4] text-center py-8">No community members yet</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(memberSearch ? regularUsers.filter(u => filteredUsers.includes(u)) : regularUsers).map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30 hover:border-[#20205a] transition-all">
                        <Link href={`/profile/${user.user_id}`} className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#20205a] flex items-center justify-center overflow-hidden">
                            {user.profile_pic ? (
                              <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-[#9a9fc4]">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${user.user_id}`} className="font-medium text-[#f5f7ff] hover:text-[#ea6f2a] transition-colors text-sm truncate block">
                            {user.first_name} {user.last_name}
                          </Link>
                          <p className="text-xs text-[#9a9fc4] truncate">{user.email}</p>
                          {user.social_banned && (
                            <span
                              className="inline-flex items-center gap-1 mt-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300"
                              title={user.social_ban_reason || "Social privileges suspended"}
                            >
                              <Ban className="w-3 h-3" /> Social banned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Select
                            value={user.is_admin ? "admin" : (user.role || (user.is_employee ? "staff" : "user"))}
                            onValueChange={(v) => handleSetRole(user.id, v as "admin" | "staff" | "user")}
                          >
                            <SelectTrigger className="h-8 w-24 bg-[#05052d] border-[#20205a] text-[#f5f7ff] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff]">
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {user.social_banned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 border-[#20205a] text-[#9a9fc4] bg-transparent hover:bg-[#20205a]/30"
                              onClick={() => handleLiftBan(user.id)}
                              title="Lift social ban"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 border-red-500/30 text-red-300 bg-transparent hover:bg-red-500/10"
                              onClick={() => setBanDialog({ user, reason: "" })}
                              title="Social ban this member"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* STUDIO TAB */}
        {activeTab === "studio" && (
          <StudioManager canDelete canViewRevenue />
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Pending Articles */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <CardTitle className="text-[#f5f7ff]">Pending Articles ({pendingArticles.length})</CardTitle>
                <CardDescription className="text-[#9a9fc4]">Articles waiting for approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingArticles.length === 0 ? (
                  <p className="text-[#9a9fc4] text-center py-8">No pending articles</p>
                ) : (
                  <div className="space-y-3">
                    {pendingArticles.map((article) => (
                      <div key={article.id} className="p-4 bg-[#05052d]/50 rounded-xl border border-yellow-600/30">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-[#f5f7ff]">{article.title}</h3>
                            {article.subtitle && <p className="text-sm text-[#9a9fc4]/80">{article.subtitle}</p>}
                            <p className="text-xs text-[#9a9fc4] mt-1">
                              by {article.employee?.first_name} {article.employee?.last_name} • {new Date(article.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => router.push(`/articles/${article.slug}`)} variant="outline" className="border-[#20205a] text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleApproveArticle(article.id)} className="bg-green-600 hover:bg-green-700">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleRejectArticle(article.id)} variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-[#9a9fc4] line-clamp-2">{article.excerpt || article.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Articles */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <CardTitle className="text-[#f5f7ff]">Published Articles ({approvedArticles.length})</CardTitle>
                <CardDescription className="text-[#9a9fc4]">Recently published articles</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedArticles.length === 0 ? (
                  <p className="text-[#9a9fc4] text-center py-8">No published articles</p>
                ) : (
                  <div className="space-y-3">
                    {approvedArticles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 bg-[#05052d]/50 rounded-xl border border-[#20205a]/30">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[#f5f7ff] truncate">{article.title}</h3>
                          <p className="text-xs text-[#9a9fc4]">
                            by {article.employee?.first_name} {article.employee?.last_name} • {new Date(article.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <Button size="sm" onClick={() => router.push(`/articles/${article.slug}`)} variant="outline" className="border-[#20205a] text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent">
                            View
                          </Button>
                          <Button size="sm" onClick={() => handleDeleteArticle(article.id)} variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Community Posts */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <CardTitle className="text-[#f5f7ff]">Community Posts</CardTitle>
                <CardDescription className="text-[#9a9fc4]">Manage community discussion posts</CardDescription>
              </CardHeader>
              <CardContent>
                {communityPosts.length === 0 ? (
                  <p className="text-[#9a9fc4] text-center py-8">No community posts</p>
                ) : (
                  <div className="space-y-3">
                    {communityPosts.map((post) => (
                      <div key={post.id} className={`p-3 bg-[#05052d]/50 rounded-xl border ${post.pinned ? 'border-[#ea6f2a]/50' : 'border-[#20205a]/30'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#f5f7ff]">{post.title}</p>
                            {post.pinned && <Pin className="w-4 h-4 text-[#ea6f2a]" />}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handlePinPost(post.id, post.pinned)} variant="outline" className="border-[#ea6f2a]/50 text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent h-8">
                              {post.pinned ? 'Unpin' : 'Pin'}
                            </Button>
                            <Button size="sm" onClick={() => handleDeletePost(post.id)} variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50 bg-transparent h-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#f5f7ff]">Categories</CardTitle>
                    <CardDescription className="text-[#9a9fc4]">Manage discussion categories</CardDescription>
                  </div>
                  <Button onClick={() => setCategoryDialog(true)} className="bg-[#ea6f2a] hover:bg-[#bc3f00]">
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-[#05052d]/50 rounded-lg border border-[#20205a]/30">
                      <span>{cat.icon}</span>
                      <span className="text-[#f5f7ff] text-sm">{cat.name}</span>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-300 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* INBOX TAB */}
        {activeTab === "inbox" && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Email List */}
            <div className="lg:col-span-2">
              <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60 h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#f5f7ff]">Inbox ({inboxMessages.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2">
                  {inboxMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => { setSelectedMessage(msg); handleMarkRead(msg.id) }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedMessage?.id === msg.id 
                          ? "bg-[#ea6f2a]/20 border-[#ea6f2a]/50" 
                          : msg.is_read 
                          ? "bg-[#05052d]/30 border-[#20205a]/30 hover:border-[#20205a]" 
                          : "bg-[#05052d]/50 border-[#20205a]/50 hover:border-[#ea6f2a]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.is_read && <div className="w-2 h-2 rounded-full bg-[#ea6f2a]" />}
                        <p className={`text-sm truncate ${msg.is_read ? "text-[#9a9fc4]" : "text-[#f5f7ff] font-semibold"}`}>
                          {msg.from_email}
                        </p>
                      </div>
                      <p className="text-[#f5f7ff] font-medium truncate text-sm">{msg.subject}</p>
                      <p className="text-xs text-[#9a9fc4] mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Email Detail */}
            <div className="lg:col-span-3">
              <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60 h-[600px] flex flex-col">
                {selectedMessage ? (
                  <>
                    <CardHeader className="border-b border-[#20205a]/30">
                      <CardTitle className="text-[#f5f7ff] text-lg">{selectedMessage.subject}</CardTitle>
                      <CardDescription className="text-[#9a9fc4]">
                        From: {selectedMessage.from_email} • {new Date(selectedMessage.created_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto py-4">
                      {selectedMessage.html_body ? (
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedMessage.html_body }} />
                      ) : selectedMessage.text_body ? (
                        <pre className="text-[#f5f7ff] whitespace-pre-wrap font-sans text-sm">{selectedMessage.text_body}</pre>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[#9a9fc4] mb-4">No content available</p>
                          <Button onClick={() => handleRefreshContent(selectedMessage.id)} variant="outline" className="border-[#20205a] text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent">
                            <RefreshCw className="w-4 h-4 mr-2" /> Fetch Content
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-4 border-t border-[#20205a]/30 space-y-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[80px]"
                      />
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${replyMessage.includes("sent") ? "text-green-400" : "text-red-400"}`}>
                          {replyMessage}
                        </p>
                        <Button onClick={handleReply} disabled={replying || !replyText.trim()} className="bg-[#ea6f2a] hover:bg-[#bc3f00]">
                          <Send className="w-4 h-4 mr-2" /> {replying ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[#9a9fc4]">
                    Select an email to view
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* SPONSORS TAB */}
        {activeTab === "sponsors" && (
          <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
            <CardHeader>
              <CardTitle className="text-[#f5f7ff]">Sponsors ({sponsors.length})</CardTitle>
              <CardDescription className="text-[#9a9fc4]">Manage sponsorship purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {sponsors.length === 0 ? (
                <p className="text-[#9a9fc4] text-center py-8">No sponsors yet</p>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className={`p-4 bg-[#05052d]/50 rounded-xl border ${
                      sponsor.status === "paid" ? "border-green-600/30" : "border-[#20205a]/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#f5f7ff]">{sponsor.company_name}</p>
                          <p className="text-sm text-[#9a9fc4]">{sponsor.contact_name} • {sponsor.company_email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-[#ea6f2a]/20 text-[#ea6f2a]">
                              {sponsor.package_name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              sponsor.status === "paid" ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"
                            }`}>
                              {sponsor.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#ea6f2a]">${(sponsor.amount_cents / 100).toFixed(2)}</p>
                          <p className="text-xs text-[#9a9fc4]">{new Date(sponsor.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Social ban confirmation */}
      <Dialog open={!!banDialog.user} onOpenChange={(open) => !open && setBanDialog({ user: null, reason: "" })}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">
              Social ban {banDialog.user?.first_name} {banDialog.user?.last_name}?
            </DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              They will not be able to like, comment, post, send messages, or send friend requests. They can still
              sign in, browse the site, and manage their studio bookings.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm text-[#f5f7ff]">Reason (optional, internal)</label>
            <Textarea
              value={banDialog.reason}
              onChange={(e) => setBanDialog({ ...banDialog, reason: e.target.value })}
              placeholder="e.g. Repeated harassment in comments"
              className="mt-1.5 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
              onClick={() => setBanDialog({ user: null, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleApplyBan}
              disabled={banSaving}
            >
              {banSaving ? "Applying..." : "Apply social ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
