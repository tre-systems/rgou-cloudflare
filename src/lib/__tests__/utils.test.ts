import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, getAIName, getAISubtitle, isDevelopment } from '../utils';

describe('Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    it('should detect production environment', () => {
      vi.stubGlobal('window', undefined);
      vi.stubEnv('NODE_ENV', 'production');
      expect(isDevelopment()).toBe(false);
    });

    it('should detect development environment', () => {
      vi.stubGlobal('window', { location: { hostname: 'localhost' } });
      vi.stubEnv('NODE_ENV', 'development');
      expect(isDevelopment()).toBe(true);
    });
  });
});
