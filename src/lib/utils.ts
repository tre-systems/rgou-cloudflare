import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PLAYER_ID_KEY = 'rgou-player-id';

export function createId(prefix: 'game' | 'player'): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}_${randomId}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  let playerId = localStorage.getItem(PLAYER_ID_KEY);

  if (!playerId || !/^player_[A-Za-z0-9_-]+$/.test(playerId) || playerId.length > 128) {
    playerId = createId('player');
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

export function getAIName(
  aiSource: 'server' | 'client' | 'ml' | 'fallback' | 'heuristic' | null
): string {
  if (!aiSource) return 'Unknown';
  switch (aiSource) {
    case 'client':
      return 'Classic';
    case 'ml':
      return 'ML AI';
    case 'server':
      return 'Server AI';
    case 'fallback':
      return 'Fallback';
    case 'heuristic':
      return 'Heuristic';
    default:
      return 'Unknown';
  }
}

export function getAISubtitle(
  aiSource: 'server' | 'client' | 'ml' | 'fallback' | 'heuristic' | null
): string {
  switch (aiSource) {
    case 'client':
      return 'Expectiminimax algorithm';
    case 'ml':
      return 'Neural network model';
    case 'heuristic':
      return 'Immediate evaluation';
    default:
      return '';
  }
}

export const isDevelopment = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || process.env.NODE_ENV === 'development'
  );
};
