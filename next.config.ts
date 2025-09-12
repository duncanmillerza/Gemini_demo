import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow deploys even if ESLint finds issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow deploys even if type errors exist
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
