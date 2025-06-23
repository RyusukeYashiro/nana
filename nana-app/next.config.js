/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@/components': './components',
        '@/app': './app',
        '@/lib': './lib',
        '@/hooks': './hooks',
        '@/styles': './styles',
      },
    },
  },
}

module.exports = nextConfig