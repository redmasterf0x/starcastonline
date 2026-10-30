"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy, Share2, Sparkles, ExternalLink } from "lucide-react"

interface BandShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  url: string
  text?: string
}

export function BandShareModal({
  open,
  onOpenChange,
  title,
  subtitle,
  url,
  text,
}: BandShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || subtitle || title,
          url,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy()
    }
  }

  const shareText = encodeURIComponent(text || subtitle || title)
  const shareUrl = encodeURIComponent(url)

  const socialLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/25",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      color: "bg-[#f5f7ff]/10 text-[#f5f7ff] border-[#f5f7ff]/20 hover:bg-[#f5f7ff]/20",
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`,
      color: "bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/25",
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${shareText}%0A%0A${shareUrl}`,
      color: "bg-[#ea6f2a]/15 text-[#ea6f2a] border-[#ea6f2a]/30 hover:bg-[#ea6f2a]/25",
    },
  ]

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a33] border border-[#20205a]/90 text-[#f5f7ff] shadow-2xl shadow-black/80 rounded-2xl p-6">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center text-[#ea6f2a]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#f5f7ff] tracking-tight">
                Share With Fans &amp; Friends
              </DialogTitle>
              <DialogDescription className="text-xs text-[#9a9fc4]">
                Spread the soundstage broadcast across social channels or copy the direct link.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Preview Box */}
        <div className="mt-4 p-3.5 rounded-xl border border-[#20205a]/70 bg-[#050524]/80 space-y-1">
          <p className="font-bold text-sm text-[#f5f7ff] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd166]" />
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-[#9a9fc4] line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Link Copy Bar */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-[#dbe0fb]">Direct Link</label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={url}
              className="bg-[#050524] border-[#20205a] text-[#f5f7ff] text-xs h-10 rounded-xl select-all font-mono"
            />
            <Button
              onClick={handleCopy}
              className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white shadow-md shadow-[#ea6f2a]/25"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-white" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-[#dbe0fb]">Share Via Social</label>
          <div className="grid grid-cols-2 gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${item.color}`}
              >
                <span>{item.name}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </div>

        {/* Native Mobile Share Sheet button */}
        {hasNativeShare && (
          <div className="mt-2 pt-3 border-t border-[#20205a]/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleNativeShare}
              className="w-full border-[#20efe0]/30 bg-[#20efe0]/10 text-[#20efe0] hover:bg-[#20efe0]/20 hover:text-white rounded-xl text-xs font-semibold h-10"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Open Device Share Sheet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
