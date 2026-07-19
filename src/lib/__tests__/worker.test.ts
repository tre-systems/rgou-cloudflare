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

  it('enforces method and media-type boundaries', async () => {
    const environment = env();
    expect(
      (
        await worker.fetch(
          new Request('https://gameofur.org/api/usage', { method: 'GET' }),
          environment
        )
      ).status
    ).toBe(405);
    expect(
      (
        await worker.fetch(
          usageRequest(gameStartedUsage('ml', 'player1'), { 'Content-Type': 'text/plain' }),
          environment
        )
      ).status
    ).toBe(415);
    expect(
      (
        await worker.fetch(
          usageRequest(gameStartedUsage('ml', 'player1'), { 'Content-Encoding': 'gzip' }),
          environment
        )
      ).status
    ).toBe(415);
  });

  it('fails closed when analytics are unavailable', async () => {
    const unavailable = env();
    delete unavailable.APP_USAGE;
    expect(
      (await worker.fetch(usageRequest(gameStartedUsage('watch', 'player2')), unavailable)).status
    ).toBe(503);
  });
});

describe('Worker routing', () => {
  it('redirects aliases and delegates canonical assets', async () => {
    const environment = env();
    const redirect = await worker.fetch(
      new Request('https://www.gameofur.net/offline?source=test'),
      environment
    );
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get('location')).toBe('https://gameofur.org/offline?source=test');

    const legacyPage = await worker.fetch(
      new Request('https://gameofur.org/oracle-ai?source=test'),
      environment
    );
    expect(legacyPage.status).toBe(301);
    expect(legacyPage.headers.get('location')).toBe('https://gameofur.org/ai?source=test');

    const request = new Request('https://gameofur.org/manifest.json');
    const asset = await worker.fetch(request, environment);
    expect(await asset.text()).toBe('asset');
    expect(environment.ASSETS.fetch).toHaveBeenCalledWith(request);
  });

  it('rejects scanner paths before the SPA fallback', async () => {
    const environment = env();

    for (const url of [
      'https://gameofur.org/.env',
      'https://gameofur.org/wp-admin/css/wp-login.php',
      'https://gameofur.org/serviceAccountKey.json',
      'https://rgou.tre.systems/.git/config',
    ]) {
      const response = await worker.fetch(new Request(url), environment);
      expect(response.status).toBe(404);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }

    expect(environment.ASSETS.fetch).not.toHaveBeenCalled();
  });
});

describe('health Worker endpoint', () => {
  it('exposes a non-cacheable release identity', async () => {
    const response = await worker.fetch(new Request('https://gameofur.org/healthz'), env());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-app-release')).toBeTruthy();
    expect(response.headers.get('permissions-policy')).toContain('geolocation=()');
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
