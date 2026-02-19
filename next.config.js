/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'nrbbxcxwyqczsoscdfyw.supabase.co' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
}

module.exports = nextConfig
