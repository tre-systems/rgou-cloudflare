import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AISource } from './types';

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

export function getAIName(aiSource: AISource | null): string {
  if (!aiSource) return 'Unknown';
  switch (aiSource) {
    case 'classic':
      return 'Classic';
    case 'ml':
      return 'ML AI';
    case 'oracle':
      return 'Oracle AI';
    case 'heuristic':
      return 'Heuristic';
    default:
      return 'Unknown';
  }
}

export const isDevelopment = () => import.meta.env.DEV || import.meta.env.VITE_E2E === 'true';
