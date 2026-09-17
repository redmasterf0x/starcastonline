"use client"

import React, { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { brandAssets } from "@/lib/brand-assets"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const t = params.get("token")
      if (t) setToken(t)
    }
  }, [])

  // 1. Forgot password request (unauthenticated user with no token)
  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim()

    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })

      if (resetError) {
        setError(resetError.message || "Failed to send reset link")
      } else {
        setMessage(`If an account exists for ${email}, a password reset link has been sent to your inbox.`)
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Set new password via token
  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setMessage("")
    setError("")

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      })

      if (resetError) {
        setError(resetError.message || "Failed to reset password. The link may have expired.")
      } else {
        setMessage("Password has been reset successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 3. Change password while logged in
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (updateError) {
        setError(updateError.message || "Failed to update password")
      } else {
        setMessage("Password updated successfully!")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="public-shell flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/50 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-32 mx-auto object-contain"
          />
          <CardTitle className="text-2xl font-bold text-[#f5f7ff]">
            {token ? "Create New Password" : session ? "Change Password" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-[#9a9fc4]">
            {token
              ? "Enter your new password below"
              : session
                ? "Update your current account password"
                : "Enter your account email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            /* Mode 1: Reset with token */
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#f5f7ff]">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#f5f7ff]">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/40 p-3 rounded border border-red-800">{error}</p>}
              {message && <p className="text-sm text-green-400 bg-green-950/40 p-3 rounded border border-green-800">{message}</p>}

              <Button
                type="submit"
                disabled={loading || !!message}
                className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : session ? (
            /* Mode 2: Change password while logged in */
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-[#f5f7ff]">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="Your current password"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#f5f7ff]">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#f5f7ff]">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/40 p-3 rounded border border-red-800">{error}</p>}
              {message && <p className="text-sm text-green-400 bg-green-950/40 p-3 rounded border border-green-800">{message}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            /* Mode 3: Request reset link by email */
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#f5f7ff]">
                  Account Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/40 p-3 rounded border border-red-800">{error}</p>}
              {message && <p className="text-sm text-green-400 bg-green-950/40 p-3 rounded border border-green-800">{message}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[#9a9fc4] mt-6">
            <Link href="/login" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
              Back to Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
