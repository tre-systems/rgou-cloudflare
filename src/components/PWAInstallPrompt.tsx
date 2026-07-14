import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let promptTimeoutId: number | undefined;

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);

      window.clearTimeout(promptTimeoutId);
      promptTimeoutId = window.setTimeout(() => {
        if (!localStorage.getItem(DISMISSED_KEY)) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.clearTimeout(promptTimeoutId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="surface-panel rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="h-5 w-5 text-brass" />
              <h3 className="text-sm font-semibold text-bone">Install Game of Ur</h3>
            </div>
            <p className="mb-3 text-xs text-bone-muted">
              Add it to your home screen for quick access and offline play.
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="rounded bg-brass px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-brass-light"
              >
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-bone-muted transition-colors hover:bg-surface-raised hover:text-bone"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted transition-colors hover:text-bone"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
