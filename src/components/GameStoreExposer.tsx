'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/lib/game-store';

declare global {
  interface Window {
    useGameStore: typeof useGameStore;
  }
}

export default function GameStoreExposer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      window.useGameStore = useGameStore;
    }
  }, []);

  return null;
}
