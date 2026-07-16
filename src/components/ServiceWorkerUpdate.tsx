import { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const handleStateChange = () => {
      if (active && installingWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        setWaiting(installingWorker);
      }
    };

    const handleUpdateFound = () => {
      installingWorker?.removeEventListener('statechange', handleStateChange);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener('statechange', handleStateChange);
    };

    void navigator.serviceWorker
      .register('/sw.js')
      .then(async currentRegistration => {
        if (!active) return;
        registration = currentRegistration;
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', handleUpdateFound);
        await registration.update();
      })
      .catch(error => console.warn('Service worker registration failed:', error));

    return () => {
      active = false;
      registration?.removeEventListener('updatefound', handleUpdateFound);
      installingWorker?.removeEventListener('statechange', handleStateChange);
    };
  }, []);

  const applyUpdate = () => {
    if (!waiting || isApplying) return;

    setIsApplying(true);
    const reload = () => window.location.reload();
    const fallback = window.setTimeout(reload, 4_000);
    const handleControllerChange = () => {
      window.clearTimeout(fallback);
      reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waiting) return null;

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
            setWaiting(null);
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
