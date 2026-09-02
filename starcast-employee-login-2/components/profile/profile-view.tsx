"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import {
  getProfilePageData,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
} from "@/app/actions/community"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  MapPin, Globe, Calendar, UserPlus, UserCheck, Clock, 
  MessageSquare, ArrowBigUp, Star, Users, Settings, 
  ChevronRight, Sparkles
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  bio: string
  profile_pic: string
  location: string
  website: string
  is_employee: boolean
  is_admin: boolean
  created_at: string
}

interface CommunityPost {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  star_count: number
}

interface Friend {
  id: string
  user_id: string
  first_name: string
  last_name: string
  profile_pic: string
  is_employee: boolean
}

/**
 * Full member profile. Rendered by both `/profile/[id]` (auth user id) and
 * `/u/[username]` (public handle, resolved to a user id on the server).
 */
export function ProfileView({ userId }: { userId: string }) {
  const id = userId
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [totalStars, setTotalStars] = useState(0)
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted" | "self">("self")
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [activeProfileTab, setActiveProfileTab] = useState<"posts" | "friends">("posts")
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const router = useRouter()

  const isLoggedIn = !!currentUserId
  const isOwnProfile = friendshipStatus === "self"

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
        setProfile(data.profile as UserProfile)
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
          // Signed out viewers are never "self"
          if (data.friendshipStatus === "self") setFriendshipStatus("none")
        }
      }
    } catch {
      // profile not found or db error — render "not found" state
    }
    setLoading(false)
  }

  const handleSendFriendRequest = async () => {
    if (!currentUserDbId || !profile) return
    await sendFriendRequest(profile.id)
    fetchPageData()
  }

  const handleAcceptRequest = async () => {
    if (!friendshipId) return
    await acceptFriendRequest(friendshipId)
    fetchPageData()
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
        <ResponsiveHeader currentPage="/profile" isAdmin={isAdmin} isCrew={isCrew} isLoggedIn={isLoggedIn} onSignOut={handleSignOut} onLogin={() => router.push("/login")} />
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

      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[#20205a] via-[#0c0c3f] to-[#05052d] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0Q0NzIyQiIgZmlsbC1vcGFjaXR5PSIuMDUiIGN4PSIyMCIgY3k9IjIwIiByPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05052d] to-transparent" />
        
        {/* Edit Profile Button for own profile */}
        {isOwnProfile && (
          <Link
            href="/dashboard"
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-[#f5f7ff] text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Link>
        )}
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 -mt-20 relative z-10 pb-12">
        {/* Profile Card */}
        <div className="bg-[#0c0c3f]/80 backdrop-blur-sm border border-[#20205a] rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-start">
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-[#ea6f2a] to-[#bc3f00] p-1">
                  <div className="w-full h-full rounded-xl bg-[#05052d] overflow-hidden flex items-center justify-center">
                    {profile.profile_pic ? (
                      <img src={profile.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-[#f5f7ff]">
                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                      </span>
                    )}
                  </div>
                </div>
                {profile.is_employee && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#ea6f2a] flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-[#f5f7ff]">
                  {profile.first_name} {profile.last_name}
                </h1>
                {profile.is_employee && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-[#ea6f2a]/20 to-[#bc3f00]/20 text-[#ea6f2a] px-3 py-1 rounded-full border border-[#ea6f2a]/30 self-center">
                    <Sparkles className="w-3 h-3" />
                    Team Member
                  </span>
                )}
                {profile.is_admin && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 self-center">
                    Admin
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-[#9a9fc4] mb-4 max-w-xl leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-sm text-[#9a9fc4] mb-5">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#ea6f2a]" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#ea6f2a] hover:text-[#f2a04a] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#ea6f2a]" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#f5f7ff]">{posts.length}</p>
                  <p className="text-xs text-[#9a9fc4] uppercase tracking-wide">Posts</p>
                </div>
                <div className="w-px h-8 bg-[#20205a]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#f5f7ff]">{friends.length}</p>
                  <p className="text-xs text-[#9a9fc4] uppercase tracking-wide">Friends</p>
                </div>
                <div className="w-px h-8 bg-[#20205a]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#ea6f2a]">{totalStars}</p>
                  <p className="text-xs text-[#9a9fc4] uppercase tracking-wide">Stars</p>
                </div>
              </div>

              {/* Actions */}
              {friendshipStatus !== "self" && (
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {!isLoggedIn ? (
                    <>
                      <Button
                        onClick={() => setAuthPromptOpen(true)}
                        className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white shadow-lg shadow-[#ea6f2a]/20"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                      <Button
                        onClick={() => setAuthPromptOpen(true)}
                        variant="outline"
                        className="border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50 bg-transparent"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </>
                  ) : (
                    <>
                      {friendshipStatus === "none" && (
                        <Button
                          onClick={handleSendFriendRequest}
                          className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white shadow-lg shadow-[#ea6f2a]/20"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Friend
                        </Button>
                      )}
                      {friendshipStatus === "pending_sent" && (
                        <Button variant="outline" disabled className="border-[#20205a] text-[#9a9fc4] bg-transparent">
                          <Clock className="w-4 h-4 mr-2" />
                          Request Sent
                        </Button>
                      )}
                      {friendshipStatus === "pending_received" && (
                        <Button
                          onClick={handleAcceptRequest}
                          className="bg-green-600 hover:bg-green-500 text-white"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Accept Request
                        </Button>
                      )}
                      {friendshipStatus === "accepted" && (
                        <>
                          <Button
                            onClick={() => router.push("/community")}
                            className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            onClick={handleUnfriend}
                            variant="outline"
                            className="border-red-800/50 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 bg-transparent"
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveProfileTab("posts")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeProfileTab === "posts"
                ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/20"
                : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
            }`}
          >
            <ArrowBigUp className="w-4 h-4" />
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveProfileTab("friends")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeProfileTab === "friends"
                ? "bg-[#ea6f2a] text-white shadow-lg shadow-[#ea6f2a]/20"
                : "bg-[#0c0c3f]/60 text-[#9a9fc4] hover:bg-[#20205a]/60 hover:text-[#f5f7ff] border border-[#20205a]/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </button>
        </div>

        {/* Posts Tab */}
        {activeProfileTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
                  <ArrowBigUp className="w-8 h-8 text-[#9a9fc4]" />
                </div>
                <p className="text-[#9a9fc4] text-lg">No posts yet</p>
                <p className="text-[#9a9fc4]/60 text-sm mt-1">
                  {isOwnProfile ? "Share your thoughts with the community!" : `${profile.first_name} hasn't posted anything yet.`}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-5 hover:border-[#ea6f2a]/30 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#ea6f2a] bg-[#ea6f2a]/10 px-2 py-0.5 rounded-full">{post.category}</span>
                        <span className="text-xs text-[#9a9fc4]/60">
                          {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#f5f7ff] mb-2 group-hover:text-[#ea6f2a] transition-colors">{post.title}</h3>
                      <p className="text-[#9a9fc4] line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#ea6f2a] bg-[#ea6f2a]/10 px-3 py-1.5 rounded-full flex-shrink-0">
                      <Star className="w-4 h-4 fill-[#ea6f2a]" />
                      <span className="text-sm font-semibold">{post.star_count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeProfileTab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#20205a]/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#9a9fc4]" />
                </div>
                <p className="text-[#9a9fc4] text-lg">No friends yet</p>
                <p className="text-[#9a9fc4]/60 text-sm mt-1">
                  {isOwnProfile ? "Connect with other members in the community!" : `${profile.first_name} hasn't added any friends yet.`}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.user_id}`}
                    className="group bg-[#0c0c3f]/50 border border-[#20205a]/50 rounded-2xl p-4 hover:border-[#ea6f2a]/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ea6f2a]/50 to-[#bc3f00]/50 p-0.5 group-hover:from-[#ea6f2a] group-hover:to-[#bc3f00] transition-all">
                          <div className="w-full h-full rounded-[10px] bg-[#05052d] overflow-hidden flex items-center justify-center">
                            {friend.profile_pic ? (
                              <img src={friend.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold text-[#f5f7ff]">
                                {friend.first_name?.[0]}{friend.last_name?.[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        {friend.is_employee && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#ea6f2a] flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#f5f7ff] truncate group-hover:text-[#ea6f2a] transition-colors">
                          {friend.first_name} {friend.last_name}
                        </h3>
                        <p className="text-xs text-[#9a9fc4]">View Profile</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9a9fc4]/50 group-hover:text-[#ea6f2a] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
              onClick={() => { setAuthPromptOpen(false); router.push("/signup") }}
              className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white w-full"
            >
              Create Account
            </Button>
            <Button
              onClick={() => { setAuthPromptOpen(false); router.push("/login") }}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/30 bg-transparent w-full"
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
