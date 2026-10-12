"use client"

import { useState, useRef, useEffect } from "react"
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import { getClientFirebaseAuth } from "@/lib/firebase/client"

export function useFirebasePhoneAuth(containerId: string = "recaptcha-container") {
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const verifierRef = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        try {
          verifierRef.current.clear()
        } catch {}
        verifierRef.current = null
      }
    }
  }, [])

  function formatE164(phone: string): string {
    const digits = phone.replace(/\D/g, "")
    if (phone.startsWith("+")) {
      return `+${digits}`
    }
    // Default to US +1 if 10 digits
    if (digits.length === 10) {
      return `+1${digits}`
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`
    }
    return `+${digits}`
  }

  async function sendOtp(rawPhoneNumber: string) {
    setError(null)
    setLoading(true)
    try {
      const formatted = formatE164(rawPhoneNumber)
      const auth = getClientFirebaseAuth()

      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, containerId, {
          size: "invisible",
        })
      }

      const confirmation = await signInWithPhoneNumber(auth, formatted, verifierRef.current)
      setConfirmationResult(confirmation)
      setCodeSent(true)
      return { success: true, formatted }
    } catch (err: any) {
      console.error("[Firebase Phone Auth] Send error:", err)
      if (verifierRef.current) {
        try {
          verifierRef.current.clear()
        } catch {}
        verifierRef.current = null
      }
      const msg =
        err.code === "auth/invalid-phone-number"
          ? "Invalid phone number format. Please enter a valid number with area code."
          : err.code === "auth/too-many-requests"
          ? "Too many requests. Please wait a moment and try again."
          : err.code === "auth/operation-not-allowed"
          ? "Phone authentication is not enabled yet in your Firebase console. Please enable Phone in Firebase Authentication > Sign-in method."
          : err?.message || "Failed to send SMS code."
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  async function confirmOtp(code: string): Promise<{ success: boolean; idToken?: string; error?: string }> {
    if (!confirmationResult) {
      return { success: false, error: "Please request a verification code first." }
    }
    setError(null)
    setLoading(true)
    try {
      const cred = await confirmationResult.confirm(code.trim())
      const idToken = await cred.user.getIdToken()
      return { success: true, idToken }
    } catch (err: any) {
      console.error("[Firebase Phone Auth] Confirm error:", err)
      const msg =
        err.code === "auth/invalid-verification-code"
          ? "Incorrect verification code. Please check and try again."
          : err.code === "auth/code-expired"
          ? "Verification code has expired. Please request a new one."
          : err?.message || "Failed to verify code."
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setConfirmationResult(null)
    setCodeSent(false)
    setError(null)
    setLoading(false)
    if (verifierRef.current) {
      try {
        verifierRef.current.clear()
      } catch {}
      verifierRef.current = null
    }
  }

  return {
    sendOtp,
    confirmOtp,
    reset,
    codeSent,
    loading,
    error,
  }
}
