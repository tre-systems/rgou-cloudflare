import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    config.module.rules.push({
      test: /ai\.worker\.ts$/,
      use: {
        loader: 'raw-loader',
      },
      parser: {
        amd: false,
        commonjs: false,
        system: false,
        requireJs: false,
        // Disable parsing of this module
        parse: () => ({}),
      },
    });

    if (!isServer) {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/wasm/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
        port: '',
        pathname: '/cdn/**',
      },
    ],
  },
};

export default nextConfig;
