import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export default async function MyProfileRedirectPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) {
    redirect("/login?redirect=/profile")
  }

  const [row] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  if (row?.username) {
    redirect(`/u/${row.username}`)
  }

  redirect(`/profile/${session.user.id}`)
}
