import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Route-handler admin guard. Returns the profile on success, or an
 * object with a status code to short-circuit with in the route.
 */
export async function requireAdminRoute(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 }
> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { ok: false, status: 401 }

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  if (!rows[0]?.isAdmin) return { ok: false, status: 403 }
  return { ok: true, userId: session.user.id }
}
