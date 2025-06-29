/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
