import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og-card/", "/api/blobs/"],
        disallow: ["/admin", "/dashboard", "/api/auth", "/api/stripe", "/api/cron"],
      },
    ],
    sitemap: "https://starcast.online/sitemap.xml",
  }
}
