/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable trailing slash redirects so webhooks work
  skipTrailingSlashRedirect: true,
}

export default nextConfig
