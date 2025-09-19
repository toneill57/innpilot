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
};

export default nextConfig;
