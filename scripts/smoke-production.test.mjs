import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  checkCanonicalRedirect,
  checkConfiguredCanonicalRedirects,
  getConfiguredAliases,
  runProductionSmokeCli,
  waitFor,
} from './smoke-production.mjs';

const expectedAliases = [
  'rgou.tre.systems',
  'www.gameofur.org',
  'gameofur.net',
  'www.gameofur.net',
];
const probePath = '/offline?source=smoke&mode=alias';

test('discovers every configured non-canonical Cloudflare route', async () => {
  const wranglerConfig = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.deepEqual(getConfiguredAliases(wranglerConfig), expectedAliases);
});

test('checks every configured alias while preserving the path and query', async () => {
  const wranglerConfig = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const requests = [];
  const messages = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(null, {
      status: 301,
      headers: { Location: `https://gameofur.org${new URL(url).pathname}${new URL(url).search}` },
    });
  };

  await checkConfiguredCanonicalRedirects(wranglerConfig, {
    fetchImpl,
    logger: { log: message => messages.push(message) },
    probePath,
  });

  assert.deepEqual(
    requests.map(request => request.url),
    expectedAliases.map(alias => `https://${alias}${probePath}`)
  );
  assert.ok(requests.every(request => request.options.redirect === 'manual'));
  assert.deepEqual(
    messages,
    expectedAliases.map(alias => `Canonical redirect smoke check passed: ${alias}`)
  );
});

test('reports the failing alias and redirect details', async () => {
  await assert.rejects(
    checkCanonicalRedirect('www.gameofur.net', {
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: 'https://wrong.example/offline' },
        }),
      logger: { log: () => undefined },
      probePath,
    }),
    error => {
      assert.equal(
        error.message,
        'Canonical redirect smoke check failed for www.gameofur.net: ' +
          'expected 301 https://gameofur.org/offline?source=smoke&mode=alias, ' +
          'received 302 https://wrong.example/offline'
      );
      return true;
    }
  );
});

test('does not pass when the deployment declares no aliases', async () => {
  await assert.rejects(
    checkConfiguredCanonicalRedirects('[assets]\ndirectory = "./out/client"'),
    /wrangler\.toml declares no aliases/
  );
});

test('allows time for a release identity to propagate', async () => {
  let attempts = 0;

  await waitFor(
    { path: '/healthz', type: 'application/json', includes: 'current-release' },
    {
      fetchImpl: async () => {
        attempts += 1;
        return Response.json({ release: attempts > 10 ? 'current-release' : 'previous-release' });
      },
      pauseImpl: async () => undefined,
    }
  );

  assert.equal(attempts, 11);
});

test('requires configured response headers', async () => {
  await assert.rejects(
    waitFor(
      {
        path: '/',
        type: 'text/html',
        headers: { 'content-security-policy': "frame-ancestors 'none'" },
      },
      {
        attempts: 1,
        fetchImpl: async () =>
          new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
      }
    ),
    /missing headers: content-security-policy/
  );
});

test('the CLI exits cleanly with the smoke result', async () => {
  const exitCodes = [];
  const errors = [];
  const options = {
    exit: code => exitCodes.push(code),
    logger: { error: error => errors.push(error) },
  };

  await runProductionSmokeCli({ ...options, run: async () => undefined });
  await runProductionSmokeCli({
    ...options,
    run: async () => {
      throw new Error('smoke failed');
    },
  });

  assert.deepEqual(exitCodes, [0, 1]);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /smoke failed/);
});
