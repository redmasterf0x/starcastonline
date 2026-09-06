import { betterAuth } from "better-auth"
import { phoneNumber } from "better-auth/plugins"
import { eq, sql } from "drizzle-orm"
import { db, pool } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { sendVerificationEmail } from "@/lib/email"
import { sendSms } from "@/lib/sms"

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL ?? "https://www.starcast.online"),
  emailAndPassword: {
    enabled: true,
    // TEMP: email not yet required to sign in (Resend not configured).
    requireEmailVerification: false,
    autoSignIn: true,
  },
  emailVerification: {
    // Automatically email the verification link when an account is created.
    sendOnSignUp: true,
    // Once verified, sign the user in so they land straight in the app.
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // link valid for 24h
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Create the app `profiles` row as soon as the user account exists.
        // (Previously done client-side after signup, which no longer works now
        // that there is no session until the email is verified.)
        after: async (newUser) => {
          try {
            const parts = (newUser.name ?? "").trim().split(/\s+/)
            const firstName = parts.shift() ?? ""
            const lastName = parts.join(" ")
            const existing = await db
              .select({ id: profiles.id })
              .from(profiles)
              .where(eq(profiles.userId, newUser.id))
              .limit(1)
            if (existing.length === 0) {
              // Every new member gets a public profile page immediately, so
              // assign a unique handle up front. Onboarding lets them change it.
              const base =
                (newUser.email.split("@")[0] || "member").toLowerCase().replace(/[^a-z0-9_]+/g, "") || "member"
              let username = base
              for (let i = 0; i < 5; i++) {
                const taken = await db
                  .select({ id: profiles.id })
                  .from(profiles)
                  .where(sql`lower(${profiles.username}) = lower(${username})`)
                  .limit(1)
                if (taken.length === 0) break
                username = `${base}${Math.floor(1000 + Math.random() * 9000)}`
              }

              await db.insert(profiles).values({
                userId: newUser.id,
                email: newUser.email,
                firstName,
                lastName,
                username,
              })
            }
          } catch (e) {
            console.log("[v0] profile create hook error:", e)
          }
        },
      },
    },
  },
  plugins: [
    // Optional SMS verification. Users can add + verify a phone number from
    // their dashboard to receive text notifications; it is NOT required to
    // sign up or log in.
    phoneNumber({
      otpLength: 6,
      expiresIn: 60 * 5, // OTP valid for 5 minutes
      sendOTP: async ({ phoneNumber: to, code }) => {
        await sendSms(to, `Your StarCast Media verification code is ${code}. It expires in 5 minutes.`)
      },
    }),
  ],
  trustedOrigins: [
    // Production domain (both apex and www) so auth works on the live site
    // regardless of which Vercel env var is present at runtime.
    "https://starcast.online",
    "https://www.starcast.online",
    // Netlify domains & preview deploys
    "https://*.netlify.app",
    ...(process.env.URL ? [process.env.URL] : []),
    ...(process.env.DEPLOY_PRIME_URL ? [process.env.DEPLOY_PRIME_URL] : []),
    // v0 / Vercel preview + sandbox domains (wildcards)
    "https://*.vercel.run",
    "https://*.v0.build",
    "https://*.vercel.app",
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
