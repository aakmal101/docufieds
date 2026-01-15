/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'nrbbxcxwyqczsoscdfyw.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

