"use client"

import { useState, useEffect, useRef } from "react"
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
import { QrCode, Download, Copy, Check, ExternalLink, Sparkles, Music } from "lucide-react"

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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Determine the full public URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://starcast.online"
  const publicUrl = `${origin}/bands/${band.slug}`

  useEffect(() => {
    if (!isOpen || !band.slug) return

    QRCode.toDataURL(
      publicUrl,
      {
        width: 600,
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
      <DialogContent className="bg-gradient-to-b from-[#0c0c3f] via-[#080829] to-[#05051f] border border-[#20205a] text-[#f5f7ff] max-w-sm sm:max-w-md shadow-2xl p-6 sm:p-7">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ea6f2a] to-[#20efe0] p-0.5 mx-auto shadow-lg shadow-[#ea6f2a]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0c0c3f] rounded-[14px] flex items-center justify-center">
              <QrCode className="w-6 h-6 text-[#20efe0]" />
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black text-[#f5f7ff] tracking-tight">
            Soundstage Stage Pass
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#dbe0fb] leading-relaxed">
            Instant QR Code for <span className="text-[#f5f7ff] font-semibold">{band.name}</span>. Print on posters, merch tables, or share on social stories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center my-4">
          {/* QR Code Container */}
          <div className="relative p-4 sm:p-5 rounded-2xl bg-white shadow-2xl border-4 border-[#20205a]/60 group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${band.name}`}
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-white text-gray-400">
                <div className="w-8 h-8 border-2 border-[#ea6f2a] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Floating Brand Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#05051f] border border-[#20efe0]/50 shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-[#20efe0]" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#f5f7ff] uppercase">
                STARCAST SOUNDSTAGE
              </span>
            </div>
          </div>

          {/* URL Chip */}
          <div className="w-full mt-6 p-3 rounded-xl bg-[#05052d]/90 border border-[#20205a]/80 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-mono text-[#dbe0fb] truncate pl-1">
              {publicUrl}
            </span>
            <Button
              onClick={handleCopyLink}
              size="sm"
              variant="ghost"
              className="h-8 px-3 rounded-lg text-xs text-[#20efe0] hover:text-white hover:bg-[#20205a]/50 flex items-center gap-1.5 shrink-0 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold rounded-xl text-xs sm:text-sm h-11 shadow-lg shadow-[#ea6f2a]/25 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-[#20efe0]/40 bg-[#0c0c3f]/80 text-[#c9fbf7] hover:bg-[#20efe0]/15 hover:text-white rounded-xl text-xs sm:text-sm h-11"
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Page
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
