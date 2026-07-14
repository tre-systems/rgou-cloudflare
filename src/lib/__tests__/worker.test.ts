import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../../worker';
import { gameStartedUsage } from '../usage';

function env(writeDataPoint = vi.fn()): Env {
  return {
    ASSETS: { fetch: vi.fn(async () => new Response('asset')) } as unknown as Fetcher,
    APP_USAGE: { writeDataPoint },
  };
}

function usageRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://gameofur.org/api/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://gameofur.org',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('usage Worker endpoint', () => {
  it('validates and writes an anonymous event', async () => {
    const writeDataPoint = vi.fn();
    const response = await worker.fetch(
      usageRequest(gameStartedUsage('classic', 'player1')),
      env(writeDataPoint)
    );
    expect(response.status).toBe(202);
    expect(writeDataPoint).toHaveBeenCalledWith({
      indexes: ['rgou'],
      blobs: ['game_started', 'classic', 'human', 'classic', 'player1', ''],
      doubles: [1, 0, 0],
    });
  });

  it('rejects cross-origin, invalid, and oversized payloads', async () => {
    expect(
      (
        await worker.fetch(
          usageRequest(gameStartedUsage('ml', 'player1'), { Origin: 'https://example.com' }),
          env()
        )
      ).status
    ).toBe(403);
    expect((await worker.fetch(usageRequest({ event: 'page_view' }), env())).status).toBe(400);
    expect((await worker.fetch(usageRequest({ value: 'x'.repeat(300) }), env())).status).toBe(413);
  });

  it('fails closed when analytics are unavailable', async () => {
    const unavailable = env();
    delete unavailable.APP_USAGE;
    expect(
      (await worker.fetch(usageRequest(gameStartedUsage('watch', 'player2')), unavailable)).status
    ).toBe(503);
  });
});

describe('health Worker endpoint', () => {
  it('exposes a non-cacheable release identity', async () => {
    const response = await worker.fetch(new Request('https://gameofur.org/healthz'), env());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-app-release')).toBeTruthy();
    expect(await response.json()).toEqual({
      status: 'ok',
      release: response.headers.get('x-app-release'),
    });
  });

  it('supports HEAD and rejects mutation methods', async () => {
    const head = await worker.fetch(
      new Request('https://gameofur.org/healthz', { method: 'HEAD' }),
      env()
    );
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');

    const post = await worker.fetch(
      new Request('https://gameofur.org/healthz', { method: 'POST' }),
      env()
    );
    expect(post.status).toBe(405);
  });
});
