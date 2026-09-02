"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { getPortalViewer } from "@/app/actions/bands"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { StudioManager } from "@/components/studio/studio-manager"
import { Music } from "lucide-react"

export default function StaffPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const init = async () => {
      const viewer = await getPortalViewer()
      setIsAdmin(viewer?.isAdmin ?? false)
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
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
      <ResponsiveHeader isLoggedIn={true} isAdmin={isAdmin} isCrew={true} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30">
            <Music className="w-5 h-5 text-[#ea6f2a]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#f5f7ff]">Studio Operations</h1>
            <p className="text-sm text-[#9a9fc4]">Check bands in, log payments, and adjust session pricing.</p>
          </div>
        </div>

        <StudioManager canDelete={false} canViewRevenue={false} />
      </main>

      <Footer />
    </div>
  )
}
