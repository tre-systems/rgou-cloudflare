import { Wifi, WifiOff } from 'lucide-react';
import SiteBackdrop from './SiteBackdrop';

export default function OfflinePage() {
  return (
    <>
      <SiteBackdrop />
      <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="surface-panel mx-auto max-w-md rounded-2xl p-7 text-center sm:p-9">
          <WifiOff className="mx-auto mb-5 h-10 w-10 text-brass" aria-hidden="true" />
          <h1 className="display-title mb-2 text-4xl text-bone">You&apos;re offline</h1>
          <p className="mb-7 text-bone-muted">No internet connection was detected.</p>
          <div className="surface-inset mb-6 rounded-xl p-5">
            <h2 className="mb-2 text-lg font-semibold text-bone">Your game is safe</h2>
            <p className="mb-4 text-sm leading-6 text-bone-muted">
              The board and both AI opponents remain available offline.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted">
              <Wifi className="h-4 w-4" aria-hidden="true" />
              <span>Progress and statistics stay on this device</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-brass bg-brass px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass-light hover:bg-brass-light"
          >
            Try again
          </button>
        </div>
      </main>
    </>
  );
}
