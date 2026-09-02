"use client"

import type React from "react"
import { useState } from "react"
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
      const { error: resendError } = await authClient.sendVerificationEmail({
        email: submittedEmail,
        callbackURL: "/onboarding",
      })
      setResendMessage(resendError ? resendError.message ?? "Failed to resend email" : "Verification email sent!")
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
