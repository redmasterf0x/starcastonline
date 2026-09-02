import Link from "next/link"
import { Facebook, Instagram, Music2, ShoppingBag, Twitch, Youtube } from "lucide-react"
import { brandAssets } from "@/lib/brand-assets"

const socialLinks = [
  { name: "YouTube", url: "https://www.youtube.com/@StarCastLiveMedia", icon: Youtube },
  { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61579680989260", icon: Facebook },
  { name: "TikTok", url: "https://www.tiktok.com/@starcast.live", icon: Music2 },
  { name: "Instagram", url: "https://www.instagram.com/starcast.live.media/", icon: Instagram },
  { name: "Twitch", url: "https://www.twitch.tv/tomediaandbeyond", icon: Twitch },
  { name: "Shop", url: "https://starcast-supply-company.printify.me/", icon: ShoppingBag },
]

const siteLinks = [
  { label: "Shows", href: "/shows" },
  { label: "Articles", href: "/articles" },
  { label: "The DECK", href: "/community" },
  { label: "About", href: "/information" },
  { label: "Sponsor", href: "/sponsors" },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#050519]/88 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={brandAssets.capstone.white || "/placeholder.svg"}
              alt=""
              className="h-16 w-16 object-contain"
            />
            <div className="flex flex-col gap-2">
              <img
                src={brandAssets.logotype.horizontalWhite || "/placeholder.svg"}
                alt="Starcast Media"
                className="h-7 w-auto object-contain object-left"
              />
              <p className="text-sm text-[#aeb2ce]">Independent shows, stories, and community from Topeka.</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3">
              {siteLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-[#c4c7da] hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ name, url, icon: Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  title={name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-[#aeb2ce] transition-colors hover:border-[#ea6f2a]/60 hover:bg-[#ea6f2a]/10 hover:text-white"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/8 pt-5 text-xs text-[#777c9f] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Starcast Media. All rights reserved.</p>
          <p className="font-medium uppercase tracking-[0.18em] text-[#d77a42]">To media and beyond</p>
        </div>
      </div>
    </footer>
  )
}
