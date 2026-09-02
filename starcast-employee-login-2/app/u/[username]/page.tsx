import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { ProfileView } from "@/components/profile/profile-view"

/** Resolves a public handle to the underlying auth user id. */
async function resolveHandle(username: string) {
  const rows = await db
    .select({
      userId: profiles.userId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      bio: profiles.bio,
      profilePic: profiles.profilePic,
    })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = lower(${username})`)
    .limit(1)
  return rows[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const p = await resolveHandle(username)
  if (!p) return { title: "Member not found | Starcast Media" }

  const name = `${p.firstName} ${p.lastName}`.trim() || `@${username}`
  const description = p.bio?.trim() || `${name} on Starcast Media.`

  return {
    title: `${name} (@${username}) | Starcast Media`,
    description,
    openGraph: {
      title: `${name} (@${username})`,
      description,
      type: "profile",
      images: p.profilePic ? [{ url: p.profilePic }] : undefined,
    },
  }
}

export default async function UserHandlePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const p = await resolveHandle(username)
  if (!p) notFound()

  return <ProfileView userId={p.userId} />
}
