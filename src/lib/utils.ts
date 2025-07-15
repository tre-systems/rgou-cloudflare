import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PLAYER_ID_KEY = 'rgou-player-id';

export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  let playerId = localStorage.getItem(PLAYER_ID_KEY);

  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

export function getAIName(aiSource: 'server' | 'client' | 'ml' | 'fallback' | null): string {
  if (!aiSource) return 'Unknown';
  switch (aiSource) {
    case 'client':
      return 'Expectiminimax';
    case 'ml':
      return 'ML AI';
    case 'server':
      return 'Server AI';
    case 'fallback':
      return 'Fallback';
    default:
      return 'Unknown';
  }
}

export const isProduction = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production';
  }

  const hostname = window.location.hostname;
  return hostname === 'rgou.tre.systems' || hostname === 'www.rgou.tre.systems';
};

export const isDevelopment = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export function isLocalDevelopment() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function batch<T>(array: T[], size: number): T[][] {
  const batched: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batched.push(array.slice(i, i + size));
  }
  return batched;
}
