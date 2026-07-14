import type { StateStorage } from 'zustand/middleware';
import { GameStateSchema, GameStatsSchema, type GameState, type GameStats } from './schemas';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function getBrowserStorage(): StateStorage {
  if (typeof window === 'undefined' || !window.localStorage) {
    return noopStorage;
  }

  return window.localStorage;
}

export function parsePersistedGameState(value: unknown): GameState | null {
  const result = GameStateSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parsePersistedGameStats(value: unknown): GameStats | null {
  const result = GameStatsSchema.safeParse(value);
  return result.success ? result.data : null;
}
