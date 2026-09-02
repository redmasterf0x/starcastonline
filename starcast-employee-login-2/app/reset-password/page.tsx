"use client"

import React from "react"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    // Changing a password requires being signed in
    if (!isPending && !session) {
      setError("You must be signed in to change your password. Please log in first.")
    }
  }, [session, isPending])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("currentPassword") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const { error: updateError } = await authClient.changePassword({
      currentPassword,
      newPassword: password,
      revokeOtherSessions: true,
    })

    if (updateError) {
      setError(updateError.message || "Failed to update password")
    } else {
      setMessage("Password updated successfully! Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="public-shell flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#ea6f2a]/20 bg-[#06062e]">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-[#f5f7ff] text-center">Reset Password</CardTitle>
          <CardDescription className="text-[#9a9fc4] text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[#f5f7ff]">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                placeholder="Your current password"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#f5f7ff]">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#f5f7ff]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                placeholder="Confirm your password"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-500">{message}</p>}

            <Button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#9a9fc4] mt-4">
            <Link href="/login" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
