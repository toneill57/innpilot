import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only run TypeScript checking for production files
    ignoreBuildErrors: false,
  },
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster builds in development
    swcMinify: false,
    // Optimize chunk loading
    experimental: {
      turbo: {
        // Enable Turbopack optimizations
        memoryLimit: 4096,
      },
    },
    // Compiler optimizations for development
    compiler: {
      // Disable some heavy optimizations in dev
      removeConsole: false,
    },
  }),
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    swcMinify: true,
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
  // API route optimizations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=300, stale-while-revalidate=600'
          },
        ],
      },
    ]
  },
};

export default nextConfig;
