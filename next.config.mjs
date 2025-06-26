/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Add PWA optimizations
  poweredByHeader: false,
  experimental: {
    webpackBuildWorker: true,
  },
  // PWA assets are served from public/ directory in static export mode
};

export default nextConfig;
