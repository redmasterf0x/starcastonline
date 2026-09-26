import React from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      redirect("/login")
    }

    const rows = await db
      .select({ isAdmin: profiles.isAdmin })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1)

    if (!rows[0]?.isAdmin) {
      redirect("/")
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err
    }
    console.error("[AdminLayout Error]:", err)
    redirect("/login")
  }

  return <>{children}</>
}

