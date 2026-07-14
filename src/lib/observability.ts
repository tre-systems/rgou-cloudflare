import type { ErrorEvent } from '@sentry/browser';

const SENSITIVE_KEYS = /authorization|board|cookie|diagnostics|gameState|history|moves|token/i;
let sentryPromise: Promise<typeof import('@sentry/browser')> | null = null;

function loadSentry() {
  sentryPromise ??= import('@sentry/browser');
  return sentryPromise;
}

export function sanitizeErrorEvent(event: ErrorEvent): ErrorEvent {
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
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  void loadSentry()
    .then(Sentry => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
        release: import.meta.env.VITE_SENTRY_RELEASE,
        sendDefaultPii: false,
        tracesSampleRate: import.meta.env.PROD ? 0.01 : 0,
        beforeSend: sanitizeErrorEvent,
      });
    })
    .catch(error => {
      console.error('Failed to initialize error monitoring:', error);
    });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  void loadSentry()
    .then(Sentry => {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    })
    .catch(loadError => {
      console.error('Failed to report error:', loadError);
    });
}
