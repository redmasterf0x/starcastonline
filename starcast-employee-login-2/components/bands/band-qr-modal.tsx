"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Copy, Check, ExternalLink, Sparkles, Music, Share2, Smartphone } from "lucide-react"

interface BandQrModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  band: {
    name: string
    slug: string
    logo_url?: string
    genre?: string
    type?: string
  }
}

export function BandQrModal({ isOpen, onOpenChange, band }: BandQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  // Determine the full public URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://starcast.online"
  const publicUrl = `${origin}/bands/${band.slug}`

  useEffect(() => {
    if (!isOpen || !band.slug) return

    QRCode.toDataURL(
      publicUrl,
      {
        width: 800,
        margin: 2,
        color: {
          dark: "#05051f",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url)
        }
      }
    )
  }, [isOpen, publicUrl, band.slug])

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = `${band.slug}-starcast-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[94vh] overflow-y-auto bg-gradient-to-b from-[#0c0c3f] via-[#080829] to-[#05051f] border border-[#20205a] text-[#f5f7ff] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-[#20205a]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ea6f2a] to-[#20efe0] p-0.5 shadow-lg shadow-[#ea6f2a]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0c0c3f] rounded-[10px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-[#20efe0]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
                  Soundstage Stage Pass
                </DialogTitle>
                <Badge className="bg-[#20efe0]/15 text-[#20efe0] border-[#20efe0]/40 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
                  Instant QR
                </Badge>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-[#dbe0fb]">
                Scan to instantly access <span className="text-[#f5f7ff] font-semibold">{band.name}</span>'s verified Soundstage profile.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Responsive Grid: QR Left, Info & Actions Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-2">
          {/* QR Code Frame */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-[0_0_35px_rgba(32,239,224,0.15)] border-4 border-[#20205a]/70 flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${band.name}`}
                  className="w-52 h-52 sm:w-64 sm:h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center bg-white text-gray-400">
                  <div className="w-8 h-8 border-2 border-[#ea6f2a] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Integrated Branding Badge */}
              <div className="mt-3 px-3 py-1 rounded-full bg-[#05051f] border border-[#20efe0]/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-[#20efe0]" />
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#f5f7ff] uppercase">
                  STARCAST SOUNDSTAGE
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#9a9fc4] mt-2.5 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-[#20efe0]" />
              Scan with any iPhone or Android camera app
            </p>
          </div>

          {/* Details & Action Panel */}
          <div className="md:col-span-6 flex flex-col gap-4">
            {/* Band info summary */}
            <div className="p-4 rounded-xl bg-[#05052d]/90 border border-[#20205a]/80 space-y-2">
              <div className="flex items-center gap-3">
                {band.logo_url ? (
                  <img
                    src={band.logo_url}
                    alt={band.name}
                    className="w-11 h-11 rounded-lg object-cover border border-[#20205a] shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-[#ea6f2a]/20 border border-[#ea6f2a]/40 flex items-center justify-center text-[#ea6f2a] font-bold text-sm shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-[#f5f7ff] truncate">{band.name}</h4>
                  <p className="text-xs text-[#9a9fc4] truncate">
                    {band.genre || "Soundstage Act"} • {band.type === "artist" ? "Solo Artist" : "Band"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#dbe0fb] leading-relaxed pt-1">
                Print on stage banners, merch tables, flyer graphics, or live stream overlays for direct fan discovery.
              </p>
            </div>

            {/* URL Chip with Copy Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#9a9fc4] uppercase tracking-wider block">
                Public Stage Link
              </label>
              <div className="p-2.5 rounded-xl bg-[#05052d] border border-[#20205a] flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#20efe0] truncate pl-1 select-all">
                  {publicUrl}
                </span>
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 rounded-lg text-xs text-[#f5f7ff] hover:text-[#20efe0] hover:bg-[#20205a]/60 flex items-center gap-1.5 shrink-0 font-semibold border border-transparent hover:border-[#20efe0]/30"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Button
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:opacity-95 text-white font-bold rounded-xl text-xs sm:text-sm h-11 shadow-lg shadow-[#ea6f2a]/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download High-Res PNG
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-[#20efe0]/40 bg-[#0c0c3f]/80 text-[#c9fbf7] hover:bg-[#20efe0]/15 hover:text-white rounded-xl text-xs sm:text-sm h-11 font-semibold"
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open Live Page
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
