"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, user as userTable, session as sessionTable } from "@/lib/db/schema"
import { getFirebaseAuth } from "@/lib/firebase/admin"
import { eq } from "drizzle-orm"
import { headers, cookies } from "next/headers"
import crypto from "crypto"

async function getViewer() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

/**
 * Verify a Firebase ID token and link the phone number to the current logged-in user.
 * Used during onboarding or profile editing.
 */
export async function verifyFirebasePhoneForProfile(idToken: string) {
  try {
    const viewer = await getViewer()
    if (!viewer) {
      return { success: false, message: "You must be signed in to verify your phone." }
    }

    const firebaseAuth = getFirebaseAuth()
    const decoded = await firebaseAuth.verifyIdToken(idToken)

    if (!decoded.phone_number) {
      return { success: false, message: "No phone number associated with this verification." }
    }

    const phone = decoded.phone_number

    // Update user and profile in database
    await db
      .update(profiles)
      .set({ phone, phoneVerified: true })
      .where(eq(profiles.userId, viewer.id))

    await db
      .update(userTable)
      .set({ phoneNumber: phone, phoneNumberVerified: true })
      .where(eq(userTable.id, viewer.id))

    return { success: true, phone, message: "Phone number verified and linked successfully!" }
  } catch (err: any) {
    console.error("[Firebase Phone Auth] Error verifying token for profile:", err)
    return { success: false, message: err?.message || "Verification failed." }
  }
}

/**
 * Sign in or sign up a user using a verified Firebase Phone ID token.
 * Used on the /login and /signup pages.
 */
export async function loginWithFirebasePhone(idToken: string) {
  try {
    const firebaseAuth = getFirebaseAuth()
    const decoded = await firebaseAuth.verifyIdToken(idToken)

    if (!decoded.phone_number) {
      return { success: false, message: "No phone number found in token." }
    }

    const phone = decoded.phone_number

    // Find existing user by phone
    const existingUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.phoneNumber, phone))
      .limit(1)

    let userId: string

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
      await db.update(userTable).set({ phoneNumberVerified: true }).where(eq(userTable.id, userId))
      await db.update(profiles).set({ phoneVerified: true }).where(eq(profiles.userId, userId))
    } else {
      // Check if profile exists with phone
      const existingProfiles = await db
        .select()
        .from(profiles)
        .where(eq(profiles.phone, phone))
        .limit(1)

      if (existingProfiles.length > 0) {
        userId = existingProfiles[0].userId
        await db.update(userTable).set({ phoneNumber: phone, phoneNumberVerified: true }).where(eq(userTable.id, userId))
        await db.update(profiles).set({ phoneVerified: true }).where(eq(profiles.id, existingProfiles[0].id))
      } else {
        // Create new user and profile
        userId = crypto.randomUUID().replace(/-/g, "")
        const cleanDigits = phone.replace(/\D/g, "")
        const tempEmail = `${cleanDigits}@phone.starcast.online`
        const tempName = `Member ${cleanDigits.slice(-4)}`

        await db.insert(userTable).values({
          id: userId,
          name: tempName,
          email: tempEmail,
          emailVerified: true,
          phoneNumber: phone,
          phoneNumberVerified: true,
        })

        const baseHandle = `user${cleanDigits.slice(-4)}`
        await db.insert(profiles).values({
          userId,
          email: tempEmail,
          firstName: "StarCast",
          lastName: "Member",
          username: `${baseHandle}${Math.floor(100 + Math.random() * 900)}`,
          phone,
          phoneVerified: true,
          onboardingCompleted: false,
        })
      }
    }

    // Create session token and cookie
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.insert(sessionTable).values({
      id: crypto.randomUUID().replace(/-/g, ""),
      userId,
      token,
      expiresAt,
    })

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
      message: "Phone verified successfully! Signing you in...",
      redirectUrl: "/onboarding",
    }
  } catch (err: any) {
    console.error("[Firebase Phone Auth] Error signing in with phone:", err)
    return { success: false, message: err?.message || "Failed to sign in with phone." }
  }
}
