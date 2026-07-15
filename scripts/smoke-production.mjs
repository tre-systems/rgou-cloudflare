import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const origin = 'https://gameofur.org';
const securityHeaders = {
  'content-security-policy': "frame-ancestors 'none'",
  'cross-origin-resource-policy': 'same-origin',
  'permissions-policy': 'geolocation=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};
const checks = [
  {
    path: '/',
    type: 'text/html',
    includes: '<div id="root"></div>',
    headers: securityHeaders,
  },
  { path: '/manifest.json', type: 'application/json', includes: 'Royal Game of Ur' },
  { path: '/wasm/rgou_ai_worker_bg.wasm', type: 'application/wasm' },
  { path: '/ml-weights.json.gz', type: 'application/gzip' },
  { path: '/oracle-weights.json.gz', type: 'application/gzip' },
];
const propagationAttempts = 20;

const pause = () => new Promise(resolve => setTimeout(resolve, 3_000));

export async function waitFor(
  check,
  { attempts = propagationAttempts, fetchImpl = fetch, pauseImpl = pause } = {}
) {
  let detail = 'No response';
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(`${origin}${check.path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      const contentType = response.headers.get('content-type') ?? '';
      const body = check.includes ? await response.text() : '';
      const headersMatch = Object.entries(check.headers ?? {}).every(([name, expected]) =>
        response.headers.get(name)?.includes(expected)
      );
      if (
        response.ok &&
        contentType.includes(check.type) &&
        (!check.includes || body.includes(check.includes)) &&
        headersMatch
      ) {
        console.log(`Smoke check passed: ${check.path}`);
        return;
      }
      const missingHeaders = Object.entries(check.headers ?? {})
        .filter(([name, expected]) => !response.headers.get(name)?.includes(expected))
        .map(([name]) => name);
      detail = `${response.status} ${contentType}${
        missingHeaders.length > 0 ? `; missing headers: ${missingHeaders.join(', ')}` : ''
      }`;
    } catch (error) {
      detail = String(error);
    }
    if (attempt < attempts - 1) await pauseImpl();
  }
  throw new Error(`Smoke check failed for ${check.path}: ${detail}`);
}

export function getConfiguredAliases(wranglerConfig) {
  const canonicalHostname = new URL(origin).hostname;
  const routeHostnames = Array.from(
    wranglerConfig.matchAll(/^\s*pattern\s*=\s*"([^/"]+)\/\*"\s*$/gm),
    match => match[1]
  );

  return [...new Set(routeHostnames)].filter(hostname => hostname !== canonicalHostname);
}

export async function checkCanonicalRedirect(
  alias,
  { fetchImpl = fetch, logger = console, probePath = '/offline?source=smoke&mode=alias' } = {}
) {
  const requestUrl = `https://${alias}${probePath}`;
  const expectedLocation = `${origin}${probePath}`;
  const response = await fetchImpl(requestUrl, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });
  const actualLocation = response.headers.get('location');

  if (response.status !== 301 || actualLocation !== expectedLocation) {
    throw new Error(
      `Canonical redirect smoke check failed for ${alias}: expected 301 ${expectedLocation}, ` +
        `received ${response.status} ${actualLocation ?? '(missing Location header)'}`
    );
  }

  logger.log(`Canonical redirect smoke check passed: ${alias}`);
}

export async function checkConfiguredCanonicalRedirects(wranglerConfig, options) {
  const aliases = getConfiguredAliases(wranglerConfig);
  if (aliases.length === 0) {
    throw new Error('Canonical redirect smoke check failed: wrangler.toml declares no aliases');
  }

  await Promise.all(aliases.map(alias => checkCanonicalRedirect(alias, options)));
}

export async function runProductionSmoke() {
  const expectedRelease = process.env.EXPECTED_RELEASE?.trim();

  await Promise.all(checks.map(waitFor));

  if (expectedRelease) {
    await waitFor({
      path: '/healthz',
      type: 'application/json',
      includes: `"release":"${expectedRelease}"`,
    });
    console.log(`Release identity smoke check passed: ${expectedRelease}`);
  } else {
    console.warn('Release identity smoke check skipped: EXPECTED_RELEASE is not set');
  }

  const invalidUsage = await fetch(`${origin}/api/usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ event: 'page_view' }),
    signal: AbortSignal.timeout(10_000),
  });
  if (invalidUsage.status !== 400)
    throw new Error(`Usage validation failed: ${invalidUsage.status}`);
  console.log('Usage validation smoke check passed');

  const wranglerConfig = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  await checkConfiguredCanonicalRedirects(wranglerConfig);
}

export async function runProductionSmokeCli({
  run = runProductionSmoke,
  logger = console,
  exit = process.exit,
} = {}) {
  try {
    await run();
    exit(0);
  } catch (error) {
    logger.error(error);
    exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runProductionSmokeCli();
}
