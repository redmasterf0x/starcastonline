import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function POST() {
  try {
    await auth.api.signOut({ headers: await headers() })
  } catch {
    // No active session — nothing to sign out
  }

  revalidatePath("/", "layout")
  redirect("/login")
}
