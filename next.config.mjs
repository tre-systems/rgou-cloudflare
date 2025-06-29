/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
