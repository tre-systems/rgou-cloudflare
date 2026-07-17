import { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import {
  activateWaitingServiceWorker,
  checkForServiceWorkerUpdate,
  installUpdateCheckTriggers,
  shouldCheckForUpdate,
} from '../lib/service-worker-update';

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isDeferred, setIsDeferred] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    let checking = false;
    let lastCheckAt = 0;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const handleStateChange = () => {
      if (active && installingWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        setWaiting(installingWorker);
        setIsDeferred(false);
      }
    };

    const handleUpdateFound = () => {
      installingWorker?.removeEventListener('statechange', handleStateChange);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener('statechange', handleStateChange);
    };

    const checkForUpdate = async (force = false) => {
      if (
        !active ||
        checking ||
        !registration ||
        !navigator.onLine ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      const now = Date.now();
      if (!force && !shouldCheckForUpdate(now, lastCheckAt)) return;

      checking = true;
      lastCheckAt = now;
      try {
        await checkForServiceWorkerUpdate({registration});
        if (registration.waiting) setWaiting(registration.waiting);
      } catch {
        // Update discovery is best-effort; normal app requests surface connectivity.
      } finally {
        checking = false;
      }
    };
    const removeTriggers = installUpdateCheckTriggers({
      check: () => void checkForUpdate(),
    });

    void navigator.serviceWorker
      .register('/sw.js')
      .then(async currentRegistration => {
        if (!active) return;
        registration = currentRegistration;
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', handleUpdateFound);
        await checkForUpdate(true);
      })
      .catch(error => console.warn('Service worker registration failed:', error));

    return () => {
      active = false;
      removeTriggers();
      registration?.removeEventListener('updatefound', handleUpdateFound);
      installingWorker?.removeEventListener('statechange', handleStateChange);
    };
  }, []);

  const applyUpdate = () => {
    if (!waiting || isApplying) return;

    setIsApplying(true);
    activateWaitingServiceWorker({worker: waiting});
  };

  if (!waiting) return null;

  if (isDeferred) {
    return (
      <button
        type="button"
        onClick={() => setIsDeferred(false)}
        className="surface-panel fixed bottom-4 right-4 z-[10000] rounded-full border-brass/35 px-4 py-2 text-sm font-semibold text-brass-light shadow-xl shadow-black/25"
        aria-label="Update ready. Show update options"
      >
        Update ready
      </button>
    );
  }

  return (
    <aside
      className="surface-panel fixed inset-x-4 top-4 z-[10000] mx-auto max-w-md rounded-2xl border-brass/35 p-3.5 text-bone shadow-xl shadow-black/25 sm:left-auto sm:right-5 sm:mx-0 sm:w-[26rem]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/30 bg-brass/10 text-brass-light">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-bone">Update ready</p>
          <p className="text-xs leading-5 text-bone-muted">
            {isApplying ? 'Restarting with the latest version…' : 'A newer version is ready to use.'}
          </p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          disabled={isApplying}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brass px-3 text-sm font-semibold text-ink transition-colors hover:bg-brass-light disabled:cursor-wait disabled:opacity-75"
        >
          {isApplying && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {isApplying ? 'Updating…' : 'Update'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsApplying(false);
            setIsDeferred(true);
          }}
          disabled={isApplying}
          className="h-9 shrink-0 rounded-lg px-1.5 text-sm font-medium text-bone-muted transition-colors hover:text-bone disabled:cursor-wait disabled:opacity-60"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
