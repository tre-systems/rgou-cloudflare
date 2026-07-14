import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { createServiceWorkerSource } from './generate-sw.js';

function installPromiseFor(cache, errors = []) {
  let installHandler;
  let installPromise;
  const self = {
    addEventListener(type, handler) {
      if (type === 'install') installHandler = handler;
    },
    clients: { claim: async () => undefined },
    location: { origin: 'https://gameofur.org' },
  };

  vm.runInNewContext(createServiceWorkerSource('test-release'), {
    URL,
    Response,
    caches: {
      delete: async () => true,
      keys: async () => [],
      match: async () => undefined,
      open: async () => cache,
    },
    console: {
      error: (...messages) => errors.push(messages),
      log: () => undefined,
    },
    fetch,
    self,
  });

  assert.ok(installHandler, 'service worker should register an install handler');
  installHandler({ waitUntil: promise => (installPromise = promise) });
  assert.ok(installPromise, 'install handler should extend the installation lifetime');
  return installPromise;
}

test('required precache failure rejects service worker installation', async () => {
  const requiredFailure = new Error('offline shell unavailable');
  const installPromise = installPromiseFor({
    add: async () => undefined,
    addAll: async () => {
      throw requiredFailure;
    },
    match: async () => undefined,
    put: async () => undefined,
  });

  await assert.rejects(installPromise, requiredFailure);
});

test('optional precache failure does not reject service worker installation', async () => {
  const errors = [];
  const installPromise = installPromiseFor(
    {
      add: async asset => {
        if (asset === '/ml-weights.json.gz') throw new Error('model unavailable');
      },
      addAll: async () => undefined,
      match: async () =>
        new Response(
          '<link rel="stylesheet" href="/assets/index.css"><script src="/assets/index.js"></script>'
        ),
      put: async () => undefined,
    },
    errors
  );

  await assert.doesNotReject(installPromise);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][1], '/ml-weights.json.gz');
});

test('hashed application assets are part of the required offline shell', async () => {
  const addAllCalls = [];
  const installPromise = installPromiseFor({
    add: async () => undefined,
    addAll: async assets => addAllCalls.push(Array.from(assets)),
    match: async () =>
      new Response(
        '<link rel="modulepreload" href="/assets/animation-123.js">' +
          '<link rel="stylesheet" href="/assets/index-123.css">' +
          '<script type="module" src="/assets/index-456.js"></script>'
      ),
    put: async () => undefined,
  });

  await assert.doesNotReject(installPromise);
  assert.deepEqual(addAllCalls[1], [
    '/assets/animation-123.js',
    '/assets/index-123.css',
    '/assets/index-456.js',
  ]);
});

test('health and API requests bypass the cache', () => {
  let fetchHandler;
  const self = {
    addEventListener(type, handler) {
      if (type === 'fetch') fetchHandler = handler;
    },
    clients: { claim: async () => undefined },
    location: { origin: 'https://gameofur.org' },
  };

  vm.runInNewContext(createServiceWorkerSource('test-release'), {
    URL,
    Response,
    caches: {},
    console,
    fetch,
    self,
  });

  assert.ok(fetchHandler);
  for (const pathname of ['/healthz', '/api/usage']) {
    let intercepted = false;
    fetchHandler({
      request: new Request(`https://gameofur.org${pathname}`),
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, `${pathname} should remain network-only`);
  }
});
