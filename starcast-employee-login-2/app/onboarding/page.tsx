import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getOnboardingState } from "@/app/actions/onboarding"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata: Metadata = {
  title: "Set up your profile | Starcast Media",
  description: "Finish setting up your Starcast Media member profile.",
}

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/login")

  // getOnboardingState also creates the profile row if this is a brand new user.
  const state = await getOnboardingState()

  // Already finished? This route doubles as the post-login landing spot, so
  // send returning members straight on to their dashboard.
  if (state.onboardingCompleted) redirect("/dashboard")

  return <OnboardingWizard initial={state} />
}
