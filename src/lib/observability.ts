import * as Sentry from '@sentry/browser';
import type { ErrorEvent } from '@sentry/browser';

const SENSITIVE_KEYS = /authorization|board|cookie|diagnostics|gameState|history|moves|token/i;

function beforeSend(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        event.request.url = `${url.origin}${url.pathname}`;
      } catch {
        delete event.request.url;
      }
    }
    event.request.headers = Object.fromEntries(
      Object.entries(event.request.headers ?? {}).map(([key, value]) => [
        key,
        SENSITIVE_KEYS.test(key) ? '[Filtered]' : value,
      ])
    );
  }
  if (event.extra) {
    for (const key of Object.keys(event.extra)) {
      if (SENSITIVE_KEYS.test(key)) event.extra[key] = '[Filtered]';
    }
  }
  return event;
}

export function initializeObservability() {
  const dsn = import.meta.env['VITE_SENTRY_DSN'];
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env['VITE_SENTRY_ENVIRONMENT'] ?? import.meta.env.MODE,
    release: import.meta.env['VITE_SENTRY_RELEASE'],
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.01 : 0,
    beforeSend,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
