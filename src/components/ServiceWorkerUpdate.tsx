import { useEffect, useState } from 'react';

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;

    void navigator.serviceWorker
      .register('/sw.js')
      .then(async registration => {
        if (!active) return;
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller)
              setWaiting(worker);
          });
        });
        await registration.update();
      })
      .catch(error => console.warn('Service worker registration failed:', error));

    return () => {
      active = false;
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
      className="fixed top-4 left-1/2 z-[10000] -translate-x-1/2 rounded-2xl bg-slate-800 px-6 py-4 text-white shadow-2xl"
      role="status"
    >
      <p className="mb-3">A new version is available.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-sky-500 px-4 py-2 font-semibold"
        >
          Update now
        </button>
        <button type="button" onClick={() => setWaiting(null)} className="px-3 py-2 underline">
          Later
        </button>
      </div>
    </aside>
  );
}
