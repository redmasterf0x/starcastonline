"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { brandAssets } from "@/lib/brand-assets"
import { Sparkles, ShieldCheck, Zap, AlertCircle, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const err = params.get("error")
      const errDesc = params.get("error_description")
      if (err) {
        if (err === "state_mismatch") {
          setError("Sign-in session expired or timed out. Please click Continue with Google again.")
        } else if (err === "account_not_linked") {
          setError("An account with this email already exists. Google sign-in is enabled—please try again.")
        } else if (err === "access_denied") {
          setError("Google sign-in was cancelled.")
        } else {
          setError(errDesc || `Sign-in error: ${err.replace(/_/g, " ")}`)
        }
      }
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
        errorCallbackURL: "/login",
      })
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="public-shell flex items-center justify-center p-4 min-h-screen relative overflow-hidden">
      {/* Ambient background glow accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/90 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Subtle top brand bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#38bdf8]" />

        <CardHeader className="space-y-4 text-center px-6 pt-8 pb-4">
          <div className="relative mx-auto flex items-center justify-center">
            <img
              src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
              alt="Starcast Media"
              className="h-32 sm:h-36 object-contain drop-shadow-[0_0_20px_rgba(234,111,42,0.35)] transition-transform hover:scale-105 duration-300"
            />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7ff]">
              Welcome to StarCast
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-[#9a9fc4]">
              Kansas City & Topeka's Premier Live Music Network
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/70 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-200 leading-snug">{error}</p>
            </div>
          )}

          {/* Primary Google Sign-In Action */}
          <div className="space-y-3">
            <Button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full min-h-[52px] h-13 bg-white hover:bg-slate-100 text-gray-900 border border-white/40 font-bold text-base flex items-center justify-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] active:scale-[0.99] transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] rounded-xl group"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                  <span>Connecting with Google...</span>
                </div>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-[#1e293b]">Continue with Google</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-[#9a9fc4]">
              Instant access • No passwords to remember • Works on any device
            </p>
          </div>

          {/* Feature highlights badge box */}
          <div className="p-4 bg-[#05052d]/90 border border-[#20205a] rounded-xl space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#d4d8ee]">
              <Zap className="w-4 h-4 text-[#ea6f2a] shrink-0" />
              <span>Instant profile creation for bands, fans & venues</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#d4d8ee]">
              <Sparkles className="w-4 h-4 text-[#ffd166] shrink-0" />
              <span>Post music, buy concert tickets & join community chat</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#d4d8ee]">
              <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <span>Protected by Google Secure Single Sign-On</span>
            </div>
          </div>

          {/* Back to Home / Discover */}
          <div className="pt-2 text-center">
            <Link
              href="/articles"
              className="text-xs text-[#9a9fc4] hover:text-[#f5f7ff] transition-colors underline-offset-4 hover:underline"
            >
              ← Back to StarCast Articles & Radio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
