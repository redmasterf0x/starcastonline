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
import { Mail, Smartphone, ArrowLeft } from "lucide-react"
import { sendSmsOtpAction, verifySmsOtpAction } from "@/app/actions/auth-actions"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  // Method tab: "email" | "phone"
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")

  // Phone SMS state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneCode, setPhoneCode] = useState("")
  const [smsSent, setSmsSent] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsVerifying, setSmsVerifying] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")

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
        callbackURL: "/onboarding",
      })

      if (signUpError) {
        setError(signUpError.message ?? "Failed to create account")
        setLoading(false)
        return
      }

      setSubmittedEmail(email)
      setLoading(false)
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = phoneNumber.trim()
    if (!clean || clean.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number with country code (e.g. +1 555 123 4567).")
      return
    }

    setSmsSending(true)
    setError("")
    setSmsMessage("")

    try {
      const res = await sendSmsOtpAction(clean)
      if (res.success) {
        setSmsSent(true)
        setSmsMessage(res.message)
      } else {
        setError(res.message)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send SMS code. Please try again.")
    } finally {
      setSmsSending(false)
    }
  }

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault()
    const enteredCode = phoneCode.trim().replace(/\D/g, "")
    if (!enteredCode || enteredCode.length !== 6) {
      setError("Please enter the 6-digit verification code.")
      return
    }

    setSmsVerifying(true)
    setError("")

    try {
      const res = await verifySmsOtpAction(phoneNumber, enteredCode)
      if (res.success) {
        window.location.href = res.redirectUrl || "/onboarding"
      } else {
        setError(res.message)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to verify SMS code.")
    } finally {
      setSmsVerifying(false)
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
      <div className="public-shell flex min-h-screen items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md border-[#ea6f2a]/20 bg-[#06062e]/90 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-3 text-center px-4 sm:px-6 pt-6">
            <CardTitle className="text-2xl font-bold text-[#f5f7ff] text-center">Check your email</CardTitle>
            <CardDescription className="text-[#9a9fc4] text-center text-sm">
              We sent a confirmation link to <span className="text-[#f5f7ff] font-medium">{submittedEmail}</span>. Click it to
              activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              disabled={resending}
              onClick={handleResend}
              className="w-full min-h-[48px] h-12 border-[#ea6f2a]/40 text-[#f5f7ff] hover:bg-[#ea6f2a]/10 bg-transparent font-medium"
            >
              {resending ? "Resending..." : "Resend verification email"}
            </Button>
            {resendMessage && (
              <p
                className={`text-sm text-center ${resendMessage.includes("sent") ? "text-green-400" : "text-red-400"}`}
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
    <div className="public-shell flex min-h-screen items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md border-[#ea6f2a]/20 bg-[#06062e]/90 shadow-2xl backdrop-blur-md">
        <CardHeader className="space-y-3 text-center px-4 sm:px-6 pt-6">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-28 sm:h-32 mx-auto object-contain"
          />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#f5f7ff] text-center">Create Account</CardTitle>
          <CardDescription className="text-sm sm:text-base text-[#9a9fc4] text-center">Join Starcast Media community</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 space-y-4">
          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[48px] h-12 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-semibold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform"
            disabled={loading || smsSending || smsVerifying}
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
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {/* OR Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#20205a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#06062e] px-3 text-[#9a9fc4] font-medium tracking-wider">or sign up with</span>
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#05052d] border border-[#20205a] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email")
                setError("")
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                authMethod === "email"
                  ? "bg-[#ea6f2a] text-white shadow"
                  : "text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/40"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone")
                setError("")
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                authMethod === "phone"
                  ? "bg-[#ea6f2a] text-white shadow"
                  : "text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/40"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Phone SMS
            </button>
          </div>

          {/* Email Sign-Up Form */}
          {authMethod === "email" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[#f5f7ff] text-sm">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] h-11 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[#f5f7ff] text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] h-11 text-base sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#f5f7ff] text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] h-11 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[#f5f7ff] text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] h-11 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[#f5f7ff] text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] h-11 text-base sm:text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff] font-semibold text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                {loading ? "Creating account..." : "Create Account with Email"}
              </Button>
            </form>
          )}

          {/* Phone SMS Sign-Up Form */}
          {authMethod === "phone" && (
            <div className="space-y-4">
              {!smsSent ? (
                <form onSubmit={handleSendSms} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber" className="text-[#f5f7ff] text-sm">
                      Mobile Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      required
                      placeholder="+15551234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-[#05052d] border-[#ea6f2a]/30 text-[#f5f7ff] placeholder:text-[#9a9fc4]/50 h-11 text-base sm:text-sm"
                    />
                    <p className="text-xs text-[#9a9fc4]">We'll text you a 6-digit verification code. Include +1 country code.</p>
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <Button
                    type="submit"
                    disabled={smsSending || phoneNumber.trim().length < 10}
                    className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff] font-semibold text-base shadow-lg active:scale-[0.99] transition-transform"
                  >
                    {smsSending ? "Sending Code..." : "Send Verification Code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifySms} className="space-y-4">
                  <div className="p-3 bg-[#080838] border border-[#ea6f2a]/40 rounded-lg text-sm text-[#f5f7ff] space-y-1">
                    <p>
                      Enter the 6-digit code sent to <span className="font-semibold text-[#ea6f2a]">{phoneNumber}</span>:
                    </p>
                    {smsMessage && <p className="text-xs text-emerald-400">{smsMessage}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phoneCode" className="text-[#f5f7ff] text-sm">
                      6-Digit SMS Code
                    </Label>
                    <Input
                      id="phoneCode"
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="123456"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="bg-[#05052d] border-[#ea6f2a]/60 text-[#f5f7ff] text-center tracking-widest text-xl font-mono h-12"
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <Button
                    type="submit"
                    disabled={smsVerifying || phoneCode.trim().length < 6}
                    className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff] font-semibold text-base shadow-lg active:scale-[0.99] transition-transform"
                  >
                    {smsVerifying ? "Verifying..." : "Verify & Complete Signup"}
                  </Button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSmsSent(false)
                        setPhoneCode("")
                        setError("")
                      }}
                      className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff] flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" /> Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={smsSending}
                      className="text-xs text-[#ea6f2a] hover:text-[#f2a04a] font-medium transition-colors"
                    >
                      {smsSending ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
