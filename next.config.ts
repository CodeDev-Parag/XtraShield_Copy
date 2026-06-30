import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Uncomment for static export or Docker deployment:
  // output: 'standalone',
};

export default nextConfig;
