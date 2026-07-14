import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const release = env['SENTRY_RELEASE'] || env['GITHUB_SHA'];
  const uploadSourceMaps = Boolean(env['SENTRY_AUTH_TOKEN'] && release);

  return {
    plugins: [
      react(),
      cloudflare({ inspectorPort: false }),
      uploadSourceMaps &&
        sentryVitePlugin({
          authToken: env['SENTRY_AUTH_TOKEN'],
          org: env['SENTRY_ORG'] || 'total-reality-engineering',
          project: env['SENTRY_PROJECT'] || 'rgou-cloudflare',
          release: { name: release ?? 'unknown' },
          sourcemaps: { filesToDeleteAfterUpload: ['out/client/**/*.map'] },
          telemetry: false,
        }),
    ],
    resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
    build: {
      chunkSizeWarningLimit: 750,
      outDir: 'out',
      sourcemap: uploadSourceMaps,
    },
  };
});
