import { useEffect, useState } from 'react';

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

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

  if (!waiting) return null;

  const applyUpdate = () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <aside
      className="surface-panel fixed left-1/2 top-4 z-[10000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl px-5 py-4 text-[#eee7d8]"
      role="status"
    >
      <p className="mb-3">A new version is available.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-[#c7a65d] px-4 py-2 font-semibold text-[#191a17] hover:bg-[#e2ca91]"
        >
          Update now
        </button>
        <button
          type="button"
          onClick={() => setWaiting(null)}
          className="px-3 py-2 text-[#aca99e] underline underline-offset-4 hover:text-[#eee7d8]"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
