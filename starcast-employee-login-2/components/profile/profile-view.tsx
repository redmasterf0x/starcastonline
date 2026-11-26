"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  getProfilePageData,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
} from "@/app/actions/community"
import { equipProfileCosmetics } from "@/app/actions/profile"
import {
  PROFILE_FRAMES,
  PROFILE_BANNERS,
  getFrameById,
  getBannerById,
  type LevelProgress,
  type ProfileFrameDef,
  type ProfileBannerDef,
} from "@/lib/profile-progression"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  MapPin,
  Globe,
  Calendar,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  ArrowBigUp,
  Star,
  Users,
  Settings,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Maximize2,
  Layers,
  Palette,
  Lock,
  Check,
  Trophy,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { ProfilePostComposer } from "@/components/profile/profile-post-composer"

interface UserProfile {
  id: string
  user_id: string
  username?: string
  first_name: string
  last_name: string
  bio: string
  profile_pic: string
  location: string
  website: string
  is_employee: boolean
  is_admin: boolean
  equipped_frame?: string
  equipped_banner?: string
  created_at: string
}

interface CommunityPost {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  star_count: number
  images?: { url: string; credit?: string }[]
}

interface Friend {
  id: string
  user_id: string
  username?: string
  first_name: string
  last_name: string
  profile_pic: string
  equipped_frame?: string
  is_employee: boolean
}

function BannerPatternOverlay({ pattern }: { pattern?: ProfileBannerDef["overlayPattern"] }) {
  if (pattern === "grid") {
    return (
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(32,239,224,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(32,239,224,0.22) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    )
  }
  if (pattern === "stars") {
    return (
      <div
        className="absolute inset-0 opacity-45 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, rgba(255,255,255,0.85) 1.5px, transparent 2px), radial-gradient(circle at 75% 35%, rgba(255,209,102,0.85) 2px, transparent 3px), radial-gradient(circle at 45% 70%, rgba(32,239,224,0.8) 1.5px, transparent 2.5px), radial-gradient(circle at 88% 75%, rgba(255,255,255,0.7) 1px, transparent 2px), radial-gradient(circle at 28% 80%, rgba(232,69,214,0.75) 2px, transparent 3px)",
          backgroundSize: "180px 140px",
        }}
      />
    )
  }
  if (pattern === "rays") {
    return (
      <div
        className="absolute inset-0 opacity-35 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,209,102,0.45) 0%, rgba(234,111,42,0.15) 45%, transparent 75%)",
        }}
      />
    )
  }
  return (
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0Q0NzIyQiIgZmlsbC1vcGFjaXR5PSIuMDgiIGN4PSIyMCIgY3k9IjIwIiByPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-60 pointer-events-none" />
  )
}

function FramedAvatar({
  src,
  initials,
  frame,
  level,
  size = "lg",
  isEmployee = false,
}: {
  src?: string | null
  initials: string
  frame: ProfileFrameDef
  level?: number
  size?: "sm" | "md" | "lg"
  isEmployee?: boolean
}) {
  const dims =
    size === "lg"
      ? "w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 p-[5px]"
      : size === "md"
      ? "w-24 h-24 p-[4px]"
      : "w-14 h-14 p-[2.5px]"

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div
        className={cn(
          "relative rounded-full overflow-hidden flex items-center justify-center transition-all duration-300",
          dims,
          frame.ringClass
        )}
      >
        {frame.animatedConic && (
          <div
            className="absolute -inset-6 animate-spin pointer-events-none"
            style={{
              background: frame.animatedConic,
              animationDuration: "5s",
            }}
          />
        )}

        <div className="relative z-10 w-full h-full rounded-full bg-[#05052d] overflow-hidden flex items-center justify-center border-2 border-[#05052d]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Profile avatar" className="w-full h-full object-cover" />
          ) : (
            <span
              className={cn(
                "font-black text-[#f5f7ff] select-none",
                size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-sm"
              )}
            >
              {initials || "★"}
            </span>
          )}
        </div>
      </div>

      {/* Team Member Sparkle */}
      {isEmployee && size === "lg" && (
        <div
          className="absolute top-1 right-1 z-20 w-8 h-8 rounded-full bg-[#ea6f2a] border-2 border-[#05052d] flex items-center justify-center shadow-lg"
          title="StarCast Team Member"
        >
          <Sparkles className="w-4 h-4 text-white shrink-0" />
        </div>
      )}

      {/* Centered Level Pill Badge */}
      {level !== undefined && size !== "sm" && (
        <div
          className={cn(
            "relative z-20 -mt-3.5 px-3 py-0.5 rounded-full border text-[11px] font-black uppercase tracking-wider font-mono shadow-lg",
            frame.badgeClass
          )}
        >
          LVL {level}
        </div>
      )}
    </div>
  )
}

/**
 * Full member profile. Rendered by both `/profile/[id]` (auth user id) and
 * `/u/[username]` (public handle, resolved to a user id on the server).
 */
export function ProfileView({ userId }: { userId: string }) {
  const id = userId
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progression, setProgression] = useState<LevelProgress | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [totalStars, setTotalStars] = useState(0)
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending_sent" | "pending_received" | "accepted" | "self"
  >("self")
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [activeProfileTab, setActiveProfileTab] = useState<"all" | "photos" | "friends">("all")
  const [showXpBreakdown, setShowXpBreakdown] = useState(false)

  // Wardrobe / Cosmetics Modal State
  const [wardrobeOpen, setWardrobeOpen] = useState(false)
  const [wardrobeTab, setWardrobeTab] = useState<"frames" | "banners">("frames")
  const [previewFrameId, setPreviewFrameId] = useState<string>("none")
  const [previewBannerId, setPreviewBannerId] = useState<string>("cosmic-grid")
  const [savingCosmetics, setSavingCosmetics] = useState(false)
  const [cosmeticError, setCosmeticError] = useState<string | null>(null)

  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{
    url: string
    postTitle?: string
    date?: string
  } | null>(null)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const router = useRouter()

  const isLoggedIn = !!currentUserId
  const isOwnProfile = friendshipStatus === "self"

  const photoPosts = posts.filter((p) => p.images && p.images.length > 0)
  const totalPhotosCount = photoPosts.reduce((acc, p) => acc + (p.images?.length || 0), 0)

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  useEffect(() => {
    fetchPageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchPageData = async () => {
    setLoading(true)
    try {
      const data = await getProfilePageData(id)
      if (data) {
        const p = data.profile as UserProfile
        setProfile(p)
        setProgression(data.progression ?? null)
        setPreviewFrameId(p.equipped_frame || "none")
        setPreviewBannerId(p.equipped_banner || "cosmic-grid")
        setPosts(data.posts as CommunityPost[])
        setFriends(data.friends as Friend[])
        setTotalStars(data.totalStars)
        setFriendshipStatus(data.friendshipStatus)
        setFriendshipId(data.friendshipId)
        if (data.viewer) {
          setCurrentUserId(data.viewer.user_id)
          setCurrentUserDbId(data.viewer.id)
          setIsAdmin(data.viewer.is_admin)
          setIsCrew(data.viewer.is_employee)
        } else {
          if (data.friendshipStatus === "self") setFriendshipStatus("none")
        }
      }
    } catch {
      // profile not found or db error
    }
    setLoading(false)
  }

  const openWardrobe = () => {
    if (!profile) return
    setPreviewFrameId(profile.equipped_frame || "none")
    setPreviewBannerId(profile.equipped_banner || "cosmic-grid")
    setCosmeticError(null)
    setWardrobeOpen(true)
  }

  const handleSaveCosmetics = async () => {
    if (!profile || savingCosmetics) return
    setSavingCosmetics(true)
    setCosmeticError(null)
    try {
      const res = await equipProfileCosmetics({
        frameId: previewFrameId,
        bannerId: previewBannerId,
      })
      if (!res.success) {
        setCosmeticError(res.error || "Failed to equip cosmetics.")
      } else {
        setProfile({
          ...profile,
          equipped_frame: res.equippedFrame,
          equipped_banner: res.equippedBanner,
        })
        setWardrobeOpen(false)
      }
    } catch (err: any) {
      setCosmeticError(err?.message || "Failed to equip cosmetics.")
    } finally {
      setSavingCosmetics(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!currentUserDbId || !profile) return
    await sendFriendRequest(profile.id)
    fetchPageData()
  }

  const handleAcceptRequest = async () => {
    if (!friendshipId) return
    setFriendshipStatus("accepted")
    try {
      await acceptFriendRequest(friendshipId)
      await fetchPageData()
    } catch {
      fetchPageData()
    }
  }

  const handleUnfriend = async () => {
    if (!friendshipId) return
    await removeFriendship(friendshipId)
    setFriendshipStatus("none")
    setFriendshipId(null)
    fetchPageData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <ResponsiveHeader
          currentPage="/profile"
          isAdmin={isAdmin}
          isCrew={isCrew}
          isLoggedIn={isLoggedIn}
          onSignOut={handleSignOut}
          onLogin={() => router.push("/login")}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#9a9fc4]" />
            </div>
            <p className="text-[#f5f7ff] text-xl font-semibold mb-2">Profile not found</p>
            <p className="text-[#9a9fc4] mb-6">This user may have been removed or doesn&apos;t exist.</p>
            <Link href="/community" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
              Back to Community
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const equippedFrame = getFrameById(profile.equipped_frame)
  const equippedBanner = getBannerById(profile.equipped_banner)
  const userLevel = progression?.level ?? 1
  const rankTitle = progression?.rankTitle ?? "Stargazer"
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`

  const previewFrame = getFrameById(previewFrameId)
  const previewBanner = getBannerById(previewBannerId)
  const canUnlockFrame = (f: ProfileFrameDef) => isAdmin || userLevel >= f.unlockLevel
  const canUnlockBanner = (b: ProfileBannerDef) => isAdmin || userLevel >= b.unlockLevel

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader
        currentPage="/profile"
        isAdmin={isAdmin}
        isCrew={isCrew}
        isLoggedIn={isLoggedIn}
        onSignOut={handleSignOut}
        onLogin={() => router.push("/login")}
      />

      {/* Equipped Hero Banner */}
      <div className={cn("relative h-52 sm:h-64 md:h-72 overflow-hidden transition-all", equippedBanner.bgClass)}>
        <BannerPatternOverlay pattern={equippedBanner.overlayPattern} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05051f] via-[#05052d]/70 to-transparent" />

        {/* Own-profile top-right quick actions */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openWardrobe}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#05052d]/75 backdrop-blur-md text-[#20efe0] text-xs sm:text-sm font-bold hover:bg-[#0c0c3f] transition-colors border border-[#20efe0]/45 shadow-lg cursor-pointer"
            >
              <Palette className="w-4 h-4 shrink-0" />
              Frames &amp; Banners
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-[#f5f7ff] text-xs sm:text-sm font-medium hover:bg-white/20 transition-colors border border-white/15 shadow-lg"
            >
              <Settings className="w-4 h-4 shrink-0" />
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 -mt-20 sm:-mt-24 relative z-10 pb-12">
        {/* Center-Aligned Profile Card */}
        <div className="bg-[#0c0c3f]/85 backdrop-blur-md border border-[#20205a] rounded-3xl px-5 sm:px-8 pb-7 pt-0 mb-6 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            {/* Centered Profile Picture + Equipped Frame + Level Pill */}
            <div className="-mt-16 sm:-mt-20 mb-4">
              <FramedAvatar
                src={profile.profile_pic}
                initials={initials}
                frame={equippedFrame}
                level={userLevel}
                size="lg"
                isEmployee={profile.is_employee}
              />
            </div>

            {/* Centered Name, Handle & Badges */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#f5f7ff]">
              {profile.first_name} {profile.last_name}
            </h1>

            {profile.username && (
              <p className="text-xs sm:text-sm font-mono text-[#9a9fc4] mt-0.5">
                @{profile.username}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/35 px-3 py-0.5 text-xs font-semibold">
                <Trophy className="w-3 h-3 mr-1.5 shrink-0 text-[#ffd166]" />
                {rankTitle}
              </Badge>

              {profile.is_employee && (
                <Badge className="bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/40 px-3 py-0.5 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 mr-1 shrink-0" />
                  Team Member
                </Badge>
              )}

              {profile.is_admin && (
                <Badge className="bg-purple-900/35 text-purple-300 border border-purple-500/40 px-3 py-0.5 text-xs font-semibold">
                  Admin
                </Badge>
              )}
            </div>

            {/* Centered Bio */}
            {profile.bio && (
              <p className="text-[#cbd0f2] text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Centered Meta Row */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#9a9fc4] mt-4">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#ea6f2a] shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#20efe0] hover:underline transition-colors"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Website</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#ffd166] shrink-0" />
                <span>
                  Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    timeZone: "America/Chicago",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Centered Stats */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mt-6 pt-5 border-t border-[#20205a]/70 w-full max-w-md">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-[#f5f7ff]">{posts.length}</p>
                <p className="text-[11px] text-[#9a9fc4] uppercase tracking-wider">Posts</p>
              </div>
              <div className="w-px h-8 bg-[#20205a]" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-[#f5f7ff]">{friends.length}</p>
                <p className="text-[11px] text-[#9a9fc4] uppercase tracking-wider">Friends</p>
              </div>
              <div className="w-px h-8 bg-[#20205a]" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-[#ffd166]">{totalStars}</p>
                <p className="text-[11px] text-[#9a9fc4] uppercase tracking-wider">Stars</p>
              </div>
              <div className="w-px h-8 bg-[#20205a]" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-[#20efe0]">{userLevel}</p>
                <p className="text-[11px] text-[#9a9fc4] uppercase tracking-wider">Level</p>
              </div>
            </div>

            {/* Level & XP Progression Bar */}
            {progression && (
              <div className="w-full max-w-xl mt-6 rounded-2xl border border-[#20205a] bg-[#05052d]/75 p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#f5f7ff]">
                    <span className="text-[#ffd166] font-mono">Level {progression.level}</span>
                    <span className="text-[#9a9fc4]">&bull;</span>
                    <span className="text-[#20efe0]">{progression.rankTitle}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#9a9fc4]">
                    {progression.totalXp.toLocaleString()} XP ({progression.xpIntoLevel}/
                    {progression.xpNeededForNext} to Lvl {progression.level + 1})
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-[#0c0c3f] border border-[#20205a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] transition-all duration-500"
                    style={{ width: `${progression.progressPercent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowXpBreakdown((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors cursor-pointer"
                  >
                    {showXpBreakdown ? (
                      <>
                        Hide XP Breakdown <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        View XP Breakdown &amp; How to Level Up <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={openWardrobe}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#20efe0] hover:text-[#ffd166] transition-colors cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Equip Frames &amp; Banners &rarr;
                    </button>
                  )}
                </div>

                {showXpBreakdown && (
                  <div className="pt-2.5 border-t border-[#20205a]/70 space-y-2 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {progression.breakdown.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#0c0c3f]/70 border border-[#20205a]/60 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#f5f7ff] truncate">{item.label}</p>
                            <p className="text-[10px] text-[#9a9fc4] truncate">{item.detail}</p>
                          </div>
                          <span className="font-mono font-bold text-[#ffd166] shrink-0">
                            +{item.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#9a9fc4] text-center pt-1">
                      Earn XP by posting (+35), commenting (+12), earning ⭐ stars (+15), adding friends (+25), buying event tickets (+60), and uploading music (+40).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Visitor Friend / Message Actions */}
            {friendshipStatus !== "self" && (
              <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
                {!isLoggedIn ? (
                  <>
                    <Button
                      onClick={() => setAuthPromptOpen(true)}
                      className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/20"
                    >
                      <UserPlus className="w-4 h-4 mr-2 shrink-0" />
                      Add Friend
                    </Button>
                    <Button
                      onClick={() => setAuthPromptOpen(true)}
                      variant="outline"
                      className="border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50 bg-transparent"
                    >
                      <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                      Message
                    </Button>
                  </>
                ) : (
                  <>
                    {friendshipStatus === "none" && (
                      <Button
                        onClick={handleSendFriendRequest}
                        className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/20"
                      >
                        <UserPlus className="w-4 h-4 mr-2 shrink-0" />
                        Add Friend
                      </Button>
                    )}
                    {friendshipStatus === "pending_sent" && (
                      <Button
                        variant="outline"
                        disabled
                        className="border-[#20205a] text-[#9a9fc4] bg-transparent"
                      >
                        <Clock className="w-4 h-4 mr-2 shrink-0" />
                        Request Sent
                      </Button>
                    )}
                    {friendshipStatus === "pending_received" && (
                      <Button
                        onClick={handleAcceptRequest}
                        className="bg-[#22b573] hover:bg-[#1a935c] text-[#05051f] font-bold"
                      >
                        <UserCheck className="w-4 h-4 mr-2 shrink-0" />
                        Accept Request
                      </Button>
                    )}
                    {friendshipStatus === "accepted" && (
                      <>
                        <Button
                          onClick={() => router.push("/community")}
                          className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold"
                        >
                          <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                          Message
                        </Button>
                        <Button
                          onClick={handleUnfriend}
                          variant="outline"
                          className="border-red-800/50 text-red-400/80 hover:text-red-300 hover:bg-red-950/30 bg-transparent"
                        >
                          Unfriend
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Own-profile inline composer */}
        {isOwnProfile && (
          <div className="mb-6">
            <ProfilePostComposer
              authorInitials={initials}
              authorPic={profile.profile_pic || null}
              onPosted={() => fetchPageData()}
            />
          </div>
        )}

        {/* Content Navigation Tabs */}
        <div className="flex justify-center sm:justify-start gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveProfileTab("all")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeProfileTab === "all"
                ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/20"
                : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            All ({posts.length})
          </button>
          <button
            onClick={() => setActiveProfileTab("photos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeProfileTab === "photos"
                ? "bg-[#20efe0] text-[#05052d] shadow-lg shadow-[#20efe0]/20 font-bold"
                : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            Photos ({totalPhotosCount})
          </button>
          <button
            onClick={() => setActiveProfileTab("friends")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeProfileTab === "friends"
                ? "bg-[#ffd166] text-[#05052d] shadow-lg shadow-[#ffd166]/20 font-bold"
                : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Friends ({friends.length})
          </button>
        </div>

        {/* Tab 1: All Posts */}
        {activeProfileTab === "all" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
                  <ArrowBigUp className="w-8 h-8 text-[#9a9fc4]" />
                </div>
                <p className="text-[#f5f7ff] text-lg font-bold">No posts yet</p>
                <p className="text-[#9a9fc4] text-sm mt-1">
                  {isOwnProfile
                    ? "Write an update or upload photos above to start your feed and earn +35 XP!"
                    : `${profile.first_name} hasn't posted anything yet.`}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#0c0c3f]/60 border border-[#20205a]/70 rounded-2xl p-5 hover:border-[#ea6f2a]/40 transition-colors group shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {post.category && (
                          <span className="text-[11px] font-semibold text-[#ea6f2a] bg-[#ea6f2a]/15 px-2.5 py-0.5 rounded-full border border-[#ea6f2a]/30">
                            {post.category}
                          </span>
                        )}
                        <span className="text-xs text-[#9a9fc4]">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            timeZone: "America/Chicago",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {post.title && (
                        <h3 className="text-base sm:text-lg font-bold text-[#f5f7ff] mb-2 group-hover:text-[#ea6f2a] transition-colors">
                          {post.title}
                        </h3>
                      )}

                      {post.content && (
                        <p className="text-sm sm:text-base text-[#dbe0fb] leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      )}

                      {post.images && post.images.length > 0 && (
                        <div
                          className={`mt-4 grid gap-2.5 rounded-2xl overflow-hidden ${
                            post.images.length === 1
                              ? "grid-cols-1 max-w-lg"
                              : post.images.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 sm:grid-cols-3"
                          }`}
                        >
                          {post.images.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() =>
                                setSelectedPhotoPreview({
                                  url: img.url,
                                  postTitle: post.title,
                                  date: post.created_at,
                                })
                              }
                              className="relative group/photo cursor-pointer overflow-hidden rounded-xl bg-[#05052d] aspect-square sm:aspect-video border border-[#20205a]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.credit || post.title || "Post photo"}
                                className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[#ffd166] bg-[#ffd166]/15 border border-[#ffd166]/30 px-3 py-1 rounded-full shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#ffd166]" />
                      <span className="text-xs font-bold">{post.star_count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Photos Media Gallery */}
        {activeProfileTab === "photos" && (
          <div>
            {photoPosts.length === 0 ? (
              <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-[#9a9fc4]" />
                </div>
                <p className="text-[#f5f7ff] text-lg font-bold">No photos uploaded yet</p>
                <p className="text-[#9a9fc4] text-sm mt-1">
                  {isOwnProfile
                    ? "Upload photos using the composer at the top to build your gallery!"
                    : `${profile.first_name} hasn't uploaded any photos yet.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {photoPosts.flatMap((post) =>
                  (post.images || []).map((img, idx) => (
                    <div
                      key={`${post.id}-${idx}`}
                      onClick={() =>
                        setSelectedPhotoPreview({
                          url: img.url,
                          postTitle: post.title,
                          date: post.created_at,
                        })
                      }
                      className="relative group cursor-pointer rounded-2xl overflow-hidden border border-[#20205a] bg-[#0c0c3f] aspect-square shadow-lg hover:border-[#20efe0] transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.credit || post.title || "Gallery photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-bold truncate">{post.title || "Photo"}</p>
                        <p className="text-[10px] text-[#20efe0] font-mono mt-0.5">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            timeZone: "America/Chicago",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Friends */}
        {activeProfileTab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#9a9fc4]" />
                </div>
                <p className="text-[#9a9fc4] text-lg">No friends yet</p>
                <p className="text-[#9a9fc4]/60 text-sm mt-1">
                  {isOwnProfile
                    ? "Connect with other members in the community to earn +25 XP per friend!"
                    : `${profile.first_name} hasn't added any friends yet.`}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => {
                  const friendFrame = getFrameById(friend.equipped_frame)
                  const friendHref = friend.username
                    ? `/u/${friend.username}`
                    : `/profile/${friend.user_id}`
                  return (
                    <Link
                      key={friend.id}
                      href={friendHref}
                      className="group bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-4 hover:border-[#ea6f2a]/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <FramedAvatar
                          src={friend.profile_pic}
                          initials={`${friend.first_name?.[0] || ""}${friend.last_name?.[0] || ""}`}
                          frame={friendFrame}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#f5f7ff] truncate group-hover:text-[#ea6f2a] transition-colors">
                            {friend.first_name} {friend.last_name}
                          </h3>
                          <p className="text-xs text-[#9a9fc4] truncate">
                            {friend.username ? `@${friend.username}` : "View Profile"}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#9a9fc4]/50 group-hover:text-[#ea6f2a] group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* FRAMES & BANNERS COSMETICS WARDROBE DIALOG */}
      {/* =================================================================== */}
      <Dialog open={wardrobeOpen} onOpenChange={setWardrobeOpen}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#20efe0]" />
              Cosmic Wardrobe &mdash; Frames &amp; Banners
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#9a9fc4]">
              You are currently <strong className="text-[#ffd166]">Level {userLevel} ({rankTitle})</strong>. Level up across StarCast to unlock higher-tier avatar frames and profile banners!
            </DialogDescription>
          </DialogHeader>

          {/* Live Centered Mini Profile Preview */}
          <div className="rounded-2xl border border-[#20205a] bg-[#05052d] overflow-hidden">
            <div className={cn("relative h-28 sm:h-32 overflow-hidden transition-all", previewBanner.bgClass)}>
              <BannerPatternOverlay pattern={previewBanner.overlayPattern} />
              <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-[#05052d] to-transparent" />
              <span className="absolute top-2.5 right-3 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/50 text-[#cbd0f2] border border-white/15">
                Live Preview
              </span>
            </div>
            <div className="-mt-12 pb-4 px-4 flex flex-col items-center text-center relative z-10">
              <FramedAvatar
                src={profile.profile_pic}
                initials={initials}
                frame={previewFrame}
                level={userLevel}
                size="md"
              />
              <p className="text-sm font-bold text-white mt-1.5">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-[11px] text-[#9a9fc4]">
                Frame: <span className="text-[#20efe0] font-semibold">{previewFrame.name}</span> &bull; Banner:{" "}
                <span className="text-[#ffd166] font-semibold">{previewBanner.name}</span>
              </p>
            </div>
          </div>

          {/* Switcher Tabs */}
          <div className="inline-flex rounded-xl bg-[#05052d] border border-[#20205a] p-1 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setWardrobeTab("frames")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                wardrobeTab === "frames"
                  ? "bg-[#ea6f2a] text-white"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              Avatar Frames ({PROFILE_FRAMES.length})
            </button>
            <button
              type="button"
              onClick={() => setWardrobeTab("banners")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                wardrobeTab === "banners"
                  ? "bg-[#20efe0] text-[#05051f]"
                  : "text-[#9a9fc4] hover:text-white"
              }`}
            >
              Profile Banners ({PROFILE_BANNERS.length})
            </button>
          </div>

          {wardrobeTab === "frames" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROFILE_FRAMES.map((frame) => {
                const unlocked = canUnlockFrame(frame)
                const isSelected = previewFrameId === frame.id
                const isEquipped = (profile.equipped_frame || "none") === frame.id
                return (
                  <button
                    key={frame.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && setPreviewFrameId(frame.id)}
                    className={cn(
                      "rounded-2xl border p-3.5 text-left flex items-center gap-3.5 transition-all",
                      !unlocked
                        ? "border-[#20205a]/50 bg-[#05052d]/40 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-[#20efe0] bg-[#05052d] shadow-[0_0_20px_rgba(32,239,224,0.2)] cursor-pointer"
                        : "border-[#20205a] bg-[#05052d]/70 hover:border-[#ea6f2a]/50 cursor-pointer"
                    )}
                  >
                    <FramedAvatar src={profile.profile_pic} initials={initials} frame={frame} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">{frame.name}</p>
                        {!unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Lvl {frame.unlockLevel}
                          </span>
                        ) : isEquipped ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40 shrink-0">
                            <Check className="w-2.5 h-2.5" /> Equipped
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#9a9fc4] shrink-0">
                            Lvl {frame.unlockLevel}+
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9a9fc4] line-clamp-2 mt-0.5">
                        {frame.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROFILE_BANNERS.map((banner) => {
                const unlocked = canUnlockBanner(banner)
                const isSelected = previewBannerId === banner.id
                const isEquipped = (profile.equipped_banner || "cosmic-grid") === banner.id
                return (
                  <button
                    key={banner.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && setPreviewBannerId(banner.id)}
                    className={cn(
                      "rounded-2xl border overflow-hidden text-left transition-all flex flex-col",
                      !unlocked
                        ? "border-[#20205a]/50 bg-[#05052d]/40 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-[#20efe0] bg-[#05052d] shadow-[0_0_20px_rgba(32,239,224,0.2)] cursor-pointer"
                        : "border-[#20205a] bg-[#05052d]/70 hover:border-[#ea6f2a]/50 cursor-pointer"
                    )}
                  >
                    <div className={cn("relative h-16 w-full", banner.bgClass)}>
                      <BannerPatternOverlay pattern={banner.overlayPattern} />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">{banner.name}</p>
                        {!unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Lvl {banner.unlockLevel}
                          </span>
                        ) : isEquipped ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40 shrink-0">
                            <Check className="w-2.5 h-2.5" /> Equipped
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#9a9fc4] shrink-0">
                            Lvl {banner.unlockLevel}+
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9a9fc4] line-clamp-2">
                        {banner.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {cosmeticError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {cosmeticError}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWardrobeOpen(false)}
              className="border-[#20205a] bg-[#05052d] text-[#dbe0fb] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingCosmetics}
              onClick={handleSaveCosmetics}
              className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl"
            >
              {savingCosmetics ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save &amp; Equip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Prompt Dialog */}
      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="bg-[#0c0c3f] border-[#20205a] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Join StarCast</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Create an account or sign in to connect with {profile?.first_name}, send friend requests, and message the community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => {
                setAuthPromptOpen(false)
                router.push("/signup")
              }}
              className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white w-full"
            >
              Create Account
            </Button>
            <Button
              onClick={() => {
                setAuthPromptOpen(false)
                router.push("/login")
              }}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/30 bg-transparent w-full"
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Zoom Dialog */}
      <Dialog
        open={!!selectedPhotoPreview}
        onOpenChange={(open) => !open && setSelectedPhotoPreview(null)}
      >
        <DialogContent className="bg-[#05052d]/95 border-[#20205a] max-w-3xl p-4 sm:p-6 backdrop-blur-xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-sm sm:text-base font-bold text-[#f5f7ff]">
              {selectedPhotoPreview?.postTitle || "Photo Preview"}
            </DialogTitle>
            {selectedPhotoPreview?.date && (
              <DialogDescription className="text-xs text-[#9a9fc4]">
                Uploaded{" "}
                {new Date(selectedPhotoPreview.date).toLocaleDateString("en-US", {
                  timeZone: "America/Chicago",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="relative rounded-2xl overflow-hidden bg-black/60 max-h-[75vh] flex items-center justify-center">
            {selectedPhotoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPhotoPreview.url}
                alt={selectedPhotoPreview.postTitle || "Photo"}
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
