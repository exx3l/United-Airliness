/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export'
  // Removed trailingSlash: true
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  }
}

export default nextConfig
