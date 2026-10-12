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
  Shield,
  Headphones,
  Compass,
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
      caption: "Daily Community Wall",
      icon: Sparkles,
      badge: 0,
    },
    {
      id: "feed" as const,
      label: "Discussions",
      caption: "Topics, Shows & Reviews",
      icon: MessageSquare,
      badge: 0,
    },
    {
      id: "bands" as const,
      label: "Kansas Bands",
      caption: "Artists, Shows & Audio",
      icon: Music,
      badge: 0,
    },
    ...(currentViewer
      ? [
          {
            id: "friends" as const,
            label: "Friends",
            caption: "Connections & Requests",
            icon: UserCheck,
            badge: friendRequestsCount,
          },
          {
            id: "messages" as const,
            label: "Messages",
            caption: "Direct Chat",
            icon: MessageCircle,
            badge: unreadMessagesCount,
          },
        ]
      : []),
  ]

  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col shrink-0 sticky top-24 space-y-5">
      {/* User Profile Mini Card */}
      {currentViewer ? (
        <div className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/80 to-[#05052d]/90 p-4 xl:p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/profile/${currentViewer.id}`}
              className="relative w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-br from-[#ea6f2a] to-[#20efe0] p-0.5 shrink-0 transition-transform hover:scale-105"
            >
              <div className="w-full h-full rounded-[14px] bg-[#05052d] flex items-center justify-center overflow-hidden">
                {currentViewer.profile_pic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentViewer.profile_pic}
                    alt={`${currentViewer.first_name} ${currentViewer.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base font-bold text-[#f5f7ff]">
                    {getInitials(currentViewer.first_name, currentViewer.last_name)}
                  </span>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${currentViewer.id}`}
                className="font-extrabold text-[#f5f7ff] text-sm xl:text-base truncate block hover:text-[#ea6f2a] transition-colors"
              >
                {currentViewer.first_name} {currentViewer.last_name}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                {currentViewer.is_admin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40">
                    <Shield className="w-2.5 h-2.5" /> Admin
                  </span>
                ) : currentViewer.is_employee ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#20efe0]/20 text-[#20efe0] border border-[#20efe0]/40">
                    <Headphones className="w-2.5 h-2.5" /> Crew
                  </span>
                ) : (
                  <span className="text-[11px] text-[#9a9fc4] font-medium truncate">
                    Community Member
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#20205a]/60 flex items-center justify-between text-xs">
            <Link
              href={`/profile/${currentViewer.id}`}
              className="text-[#20efe0] hover:text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> View Profile
            </Link>
            <Link
              href="/dashboard"
              className="text-[#cbd0f2] hover:text-white font-medium transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#20205a]/70 bg-gradient-to-b from-[#0c0c3f]/80 to-[#05052d]/90 p-5 shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto mb-3 text-[#ea6f2a]">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#f5f7ff] text-base">Join the Stream</h3>
          <p className="text-xs text-[#9a9fc4] mt-1 mb-4 leading-relaxed">
            Sign in to post to the DECK, comment, DM friends, and support local Kansas artists.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-10 text-sm shadow-md shadow-[#ea6f2a]/20"
          >
            Sign In / Register
          </Button>
        </div>
      )}

      {/* Main Social Stream Nav */}
      <nav className="rounded-3xl border border-[#20205a]/70 bg-[#0c0c3f]/60 p-2.5 shadow-xl backdrop-blur-md space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-[#ea6f2a] to-[#d65f1f] text-white shadow-lg shadow-[#ea6f2a]/25 font-bold"
                  : "text-[#cbd0f2] hover:bg-[#20205a]/50 hover:text-[#f5f7ff]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#05052d]/90 text-[#20efe0] group-hover:text-white group-hover:bg-[#ea6f2a]/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">{item.label}</p>
                  <p
                    className={`text-[10px] leading-tight truncate ${
                      isActive ? "text-white/80" : "text-[#9a9fc4]"
                    }`}
                  >
                    {item.caption}
                  </p>
                </div>
              </div>

              {item.badge > 0 && (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isActive ? "bg-white text-[#ea6f2a]" : "bg-[#ea6f2a] text-white"
                  }`}
                >
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
          className="w-full bg-gradient-to-r from-[#ea6f2a] via-[#f07b38] to-[#ea6f2a] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white font-extrabold rounded-2xl h-13 text-sm xl:text-base gap-2 shadow-xl shadow-[#ea6f2a]/25 border border-white/10 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Share to Feed
        </Button>
      )}

      {/* Network Quick Links */}
      <div className="px-4 py-2 text-[11px] text-[#9a9fc4] space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/shows" className="hover:text-[#20efe0] transition-colors">
            Shows
          </Link>
          <span>•</span>
          <Link href="/watch" className="hover:text-[#20efe0] transition-colors">
            Broadcasts
          </Link>
          <span>•</span>
          <Link href="/music" className="hover:text-[#20efe0] transition-colors">
            Music Hub
          </Link>
          <span>•</span>
          <Link href="/merch" className="hover:text-[#20efe0] transition-colors">
            Merch
          </Link>
        </div>
        <p className="text-[10px] text-[#6b7299]">StarCast Media &copy; 2026</p>
      </div>
    </aside>
  )
}
