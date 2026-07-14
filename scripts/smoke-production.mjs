import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const origin = 'https://gameofur.org';
const checks = [
  { path: '/', type: 'text/html', includes: '<div id="root"></div>' },
  { path: '/manifest.json', type: 'application/json', includes: 'Royal Game of Ur' },
  { path: '/wasm/rgou_ai_worker_bg.wasm', type: 'application/wasm' },
  { path: '/ml-weights.json.gz', type: 'application/gzip' },
];

const pause = () => new Promise(resolve => setTimeout(resolve, 3_000));

async function waitFor(check) {
  let detail = 'No response';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const response = await fetch(`${origin}${check.path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      const contentType = response.headers.get('content-type') ?? '';
      const body = check.includes ? await response.text() : '';
      if (
        response.ok &&
        contentType.includes(check.type) &&
        (!check.includes || body.includes(check.includes))
      ) {
        console.log(`Smoke check passed: ${check.path}`);
        return;
      }
      detail = `${response.status} ${contentType}`;
    } catch (error) {
      detail = String(error);
    }
    await pause();
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
  {
    fetchImpl = fetch,
    logger = console,
    probePath = '/offline?source=smoke&mode=alias',
  } = {}
) {
  const requestUrl = `https://${alias}${probePath}`;
  const expectedLocation = `${origin}${probePath}`;
  const response = await fetchImpl(requestUrl, { redirect: 'manual' });
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

  for (const check of checks) await waitFor(check);

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
  });
  if (invalidUsage.status !== 400) throw new Error(`Usage validation failed: ${invalidUsage.status}`);
  console.log('Usage validation smoke check passed');

  const wranglerConfig = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  await checkConfiguredCanonicalRedirects(wranglerConfig);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runProductionSmoke().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
