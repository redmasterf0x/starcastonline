import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { brandAssets } from "@/lib/brand-assets"
import { CheckCircle2 } from "lucide-react"

export default function CheckEmailPage() {
  return (
    <div className="public-shell min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
          <CardTitle className="text-2xl font-bold text-[#f5f7ff]">Google Sign-In Ready</CardTitle>
          <CardDescription className="text-sm text-[#9a9fc4]">
            Instant account access via Google SSO
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 space-y-5">
          <div className="p-4 bg-[#05052d] border border-[#20205a] rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#d4d8ee] leading-relaxed">
              Your StarCast account connects seamlessly using your Google account without needing manual email activation codes.
            </p>
          </div>

          <Button
            asChild
            className="w-full min-h-[48px] h-12 bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-white font-semibold shadow-lg rounded-xl"
          >
            <Link href="/login">Continue to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
