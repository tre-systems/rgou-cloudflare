import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import AppErrorBoundary from './components/AppErrorBoundary';
import GameStoreExposer from './components/GameStoreExposer';
import NetworkStatus from './components/NetworkStatus';
import OfflinePage from './components/OfflinePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import RoyalGameOfUr from './components/RoyalGameOfUr';
import ServiceWorkerUpdate from './components/ServiceWorkerUpdate';

const OracleAIPage = lazy(() => import('./components/OracleAIPage'));

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const content =
    pathname === '/offline' ? (
      <OfflinePage />
    ) : pathname === '/oracle-ai' ? (
      <Suspense
        fallback={
          <main className="min-h-screen bg-ink" aria-busy="true">
            <span className="sr-only">Loading Oracle AI</span>
          </main>
        }
      >
        <OracleAIPage />
      </Suspense>
    ) : (
      <>
        <GameStoreExposer />
        <RoyalGameOfUr />
      </>
    );

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        {content}
        <PWAInstallPrompt />
        <NetworkStatus />
        <ServiceWorkerUpdate />
      </MotionConfig>
    </AppErrorBoundary>
  );
}
