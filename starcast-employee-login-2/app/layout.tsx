import type React from "react"
import type { Metadata, Viewport } from "next"
import { Montserrat, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { SpaceflightTransitionProvider } from "@/components/spaceflight/spaceflight-transition-provider"
import { CelestialRadar } from "@/components/spaceflight/celestial-radar"
import "./globals.css"

// Montserrat is the closest free match to the brand kit's Proxima Nova Bold.
const _montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06062e",
}

export const metadata: Metadata = {
  title: {
    default: "StarCast Media | #1 Topeka Media Company & YouTube Broadcast Network | Topeka, KS",
    template: "%s | StarCast Media Topeka | Topeka Media Company",
  },
  description:
    "StarCast Media (@starcastlivemedia) is Topeka's leading local media company, YouTube broadcast network, and video production studio. We deliver uncut original talk shows, live music soundstages, sports broadcasting, podcast recordings, and targeted local advertising across Topeka, Kansas.",
  keywords: [
    "topeka media company",
    "media company topeka",
    "youtube media company topeka",
    "local media company topeka",
    "media company in topeka kansas",
    "topeka media production",
    "video production company topeka",
    "topeka broadcasting company",
    "podcast studio topeka",
    "topeka recording studio",
    "topeka soundstage",
    "topeka advertising agency",
    "starcast media",
    "starcast online",
    "starcast live media",
    "@starcastlivemedia",
    "kansas media company",
    "local broadcast network topeka",
    "live streaming company topeka",
    "midwest video production",
    "topeka commercial production",
    "shawnee county media company",
    "independent media topeka",
    "best media company in topeka",
    "music video production topeka",
    "sports broadcasting topeka ks",
    "topeka digital media agency",
    "topeka audio video production",
  ],
  authors: [{ name: "StarCast Media", url: "https://starcast.online" }],
  creator: "StarCast Media (@starcastlivemedia)",
  publisher: "StarCast Media LLC",
  generator: "Next.js",
  metadataBase: new URL("https://starcast.online"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://starcast.online",
    siteName: "StarCast Media | Topeka Media Company",
    title: "StarCast Media | #1 Topeka Media Company & YouTube Broadcast Network",
    description:
      "Topeka's premier local media company and YouTube studio. Live broadcasts, podcast soundstages, music performances, and targeted advertising in Topeka, Kansas.",
    images: [
      {
        url: "/images/spacemanlogo.png",
        width: 1200,
        height: 1200,
        alt: "StarCast Media - Topeka Media Company & YouTube Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@starcastlivemedia",
    creator: "@starcastlivemedia",
    title: "StarCast Media | Topeka Media Company & YouTube Network",
    description:
      "Topeka's premier local media company & broadcast studio. Stream uncut shows, podcasts, and soundstage music in Topeka, KS.",
    images: ["/images/spacemanlogo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/spacemanlogo.png",
    apple: "/images/spacemanlogo.png",
  },
  category: "Media Production & Broadcasting",
  classification: "Media Company, Video Production, Broadcasting & Advertising",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // JSON-LD structured data for local business SEO (Rich Snippets & Local Graph)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TelevisionStation", "RadioStation", "ProfessionalService", "Organization"],
    "@id": "https://starcast.online/#organization",
    name: "StarCast Media",
    legalName: "StarCast Media LLC",
    alternateName: [
      "StarCast",
      "Starcast Online",
      "Starcast Live Media",
      "StarCast Media Topeka",
      "@starcastlivemedia",
      "StarCast Broadcast Studio",
    ],
    description:
      "Topeka's premier local media company, YouTube broadcast network, and video production studio offering multi-camera live streaming, podcast recording, soundstage performances, sports broadcasting, and local business advertising in Topeka, Kansas.",
    url: "https://starcast.online",
    logo: {
      "@type": "ImageObject",
      url: "https://starcast.online/images/spacemanlogo.png",
      width: "800",
      height: "800",
    },
    image: "https://starcast.online/images/spacemanlogo.png",
    telephone: "+1-785-555-0100",
    email: "contact@starcast.online",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Topeka",
      addressRegion: "KS",
      postalCode: "66603",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 39.0473,
      longitude: -95.6752,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Topeka",
      },
      {
        "@type": "AdministrativeArea",
        name: "Shawnee County",
      },
      {
        "@type": "State",
        name: "Kansas",
      },
      {
        "@type": "Country",
        name: "United States",
      },
    ],
    sameAs: [
      "https://www.youtube.com/@StarCastLiveMedia",
      "https://www.youtube.com/channel/UCZ3dy9aqC46t33dzbBSmNjw",
      "https://open.spotify.com/show/5gfZgUVxAdXLbZ1Ffb4uod",
      "https://podcasts.apple.com/us/podcast/starcast-presents-the-observation-deck/id1896849212",
      "https://starcast.online",
    ],
    knowsAbout: [
      "Topeka Media Company",
      "YouTube Media Company",
      "Local Media Company Topeka",
      "Media Production",
      "Video Production",
      "Podcast Studio Recording",
      "Live Soundstage Streaming",
      "Sports Broadcasting",
      "Event Coverage",
      "Local Business Advertising",
      "Digital Marketing",
      "Content Creation",
      "Topeka Kansas Arts & Music",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "StarCast Media Production & Advertising Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "YouTube & Video Media Production",
            description:
              "High-definition multi-camera video production for YouTube shows, documentaries, commercials, and corporate video in Topeka, KS.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Live Media Production & Streaming",
            description:
              "Professional live broadcast production for concerts, sports events, festivals, and press conferences in Topeka and across Kansas.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Podcast Studio & Soundstage Recording",
            description:
              "State-of-the-art studio recording facility for audio and visual podcasts, interviews, and live soundstage acoustic performances.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Local Business Advertising & Sponsorships",
            description:
              "Commercial ad spots, sponsored episode integrations, digital banner placements, and billboard sponsorships across StarCast Media platforms.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sports Broadcasting & Highlights",
            description:
              "Play-by-play and color commentary live broadcasting for Kansas high school, collegiate, and regional sporting events.",
          },
        },
      ],
    },
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  }

  // WebSite schema with Sitelinks
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://starcast.online/#website",
    name: "StarCast Media",
    alternateName: ["Starcast", "StarCast Online", "Starcast Live Media", "StarcastLiveMedia", "Topeka Media Company"],
    url: "https://starcast.online",
    description:
      "Topeka's premier local media company and YouTube broadcasting studio. Watch original shows, listen to podcasts, read journalism, and book media production services.",
    inLanguage: "en-US",
    publisher: {
      "@id": "https://starcast.online/#organization",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://starcast.online/articles?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }

  // SiteNavigationElement tells Google which pages to show as sitelinks
  const siteNavJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Watch Broadcasts",
        description: "Stream uncut original shows and live YouTube broadcasts from Topeka's premier media company.",
        url: "https://starcast.online/watch",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Original Shows",
        description: "Explore The Observation Deck, Star Talk, The Psyco G Spot, and Hollywood: After Babylon.",
        url: "https://starcast.online/shows",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Articles & News",
        description: "Local Kansas sports coverage, culture analysis, and media commentary from StarCast.",
        url: "https://starcast.online/articles",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Music & Artists",
        description: "Spotlighting Topeka and Midwest independent bands, soundstage live takes, and discographies.",
        url: "https://starcast.online/music",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Sponsor & Advertise",
        description: "Grow your business with targeted local Topeka advertising, episode sponsorships, and commercials.",
        url: "https://starcast.online/sponsors",
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "About StarCast Media",
        description: "Learn about Topeka's leading media production company, studio facility, and broadcast network.",
        url: "https://starcast.online/information",
      },
    ],
  }

  return (
    <html lang="en" className={`dark bg-background ${_montserrat.variable} ${_geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavJsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <SpaceflightTransitionProvider>
          {children}
          <CelestialRadar />
        </SpaceflightTransitionProvider>
        <Toaster />
      </body>
    </html>
  )
}
