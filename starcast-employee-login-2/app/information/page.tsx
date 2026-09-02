"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { getViewerContext } from "@/app/actions/articles"
import { useEffect, useState } from "react"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Printer } from "lucide-react"
import { brandAssets } from "@/lib/brand-assets"

export default function InformationPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)

  useEffect(() => {
    if (session?.user) {
      getViewerContext()
        .then((viewer) => {
          if (viewer) {
            setCurrentUserId(viewer.profileId)
            setIsAdmin(viewer.isAdmin)
            setIsCrew(viewer.isEmployee)
          }
        })
        .catch(() => {})
    } else if (session === null) {
      setCurrentUserId(null)
      setIsAdmin(false)
      setIsCrew(false)
    }
  }, [session])

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  const handlePrintPage = () => {
    window.print()
  }

  return (
    <div className="public-shell flex flex-col print:bg-white print:min-h-0">
      <div className="print:hidden">
        <ResponsiveHeader
          currentPage="/information"
          isAdmin={isAdmin}
          isCrew={isCrew}
          isLoggedIn={!!currentUserId}
          onSignOut={handleSignOut}
          onLogin={() => router.push("/login")}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 print:max-w-none print:px-12 print:py-0 print:mx-0">
        {/* Print-only letterhead */}
        <div className="hidden print:block print:text-center print:mb-8 print:pt-8 print:border-b-2 print:border-black print:pb-6">
          <img
            src="/images/spacemanlogo.png"
            alt="Starcast Media"
            className="w-16 h-16 mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold text-black mb-1">Starcast Media</h1>
          <p className="text-base text-gray-600 italic">To media and beyond</p>
          <p className="text-sm text-gray-500 mt-2">starcastlivemedia@gmail.com</p>
        </div>

        {/* Screen-only header */}
        <div className="text-center mb-12 print:hidden">
          <img 
            src={brandAssets.full.verticalWhiteBlackStroke || "/placeholder.svg"}
            alt="Starcast Media" 
            className="mx-auto mb-6 h-40 object-contain drop-shadow-2xl md:h-52"
          />
          <p className="text-xl text-[#f2a04a] italic">To media and beyond</p>
          
          <div className="flex gap-3 justify-center mt-6">
            <Button
              onClick={handlePrintPage}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:text-[#f5f7ff] bg-transparent"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Information
            </Button>
          </div>
        </div>

        <div className="space-y-6 print:space-y-4">
          <Card className="public-panel rounded-2xl print:border-0 print:bg-transparent print:shadow-none">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-[#f5f7ff] print:text-black print:text-xl print:font-bold">StarCast Media</CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed">
              <p>
                Founded by Ray Starnes in 2025, StarCast Media is built on one mantra: <span className="text-[#f2a04a] font-semibold print:text-black">Building Worlds</span>.
              </p>
              <p>
                We create show universes around people, brands, and communities—using video entertainment on YouTube as a modern advertising engine. Our content is designed to feel like real life: authentic, story-first, and created in the moments that matter.
              </p>
            </CardContent>
          </Card>

          <Card className="public-panel rounded-2xl print:border-0 print:bg-transparent print:shadow-none">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-[#f5f7ff] print:text-black print:text-xl print:font-bold">What We Do</CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed">
              <div>
                <h3 className="text-[#f5f7ff] font-semibold mb-2 print:text-black">Live Event Video Production</h3>
                <p>Multi-cam, live switching, highlight edits, promos</p>
              </div>
              <div>
                <h3 className="text-[#f5f7ff] font-semibold mb-2 print:text-black">Show Development</h3>
                <p>Episodes, seasons, recurring segments, branded series</p>
              </div>
              <div>
                <h3 className="text-[#f5f7ff] font-semibold mb-2 print:text-black">Integrated Promotions & Commercials</h3>
                <p>
                  We specialize in seamless marketing—brand placement and messaging that fits naturally into the story and the environment.
                </p>
              </div>
              <div>
                <h3 className="text-[#f5f7ff] font-semibold mb-2 print:text-black">YouTube Channel Programming</h3>
                <p>Multiple shows. Multiple playlists. One channel that runs like a network.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="public-panel rounded-2xl print:border-0 print:bg-transparent print:shadow-none">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-[#f5f7ff] print:text-black print:text-xl print:font-bold">The Vision</CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed">
              <p>{"We're building a YouTube-based \"TV channel\" with:"}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Multiple shows hosted on a single channel</li>
                <li>Organized playlists by series and theme</li>
                <li>A 24/7 livestream that programs our content like a true network stream</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="public-panel rounded-2xl print:border-0 print:bg-transparent print:shadow-none">
            <CardHeader className="print:px-0 print:pb-2">
              <CardTitle className="text-[#f5f7ff] print:text-black print:text-xl print:font-bold">Business Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="text-[#9a9fc4] space-y-4 print:text-gray-800 print:px-0 print:text-sm print:leading-relaxed">
              <p>
                {"If you'd like to collaborate, join production, sponsor content, or invest in StarCast Media, we'd love to connect."}
              </p>
              <Link
                href="/sponsors"
                className="flex items-center justify-between p-4 bg-[#ea6f2a]/10 border border-[#ea6f2a]/40 rounded-lg hover:bg-[#ea6f2a]/20 transition-colors group print:hidden"
              >
                <div>
                  <p className="text-[#f5f7ff] font-semibold">View Sponsorship Packages</p>
                  <p className="text-sm text-[#9a9fc4] mt-0.5">From $50 &mdash; single reads to full season deals</p>
                </div>
                <span className="text-[#ea6f2a] text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
              <div className="p-4 bg-[#05052d] border border-[#20205a] rounded-lg print:bg-transparent print:border print:border-gray-300 print:p-3">
                <p className="text-[#f5f7ff] font-semibold mb-2 print:text-black">Contact Us:</p>
                <p className="text-[#f2a04a] print:text-black">
                  Email: <a href="mailto:starcastlivemedia@gmail.com" className="hover:text-[#ea6f2a] transition-colors print:text-black print:underline">starcastlivemedia@gmail.com</a>
                </p>
                <p className="text-sm mt-2">(Ask for our current slate, sponsorship options, or media kit.)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}
