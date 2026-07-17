import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  activateWaitingServiceWorker,
  checkForServiceWorkerUpdate,
  installUpdateCheckTriggers,
  shouldCheckForUpdate,
} from '../service-worker-update';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('service worker updates', () => {
  it('debounces frequent checks', () => {
    expect(shouldCheckForUpdate(1_000, 0)).toBe(true);
    expect(shouldCheckForUpdate(61_000, 1_000)).toBe(true);
    expect(shouldCheckForUpdate(60_999, 1_000)).toBe(false);
  });

  it('bypasses browser caches before updating', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', {status: 200}));
    const update = vi.fn().mockResolvedValue(undefined);

    await checkForServiceWorkerUpdate({
      registration: {update} as unknown as ServiceWorkerRegistration,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      '/sw.js',
      expect.objectContaining({cache: 'no-store'})
    );
    expect(update).toHaveBeenCalledOnce();
  });

  it('checks when a visible app returns to the foreground', () => {
    const check = vi.fn();
    Object.defineProperty(document, 'visibilityState', {value: 'visible', configurable: true});
    Object.defineProperty(navigator, 'onLine', {value: true, configurable: true});
    const cleanup = installUpdateCheckTriggers({check});

    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(check).toHaveBeenCalledTimes(3);
    cleanup();
  });

  it('activates the selected waiting worker and reloads', () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const worker = new EventTarget() as ServiceWorker;
    const serviceWorkerContainer = new EventTarget();
    Object.defineProperty(worker, 'state', {value: 'installed', configurable: true});
    worker.postMessage = vi.fn();

    activateWaitingServiceWorker({
      worker,
      reload,
      serviceWorkerContainer,
    });
    expect(worker.postMessage).toHaveBeenCalledWith({type: 'SKIP_WAITING'});

    vi.advanceTimersByTime(4_000);
    expect(reload).toHaveBeenCalledOnce();
  });
});
