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
    default: "Starcast Media | Media & Advertising Company in Topeka, Kansas",
    template: "%s | Starcast Media Topeka",
  },
  description: "Starcast Media is Topeka's premier media production and advertising company. We offer live media production, video production, sports broadcasting, event coverage, and advertising services in Topeka, Kansas and surrounding areas.",
  keywords: [
    "media company Topeka",
    "advertising company Topeka",
    "media production Topeka Kansas",
    "video production Topeka",
    "Topeka advertising agency",
    "live media production Kansas",
    "sports broadcasting Topeka",
    "event coverage Topeka",
    "Starcast Media",
    "Topeka media services",
    "Kansas media company",
    "advertising Topeka KS",
    "media production company near me",
  ],
  authors: [{ name: "Starcast Media" }],
  creator: "Starcast Media",
  publisher: "Starcast Media",
  generator: "v0.app",
  metadataBase: new URL("https://starcast.online"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://starcast.online",
    siteName: "Starcast Media",
    title: "Starcast Media | Media & Advertising Company in Topeka, Kansas",
    description: "Topeka's premier media production and advertising company. Live media production, video production, sports broadcasting, and advertising services.",
    images: [
      {
        url: "/images/spacemanlogo.png",
        width: 800,
        height: 800,
        alt: "Starcast Media - Topeka Media Company",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starcast Media | Media & Advertising in Topeka, KS",
    description: "Topeka's premier media production and advertising company.",
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
  verification: {
    // Add your Google Search Console verification code here when you have it
    // google: "your-google-verification-code",
  },
  category: "Media Production",
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
  // JSON-LD structured data for local business SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://starcast.online",
    name: "Starcast Media",
    alternateName: "Starcast Live Media",
    description: "Topeka's premier media production and advertising company offering live media production, video production, sports broadcasting, event coverage, and advertising services.",
    url: "https://starcast.online",
    logo: "https://starcast.online/images/spacemanlogo.png",
    image: "https://starcast.online/images/spacemanlogo.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Topeka",
      addressRegion: "KS",
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
        "@type": "State",
        name: "Kansas",
      },
    ],
    knowsAbout: [
      "Media Production",
      "Video Production",
      "Sports Broadcasting",
      "Event Coverage",
      "Live Streaming",
      "Advertising",
      "Digital Marketing",
      "Content Creation",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Media & Advertising Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Live Media Production",
            description: "Professional multi-camera live broadcast production for sports, concerts, and events.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Video Production",
            description: "High-quality video production for commercials, corporate videos, and promotional content.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Advertising Services",
            description: "Targeted advertising and sponsorship packages across Starcast Media network platforms.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sports Broadcasting",
            description: "Live play-by-play and color commentary sports broadcasting for high school, college, and semi-pro sports.",
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
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "15:00",
      },
    ],
  }

  // WebSite schema with Sitelinks - this is what Google uses to generate sitelinks
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://starcast.online/#website",
    name: "Starcast Media",
    alternateName: ["Starcast", "Starcast Live Media", "StarcastLiveMedia"],
    url: "https://starcast.online",
    description: "Topeka's premier media production and advertising company. Articles, shows, community, and more.",
    inLanguage: "en-US",
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
        "@type": "SiteLinksSearchBox",
        target: "https://starcast.online/articles?q={search_term_string}",
      },
      {
        "@type": "ListItem",
        position: 1,
        name: "Articles",
        description: "Sports coverage, analysis, and commentary from Starcast Media.",
        url: "https://starcast.online/articles",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shows",
        description: "Watch The Observation Deck, Star Talk, and more Starcast original shows.",
        url: "https://starcast.online/shows",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Community",
        description: "Join the Starcast Media community. Discuss sports, media, and more.",
        url: "https://starcast.online/community",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Information",
        description: "Learn more about Starcast Media and our services.",
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
