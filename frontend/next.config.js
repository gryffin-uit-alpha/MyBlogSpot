/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enables static HTML export
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static HTML export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
}

module.exports = nextConfig
