export interface SponsorshipPackage {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  popular?: boolean
  bestValue?: boolean
}

export const SPONSORSHIP_PACKAGES: SponsorshipPackage[] = [
  {
    id: "single-tester",
    name: "Single Sponsorship Tester",
    description: "A simple single sponsor spot/live read for businesses that want to test StarCast before joining the full sponsorship program.",
    priceInCents: 5000,
    features: [
      "1 live read sponsor spot",
      "Great for trying us out",
      "No long-term commitment",
    ],
  },
  {
    id: "starter",
    name: "Starter Sponsorship Package",
    description: "Covers 8 single live reads over 2 months. Your company gets printed on our physical flyers.",
    priceInCents: 15000,
    features: [
      "8 live reads over 2 months",
      "Printed on physical flyers",
      "Option to play your commercial video",
    ],
  },
  {
    id: "enhanced",
    name: "Enhanced Sponsorship Package",
    description: "Doubles the starter package with more sponsor mentions, flyer placement, and on-screen graphics.",
    priceInCents: 30000,
    features: [
      "16+ live reads over 2 months",
      "Premium flyer placement",
      "On-screen graphics during live reads",
      "Commercial video playback",
    ],
    popular: true,
  },
  {
    id: "full-season",
    name: "Full Season Sponsorship",
    description: "Full season sponsorship for businesses wanting stronger presence across StarCast programming.",
    priceInCents: 90000,
    features: [
      "Full season coverage",
      "Custom sponsorship plan",
      "Priority placement",
      "Direct collaboration with our team",
      "Maximum brand exposure",
    ],
    bestValue: true,
  },
]

export function getPackageById(id: string): SponsorshipPackage | undefined {
  return SPONSORSHIP_PACKAGES.find((p) => p.id === id)
}
