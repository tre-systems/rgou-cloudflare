import { MotionConfig } from 'framer-motion';
import AppErrorBoundary from './components/AppErrorBoundary';
import GameStoreExposer from './components/GameStoreExposer';
import NetworkStatus from './components/NetworkStatus';
import OfflinePage from './components/OfflinePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import RoyalGameOfUr from './components/RoyalGameOfUr';
import ServiceWorkerUpdate from './components/ServiceWorkerUpdate';

export default function App() {
  const content =
    window.location.pathname === '/offline' ? (
      <OfflinePage />
    ) : (
      <>
        <GameStoreExposer />
        <RoyalGameOfUr />
      </>
    );

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>{content}</div>
        <PWAInstallPrompt />
        <NetworkStatus />
        <ServiceWorkerUpdate />
      </MotionConfig>
    </AppErrorBoundary>
  );
}
