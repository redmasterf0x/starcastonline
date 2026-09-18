"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { brandAssets } from "@/lib/brand-assets"
import { ShieldCheck, ArrowRight } from "lucide-react"

export default function ResetPasswordPage() {
  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
        errorCallbackURL: "/login",
      })
    } catch {
      window.location.href = "/login"
    }
  }

  return (
    <div className="public-shell flex items-center justify-center p-4 min-h-screen relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/90 backdrop-blur-xl relative z-10 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#38bdf8]" />

        <CardHeader className="space-y-4 text-center px-6 pt-8 pb-4">
          <img
            src={brandAssets.capstone.fullcolor || "/placeholder.svg"}
            alt="Starcast Media"
            className="h-28 sm:h-32 mx-auto object-contain drop-shadow-[0_0_20px_rgba(234,111,42,0.3)]"
          />
          <CardTitle className="text-2xl font-bold text-[#f5f7ff]">
            Passwordless Sign-In
          </CardTitle>
          <CardDescription className="text-sm text-[#9a9fc4]">
            StarCast Online uses direct Google Authentication
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 space-y-5">
          <div className="p-4 bg-[#05052d] border border-[#20205a] rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#d4d8ee] leading-relaxed">
              You don&apos;t need to remember or reset any passwords. StarCast uses secure, one-click Sign in with Google to protect your account.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full min-h-[50px] h-12 bg-white hover:bg-slate-100 text-gray-900 border border-white/40 font-bold text-base flex items-center justify-center gap-3 shadow-lg rounded-xl group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
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
          </Button>

          <p className="text-center text-xs text-[#9a9fc4]">
            <Link href="/login" className="text-[#ea6f2a] hover:text-[#f2a04a] font-medium">
              ← Return to Login Page
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
