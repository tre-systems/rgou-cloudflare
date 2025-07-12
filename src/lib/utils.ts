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

export const isLocalDevelopment = () => {
  return (
    isDevelopment() ||
    (typeof window !== 'undefined' && window.location.hostname === 'rgou.tre.systems')
  );
};
