import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_build_placeholder")

const FROM = "StarCast Media <noreply@starcast.online>"
const BRAND_ORANGE = "#D4722B"
const BRAND_NAVY = "#0A1828"
const BRAND_CREAM = "#F5F1E6"

/**
 * Wrap body content in a consistent, email-client-safe branded shell.
 * Uses inline styles + tables since email clients strip <style>/flexbox.
 */
function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND_NAVY};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_NAVY};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0F1F2E;border:1px solid rgba(212,114,43,0.25);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <p style="margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ORANGE};font-weight:bold;">StarCast Media</p>
                <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.3;color:${BRAND_CREAM};">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;color:#BFA98E;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0 0;font-size:12px;color:#5c6b7a;">© ${new Date().getFullYear()} StarCast Media · starcast.online</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;">
    <tr>
      <td style="border-radius:8px;background:${BRAND_ORANGE};">
        <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:${BRAND_CREAM};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`
}

/** Send the account email-verification link (used by Better Auth on signup + resend). */
export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  // Always log the verification link for easy developer / admin access and debugging
  console.log(
    `\n=======================================================\n` +
    `[EMAIL VERIFICATION]\n` +
    `To: ${to}\n` +
    `Verification Link: ${url}\n` +
    `=======================================================\n`
  )

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.warn(
      `[EMAIL] RESEND_API_KEY is not configured or is a placeholder. ` +
      `Skipping Resend dispatch. The account verification link has been printed to the server log above.`
    )
    return
  }

  const body = `
    <p style="margin:0 0 16px 0;">Welcome to StarCast Media! Confirm this email address to activate your account and start booking sessions.</p>
    ${button(url, "Verify my email")}
    <p style="margin:0 0 8px 0;font-size:13px;">Or paste this link into your browser:</p>
    <p style="margin:0 0 16px 0;word-break:break-all;"><a href="${url}" target="_blank" style="color:${BRAND_ORANGE};">${url}</a></p>
    <p style="margin:0;font-size:13px;color:#5c6b7a;">If you didn&apos;t create this account, you can safely ignore this email.</p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your StarCast Media account",
      html: shell("Confirm your email", body),
    })

    if (error) {
      console.error("[EMAIL] Resend send error with primary domain:", error)
      console.warn("[EMAIL] Attempting fallback delivery via onboarding@resend.dev...")
      const fallbackRes = await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to,
        subject: "Verify your StarCast Media account",
        html: shell("Confirm your email", body),
      })
      if (fallbackRes.error) {
        console.error("[EMAIL] Fallback sender error:", fallbackRes.error)
      } else {
        console.log("[EMAIL] Fallback verification email sent via onboarding@resend.dev ID:", fallbackRes.data?.id)
      }
    } else {
      console.log("[EMAIL] Verification email sent successfully via Resend. ID:", data?.id)
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error while sending email via Resend:", err)
    console.log(`[EMAIL] Fallback verification link for ${to}: ${url}`)
  }
}

/** Send the password reset link (used by Better Auth forgetPassword). */
export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  console.log(
    `\n=======================================================\n` +
    `[PASSWORD RESET]\n` +
    `To: ${to}\n` +
    `Reset Link: ${url}\n` +
    `=======================================================\n`
  )

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("re_dummy")) {
    console.warn(`[EMAIL] RESEND_API_KEY not configured. Reset link printed above.`)
    return
  }

  const body = `
    <p style="margin:0 0 16px 0;">We received a request to reset your StarCast Media password.</p>
    ${button(url, "Reset password")}
    <p style="margin:0 0 8px 0;font-size:13px;">Or paste this link into your browser:</p>
    <p style="margin:0 0 16px 0;word-break:break-all;"><a href="${url}" target="_blank" style="color:${BRAND_ORANGE};">${url}</a></p>
    <p style="margin:0;font-size:13px;color:#5c6b7a;">If you didn&apos;t request this, you can safely ignore this email.</p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your StarCast Media password",
      html: shell("Reset your password", body),
    })

    if (error) {
      console.error("[EMAIL] Resend reset error:", error)
      const fallbackRes = await resend.emails.send({
        from: "StarCast Media <onboarding@resend.dev>",
        to,
        subject: "Reset your StarCast Media password",
        html: shell("Reset your password", body),
      })
      if (!fallbackRes.error) {
        console.log("[EMAIL] Fallback password reset sent ID:", fallbackRes.data?.id)
      }
    } else {
      console.log("[EMAIL] Password reset sent successfully ID:", data?.id)
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendPasswordResetEmail:", err)
  }
}

