"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  MessageSquare,
  Music,
  UserCheck,
  MessageCircle,
  User,
  Radio,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CommunityViewerInfo {
  id: string
  user_id: string
  first_name: string
  last_name: string
  bio?: string
  profile_pic?: string
  is_admin: boolean
  is_employee: boolean
}

interface CommunityLeftNavProps {
  currentViewer: CommunityViewerInfo | null
  activeTab: "deck" | "feed" | "explore" | "friends" | "messages" | "bands"
  onSelectTab: (tab: "deck" | "feed" | "explore" | "friends" | "messages" | "bands") => void
  friendRequestsCount: number
  unreadMessagesCount: number
  onFocusComposer?: () => void
}

function getInitials(first?: string, last?: string) {
  const f = (first ?? "").trim()[0] ?? ""
  const l = (last ?? "").trim()[0] ?? ""
  return `${f}${l}` || "?"
}

export function CommunityLeftNav({
  currentViewer,
  activeTab,
  onSelectTab,
  friendRequestsCount,
  unreadMessagesCount,
  onFocusComposer,
}: CommunityLeftNavProps) {
  const router = useRouter()

  const navItems = [
    {
      id: "deck" as const,
      label: "The DECK",
      icon: Sparkles,
      badge: 0,
    },
    {
      id: "feed" as const,
      label: "Discussions",
      icon: MessageSquare,
      badge: 0,
    },
    {
      id: "bands" as const,
      label: "Artists & Bands",
      icon: Music,
      badge: 0,
    },
    ...(currentViewer
      ? [
          {
            id: "friends" as const,
            label: "Friends",
            icon: UserCheck,
            badge: friendRequestsCount,
          },
          {
            id: "messages" as const,
            label: "Messages",
            icon: MessageCircle,
            badge: unreadMessagesCount,
          },
        ]
      : []),
  ]

  return (
    <aside className="hidden lg:flex lg:w-56 xl:w-60 flex-col shrink-0 sticky top-24 space-y-4">
      {/* User Profile Header or Sign-in Prompt */}
      {currentViewer ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#080924]/90 p-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${currentViewer.id}`}
              className="relative w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center overflow-hidden shrink-0"
            >
              {currentViewer.profile_pic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentViewer.profile_pic}
                  alt={`${currentViewer.first_name} ${currentViewer.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#f5f7ff]">
                  {getInitials(currentViewer.first_name, currentViewer.last_name)}
                </span>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${currentViewer.id}`}
                className="font-semibold text-[#f5f7ff] text-sm truncate block hover:text-[#20efe0] transition-colors"
              >
                {currentViewer.first_name} {currentViewer.last_name}
              </Link>
              <Link
                href={`/profile/${currentViewer.id}`}
                className="text-xs text-[#7f84ad] hover:text-white inline-flex items-center gap-1 mt-0.5 transition-colors"
              >
                <User className="w-3 h-3" /> View Profile
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#080924]/90 p-4 text-center space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto text-[#ea6f2a]">
            <Radio className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-[#f5f7ff] text-sm">Join the Stream</h3>
          <p className="text-xs text-[#9a9fc4] leading-relaxed">
            Sign in to post to The DECK, comment, and message friends.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-lg h-9 text-xs"
          >
            Sign In / Register
          </Button>
        </div>
      )}

      {/* Sleek Single-Line Social Stream Nav */}
      <nav className="rounded-2xl border border-white/[0.08] bg-[#080924]/80 p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] font-medium transition-colors group ${
                isActive
                  ? "bg-white/[0.09] text-white font-semibold"
                  : "text-[#9a9fc4] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#ea6f2a]" : "text-[#6e7399] group-hover:text-[#cbd0f2]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ea6f2a] text-white shrink-0 leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Post Action Button */}
      {currentViewer && (
        <Button
          onClick={onFocusComposer}
          className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl h-10 text-xs gap-1.5 shadow-md shadow-[#ea6f2a]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      )}
    </aside>
  )
}
