"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Check,
  Loader2,
  AtSign,
  Camera,
  MapPin,
  Music,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
} from "lucide-react"
import { INTEREST_OPTIONS } from "@/lib/onboarding-options"
import {
  checkUsernameAvailable,
  saveOnboardingStep,
  sendPhoneCode,
  verifyPhoneCode,
  completeOnboarding,
} from "@/app/actions/onboarding"

type OnboardingState = {
  email: string
  username: string
  firstName: string
  lastName: string
  bio: string
  location: string
  website: string
  profilePic: string
  phone: string
  phoneVerified: boolean
  interests: string[]
  onboardingCompleted: boolean
  smsAvailable: boolean
}

const STEPS = ["Handle", "Photo", "About you", "Interests", "Phone"] as const

export function OnboardingWizard({ initial }: { initial: OnboardingState }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — handle
  const [username, setUsername] = useState(initial.username)
  const [handleState, setHandleState] = useState<{ checking: boolean; ok: boolean | null; reason: string | null }>({
    checking: false,
    ok: null,
    reason: null,
  })

  // Step 2 — photo
  const [profilePic, setProfilePic] = useState(initial.profilePic)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Step 3 — about
  const [firstName, setFirstName] = useState(initial.firstName)
  const [lastName, setLastName] = useState(initial.lastName)
  const [bio, setBio] = useState(initial.bio)
  const [location, setLocation] = useState(initial.location)

  // Step 4 — interests
  const [interests, setInterests] = useState<string[]>(initial.interests)

  // Step 5 — phone
  const [phone, setPhone] = useState(initial.phone)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(initial.phoneVerified)

  // Debounced availability check so the member gets instant feedback.
  useEffect(() => {
    const value = username.trim()
    if (!value) {
      setHandleState({ checking: false, ok: null, reason: null })
      return
    }
    setHandleState((s) => ({ ...s, checking: true }))
    const t = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(value)
        setHandleState({ checking: false, ok: res.available, reason: res.reason })
      } catch {
        setHandleState({ checking: false, ok: null, reason: null })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [username])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("folder", "avatars")
      const res = await fetch("/api/upload", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")
      setProfilePic(json.url)
    } catch (err: any) {
      setError(err?.message || "Could not upload that image.")
    } finally {
      setUploading(false)
    }
  }

  const next = async () => {
    setError(null)
    setSaving(true)
    try {
      if (step === 0) {
        if (!handleState.ok) throw new Error(handleState.reason ?? "Choose an available handle to continue.")
        await saveOnboardingStep({ username })
      } else if (step === 1) {
        await saveOnboardingStep({ profilePic })
      } else if (step === 2) {
        if (!firstName.trim()) throw new Error("Please enter your first name.")
        await saveOnboardingStep({ firstName, lastName, bio, location })
      } else if (step === 3) {
        await saveOnboardingStep({ interests })
      }

      if (step < STEPS.length - 1) {
        setStep(step + 1)
      } else {
        const { username: handle } = await completeOnboarding()
        router.push(`/u/${handle}`)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  const finish = async () => {
    setError(null)
    setSaving(true)
    try {
      const { username: handle } = await completeOnboarding()
      router.push(`/u/${handle}`)
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  const handleSendCode = async () => {
    setError(null)
    setSaving(true)
    try {
      await sendPhoneCode(phone)
      setCodeSent(true)
    } catch (err: any) {
      setError(err?.message || "Could not send the code.")
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async (value: string) => {
    setError(null)
    setSaving(true)
    try {
      await verifyPhoneCode(value)
      setPhoneVerified(true)
    } catch (err: any) {
      setError(err?.message || "Could not verify that code.")
    } finally {
      setSaving(false)
    }
  }

  const toggleInterest = (interest: string) =>
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "★"

  return (
    <div className="min-h-screen bg-[#05052d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress rail */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    i <= step ? "bg-[#ea6f2a]" : "bg-[#20205a]"
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs uppercase tracking-widest text-[#9a9fc4]">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <div className="rounded-2xl border border-[#20205a]/60 bg-[#0c0c3f]/70 p-6 sm:p-8">
          {/* STEP 1 — handle */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                <AtSign className="w-7 h-7 text-[#ea6f2a]" />
                <h1 className="text-2xl font-bold text-[#f5f7ff] text-balance">Claim your handle</h1>
                <p className="text-sm leading-relaxed text-[#9a9fc4]">
                  This becomes your public profile link. You can share it anywhere.
                </p>
              </header>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-[#f5f7ff]">
                  Handle
                </Label>
                <div className="flex items-center gap-0 rounded-lg border border-[#20205a] bg-[#05052d] focus-within:border-[#ea6f2a] transition-colors">
                  <span className="pl-3 text-sm text-[#9a9fc4] select-none">starcast.online/u/</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="yourname"
                    autoFocus
                    className="border-0 bg-transparent text-[#f5f7ff] focus-visible:ring-0 px-1"
                  />
                  <span className="pr-3">
                    {handleState.checking ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#9a9fc4]" />
                    ) : handleState.ok ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : null}
                  </span>
                </div>
                {handleState.reason && !handleState.ok && (
                  <p className="text-xs text-red-300">{handleState.reason}</p>
                )}
                {handleState.ok && <p className="text-xs text-green-400">That handle is available.</p>}
                <p className="text-xs text-[#9a9fc4]">Lowercase letters, numbers and underscores. 3-24 characters.</p>
              </div>
            </div>
          )}

          {/* STEP 2 — photo */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                <Camera className="w-7 h-7 text-[#ea6f2a]" />
                <h1 className="text-2xl font-bold text-[#f5f7ff] text-balance">Add a profile photo</h1>
                <p className="text-sm leading-relaxed text-[#9a9fc4]">
                  Optional, but members with a photo get a lot more engagement.
                </p>
              </header>
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#20205a] flex items-center justify-center flex-shrink-0">
                  {profilePic ? (
                    <img src={profilePic || "/placeholder.svg"} alt="Your profile photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#9a9fc4]">{initials}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/40"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" /> {profilePic ? "Change photo" : "Upload photo"}
                      </>
                    )}
                  </Button>
                  {profilePic && (
                    <button
                      type="button"
                      onClick={() => setProfilePic("")}
                      className="text-xs text-[#9a9fc4] hover:text-[#ea6f2a] transition-colors text-left"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — about */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                <MapPin className="w-7 h-7 text-[#ea6f2a]" />
                <h1 className="text-2xl font-bold text-[#f5f7ff] text-balance">Tell us about you</h1>
                <p className="text-sm leading-relaxed text-[#9a9fc4]">
                  This shows on your public profile.
                </p>
              </header>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName" className="text-[#f5f7ff]">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName" className="text-[#f5f7ff]">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="location" className="text-[#f5f7ff]">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bio" className="text-[#f5f7ff]">Short bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="What do you play, produce, or listen to?"
                  className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                />
              </div>
            </div>
          )}

          {/* STEP 4 — interests */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                <Music className="w-7 h-7 text-[#ea6f2a]" />
                <h1 className="text-2xl font-bold text-[#f5f7ff] text-balance">What are you into?</h1>
                <p className="text-sm leading-relaxed text-[#9a9fc4]">
                  Pick as many as you like. We use these to suggest shows and members.
                </p>
              </header>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={active}
                      className={`rounded-full px-3.5 py-1.5 text-sm transition-colors border ${
                        active
                          ? "bg-[#ea6f2a] border-[#ea6f2a] text-[#05052d] font-medium"
                          : "bg-transparent border-[#20205a] text-[#9a9fc4] hover:border-[#ea6f2a]/50 hover:text-[#f5f7ff]"
                      }`}
                    >
                      {interest}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#9a9fc4]">
                {interests.length} selected
              </p>
            </div>
          )}

          {/* STEP 5 — phone */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <header className="flex flex-col gap-2">
                {phoneVerified ? (
                  <ShieldCheck className="w-7 h-7 text-green-400" />
                ) : (
                  <Phone className="w-7 h-7 text-[#ea6f2a]" />
                )}
                <h1 className="text-2xl font-bold text-[#f5f7ff] text-balance">
                  {phoneVerified ? "Phone verified" : "Verify your phone"}
                </h1>
                <p className="text-sm leading-relaxed text-[#9a9fc4]">
                  {phoneVerified
                    ? "You're all set. We'll text you booking reminders and nothing else."
                    : "We text a 6-digit code. Verified members get booking reminders and can be reached about sessions."}
                </p>
              </header>

              {phoneVerified ? (
                <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-[#f5f7ff]">{phone}</p>
                </div>
              ) : !initial.smsAvailable ? (
                <p className="rounded-lg border border-[#20205a] bg-[#05052d] p-4 text-sm text-[#9a9fc4]">
                  SMS verification is not available right now. You can finish setup and verify later from your profile.
                </p>
              ) : !codeSent ? (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="phone" className="text-[#f5f7ff]">Mobile number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                  />
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={saving || !phone.trim()}
                    className="bg-[#ea6f2a] hover:bg-[#d86224] text-[#05052d] font-semibold w-fit"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Send code
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Label className="text-[#f5f7ff]">Enter the 6-digit code sent to {phone}</Label>
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(v) => {
                      setCode(v)
                      if (v.length === 6) handleVerify(v)
                    }}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="border-[#20205a] bg-[#05052d] text-[#f5f7ff]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false)
                      setCode("")
                    }}
                    className="text-xs text-[#9a9fc4] hover:text-[#ea6f2a] transition-colors text-left"
                  >
                    Use a different number
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || saving}
              className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/40"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="flex items-center gap-2">
              {step === STEPS.length - 1 && !phoneVerified && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={finish}
                  disabled={saving}
                  className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/40"
                >
                  Skip for now
                </Button>
              )}
              <Button
                type="button"
                onClick={step === STEPS.length - 1 ? finish : next}
                disabled={saving || (step === 0 && !handleState.ok)}
                className="bg-[#ea6f2a] hover:bg-[#d86224] text-[#05052d] font-semibold"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : step === STEPS.length - 1 ? (
                  <PartyPopper className="w-4 h-4 mr-2" />
                ) : null}
                {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
                {step < STEPS.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
