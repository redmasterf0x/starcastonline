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
      "https://starcast.online"

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

/**
 * Send SMS OTP code for phone login / signup.
 */
export async function sendSmsOtpAction(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const clean = phoneNumber.replace(/[^\d+]/g, "")
  if (clean.replace(/\D/g, "").length < 10) {
    return { success: false, message: "Please enter a valid phone number including country code (e.g. +1...)." }
  }

  try {
    const { sendSms, isSmsConfigured } = await import("@/lib/sms")
    if (!isSmsConfigured()) {
      return { success: false, message: "SMS service is currently unavailable. Please use Google or Email to sign in." }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP in verification table
    await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier: `phone:${clean}`,
      value: code,
      expiresAt,
    })

    const res = await sendSms(clean, `Your StarCast Media login code is ${code}. It expires in 5 minutes.`)
    if (!res.ok && !res.skipped) {
      return { success: false, message: "Could not send SMS code. Please check your phone number and try again." }
    }

    return { success: true, message: `Verification code sent to ${clean}!` }
  } catch (err: any) {
    console.error("[AUTH ACTION] Error in sendSmsOtpAction:", err)
    return { success: false, message: err?.message || "Failed to send SMS code." }
  }
}

/**
 * Verify SMS OTP code and create/log in the user.
 */
export async function verifySmsOtpAction(phoneNumber: string, code: string): Promise<{ success: boolean; message: string; redirectUrl?: string }> {
  const clean = phoneNumber.replace(/[^\d+]/g, "")
  const entered = code.trim().replace(/\D/g, "")

  if (!clean || entered.length !== 6) {
    return { success: false, message: "Please enter a valid 6-digit code." }
  }

  try {
    const { desc, and } = await import("drizzle-orm")
    const records = await db
      .select()
      .from(verification)
      .where(and(eq(verification.identifier, `phone:${clean}`)))
      .orderBy(desc(verification.createdAt))
      .limit(1)

    const record = records[0]
    if (!record) {
      return { success: false, message: "No verification code found. Please request a new one." }
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return { success: false, message: "That verification code has expired. Please request a new one." }
    }

    if (record.value !== entered) {
      return { success: false, message: "Incorrect verification code. Please try again." }
    }

    // Code is valid! Clean up verification record
    await db.delete(verification).where(eq(verification.id, record.id))

    // Check if user already exists with this phone number or temporary email
    const { profiles: profilesTable, session: sessionTable } = await import("@/lib/db/schema")
    const existingUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.phoneNumber, clean))
      .limit(1)

    let userId: string

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
      await db.update(userTable).set({ phoneNumberVerified: true }).where(eq(userTable.id, userId))
    } else {
      // Check if profile exists with phone
      const existingProfiles = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.phone, clean))
        .limit(1)

      if (existingProfiles.length > 0) {
        userId = existingProfiles[0].userId
        await db.update(userTable).set({ phoneNumber: clean, phoneNumberVerified: true }).where(eq(userTable.id, userId))
        await db.update(profilesTable).set({ phoneVerified: true }).where(eq(profilesTable.id, existingProfiles[0].id))
      } else {
        // Create fresh user & profile for this phone number
        userId = crypto.randomUUID().replace(/-/g, "")
        const tempEmail = `${clean.replace(/\D/g, "")}@phone.starcast.online`
        const tempName = `Member ${clean.slice(-4)}`

        await db.insert(userTable).values({
          id: userId,
          name: tempName,
          email: tempEmail,
          emailVerified: true,
          phoneNumber: clean,
          phoneNumberVerified: true,
        })

        const baseHandle = `user${clean.slice(-4)}`
        await db.insert(profilesTable).values({
          userId,
          email: tempEmail,
          firstName: "StarCast",
          lastName: "Member",
          username: `${baseHandle}${Math.floor(100 + Math.random() * 900)}`,
          phone: clean,
          phoneVerified: true,
          onboardingCompleted: false,
        })
      }
    }

    // Create session token and set session cookie
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(sessionTable).values({
      id: crypto.randomUUID().replace(/-/g, ""),
      userId,
      token,
      expiresAt,
    })

    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === "production"

    cookieStore.set("better-auth.session_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    })

    return {
      success: true,
      message: "Phone verified successfully! Signing in...",
      redirectUrl: "/onboarding",
    }
  } catch (err: any) {
    console.error("[AUTH ACTION] Error in verifySmsOtpAction:", err)
    return { success: false, message: err?.message || "Failed to verify phone code." }
  }
}

