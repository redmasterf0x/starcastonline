import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Flame,
  Star,
  Users,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Radio,
  Clock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export interface CommunityHomePost {
  id: string
  title?: string | null
  content: string
  category?: string | null
  authorName: string
  authorUsername?: string | null
  authorAvatar?: string | null
  authorRole?: string | null
  createdAt: string
  replyCount: number
  starCount: number
  hasPoll?: boolean
  hasImage?: boolean
  href: string
}

interface CommunityHomeModuleProps {
  posts: CommunityHomePost[]
}

export function CommunityHomeModule({ posts }: CommunityHomeModuleProps) {
  const displayPosts = posts.slice(0, 5)

  return (
    <div className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/85 p-5 sm:p-6 lg:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden h-full">
      {/* Cosmic background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd166]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Module Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20205a]/60 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#ffd166]">
                COMMUNITY LOUNGE // THE DECK
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
                Live Community Feed
              </h3>
            </div>
          </div>

          <Link
            href="/community"
            className="text-xs text-[#ffd166] hover:text-white transition-colors font-bold flex items-center gap-1 group"
          >
            Enter The DECK <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Quick Post Prompt CTA */}
        <div className="rounded-2xl border border-[#ffd166]/30 bg-gradient-to-r from-[#ffd166]/10 via-[#0c0c3f] to-[#ea6f2a]/10 p-3.5 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#ffd166]/20 border border-[#ffd166]/40 flex items-center justify-center text-[#ffd166] shrink-0 font-bold text-xs">
              ⚡
            </div>
            <p className="text-xs text-[#f5f7ff] truncate">
              <span className="font-bold text-[#ffd166]">The DECK is live:</span> share thoughts or band reactions!
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-[#ffd166] hover:bg-[#ffc338] text-black font-black text-xs rounded-xl h-8 px-3 shrink-0 shadow-md"
          >
            <Link href="/community?tab=deck">
              Post Now
            </Link>
          </Button>
        </div>

        {/* Live Posts Stream */}
        <div className="space-y-3.5">
          {displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <Link
                key={post.id}
                href={post.href}
                className="group block rounded-2xl border border-[#20205a]/70 bg-[#0c0c3f]/60 hover:bg-[#0c0c3f] hover:border-[#ffd166]/60 p-4 transition-all duration-200 shadow-sm hover:shadow-lg"
              >
                {/* Author row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-[#20205a] shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#20efe0]/20 border border-[#20efe0]/40 flex items-center justify-center text-[#20efe0] font-black text-xs shrink-0">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#f5f7ff] group-hover:text-[#ffd166] transition-colors truncate">
                        {post.authorName}
                      </p>
                      {post.authorUsername && (
                        <p className="text-[10px] text-[#9a9fc4] font-mono truncate">
                          @{post.authorUsername}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {post.category && (
                      <Badge
                        variant="outline"
                        className="border-[#ffd166]/40 text-[#ffd166] bg-[#ffd166]/10 text-[10px] font-mono px-2 py-0.2"
                      >
                        {post.category}
                      </Badge>
                    )}
                    <span className="text-[10px] text-[#9a9fc4] font-mono">
                      {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                </div>

                {/* Content snippet */}
                <p className="text-xs sm:text-sm text-[#cbd0f2] line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                {/* Meta indicators */}
                <div className="mt-3 pt-2.5 border-t border-[#20205a]/50 flex items-center justify-between text-[11px] text-[#9a9fc4]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[#ffd166]">
                      <Star className="w-3 h-3 fill-current" />
                      {post.starCount}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[#20efe0]">
                      <MessageCircle className="w-3 h-3" />
                      {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
                    </span>
                    {post.hasPoll && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#20efe0]/15 text-[#20efe0]">
                        📊 Poll
                      </span>
                    )}
                  </div>

                  <span className="text-[#ffd166] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Reply &rarr;
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/40 p-6 text-center text-xs text-[#9a9fc4] space-y-2">
              <MessageCircle className="w-8 h-8 text-[#ffd166] mx-auto opacity-70" />
              <p className="font-bold text-[#f5f7ff]">Be the first to post on The DECK!</p>
              <p className="text-[11px] text-[#cbd0f2]">
                Join the local conversation, talk about shows, or share regional music news.
              </p>
              <Button asChild size="sm" className="mt-2 bg-[#ffd166] hover:bg-[#ffc338] text-black font-bold text-xs rounded-xl">
                <Link href="/community">Open Community Lounge</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Module Footer CTA */}
      <div className="relative z-10 mt-5 pt-4 border-t border-[#20205a]/60 flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#9a9fc4] uppercase">
          COMMUNITY GUIDELINES ACTIVE
        </span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-[#ffd166]/40 text-[#ffd166] hover:bg-[#ffd166]/20 hover:text-white rounded-xl text-xs font-bold h-9"
        >
          <Link href="/community">
            Explore All Discussions &rarr;
          </Link>
        </Button>
      </div>
    </div>
  )
}

