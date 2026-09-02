"use client"

import React from "react"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { getMyProfile, updateMyProfile, getMySavedArticles, removeSavedArticle } from "@/app/actions/profile"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { LoadingScreen } from "@/components/loading-screen"
import { Music, ChevronRight } from "lucide-react"

interface UserProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  bio: string | null
  profilePic: string | null
  location: string | null
  website: string | null
  isEmployee: boolean
  isAdmin: boolean
}

interface SavedArticle {
  id: string
  articleId: string
  title: string
  slug: string | null
  createdAt: Date | string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pwMessage, setPwMessage] = useState("")
  const [changingPw, setChangingPw] = useState(false)
  const [justVerified, setJustVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("verified") === "1") {
      setJustVerified(true)
      // Strip the query param so refreshing doesn't re-show the banner.
      router.replace("/dashboard")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile()
      if (!data) {
        router.push("/login")
        return
      }
      setProfile(data as UserProfile)
      setLoading(false)
      const saved = await getMySavedArticles()
      setSavedArticles(saved as SavedArticle[])
    } catch {
      router.push("/login")
    }
  }

  const handleRemoveSaved = async (savedId: string) => {
    try {
      await removeSavedArticle(savedId)
      setSavedArticles((prev) => prev.filter((s) => s.id !== savedId))
    } catch {
      // ignore
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile) return

    const file = e.target.files[0]
    setUploading(true)

    // Upload to Vercel Blob (served by Vercel CDN)
    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("folder", "avatars")

    const res = await fetch("/api/upload", { method: "POST", body: uploadData })
    if (!res.ok) {
      setMessage("Failed to upload image")
      setUploading(false)
      return
    }
    const { url: publicUrl } = await res.json()

    try {
      await updateMyProfile({ profilePic: publicUrl })
      setMessage("Profile picture updated!")
      fetchProfile()
    } catch {
      setMessage("Failed to update profile picture")
    }
    setUploading(false)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)

    try {
      await updateMyProfile({
        firstName: formData.get("first_name") as string,
        lastName: formData.get("last_name") as string,
        phone: formData.get("phone") as string,
        bio: formData.get("bio") as string,
        location: formData.get("location") as string,
        website: formData.get("website") as string,
      })
      setMessage("Profile saved!")
      fetchProfile()
    } catch {
      setMessage("Failed to save profile")
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setChangingPw(true)
    setPwMessage("")

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("current_password") as string
    const newPassword = formData.get("new_password") as string

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    if (error) {
      setPwMessage(error.message ?? "Failed to change password")
    } else {
      setPwMessage("Password changed successfully!")
      ;(e.target as HTMLFormElement).reset()
    }
    setChangingPw(false)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!profile) return null

  return (
    <div className="min-h-screen flex flex-col">
      <ResponsiveHeader
        currentPage="/dashboard"
        isAdmin={profile.isAdmin}
        isCrew={profile.isEmployee}
        isLoggedIn={true}
        onSignOut={handleSignOut}
        onLogin={() => router.push("/login")}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-8 flex-1 w-full">
        {justVerified && (
          <div className="rounded-lg border border-green-800 bg-green-950/50 p-4 flex items-start justify-between gap-4">
            <p className="text-sm text-green-400">Your email is verified. Welcome to Starcast Media!</p>
            <button
              type="button"
              onClick={() => setJustVerified(false)}
              className="text-sm text-green-400/70 hover:text-green-400"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}
        {/* ── PUBLIC PROFILE PREVIEW ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-[#f5f7ff] tracking-tight">Public Profile</h1>
              <p className="text-sm text-[#9a9fc4] mt-0.5">
                This is exactly what other people see when they visit your profile.
              </p>
            </div>
            <Link
              href={`/profile/${profile.userId}`}
              className="text-sm text-[#ea6f2a] hover:text-[#f2a04a] underline-offset-2 hover:underline whitespace-nowrap"
            >
              Open profile
            </Link>
          </div>

          <div className="rounded-xl border border-[#20205a] bg-[#0c0c3f]/60 p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#20205a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {profile.profilePic ? (
                  <img src={profile.profilePic || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-[#f5f7ff]">
                    {profile.firstName?.[0]}
                    {profile.lastName?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-[#f5f7ff]">
                  {profile.firstName} {profile.lastName}
                </p>
                {profile.isEmployee && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-[#ea6f2a]/20 text-[#ea6f2a] border border-[#ea6f2a]/30 mt-1">
                    Crew
                  </span>
                )}
                {profile.bio ? (
                  <p className="text-sm text-[#9a9fc4] mt-2 leading-relaxed line-clamp-3">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-[#9a9fc4]/50 mt-2 italic">No bio yet — add one below.</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#20205a] flex flex-wrap gap-x-5 gap-y-1">
              {profile.location && (
                <span className="text-xs text-[#9a9fc4] flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <span className="text-xs text-[#ea6f2a] flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {profile.website.replace(/^https?:\/\//, "")}
                </span>
              )}
              {!profile.location && !profile.website && (
                <span className="text-xs text-[#9a9fc4]/50 italic">No location or website added yet.</span>
              )}
            </div>
          </div>
        </section>

        {/* ── ARTIST PORTAL ── moved here from the main nav bar */}
        <section>
          <Link href="/portal" className="block group">
            <Card className="border-[#20205a] bg-[#0c0c3f]/50 transition-colors group-hover:border-[#ea6f2a]/50">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex-shrink-0">
                  <Music className="w-5 h-5 text-[#ea6f2a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors">
                    Artist Portal
                  </h2>
                  <p className="text-sm text-[#9a9fc4] text-pretty">
                    Manage your band, book studio time, and track your sessions.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9a9fc4] group-hover:text-[#ea6f2a] transition-colors flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* ── SAVED ARTICLES ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#f5f7ff]">Saved Articles</h2>
            <Link
              href="/articles"
              className="text-sm text-[#ea6f2a] hover:text-[#f2a04a] hover:underline underline-offset-2"
            >
              Browse articles
            </Link>
          </div>
          <Card className="border-[#20205a] bg-[#0c0c3f]/50">
            <CardContent className="pt-6">
              {savedArticles.length === 0 ? (
                <div className="text-center py-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 mx-auto text-[#9a9fc4]/40 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <p className="text-sm text-[#9a9fc4]">You haven&apos;t saved any articles yet.</p>
                  <p className="text-xs text-[#9a9fc4]/60 mt-1">Tap &quot;Save&quot; on any article to keep it here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#20205a]">
                  {savedArticles.map((saved) => (
                    <li key={saved.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <Link href={`/articles/${saved.slug}`} className="flex-1 min-w-0 group">
                        <p className="text-[#f5f7ff] font-medium truncate group-hover:text-[#ea6f2a] transition-colors">
                          {saved.title}
                        </p>
                        <p className="text-xs text-[#9a9fc4] mt-0.5">
                          Saved{" "}
                          {new Date(saved.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </Link>
                      <Button
                        onClick={() => handleRemoveSaved(saved.id)}
                        size="sm"
                        variant="ghost"
                        className="text-[#9a9fc4] hover:text-red-400 hover:bg-red-950/20 flex-shrink-0"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── EDIT PROFILE ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#f5f7ff] mb-3">Edit Profile</h2>
          <Card className="border-[#20205a] bg-[#0c0c3f]/50">
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#20205a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {profile.profilePic ? (
                      <img src={profile.profilePic || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-[#f5f7ff]">
                        {profile.firstName?.[0]}
                        {profile.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadAvatar}
                        className="hidden"
                        disabled={uploading}
                      />
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#20205a] text-[#f5f7ff] hover:bg-[#2a2a66] transition-colors text-sm">
                        {uploading ? "Uploading..." : "Change Photo"}
                      </span>
                    </label>
                    <p className="text-xs text-[#9a9fc4] mt-1">JPG, PNG, GIF up to 5MB</p>
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-[#f5f7ff]">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={profile.firstName || ""}
                      required
                      className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-[#f5f7ff]">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      defaultValue={profile.lastName || ""}
                      required
                      className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                    />
                  </div>
                </div>

                {/* Email (locked) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#f5f7ff]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile.email || ""}
                    disabled
                    className="bg-[#05052d] border-[#20205a] text-[#9a9fc4]"
                  />
                  <p className="text-xs text-[#9a9fc4]">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[#f5f7ff]">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone || ""}
                    placeholder="+15551234567"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                  <p className="text-xs text-[#9a9fc4]">Used for production reminder texts. Include +1.</p>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-[#f5f7ff]">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={profile.location || ""}
                    placeholder="City, State"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-[#f5f7ff]">
                    Website
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    defaultValue={profile.website || ""}
                    placeholder="https://yourwebsite.com"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-[#f5f7ff]">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio || ""}
                    placeholder="Tell the community about yourself..."
                    rows={4}
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] resize-none"
                  />
                </div>

                {message && (
                  <p className={`text-sm ${message.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
                    {message}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-[#f5f7ff]">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* ── CHANGE PASSWORD ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#f5f7ff] mb-3">Change Password</h2>
          <Card className="border-[#20205a] bg-[#0c0c3f]/50">
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current_password" className="text-[#f5f7ff]">
                    Current Password
                  </Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_password" className="text-[#f5f7ff]">
                    New Password
                  </Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>

                {pwMessage && (
                  <p className={`text-sm ${pwMessage.includes("Failed") || pwMessage.includes("Invalid") ? "text-red-400" : "text-green-400"}`}>
                    {pwMessage}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingPw}
                    variant="outline"
                    className="border-[#ea6f2a] text-[#ea6f2a] hover:bg-[#ea6f2a]/10 bg-transparent"
                  >
                    {changingPw ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
