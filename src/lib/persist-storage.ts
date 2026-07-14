import type { StateStorage } from 'zustand/middleware';
import {
  GameStateSchema,
  GameStatsSchema,
  PersistedGameStateSchema,
  type GameState,
  type GameStats,
} from './schemas';
import { materializeGameState } from './game-logic';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const LEGACY_PLAYER_ID_KEY = 'rgou-player-id';

export function getBrowserStorage(): StateStorage {
  if (typeof window === 'undefined' || !window.localStorage) {
    return noopStorage;
  }

  return window.localStorage;
}

export function removeLegacyPlayerIdentity(): void {
  getBrowserStorage().removeItem(LEGACY_PLAYER_ID_KEY);
}

export function parsePersistedGameState(value: unknown): GameState | null {
  const result = PersistedGameStateSchema.safeParse(value);
  if (!result.success) return null;

  try {
    return GameStateSchema.parse(materializeGameState(result.data));
  } catch {
    return null;
  }
}

export function parsePersistedGameStats(value: unknown): GameStats | null {
  const result = GameStatsSchema.safeParse(value);
  return result.success ? result.data : null;
}
