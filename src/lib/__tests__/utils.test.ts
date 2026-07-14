import { afterEach, describe, expect, it, vi } from 'vitest';
import { cn, getAIName, getAISubtitle, isDevelopment } from '../utils';

describe('Utils', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('cn', () => {
    it('should merge class names and handle conflicts', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });

  describe('getAIName and getAISubtitle', () => {
    it('should return correct AI names and subtitles', () => {
      expect(getAIName('classic')).toBe('Classic');
      expect(getAISubtitle('classic')).toBe('Expectiminimax algorithm');

      expect(getAIName('ml')).toBe('ML AI');
      expect(getAISubtitle('ml')).toBe('Neural network model');

      expect(getAIName('fallback')).toBe('Fallback');
      expect(getAISubtitle('fallback')).toBe('');

      expect(getAIName(null)).toBe('Unknown');
      expect(getAISubtitle(null)).toBe('');
    });
  });

  describe('environment detection', () => {
    it('detects production and explicit end-to-end builds', () => {
      vi.stubEnv('DEV', false);
      expect(isDevelopment()).toBe(false);

      vi.stubEnv('VITE_E2E', 'true');
      expect(isDevelopment()).toBe(true);
    });
  });
});
