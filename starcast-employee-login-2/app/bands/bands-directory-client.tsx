"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  Search,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  UserCheck,
  UserPlus,
  Radio,
  Disc,
} from "lucide-react"
import {
  type BandDirectoryEntry,
  followBand,
  unfollowBand,
} from "@/app/actions/band-pages"

interface BandsDirectoryClientProps {
  initialBands: BandDirectoryEntry[]
}

export function BandsDirectoryClient({ initialBands }: BandsDirectoryClientProps) {
  const [bands, setBands] = useState<BandDirectoryEntry[]>(initialBands)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "followers" | "name">("followers")
  const [actionError, setActionError] = useState("")

  const filteredBands = useMemo(() => {
    let result = [...bands]

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((b) => b.type?.toLowerCase() === typeFilter.toLowerCase())
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.genre && b.genre.toLowerCase().includes(q)) ||
          (b.bio && b.bio.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "followers") {
        return b.follower_count - a.follower_count
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      return 0 // default order (newest)
    })

    return result
  }, [bands, search, typeFilter, sortBy])

  const handleToggleFollow = async (band: BandDirectoryEntry) => {
    setActionError("")
    const next = !band.is_following

    // Optimistic update
    setBands((prev) =>
      prev.map((b) =>
        b.id === band.id
          ? {
              ...b,
              is_following: next,
              follower_count: b.follower_count + (next ? 1 : -1),
            }
          : b
      )
    )

    try {
      if (next) {
        await followBand(band.id)
      } else {
        await unfollowBand(band.id)
      }
    } catch (e: any) {
      // Revert on error
      setBands((prev) =>
        prev.map((b) =>
          b.id === band.id
            ? {
                ...b,
                is_following: !next,
                follower_count: b.follower_count + (!next ? 1 : -1),
              }
            : b
        )
      )
      setActionError(e?.message || "Please sign in to follow this band.")
    }
  }

  const typeOptions = [
    { value: "all", label: "All Acts" },
    { value: "band", label: "Bands & Groups" },
    { value: "artist", label: "Solo Artists" },
    { value: "producer", label: "Producers" },
    { value: "dj", label: "DJs / Electronic" },
  ]

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <ResponsiveHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden border border-[#20205a]/60 bg-gradient-to-r from-[#0c0c3f]/90 via-[#0c0c3f]/60 to-[#05051f]/90 p-8 sm:p-12 mb-10 shadow-[0_0_50px_rgba(32,239,224,0.06)]">
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#ea6f2a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-[#20efe0]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 text-[#ea6f2a] text-xs font-semibold tracking-wider uppercase mb-4">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Aethelgard Soundstage Directory
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#f5f7ff] tracking-tight mb-3">
                StarCast Bands &amp; Artists
              </h1>

              <p className="text-[#9a9fc4] text-base sm:text-lg leading-relaxed">
                Discover independent bands, soundstage residents, and sonic collectives broadcasting live across
                StarCast Online. Follow your favorite acts, explore their music catalogs, and catch upcoming studio sessions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Button
                asChild
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold px-6 py-6 rounded-xl shadow-[0_0_25px_rgba(234,111,42,0.35)]"
              >
                <Link href="/portal">
                  <Plus className="w-4 h-4 mr-2" />
                  Artist Portal &amp; Registration
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-[#20efe0]/40 bg-[#0c0c3f]/60 text-[#c9fbf7] hover:bg-[#20efe0]/15 hover:text-white px-6 py-6 rounded-xl"
              >
                <Link href="/community?tab=bands">
                  <Sparkles className="w-4 h-4 mr-2 text-[#20efe0]" />
                  Community Band Feed
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 p-4 rounded-xl border border-red-800/60 bg-red-950/40 text-red-300 text-sm flex items-center justify-between">
            <span>{actionError}</span>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-red-700/60 text-red-200 bg-red-900/30 hover:bg-red-900/50 text-xs"
            >
              <Link href="/login?redirect=/bands">Sign In</Link>
            </Button>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9fc4]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by artist name, genre, or keyword..."
              className="bg-[#0c0c3f]/60 border-[#20205a]/60 text-[#f5f7ff] pl-12 h-12 rounded-xl focus:border-[#20efe0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  typeFilter === opt.value
                    ? "bg-[#20efe0] text-[#05051f] shadow-[0_0_15px_rgba(32,239,224,0.3)]"
                    : "bg-[#0c0c3f]/60 text-[#9a9fc4] border border-[#20205a]/60 hover:border-[#20efe0]/40 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-xl bg-[#0c0c3f]/80 border border-[#20205a]/60 text-xs font-semibold text-[#9a9fc4] hover:text-white transition-colors"
            >
              <option value="followers">Most Followed</option>
              <option value="name">Alphabetical</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Band Cards Grid */}
        {filteredBands.length === 0 ? (
          <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/40 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-[#ea6f2a]" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f7ff] mb-2">No Acts Found</h3>
            <p className="text-sm text-[#9a9fc4] max-w-md mx-auto mb-6">
              {search
                ? `No bands or artists matched "${search}". Try adjusting your search query or filter.`
                : "No bands registered yet. Be the first to take the stage!"}
            </p>
            <div className="flex justify-center gap-3">
              {search && (
                <Button
                  onClick={() => {
                    setSearch("")
                    setTypeFilter("all")
                  }}
                  variant="outline"
                  className="border-[#20205a] text-[#9a9fc4] hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
              <Button asChild className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white">
                <Link href="/portal">Register Your Band</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBands.map((band) => (
              <div
                key={band.id}
                className="group relative rounded-2xl border border-[#20205a]/60 bg-gradient-to-b from-[#0c0c3f]/70 to-[#0c0c3f]/40 p-6 flex flex-col justify-between hover:border-[#ea6f2a]/50 transition-all hover:shadow-[0_0_30px_rgba(234,111,42,0.12)]"
              >
                <div>
                  {/* Card Header: Avatar & Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {band.logo_url ? (
                      <Image
                        src={band.logo_url || "/placeholder.svg"}
                        alt={band.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#20205a] flex-shrink-0 bg-[#05052d]"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ea6f2a]/15 border border-[#ea6f2a]/30 flex-shrink-0">
                        <Music className="w-8 h-8 text-[#ea6f2a]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className="border-[#20efe0]/30 text-[#20efe0] bg-[#20efe0]/10 text-[10px] uppercase font-bold"
                        >
                          {band.type === "artist"
                            ? "Solo Artist"
                            : band.type === "producer"
                            ? "Producer"
                            : band.type === "dj"
                            ? "DJ / Electronic"
                            : "Band"}
                        </Badge>

                        {band.genre && (
                          <span className="text-xs text-[#9a9fc4] truncate">· {band.genre}</span>
                        )}
                      </div>

                      <Link href={`/bands/${band.slug}`} className="block group-hover:text-[#ea6f2a] transition-colors">
                        <h3 className="font-bold text-lg text-[#f5f7ff] truncate group-hover:text-[#ea6f2a]">
                          {band.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-[#9a9fc4] flex items-center gap-1.5 mt-1">
                        <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>
                          {band.follower_count} {band.follower_count === 1 ? "follower" : "followers"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {band.bio && (
                    <p className="text-xs text-[#9a9fc4] leading-relaxed line-clamp-3 mb-4">
                      {band.bio}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-[#20205a]/40 flex items-center justify-between gap-3 mt-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-[#20efe0]/15 hover:bg-[#20efe0]/25 text-[#c9fbf7] border border-[#20efe0]/35 hover:text-white rounded-xl text-xs font-semibold"
                  >
                    <Link href={`/bands/${band.slug}`}>
                      <Disc className="w-3.5 h-3.5 mr-1.5 text-[#20efe0]" />
                      View Soundstage
                    </Link>
                  </Button>

                  {!band.is_owner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFollow(band)}
                      className={`text-xs rounded-xl font-medium transition-all ${
                        band.is_following
                          ? "border-green-700/50 bg-green-950/30 text-green-400 hover:bg-green-950/60"
                          : "border-[#20205a] text-[#9a9fc4] hover:text-white hover:border-[#ea6f2a]/50"
                      }`}
                    >
                      {band.is_following ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-green-400" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
