import React from "react"
import { ExternalLink, Music, Disc, Youtube, Instagram, Globe, ShoppingBag, Radio } from "lucide-react"

export type LinkItem = {
  label: string
  url: string
  icon?: React.ReactNode
}

function getPlatformDetails(label: string, url: string) {
  const l = (label + " " + url).toLowerCase()
  if (l.includes("spotify")) {
    return {
      name: "Spotify",
      color: "from-[#1db954]/20 to-[#0c0c3f]",
      border: "border-[#1db954]/40 hover:border-[#1db954]",
      icon: <Music className="w-4 h-4 text-[#1db954]" />,
      badge: "STREAM",
    }
  }
  if (l.includes("apple") || l.includes("itunes")) {
    return {
      name: "Apple Music",
      color: "from-[#fc3c44]/20 to-[#0c0c3f]",
      border: "border-[#fc3c44]/40 hover:border-[#fc3c44]",
      icon: <Music className="w-4 h-4 text-[#fc3c44]" />,
      badge: "STREAM",
    }
  }
  if (l.includes("youtube") || l.includes("youtu.be")) {
    return {
      name: "YouTube",
      color: "from-[#ff0000]/20 to-[#0c0c3f]",
      border: "border-[#ff0000]/40 hover:border-[#ff0000]",
      icon: <Youtube className="w-4 h-4 text-[#ff0000]" />,
      badge: "VIDEO",
    }
  }
  if (l.includes("instagram")) {
    return {
      name: "Instagram",
      color: "from-[#e1306c]/20 to-[#0c0c3f]",
      border: "border-[#e1306c]/40 hover:border-[#e1306c]",
      icon: <Instagram className="w-4 h-4 text-[#e1306c]" />,
      badge: "SOCIAL",
    }
  }
  if (l.includes("bandcamp") || l.includes("soundcloud")) {
    return {
      name: "Music / Audio",
      color: "from-[#ff5500]/20 to-[#0c0c3f]",
      border: "border-[#ff5500]/40 hover:border-[#ff5500]",
      icon: <Disc className="w-4 h-4 text-[#ff5500]" />,
      badge: "AUDIO",
    }
  }
  if (l.includes("shop") || l.includes("merch") || l.includes("store")) {
    return {
      name: "Merch Store",
      color: "from-[#ea6f2a]/20 to-[#0c0c3f]",
      border: "border-[#ea6f2a]/40 hover:border-[#ea6f2a]",
      icon: <ShoppingBag className="w-4 h-4 text-[#ea6f2a]" />,
      badge: "SUPPLY",
    }
  }
  return {
    name: "Website",
    color: "from-[#20efe0]/15 to-[#0c0c3f]",
    border: "border-[#20efe0]/30 hover:border-[#20efe0]",
    icon: <Globe className="w-4 h-4 text-[#20efe0]" />,
    badge: "LINK",
  }
}

/**
 * Renders a cosmic broadcast linktree of external music, social, and merch channels.
 */
export function LinkTree({ links }: { links: LinkItem[] }) {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-4 h-4 text-[#ea6f2a]" />
        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#9a9fc4]">
          Artist Links &amp; Soundstage Channels
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {links.map((link, idx) => {
          const p = getPlatformDetails(link.label, link.url)
          return (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r ${p.color} border ${p.border} transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#05052d] border border-[#20205a] flex items-center justify-center shrink-0 group-hover:border-[#f5f7ff]/40 transition-colors">
                  {link.icon || p.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#f5f7ff] group-hover:text-white truncate">
                    {link.label}
                  </p>
                  <p className="text-[11px] font-mono text-[#9a9fc4] truncate opacity-80">
                    {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#05052d]/90 border border-[#20205a] text-[#9a9fc4]">
                  {p.badge}
                </span>
                <ExternalLink className="w-4 h-4 text-[#9a9fc4] group-hover:text-[#ea6f2a] transition-colors" />
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
