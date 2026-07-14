import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { withSentryConfig } from '@sentry/nextjs';

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
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

    if (!isServer) {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'total-reality-engineering',
  project: process.env.SENTRY_PROJECT ?? 'rgou-cloudflare',
  sentryUrl: process.env.SENTRY_URL ?? 'https://de.sentry.io',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
