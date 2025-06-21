import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    runtime: "edge", // Enable edge runtime for Cloudflare
  },
  // Enable static exports for Cloudflare Pages
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "dist",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
