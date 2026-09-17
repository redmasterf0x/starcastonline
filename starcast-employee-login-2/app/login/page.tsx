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
import { Mail, Smartphone, ArrowLeft } from "lucide-react"
import { sendSmsOtpAction, verifySmsOtpAction } from "@/app/actions/auth-actions"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  // Auth method tab: "email" | "phone"
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
          setError(errDesc || `Sign-in error: ${err.replace(/_/g, " ")}`)
        }
      }
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

      window.location.href = "/onboarding"
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
    setError(null)
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
    setError(null)

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

  const handleResendEmail = async () => {
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
    <div className="public-shell flex items-center justify-center p-3 sm:p-4 min-h-screen">
      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/85 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center px-4 sm:px-6 pt-6">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-32 sm:h-40 mx-auto object-contain"
          />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#f5f7ff]">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base text-[#9a9fc4]">Sign in to your Starcast account</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 space-y-4">
          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[48px] h-12 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-semibold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform"
            disabled={loading || smsSending || smsVerifying}
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
              <span className="bg-[#0c0c3f] px-3 text-[#9a9fc4] font-medium tracking-wider">or sign in with</span>
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#05052d] border border-[#20205a] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email")
                setError(null)
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
                setError(null)
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

          {/* Email Login Form */}
          {authMethod === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#f5f7ff] text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/50 h-11 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#f5f7ff] text-sm">
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
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/50 h-11 text-base sm:text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {unverifiedEmail && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg space-y-2">
                  <p className="text-sm text-red-300">
                    Please verify your email before signing in. We can resend the confirmation link to{" "}
                    <span className="font-semibold text-white">{unverifiedEmail}</span>.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resending}
                    onClick={handleResendEmail}
                    className="border-red-800 text-[#f5f7ff] hover:bg-red-950 bg-transparent w-full"
                  >
                    {resending ? "Resending..." : "Resend verification email"}
                  </Button>
                  {resendMessage && (
                    <p className={`text-xs text-center ${resendMessage.includes("sent") ? "text-green-400" : "text-red-400"}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff] font-semibold text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                {loading ? "Signing in..." : "Sign In with Email"}
              </Button>
            </form>
          )}

          {/* Phone SMS Login Form */}
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
                      className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] placeholder:text-[#9a9fc4]/50 h-11 text-base sm:text-sm"
                    />
                    <p className="text-xs text-[#9a9fc4]">Include country code (e.g. +1 for US/Canada).</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

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

                  {error && (
                    <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={smsVerifying || phoneCode.trim().length < 6}
                    className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff] font-semibold text-base shadow-lg active:scale-[0.99] transition-transform"
                  >
                    {smsVerifying ? "Verifying..." : "Confirm & Sign In"}
                  </Button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSmsSent(false)
                        setPhoneCode("")
                        setError(null)
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

          {/* Footer sign up link */}
          <div className="mt-4 pt-4 border-t border-[#20205a]">
            <p className="text-center text-sm font-medium text-[#f5f7ff] mb-2">New to Starcast Media?</p>
            <Link href="/signup" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] h-12 text-base font-bold border-2 border-[#ea6f2a] text-[#ea6f2a] hover:bg-[#ea6f2a] hover:text-white bg-transparent transition-colors active:scale-[0.99]"
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
