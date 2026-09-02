/**
 * Interests offered in the onboarding wizard.
 *
 * Kept out of `app/actions/onboarding.ts` because a `"use server"` file may
 * only export async functions.
 */
export const INTEREST_OPTIONS = [
  "Rock",
  "Metal",
  "Hip Hop",
  "R&B / Soul",
  "Country",
  "Jazz",
  "Blues",
  "Electronic",
  "Punk",
  "Folk / Acoustic",
  "Pop",
  "Gospel",
  "Podcasting",
  "Live Sound",
  "Recording / Mixing",
  "Videography",
] as const
