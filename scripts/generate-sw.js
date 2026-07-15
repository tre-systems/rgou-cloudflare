#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function findBuildAssets(assetDir) {
  if (!assetDir || !fs.existsSync(assetDir)) return [];

  const paths = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (!entry.name.endsWith('.map')) {
        paths.push(`/assets/${path.relative(assetDir, entryPath).split(path.sep).join('/')}`);
      }
    }
  };

  visit(assetDir);
  return paths.sort();
}

export function createServiceWorkerSource(releaseId, buildAssets = []) {
  const cacheVersion = `${releaseId}-v1.2.0`;
  return `const CACHE_VERSION = '${cacheVersion}';
const CACHE_NAME = \`royal-game-of-ur-\${CACHE_VERSION}\`;
const OFFLINE_URL = '/offline';
const BUILD_ASSETS = ${JSON.stringify(buildAssets, null, 2)};

const REQUIRED_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-128x128.png',
];

const OPTIONAL_ASSETS = [
  '/wasm/rgou_ai_core.js',
  '/wasm/rgou_ai_worker_bg.wasm',
  '/ml-weights.json.gz',
  '/oracle-weights.json.gz',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(REQUIRED_ASSETS);

      const indexResponse = await cache.match('/');
      if (!indexResponse) throw new Error('[SW] Cached application shell is missing');
      const html = await indexResponse.text();
      const shellAssets = Array.from(
        html.matchAll(/(?:src|href)=["'](\\/assets\\/[^"']+)["']/g),
        match => match[1]
      );
      await cache.addAll([...new Set([...shellAssets, ...BUILD_ASSETS])]);

      const results = await Promise.allSettled(
        OPTIONAL_ASSETS.map(asset => cache.add(asset))
      );
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error('[SW] Failed to cache optional asset:', OPTIONAL_ASSETS[index], result.reason);
        }
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName.startsWith('royal-game-of-ur-') && cacheName !== CACHE_NAME
            )
            .map(cacheName => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname === '/healthz' || url.pathname.startsWith('/api/')) {
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/wasm/')) {
    event.respondWith(
      caches.match(event.request, { ignoreVary: true }).then(async cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        const response = await fetch(event.request);
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }

          return Response.error();
        })
      )
  );
});

self.addEventListener('message', event => {
  if (event.origin !== self.location.origin) return;
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
`;
}

export function generateServiceWorker({
  releaseId = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`,
  publicDir = path.join(process.cwd(), 'public'),
  assetDir,
} = {}) {
  const cacheVersion = `${releaseId}-v1.2.0`;
  const swPath = path.join(publicDir, 'sw.js');
  const buildAssets = findBuildAssets(assetDir);

  console.log('Generating service worker with cache version:', cacheVersion);
  fs.writeFileSync(swPath, createServiceWorkerSource(releaseId, buildAssets));
  console.log('Service worker generated successfully');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = process.argv.includes('--built');
  generateServiceWorker(
    built
      ? {
          publicDir: path.join(process.cwd(), 'out/client'),
          assetDir: path.join(process.cwd(), 'out/client/assets'),
        }
      : undefined
  );
}
