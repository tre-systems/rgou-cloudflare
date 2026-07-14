import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { createServiceWorkerSource, findBuildAssets } from './generate-sw.js';

function installPromiseFor(cache, errors = [], buildAssets = []) {
  let installHandler;
  let installPromise;
  const self = {
    addEventListener(type, handler) {
      if (type === 'install') installHandler = handler;
    },
    clients: { claim: async () => undefined },
    location: { origin: 'https://gameofur.org' },
  };

  vm.runInNewContext(createServiceWorkerSource('test-release', buildAssets), {
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

test('production precache includes lazy build chunks and excludes source maps', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rgou-sw-'));
  const assetDir = path.join(root, 'assets');
  fs.mkdirSync(path.join(assetDir, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(assetDir, 'index-123.js'), '');
  fs.writeFileSync(path.join(assetDir, 'prod-456.js'), '');
  fs.writeFileSync(path.join(assetDir, 'nested', 'worker-789.js'), '');
  fs.writeFileSync(path.join(assetDir, 'prod-456.js.map'), '');

  try {
    const buildAssets = findBuildAssets(assetDir);
    assert.deepEqual(buildAssets, [
      '/assets/index-123.js',
      '/assets/nested/worker-789.js',
      '/assets/prod-456.js',
    ]);

    const addAllCalls = [];
    const installPromise = installPromiseFor(
      {
        add: async () => undefined,
        addAll: async assets => addAllCalls.push(Array.from(assets)),
        match: async () =>
          new Response('<script type="module" src="/assets/index-123.js"></script>'),
        put: async () => undefined,
      },
      [],
      buildAssets
    );

    await assert.doesNotReject(installPromise);
    assert.deepEqual(addAllCalls[1], buildAssets);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
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
