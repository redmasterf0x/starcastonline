"use client"

import type React from "react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { brandAssets } from "@/lib/brand-assets"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setUnverifiedEmail(null)
    setResendMessage("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error: signInError } = await authClient.signIn.email({ email, password })

      if (signInError) {
        if (signInError.message?.toLowerCase().includes("not verified")) {
          setUnverifiedEmail(email)
        } else {
          setError(signInError.message ?? "Invalid email or password")
        }
        setLoading(false)
        return
      }

      // /onboarding forwards already-onboarded members to the dashboard, and
      // shows the setup wizard to anyone who hasn't finished it yet.
      window.location.href = "/onboarding"
    } catch (err: any) {
      // A thrown error must reset the button instead of leaving it stuck on
      // "Signing in...".
      setError(err?.message ?? "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    setResending(true)
    setResendMessage("")
    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email: unverifiedEmail,
        callbackURL: "/onboarding",
      })
      setResendMessage(resendError ? resendError.message ?? "Failed to resend email" : "Verification email sent!")
    } catch (err: any) {
      setResendMessage(err?.message ?? "Failed to resend email")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="public-shell flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/50 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-48 mx-auto object-contain"
          />
          <CardTitle className="text-3xl font-bold text-[#f5f7ff]">Welcome Back</CardTitle>
          <CardDescription className="text-base text-[#9a9fc4]">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#f5f7ff]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="bg-transparent border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#f5f7ff]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Your password"
                autoComplete="current-password"
                className="bg-transparent border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {unverifiedEmail && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg space-y-2">
                <p className="text-sm text-red-400">
                  Please verify your email before signing in. We can resend the confirmation link to{" "}
                  {unverifiedEmail}.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resending}
                  onClick={handleResend}
                  className="border-red-800 text-[#f5f7ff] hover:bg-red-950 bg-transparent"
                >
                  {resending ? "Resending..." : "Resend verification email"}
                </Button>
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes("sent") ? "text-green-400" : "text-red-400"}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#20205a]">
            <p className="text-center text-sm font-medium text-[#f5f7ff] mb-3">New to Starcast Media?</p>
            <Link href="/signup" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-bold border-2 border-[#ea6f2a] text-[#ea6f2a] hover:bg-[#ea6f2a] hover:text-white bg-transparent transition-colors"
              >
                Create a Free Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
