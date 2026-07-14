import type { ErrorEvent } from '@sentry/browser';
import { describe, expect, it } from 'vitest';
import { sanitizeErrorEvent } from '../observability';

describe('observability privacy filter', () => {
  it('removes identity, request data, query strings, and sensitive context', () => {
    const event = {
      type: undefined,
      user: { id: 'private' },
      request: {
        cookies: { session: 'private' },
        data: { board: 'private' },
        query_string: 'token=private',
        url: 'https://gameofur.org/play?token=private',
        headers: { Authorization: 'private', Accept: 'application/json' },
      },
      extra: { gameState: { history: [] }, operation: 'ai-move' },
    } as ErrorEvent;

    expect(sanitizeErrorEvent(event)).toEqual({
      request: {
        url: 'https://gameofur.org/play',
        headers: { Authorization: '[Filtered]', Accept: 'application/json' },
      },
      extra: { gameState: '[Filtered]', operation: 'ai-move' },
    });
  });

  it('drops malformed request URLs', () => {
    const event = { type: undefined, request: { url: 'not a URL' } } as ErrorEvent;

    expect(sanitizeErrorEvent(event).request).not.toHaveProperty('url');
  });
});
