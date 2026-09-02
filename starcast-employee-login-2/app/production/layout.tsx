import React from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function ProductionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/login")
  }

  const rows = await db
    .select({ isAdmin: profiles.isAdmin, isEmployee: profiles.isEmployee })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  if (!rows[0]?.isEmployee && !rows[0]?.isAdmin) {
    redirect("/articles")
  }

  return <>{children}</>
}
