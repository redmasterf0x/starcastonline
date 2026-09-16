"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const err = params.get("error")
      const errDesc = params.get("error_description")
      if (err) {
        if (err === "state_mismatch") {
          setError("Sign-in session expired or mismatch. Please try clicking Continue with Google again.")
        } else if (err === "account_not_linked") {
          setError("An account with this email already exists. We've enabled linking—please try signing in with Google again.")
        } else if (err === "access_denied") {
          setError("Google sign-in was cancelled.")
        } else {
          setError(errDesc || `Sign-in error: ${err.replace(/_/g, " ")}`)
        }
      }
    }
  }, [])

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
      const { resendVerificationEmailAction } = await import("@/app/actions/auth-actions")
      const result = await resendVerificationEmailAction(unverifiedEmail)
      setResendMessage(result.message)
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
          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-medium text-base flex items-center justify-center gap-3 mb-4"
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              setError(null)
              try {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/onboarding",
                  errorCallbackURL: "/login",
                })
              } catch (err: any) {
                setError(err?.message ?? "Google sign-in failed")
                setLoading(false)
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {/* OR Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#20205a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0c0c3f] px-3 text-[#9a9fc4] font-medium tracking-wider">or sign in with email</span>
            </div>
          </div>

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#f5f7ff]">
                  Password
                </Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-[#ea6f2a] hover:text-[#f2a04a] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
