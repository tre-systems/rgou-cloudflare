import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';

/**
 * @type {import("@opennextjs/cloudflare").OpenNextConfig}
 */
const config = {
  incrementalCache: r2IncrementalCache,
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
  assets: {
    patterns: ['public/wasm/*'],
  },
  edgeExternals: ['node:crypto'],
  middleware: {
    external: true,
    override: {
      wrapper: 'cloudflare-edge',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
};

export default defineCloudflareConfig(config);
