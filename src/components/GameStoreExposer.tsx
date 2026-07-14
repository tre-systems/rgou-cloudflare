import { useEffect } from 'react';
import { useGameStore } from '@/lib/game-store';

declare global {
  interface Window {
    useGameStore: typeof useGameStore;
  }
}

export default function GameStoreExposer() {
  useEffect(() => {
    if (
      (import.meta.env.DEV || import.meta.env['VITE_E2E'] === 'true') &&
      typeof window !== 'undefined'
    ) {
      window.useGameStore = useGameStore;
    }
  }, []);

  return null;
}
