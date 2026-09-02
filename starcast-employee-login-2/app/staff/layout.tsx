import type React from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/login")
  }

  const rows = await db
    .select({ isAdmin: profiles.isAdmin, isEmployee: profiles.isEmployee, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  const isStaff = rows[0]?.isAdmin || rows[0]?.isEmployee || rows[0]?.role === "staff" || rows[0]?.role === "admin"

  if (!isStaff) {
    redirect("/portal")
  }

  return <>{children}</>
}
