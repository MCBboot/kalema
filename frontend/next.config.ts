import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kalema';

const nextConfig: NextConfig = {
  output: "export",
  basePath,
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
