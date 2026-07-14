import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    let timer: number | undefined;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowStatus(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShowStatus(false), 3000);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.clearTimeout(timer);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      className="surface-panel fixed left-4 top-4 z-50 flex items-center justify-center rounded-full p-2 transition-all duration-300"
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <Wifi className="h-5 w-5 text-lapis-light" aria-hidden="true" />
      ) : (
        <WifiOff className="h-5 w-5 text-clay-light" aria-hidden="true" />
      )}
      <span className="sr-only">{isOnline ? 'Back online' : 'You are offline'}</span>
    </div>
  );
}
