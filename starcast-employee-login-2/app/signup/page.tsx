"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { brandAssets } from "@/lib/brand-assets"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Once signUp succeeds, no session exists yet (email must be verified
  // first), so we show a "check your email" state instead of redirecting.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
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
          setError(errDesc || `Sign-up error: ${err.replace(/_/g, " ")}`)
        }
      }
    }
  }, [])

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        // After verifying, drop new members straight into the setup wizard.
        callbackURL: "/onboarding",
      })

      if (signUpError) {
        setError(signUpError.message ?? "Failed to create account")
        setLoading(false)
        return
      }

      // The app `profiles` row is created server-side by a Better Auth
      // databaseHook as soon as the account exists, so there's nothing to
      // do here — just tell the user to confirm their email.
      setSubmittedEmail(email)
      setLoading(false)
    } catch (err: any) {
      // A thrown error (e.g. network / 403 invalid origin) must reset the
      // button instead of leaving it stuck on "Creating account...".
      setError(err?.message ?? "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!submittedEmail) return
    setResending(true)
    setResendMessage("")
    try {
      const { resendVerificationEmailAction } = await import("@/app/actions/auth-actions")
      const result = await resendVerificationEmailAction(submittedEmail)
      setResendMessage(result.message)
    } catch (err: any) {
      setResendMessage(err?.message ?? "Failed to resend email")
    } finally {
      setResending(false)
    }
  }

  if (submittedEmail) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-[#ea6f2a]/20 bg-[#06062e]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-bold text-[#f5f7ff] text-center">Check your email</CardTitle>
            <CardDescription className="text-[#9a9fc4] text-center">
              We sent a confirmation link to <span className="text-[#f5f7ff]">{submittedEmail}</span>. Click it to
              activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={resending}
              onClick={handleResend}
              className="w-full border-[#ea6f2a]/40 text-[#f5f7ff] hover:bg-[#ea6f2a]/10 bg-transparent"
            >
              {resending ? "Resending..." : "Resend verification email"}
            </Button>
            {resendMessage && (
              <p
                className={`text-sm text-center ${resendMessage.includes("sent") ? "text-green-400" : "text-red-500"}`}
              >
                {resendMessage}
              </p>
            )}
            <p className="text-center text-sm text-[#9a9fc4]">
              Already verified?{" "}
              <Link href="/login" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="public-shell flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#ea6f2a]/20 bg-[#06062e]">
        <CardHeader className="space-y-3 text-center">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-32 mx-auto object-contain"
          />
          <CardTitle className="text-2xl font-bold text-[#f5f7ff] text-center">Create Account</CardTitle>
          <CardDescription className="text-[#9a9fc4] text-center">Join Starcast Media community</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-medium text-base flex items-center justify-center gap-3 mb-4"
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              setError("")
              try {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/onboarding",
                  errorCallbackURL: "/signup",
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
              <span className="bg-[#06062e] px-3 text-[#9a9fc4] font-medium tracking-wider">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#f5f7ff]">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#f5f7ff]">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#f5f7ff]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
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
                minLength={8}
                autoComplete="new-password"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#f5f7ff]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#9a9fc4] mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
