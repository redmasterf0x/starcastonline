"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Printer,
  FileText,
  Lock,
  Music2,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Search,
  ExternalLink,
  Award,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function MusicAgreementClient() {
  const [certTrackTitle, setCertTrackTitle] = useState("")
  const [certArtistName, setCertArtistName] = useState("")
  const [certTrackId, setCertTrackId] = useState("")
  const [certDate, setCertDate] = useState("")
  const [showCertPreview, setShowCertPreview] = useState(false)

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const handleGenerateCustomCert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!certTrackTitle.trim() || !certArtistName.trim()) return
    if (!certTrackId.trim()) {
      setCertTrackId(`SC-TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`)
    }
    if (!certDate) {
      setCertDate(new Date().toISOString().split("T")[0])
    }
    setShowCertPreview(true)
  }

  return (
    <div className="space-y-10">
      {/* ── TOP ACTION BAR (Hidden in print) ── */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl border border-[#20205a] bg-[#0c0c3f]/90 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#20efe0] uppercase">
            <ShieldCheck className="w-4 h-4 text-[#20efe0]" />
            Official StarCast Legal Registry
          </div>
          <h2 className="text-xl font-black text-white">Music Distribution &amp; Rights Agreement</h2>
          <p className="text-xs text-[#9a9fc4]">
            Document Ref: <code className="text-[#ffd166]">SC-MRA-2026-V1</code> &middot; Governing Law: State of Kansas, USA
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handlePrint}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#ea6f2a]/25 gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Contract / Save PDF
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-[#20205a] bg-[#05052d] text-[#c5caea] hover:text-white hover:bg-[#121248] text-xs sm:text-sm"
          >
            <Link href="/terms">General Terms</Link>
          </Button>
        </div>
      </div>

      {/* ── MAIN CONTRACT DOCUMENT (Formatted for both web and print) ── */}
      <article className="legal-contract bg-[#070724] print:bg-white text-[#d6dafa] print:text-black p-6 sm:p-12 md:p-16 rounded-3xl print:rounded-none border border-[#20205a] print:border-none shadow-2xl print:shadow-none font-sans leading-relaxed text-sm">
        {/* Formal Letterhead */}
        <div className="border-b-2 border-[#20205a] print:border-black pb-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ea6f2a] print:bg-black text-white flex items-center justify-center font-black text-lg">
                ★
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white print:text-black">
                  STARCAST MEDIA
                </span>
                <span className="block text-xs font-mono text-[#ffd166] print:text-gray-600 uppercase tracking-widest">
                  Live Media &amp; Soundstage Broadcast Network
                </span>
              </div>
            </div>
            <p className="text-xs text-[#9a9fc4] print:text-gray-600">
              StarCast Media LLC &middot; Topeka, Kansas, United States &middot; https://starcast.online
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-[#9a9fc4] print:text-gray-800 space-y-1">
            <div><strong>DOCUMENT ID:</strong> SC-MRA-2026-V1</div>
            <div><strong>EFFECTIVE DATE:</strong> January 1, 2026</div>
            <div><strong>REVISION DATE:</strong> October 11, 2026</div>
            <div><strong>CLASSIFICATION:</strong> Standard Artist Distribution</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-8 space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-white print:text-black uppercase tracking-tight">
            Music Distribution, Intellectual Property &amp; Artist Rights Agreement
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#ffd166] print:text-gray-700 max-w-2xl mx-auto">
            Governing All Musical Compositions, Sound Recordings, Master Tapes, and Audio Uploads on StarCast Online
          </p>
        </div>

        {/* Executive Summary Callout */}
        <div className="my-8 p-5 rounded-2xl border-2 border-[#20efe0]/40 print:border-gray-400 bg-[#20efe0]/10 print:bg-gray-50 text-xs sm:text-sm text-[#c5caea] print:text-black space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#20efe0] print:text-black text-sm uppercase">
            <ShieldCheck className="w-4 h-4" />
            Executive Artist Protection Summary:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>100% Artist Ownership:</strong> You own all your master recordings and songwriting rights. StarCast claims ZERO equity or master ownership.</li>
            <li><strong>100% Ad-Free Streaming:</strong> StarCast will never place ads over your music. It is free for everyone to listen to.</li>
            <li><strong>Anti-Theft &amp; Anti-Sampling:</strong> Nobody may steal, sample, chop, or record over your music without your separate written permission.</li>
            <li><strong>Digital Chain of Custody:</strong> Your upload timestamp and record reference serve as official proof of prior-art if anyone infringes on your music.</li>
          </ul>
        </div>

        {/* Contract Clauses */}
        <div className="space-y-8 print:space-y-6">
          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">1.</span> PARTIES &amp; SCOPE
            </h2>
            <p>
              This Agreement is entered into between <strong>StarCast Media LLC</strong> (&quot;StarCast&quot; or &quot;Platform&quot;) and the individual, band, record producer, or musical act uploading sound recordings to StarCast Online (&quot;Artist&quot;, &quot;Musician&quot;, or &quot;Licensor&quot;). This Agreement governs all audio recordings, tracks, singles, EPs, albums, lyrics, and artwork uploaded through the StarCast Artist Portal or soundstage features.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">2.</span> ARTIST 100% COPYRIGHT &amp; OWNERSHIP RETENTION
            </h2>
            <p>
              <strong>2.1 Retention of All Master &amp; Composition Rights:</strong> The Artist retains one hundred percent (100%) exclusive copyright ownership, title, and all proprietary rights in and to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>All sound recordings (Master Rights) under Title 17, United States Code;</li>
              <li>All underlying musical compositions, lyrics, melodies, chord arrangements, and sheet music (Publishing Rights);</li>
              <li>All band trademarks, names, stage personas, artwork, and visual brand assets.</li>
            </ul>
            <p>
              <strong>2.2 Zero Claim by StarCast:</strong> StarCast Media does not acquire, and shall not assert at any time, any ownership, copyright assignment, royalty split, publishing cut, or transfer of rights in the Artist&apos;s music.
            </p>
            <p>
              <strong>2.3 Non-Exclusivity:</strong> This agreement is strictly non-exclusive. The Artist retains the unconditional right to upload, distribute, license, sell, perform, or stream their music on any third-party service (including Spotify, Apple Music, YouTube, Bandcamp, TikTok, vinyl, or radio).
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">3.</span> LIMITED NON-EXCLUSIVE BROADCAST LICENSE TO STARCAST
            </h2>
            <p>
              <strong>3.1 Ad-Free Streaming Grant:</strong> The Artist grants StarCast Media a limited, non-exclusive, revocable, royalty-free license to stream the uploaded sound recordings on `starcast.online` and the StarCast mobile apps.
            </p>
            <p>
              <strong>3.2 Ad-Free Pledge:</strong> StarCast pledges that the music will be delivered to listeners completely free of commercial advertisements, pre-roll ads, or mid-roll interruptions.
            </p>
            <p>
              <strong>3.3 Artist-Controlled Downloads:</strong> If the Artist chooses to toggle on &quot;Free MP3 Download&quot;, listeners may download the track for private listening. If toggled off, downloading is strictly disabled.
            </p>
            <p>
              <strong>3.4 Immediate Revocation &amp; Takedown:</strong> The Artist may delete or unpublish their music at any time through their StarCast portal. StarCast will cease public transmission within 24 hours of deletion.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">4.</span> STRICT PROHIBITION ON MUSIC THEFT, SAMPLING &amp; DERIVATIVE WORKS
            </h2>
            <p>
              All music hosted on StarCast is protected under United States and international copyright law. All visitors, listeners, third-party creators, producers, and entities are strictly subject to the following prohibitions:
            </p>
            <div className="p-4 rounded-xl border border-red-500/30 print:border-black bg-red-950/20 print:bg-transparent space-y-2 text-xs sm:text-sm">
              <p>
                <strong>(A) No Unauthorized Sampling:</strong> No individual or company may sample, chop, isolate vocal/instrumental stems, loop, or incorporate any portion of the Artist&apos;s audio into another track or beat without an executed commercial licensing contract signed directly by the Artist.
              </p>
              <p>
                <strong>(B) No Recording Over:</strong> No individual may record vocals, raps, voiceovers, or instruments over the Artist&apos;s tracks or release any derivative remix without written authorization.
              </p>
              <p>
                <strong>(C) No Sync Exploitation:</strong> No individual or company may sync the Artist&apos;s music into video games, films, YouTube videos, TikToks, podcasts, or television commercials without a direct sync license from the Artist.
              </p>
              <p>
                <strong>(D) No AI Training / Voice Cloning:</strong> No party may ingest or process the Artist&apos;s audio into any generative artificial intelligence model or synthetic voice cloning software.
              </p>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">5.</span> DIGITAL CHAIN OF CUSTODY &amp; DATE-STAMPED PROOF OF OWNERSHIP
            </h2>
            <p>
              <strong>5.1 Automatic System Ledger:</strong> At the precise millisecond an audio file is uploaded to StarCast Online, our database creates an immutable, timestamped registry record containing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Track Title, Album Name, and System UUID;</li>
              <li>Artist Name, Band Identifier, and Verified Account Profile ID;</li>
              <li>Universal Time (UTC) and Central Standard Time (CST) Ingestion Timestamp;</li>
              <li>Cryptographic audio storage hash reference;</li>
              <li>Explicit electronic assertion of copyright ownership.</li>
            </ul>
            <p>
              <strong>5.2 Evidentiary Legal Value:</strong> In the event that a third party steals, infringes, or samples the Artist&apos;s music, this date-stamped certificate serves as official, verified proof of prior-art and custody to establish the Artist&apos;s original creation date in DMCA proceedings, copyright registration disputes, and federal court litigation.
            </p>
            <p>
              <strong>5.3 StarCast Enforcement Assistance:</strong> StarCast Media will provide certified server audit logs, upload certificates, and written verification to support the Artist in enforcing copyright claims or pursuing legal damages against infringers.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-bold text-white print:text-black border-b border-[#20205a]/60 print:border-gray-300 pb-1.5 flex items-center gap-2">
              <span className="text-[#ea6f2a] print:text-black font-mono">6.</span> GOVERNING LAW &amp; JURISDICTION
            </h2>
            <p>
              This Agreement shall be construed and governed in accordance with the laws of the <strong>State of Kansas</strong> and federal copyright laws of the <strong>United States of America</strong>. Any legal action shall be filed exclusively in the courts located in Shawnee County, Kansas.
            </p>
          </section>

          {/* Formal Signature & Seal Block */}
          <section className="pt-8 mt-10 border-t-2 border-[#20205a] print:border-black grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="font-mono text-xs text-[#ffd166] print:text-black uppercase font-bold">
                Platform Representative &amp; Host:
              </div>
              <div className="p-4 rounded-xl border border-[#20205a] print:border-gray-400 bg-[#05051f] print:bg-white space-y-2 text-xs">
                <div className="font-serif italic text-base text-white print:text-black">
                  StarCast Media Legal &amp; Soundstage Registry
                </div>
                <div><strong>Entity:</strong> StarCast Live Media LLC</div>
                <div><strong>Location:</strong> Topeka, Kansas, USA</div>
                <div><strong>Direct Inquiries:</strong> contact@starcast.online</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-mono text-xs text-[#20efe0] print:text-black uppercase font-bold">
                Artist Electronic Signature:
              </div>
              <div className="p-4 rounded-xl border border-[#20205a] print:border-gray-400 bg-[#05051f] print:bg-white space-y-2 text-xs">
                <div className="font-serif italic text-base text-white print:text-black">
                  Executed Electronically upon Audio Ingestion
                </div>
                <div><strong>Binding Method:</strong> Authenticated Account Portal Upload</div>
                <div><strong>Ownership Claim:</strong> 100% Master &amp; Publishing Retained</div>
                <div><strong>Certificate:</strong> Available in Artist Portal anytime</div>
              </div>
            </div>
          </section>
        </div>
      </article>

      {/* ── INTERACTIVE CERTIFICATE GENERATOR / VERIFIER (Hidden in print) ── */}
      <section className="print:hidden rounded-3xl border border-[#20205a] bg-gradient-to-br from-[#0c0c3f] via-[#05051f] to-[#121248] p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#ffd166] uppercase">
              <Award className="w-4 h-4 text-[#ffd166]" />
              Digital Chain of Custody
            </div>
            <h2 className="text-2xl font-black text-white">Generate Official Proof of Ownership Certificate</h2>
            <p className="text-xs text-[#9a9fc4]">
              Pull up and print a formal certificate of upload for any of your tracks to establish ownership proof.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateCustomCert} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#c5caea] uppercase mb-1.5">
              Track Title
            </label>
            <Input
              placeholder="e.g. Midnight Horizon"
              value={certTrackTitle}
              onChange={(e) => setCertTrackTitle(e.target.value)}
              className="bg-[#05052d] border-[#20205a] text-white text-xs h-10"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#c5caea] uppercase mb-1.5">
              Artist / Band Name
            </label>
            <Input
              placeholder="e.g. Lunar Velocity"
              value={certArtistName}
              onChange={(e) => setCertArtistName(e.target.value)}
              className="bg-[#05052d] border-[#20205a] text-white text-xs h-10"
              required
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full h-10 bg-[#20efe0] hover:bg-[#18c9bd] text-[#05051f] font-bold text-xs uppercase tracking-wider"
            >
              Generate Certificate
            </Button>
          </div>
        </form>

        {/* Certificate Display Card */}
        {showCertPreview && (
          <div className="mt-6 p-6 sm:p-8 rounded-2xl border-2 border-[#ffd166]/60 bg-[#08082e] text-[#f5f7ff] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#20205a] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ffd166]/20 border border-[#ffd166]/50 flex items-center justify-center text-[#ffd166]">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Certificate of Musical Work Upload</h3>
                  <p className="text-xs font-mono text-[#20efe0]">
                    Chain of Custody &amp; Prior-Art Registry &middot; StarCast Online
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePrint}
                size="sm"
                className="bg-[#ffd166] hover:bg-[#e0b74d] text-black font-bold text-xs gap-1.5 self-start sm:self-center"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#050520] border border-[#20205a]">
                <span className="text-[#7f84ad] block text-[10px] uppercase">Track Title</span>
                <span className="font-bold text-white text-sm truncate block">{certTrackTitle}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050520] border border-[#20205a]">
                <span className="text-[#7f84ad] block text-[10px] uppercase">Registered Artist</span>
                <span className="font-bold text-[#ffd166] text-sm truncate block">{certArtistName}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050520] border border-[#20205a]">
                <span className="text-[#7f84ad] block text-[10px] uppercase">Upload Date (UTC)</span>
                <span className="font-bold text-[#20efe0] text-sm block">{certDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050520] border border-[#20205a]">
                <span className="text-[#7f84ad] block text-[10px] uppercase">Registry Hash ID</span>
                <span className="font-bold text-white text-sm truncate block">{certTrackId}</span>
              </div>
            </div>

            <p className="text-xs text-[#c4c7da] leading-relaxed bg-[#050520]/60 p-4 rounded-xl border border-[#20205a]">
              This document certifies that the above-named Artist submitted this sound recording to StarCast Online on the recorded date. Under the StarCast Music Rights Agreement, the Artist retains 100% of all master and publishing copyrights. All public sampling, unauthorized downloading, re-recording, and commercial synchronization without the Artist&apos;s direct written consent are strictly unlawful.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
