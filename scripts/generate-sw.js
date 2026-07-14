#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const releaseId = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`;
const CACHE_VERSION = `${releaseId}-v1.0.0`;

const serviceWorkerTemplate = `const CACHE_VERSION = '${CACHE_VERSION}';
const CACHE_NAME = \`royal-game-of-ur-\${CACHE_VERSION}\`;
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );

  self.skipWaiting();
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

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/static/') || url.pathname.startsWith('/wasm/')) {
    event.respondWith(
      caches.match(event.request).then(async cachedResponse => {
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
`;

const publicDir = path.join(process.cwd(), 'public');
const swPath = path.join(publicDir, 'sw.js');

console.log('Generating service worker with cache version:', CACHE_VERSION);
fs.writeFileSync(swPath, serviceWorkerTemplate);
console.log('Service worker generated successfully');
