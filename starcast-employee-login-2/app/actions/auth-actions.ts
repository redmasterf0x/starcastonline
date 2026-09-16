"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable, verification } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export type ResendVerificationResult = {
  success: boolean
  message: string
}

/**
 * Resend verification email to any user safely and reliably.
 */
export async function resendVerificationEmailAction(email: string): Promise<ResendVerificationResult> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: "Please provide a valid email address." }
  }

  try {
    // 1. Check if user exists in database
    const users = await db
      .select({ id: userTable.id, email: userTable.email, emailVerified: userTable.emailVerified })
      .from(userTable)
      .where(eq(userTable.email, cleanEmail))
      .limit(1)

    if (users.length === 0) {
      return {
        success: false,
        message: "No account found with that email. Please create an account on the signup page.",
      }
    }

    const foundUser = users[0]

    // 2. If already verified, let them know immediately
    if (foundUser.emailVerified) {
      return {
        success: true,
        message: "Your email is already verified! You can sign in with your password or with Google.",
      }
    }

    // 3. Try Better-Auth native sendVerificationEmail API
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email: cleanEmail,
          callbackURL: "/onboarding",
        },
        headers: await headers(),
      })
      return {
        success: true,
        message: `Verification link sent to ${cleanEmail}! Please check your inbox and spam folder.`,
      }
    } catch (authApiError) {
      console.warn("[AUTH ACTION] Better Auth API error, generating direct token fallback:", authApiError)
    }

    // 4. Fallback: Generate verification token directly in DB and dispatch email via Resend
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier: foundUser.id,
      value: token,
      expiresAt,
    })

    const baseUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://www.starcast.online"

    const verifyUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${token}&callbackURL=/onboarding`

    await sendVerificationEmail(cleanEmail, verifyUrl)

    return {
      success: true,
      message: `Verification email sent to ${cleanEmail}! Please check your inbox and spam folder.`,
    }
  } catch (err: any) {
    console.error("[AUTH ACTION] Unexpected error in resendVerificationEmailAction:", err)
    return {
      success: false,
      message: err?.message || "Failed to send verification email. Please try again or use Google sign in.",
    }
  }
}
