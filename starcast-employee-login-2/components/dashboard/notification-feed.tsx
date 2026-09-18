"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from "@/app/actions/notifications"
import { acceptFriendRequest, removeFriendship } from "@/app/actions/community"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Star,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  CornerDownRight,
  Sparkles,
  Check,
  X,
  Trash2,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotificationFeed() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadNotifications() {
    try {
      const [list, count] = await Promise.all([
        getMyNotifications(40),
        getUnreadNotificationCount(),
      ])
      setNotifications(list)
      setUnreadCount(count)
    } catch (err) {
      console.error("loadNotifications error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  async function handleDelete(id: string) {
    await deleteNotification(id)
    const item = notifications.find((n) => n.id === id)
    if (item && !item.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleAcceptFriend(notifId: string, friendshipId?: string | null) {
    if (!friendshipId) return
    setBusyId(notifId)
    try {
      await acceptFriendRequest(friendshipId)
      await handleMarkRead(notifId)
    } catch (err) {
      console.error(err)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeclineFriend(notifId: string, friendshipId?: string | null) {
    if (!friendshipId) return
    setBusyId(notifId)
    try {
      await removeFriendship(friendshipId)
      await handleDelete(notifId)
    } catch (err) {
      console.error(err)
    } finally {
      setBusyId(null)
    }
  }

  const displayedList =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications

  return (
    <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/60 p-5 sm:p-6 backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#20205a]/50">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-5 h-5 text-[#ea6f2a]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ea6f2a] ring-2 ring-[#0c0c3f] animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
              Notifications &amp; Social Activity
              {unreadCount > 0 && (
                <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 text-xs font-mono">
                  {unreadCount} new
                </Badge>
              )}
            </h2>
            <p className="text-xs text-[#9a9fc4]">
              Updates on likes, replies, friend requests, and community discussions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="border-[#20205a] bg-[#05052d]/60 text-[#c9fbf7] hover:bg-[#20205a] text-xs h-8"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mark All Read
            </Button>
          )}

          <Button
            onClick={loadNotifications}
            variant="ghost"
            size="sm"
            className="text-[#9a9fc4] hover:text-[#f5f7ff] h-8 w-8 p-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-[#ea6f2a] text-white"
              : "bg-[#05052d]/80 text-[#9a9fc4] hover:text-[#f5f7ff]"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "unread"
              ? "bg-[#ea6f2a] text-white"
              : "bg-[#05052d]/80 text-[#9a9fc4] hover:text-[#f5f7ff]"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-10 text-center text-[#9a9fc4]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ea6f2a]" />
          <p className="text-xs">Loading social notifications...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-10 text-center space-y-2 rounded-xl bg-[#05052d]/40 border border-[#20205a]/30">
          <Bell className="w-8 h-8 text-[#9a9fc4]/40 mx-auto" />
          <p className="text-sm font-semibold text-[#f5f7ff]">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-[#9a9fc4] max-w-xs mx-auto">
            When members like your posts, reply to comments, or add you as a friend, they'll show up right here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#20205a]/40 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          {displayedList.map((n) => {
            const actorName = `${n.actor.firstName} ${n.actor.lastName}`.trim() || "A member"

            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`p-3 sm:p-3.5 rounded-xl transition-all flex items-start justify-between gap-3 ${
                  n.isRead
                    ? "opacity-75 hover:opacity-100 hover:bg-[#05052d]/40"
                    : "bg-[#05052d]/80 border border-[#ea6f2a]/30 shadow-sm"
                }`}
              >
                {/* Avatar + Icon badge */}
                <div className="relative shrink-0 mt-0.5">
                  {n.actor.profilePic ? (
                    <img
                      src={n.actor.profilePic}
                      alt={actorName}
                      className="w-9 h-9 rounded-full object-cover border border-[#20205a]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#ea6f2a]/20 border border-[#ea6f2a]/30 text-[#ea6f2a] font-bold text-xs flex items-center justify-center">
                      {n.actor.firstName?.charAt(0) || "★"}
                    </div>
                  )}

                  {/* Type Icon Pin */}
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0c0c3f] border border-[#20205a]">
                    {n.type === "post_star" || n.type === "comment_star" ? (
                      <Star className="w-3 h-3 text-[#ea6f2a] fill-[#ea6f2a]" />
                    ) : n.type === "friend_request" || n.type === "friend_accepted" ? (
                      <UserPlus className="w-3 h-3 text-[#20efe0]" />
                    ) : n.type === "comment_reply" || n.type === "comment_on_your_post" ? (
                      <CornerDownRight className="w-3 h-3 text-[#20efe0]" />
                    ) : (
                      <MessageSquare className="w-3 h-3 text-[#22b573]" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#f5f7ff]">
                      <span className="font-bold text-[#f5f7ff] hover:underline cursor-pointer">
                        {actorName}
                      </span>{" "}
                      {n.type === "post_star" && (
                        <span>starred your post:</span>
                      )}
                      {n.type === "comment_star" && (
                        <span>liked your comment:</span>
                      )}
                      {n.type === "post_comment" && (
                        <span>commented on your post:</span>
                      )}
                      {n.type === "comment_reply" && (
                        <span>replied to your comment:</span>
                      )}
                      {n.type === "comment_on_your_post" && (
                        <span>replied to a discussion on your post:</span>
                      )}
                      {n.type === "friend_request" && (
                        <span>sent you a friend request!</span>
                      )}
                      {n.type === "friend_accepted" && (
                        <span>accepted your friend request!</span>
                      )}
                    </p>
                    <span className="text-[10px] text-[#9a9fc4] shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>

                  {/* Post title or Snippet */}
                  {n.postTitle && (
                    <p className="font-medium text-[#20efe0] truncate">
                      "{n.postTitle}"
                    </p>
                  )}

                  {n.snippet && (
                    <p className="text-[#9a9fc4] italic line-clamp-1 bg-[#05052d]/60 px-2 py-0.5 rounded border border-[#20205a]/30 text-[11px]">
                      "{n.snippet}"
                    </p>
                  )}

                  {/* Friend request quick actions */}
                  {n.type === "friend_request" && n.friendshipId && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAcceptFriend(n.id, n.friendshipId)
                        }}
                        disabled={busyId === n.id}
                        size="sm"
                        className="h-7 px-3 bg-[#22b573] hover:bg-[#1ba063] text-black font-semibold text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeclineFriend(n.id, n.friendshipId)
                        }}
                        disabled={busyId === n.id}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 border-[#20205a] text-[#9a9fc4] hover:text-white bg-transparent text-xs"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Community post quick link */}
                  {n.postId && (
                    <div className="pt-0.5">
                      <Link
                        href="/community"
                        className="text-[11px] text-[#ea6f2a] hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        View in Community <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(n.id)
                  }}
                  className="text-[#9a9fc4]/50 hover:text-red-400 p-1 rounded transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
