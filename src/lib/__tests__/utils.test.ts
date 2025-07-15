import { describe, it, expect, afterEach, vi } from 'vitest';
import { cn, getPlayerId, isProduction, isDevelopment, batch } from '../utils';

describe('utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('getPlayerId', () => {
    it('should return existing player ID from localStorage', () => {
      const existingId = 'player_1234567890_abc123';
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(existingId),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      const result = getPlayerId();
      expect(result).toBe(existingId);
    });

    it('should generate new player ID when none exists', () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      const result = getPlayerId();
      expect(result).toMatch(/^player_\d+_[a-z0-9]{9}$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rgou-player-id', result);
    });

    it('should return "unknown" when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const result = getPlayerId();
      expect(result).toBe('unknown');
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production and window is undefined', () => {
      vi.stubGlobal('window', undefined);
      vi.stubEnv('NODE_ENV', 'production');
      expect(isProduction()).toBe(true);
    });

    it('should return true for production hostnames', () => {
      const location = new URL('https://rgou.tre.systems');
      vi.stubGlobal('location', location);
      expect(isProduction()).toBe(true);
    });

    it('should return false for non-production hostnames', () => {
      const location = new URL('http://localhost');
      vi.stubGlobal('location', location);
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development and window is undefined', () => {
      vi.stubGlobal('window', undefined);
      vi.stubEnv('NODE_ENV', 'development');
      expect(isDevelopment()).toBe(true);
    });

    it('should return true for localhost', () => {
      const location = new URL('http://localhost');
      vi.stubGlobal('location', location);
      expect(isDevelopment()).toBe(true);
    });

    it('should return true for 127.0.0.1', () => {
      const location = new URL('http://127.0.0.1');
      vi.stubGlobal('location', location);
      expect(isDevelopment()).toBe(true);
    });

    it('should return false for production hostname', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const location = new URL('https://rgou.tre.systems');
      vi.stubGlobal('location', location);
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('batch', () => {
    it('should batch items correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      expect(batch(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });
  });
});
