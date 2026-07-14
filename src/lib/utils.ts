import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AIResponse } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: 'game'): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}_${randomId}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getAIName(aiSource: AIResponse['aiType'] | null): string {
  if (!aiSource) return 'Unknown';
  switch (aiSource) {
    case 'classic':
      return 'Classic';
    case 'ml':
      return 'ML AI';
    case 'fallback':
      return 'Fallback';
    case 'heuristic':
      return 'Heuristic';
    default:
      return 'Unknown';
  }
}

export function getAISubtitle(aiSource: AIResponse['aiType'] | null): string {
  switch (aiSource) {
    case 'classic':
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
