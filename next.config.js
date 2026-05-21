/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
