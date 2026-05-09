import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Ignore typescript errors during static build if any
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure images work without Next.js Image Optimization server
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
