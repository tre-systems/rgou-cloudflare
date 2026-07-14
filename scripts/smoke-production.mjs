const origin = 'https://gameofur.org';
const expectedRelease = process.env.EXPECTED_RELEASE?.trim();
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

const redirect = await fetch('https://gameofur.net/offline?source=smoke', { redirect: 'manual' });
if (
  redirect.status !== 301 ||
  redirect.headers.get('location') !== `${origin}/offline?source=smoke`
) {
  throw new Error('Canonical redirect smoke check failed');
}
console.log('Canonical redirect smoke check passed');
