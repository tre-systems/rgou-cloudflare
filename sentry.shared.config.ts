import type { ErrorEvent, EventHint } from '@sentry/nextjs';

const SENSITIVE_EXTRA_KEYS = [
  'apiKey',
  'authorization',
  'board',
  'cookie',
  'diagnostics',
  'gameState',
  'history',
  'moves',
  'prompt',
  'requestBody',
  'response',
  'stats',
  'text',
  'token',
];

function redactHeaders(headers: Record<string, string> | undefined) {
  if (!headers) {
    return headers;
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('authorization') || lowerKey.includes('cookie')) {
        return [key, '[Filtered]'];
      }
      return [key, value];
    })
  );
}

export function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request) {
    const headers = redactHeaders(event.request.headers);
    if (headers) {
      event.request.headers = headers;
    } else {
      delete event.request.headers;
    }
    delete event.request.cookies;
    delete event.request.data;
  }

  if (event.extra) {
    for (const key of SENSITIVE_EXTRA_KEYS) {
      if (key in event.extra) {
        event.extra[key] = '[Filtered]';
      }
    }
  }

  return event;
}

export function tracesSampleRate(): number {
  return process.env.SENTRY_ENVIRONMENT === 'production' ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === 'production'
    ? 0.01
    : 0;
}
