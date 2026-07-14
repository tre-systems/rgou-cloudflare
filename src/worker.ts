import { getCanonicalRedirectUrl } from './lib/canonical-host';
import { parseUsageEvent, usageDataPoint } from './lib/usage';

const MAX_USAGE_BODY_BYTES = 256;
const APP_RELEASE = import.meta.env.VITE_SENTRY_RELEASE || 'development';
const SECURITY_HEADERS = {
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

interface AnalyticsEngineDataset {
  writeDataPoint(point: ReturnType<typeof usageDataPoint>): void;
}

export interface Env {
  ASSETS: Fetcher;
  APP_USAGE?: AnalyticsEngineDataset;
}

function textResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function healthResponse(request: Request): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return textResponse(405, 'Method not allowed');
  }

  const body =
    request.method === 'HEAD' ? null : JSON.stringify({ status: 'ok', release: APP_RELEASE });
  return new Response(body, {
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-App-Release': APP_RELEASE,
    },
  });
}

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid request');

  const decoder = new TextDecoder();
  let body = '';
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_USAGE_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('Payload too large');
    }
    body += decoder.decode(value, { stream: true });
  }
  return JSON.parse(body + decoder.decode()) as unknown;
}

async function recordUsage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return textResponse(405, 'Method not allowed');
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return textResponse(403, 'Forbidden');
  }
  const mediaType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return textResponse(415, 'Unsupported media type');
  }
  const contentEncoding = request.headers.get('Content-Encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    return textResponse(415, 'Unsupported content encoding');
  }
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_USAGE_BODY_BYTES) {
    return textResponse(413, 'Payload too large');
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    return textResponse(error instanceof RangeError ? 413 : 400, 'Invalid request');
  }

  const event = parseUsageEvent(body);
  if (!event) return textResponse(400, 'Invalid request');
  if (!env.APP_USAGE) return textResponse(503, 'Usage reporting unavailable');

  try {
    env.APP_USAGE.writeDataPoint(usageDataPoint(event));
    return textResponse(202, 'Accepted');
  } catch {
    return textResponse(503, 'Usage reporting unavailable');
  }
}

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    const redirectUrl = getCanonicalRedirectUrl(request.url);
    if (redirectUrl) {
      return new Response(null, {
        status: 301,
        headers: { ...SECURITY_HEADERS, Location: redirectUrl },
      });
    }

    const pathname = new URL(request.url).pathname;
    if (pathname === '/healthz') return healthResponse(request);
    if (pathname === '/api/usage') return recordUsage(request, env);
    return env.ASSETS.fetch(request);
  },
};
