import type { ErrorEvent } from '@sentry/browser';

const SENSITIVE_KEYS =
  /authorization|board|cookie|diagnostics|email|gameState|history|ipAddress|moves|password|referer|referrer|secret|session|token|user/i;
const URL_KEYS = /^(?:from|link|source|to|url)$/i;
const FILTERED = '[Filtered]';
let sentryPromise: Promise<typeof import('@sentry/browser')> | null = null;

function sanitizeUrl(value: string): string {
  try {
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(value);
    const url = new URL(value, window.location.origin);
    return isAbsolute ? `${url.origin}${url.pathname}` : url.pathname;
  } catch {
    return FILTERED;
  }
}

function sanitizeValue(value: unknown, key = '', seen = new WeakSet<object>()): unknown {
  if (SENSITIVE_KEYS.test(key)) return FILTERED;
  if (URL_KEYS.test(key) && typeof value === 'string') return sanitizeUrl(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return FILTERED;

  seen.add(value);
  if (Array.isArray(value)) return value.map(item => sanitizeValue(item, '', seen));

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValue(entryValue, entryKey, seen),
    ])
  );
}

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
        SENSITIVE_KEYS.test(key) ? FILTERED : value,
      ])
    );
  }
  if (event.extra) event.extra = sanitizeValue(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = sanitizeValue(event.contexts) as typeof event.contexts;
  if (event.tags) event.tags = sanitizeValue(event.tags) as typeof event.tags;
  if (event.breadcrumbs) {
    event.breadcrumbs = sanitizeValue(event.breadcrumbs) as typeof event.breadcrumbs;
  }
  return event;
}

export function initializeObservability() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (!navigator.onLine) {
    window.addEventListener('online', initializeObservability, { once: true });
    return;
  }

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
