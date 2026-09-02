import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { brandAssets } from "@/lib/brand-assets"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-[#20205a] bg-[#0c0c3f]/50 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <img src={brandAssets.full.verticalWhiteBlackStroke || "/placeholder.svg"} alt="Starcast Media" className="h-96 mx-auto object-contain" />
          <CardTitle className="text-3xl font-bold text-[#f5f7ff]">Check Your Email</CardTitle>
          <CardDescription className="text-base text-[#9a9fc4]">
            We sent you a confirmation link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[#05052d] border border-[#20205a] rounded-lg">
            <p className="text-sm text-[#f5f7ff] leading-relaxed">
              Click the link in your email to verify your account. After that, you'll be able to complete your profile.
            </p>
          </div>

          <p className="text-xs text-[#9a9fc4] text-center">
            Didn't get an email? Check your spam folder or{" "}
            <Link href="/signup" className="text-[#ea6f2a] hover:text-[#f2a04a]">
              try again
            </Link>
          </p>

          <Button
            asChild
            variant="outline"
            className="w-full border-[#20205a] text-[#f5f7ff] hover:bg-[#20205a]/50 bg-transparent"
          >
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
