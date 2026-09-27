"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string>("Just now")
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    try {
      await fetch("/api/admin/support/sync", { method: "POST" })
      router.refresh()
      setLastSync(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-sync every 20 seconds while page is open
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 20000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={loading}
        size="sm"
        className="bg-gradient-to-r from-[#ea6f2a] to-[#ffd166] text-[#05052d] font-bold hover:opacity-90 shadow-md shadow-[#ea6f2a]/20 gap-1.5 text-xs px-3 py-1.5"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync Emails"}
      </Button>
    </div>
  )
}
