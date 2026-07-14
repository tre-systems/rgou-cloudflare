import type { ErrorEvent } from '@sentry/browser';
import { describe, expect, it } from 'vitest';
import { sanitizeErrorEvent } from '../observability';

describe('observability privacy filter', () => {
  it('removes identity, request data, query strings, and sensitive context', () => {
    const event = {
      user: { id: 'private' },
      request: {
        cookies: { session: 'private' },
        data: { board: 'private' },
        query_string: 'token=private',
        url: 'https://gameofur.org/play?token=private',
        headers: { Authorization: 'private', Accept: 'application/json' },
      },
      extra: {
        gameState: { history: [] },
        operation: 'ai-move',
        nested: { token: 'private', url: 'https://gameofur.org/play?secret=value' },
      },
      contexts: { state: { board: ['private'] } },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/?secret=value', to: '/play?secret=value' } },
      ],
    } as unknown as ErrorEvent;

    expect(sanitizeErrorEvent(event)).toEqual({
      request: {
        url: 'https://gameofur.org/play',
        headers: { Authorization: '[Filtered]', Accept: 'application/json' },
      },
      extra: {
        gameState: '[Filtered]',
        operation: 'ai-move',
        nested: { token: '[Filtered]', url: 'https://gameofur.org/play' },
      },
      contexts: { state: { board: '[Filtered]' } },
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: '/', to: '/play' },
        },
      ],
    });
  });

  it('drops malformed request URLs', () => {
    const event = { type: undefined, request: { url: 'not a URL' } } as ErrorEvent;

    expect(sanitizeErrorEvent(event).request).not.toHaveProperty('url');
  });
});
