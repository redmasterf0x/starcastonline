import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

// Montserrat is the closest free match to the brand kit's Proxima Nova Bold.
const _montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

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
  metadataBase: new URL("https://www.starcast.online"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.starcast.online",
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
    canonical: "https://www.starcast.online",
    types: {
      "application/rss+xml": "https://www.starcast.online/rss.xml",
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
    "@id": "https://www.starcast.online",
    name: "Starcast Media",
    alternateName: "Starcast Live Media",
    description: "Topeka's premier media production and advertising company offering live media production, video production, sports broadcasting, event coverage, and advertising services.",
    url: "https://www.starcast.online",
    logo: "https://www.starcast.online/images/spacemanlogo.png",
    image: "https://www.starcast.online/images/spacemanlogo.png",
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
        "@id": "https://en.wikipedia.org/wiki/Topeka,_Kansas",
      },
      {
        "@type": "State",
        name: "Kansas",
      },
    ],
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 39.0473,
        longitude: -95.6752,
      },
      geoRadius: "50 mi",
    },
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    sameAs: [
      // Add social media URLs here when available
    ],
    knowsAbout: [
      "Media Production",
      "Advertising",
      "Video Production", 
      "Live Streaming",
      "Sports Broadcasting",
      "Event Coverage",
      "Content Creation",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Media Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Live Media Production",
            description: "Professional live media production services for events, sports, and broadcasts in Topeka and Kansas.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Video Production",
            description: "High-quality video production and content creation services.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Advertising Services",
            description: "Comprehensive advertising and media buying services for local Topeka businesses.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sports Broadcasting",
            description: "Professional sports broadcasting and coverage services.",
          },
        },
      ],
    },
  }

  // WebSite schema with Sitelinks - this is what Google uses to generate sitelinks
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.starcast.online/#website",
    name: "Starcast Media",
    alternateName: ["Starcast", "Starcast Live Media", "StarcastLiveMedia"],
    url: "https://www.starcast.online",
    description: "Topeka's premier media production and advertising company. Articles, shows, community, and more.",
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.starcast.online/articles?q={search_term_string}",
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
        target: "https://www.starcast.online/articles?q={search_term_string}",
      },
      {
        "@type": "ListItem",
        position: 1,
        name: "Articles",
        description: "Sports coverage, analysis, and commentary from Starcast Media.",
        url: "https://www.starcast.online/articles",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shows",
        description: "Watch The Observation Deck, Star Talk, and more Starcast original shows.",
        url: "https://www.starcast.online/shows",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Community",
        description: "Join the Starcast Media community. Discuss sports, media, and more.",
        url: "https://www.starcast.online/community",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Information",
        description: "Learn more about Starcast Media and our services.",
        url: "https://www.starcast.online/information",
      },
    ],
  }

  return (
    <html lang="en" className={`dark bg-background ${_montserrat.variable} ${_geistMono.variable}`}>
      <head>
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
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
