import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cn, getPlayerId, isProduction, isDevelopment, isLocalDevelopment, batch } from '../utils';

describe('utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
      expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
    });

    it('should handle complex combinations', () => {
      expect(
        cn(
          'base-class',
          ['array-class1', 'array-class2'],
          { 'object-class1': true, 'object-class2': false },
          'final-class'
        )
      ).toBe('base-class array-class1 array-class2 object-class1 final-class');
    });
  });

  describe('getPlayerId', () => {
    let localStorageMock: any;
    beforeEach(() => {
      localStorageMock = (function () {
        let store: Record<string, string> = {};
        return {
          getItem(key: string) {
            return store[key] || null;
          },
          setItem(key: string, value: string) {
            store[key] = value;
          },
          removeItem(key: string) {
            delete store[key];
          },
          clear() {
            store = {};
          },
        };
      })();
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      localStorage.clear();
    });

    it('should return existing player ID from localStorage', () => {
      const existingId = 'player_1234567890_abc123';
      localStorage.setItem('rgou-player-id', existingId);

      const result = getPlayerId();
      expect(result).toBe(existingId);
    });

    it('should generate new player ID when none exists', () => {
      localStorage.removeItem('rgou-player-id');
      const result = getPlayerId();
      expect(result).toMatch(/^player_\d+_[a-z0-9]{9}$/);
      expect(localStorage.getItem('rgou-player-id')).toBe(result);
    });

    it('should return different IDs for different calls when no existing ID', () => {
      localStorage.removeItem('rgou-player-id');
      const id1 = getPlayerId();
      localStorage.removeItem('rgou-player-id');
      const id2 = getPlayerId();
      expect(id1).not.toBe(id2);
    });

    it('should return "unknown" when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = getPlayerId();
      expect(result).toBe('unknown');

      global.window = originalWindow;
    });
  });

  describe('isProduction', () => {
    it('should return true for production environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'production';

      const result = isProduction();
      expect(result).toBe(true);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return false for non-production environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'development';

      const result = isProduction();
      expect(result).toBe(false);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return true for production hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'rgou.tre.systems' },
        writable: true,
      });

      expect(isProduction()).toBe(true);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.rgou.tre.systems' },
        writable: true,
      });

      expect(isProduction()).toBe(true);

      (window as any).location = originalLocation;
    });

    it('should return false for non-production hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      expect(isProduction()).toBe(false);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      expect(isProduction()).toBe(false);

      (window as any).location = originalLocation;
    });
  });

  describe('isDevelopment', () => {
    it('should return true for development environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'development';

      const result = isDevelopment();
      expect(result).toBe(true);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return false for non-development environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'production';

      const result = isDevelopment();
      expect(result).toBe(false);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return true for development hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      expect(isDevelopment()).toBe(true);

      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1' },
        writable: true,
      });

      expect(isDevelopment()).toBe(true);

      (window as any).location = originalLocation;
    });

    it('should return false for non-development hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'rgou.tre.systems' },
        writable: true,
      });

      expect(isDevelopment()).toBe(false);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      expect(isDevelopment()).toBe(false);

      (window as any).location = originalLocation;
    });
  });

  describe('isLocalDevelopment', () => {
    it('should return true for development environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'development';

      const result = isLocalDevelopment();
      expect(result).toBe(true);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return false for non-development environment when window is undefined', () => {
      const originalWindow = global.window;
      const originalEnv = process.env.NODE_ENV;

      delete (global as any).window;
      (process.env as any).NODE_ENV = 'production';

      const result = isLocalDevelopment();
      expect(result).toBe(false);

      global.window = originalWindow;
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return true for local development hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      expect(isLocalDevelopment()).toBe(true);

      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1' },
        writable: true,
      });

      expect(isLocalDevelopment()).toBe(true);

      (window as any).location = originalLocation;
    });

    it('should return false for non-local development hostnames', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'rgou.tre.systems' },
        writable: true,
      });

      expect(isLocalDevelopment()).toBe(false);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      expect(isLocalDevelopment()).toBe(false);

      (window as any).location = originalLocation;
    });
  });

  describe('batch', () => {
    it('should batch array into specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = batch(array, 3);

      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8],
      ]);
    });

    it('should handle empty array', () => {
      const result = batch([], 3);
      expect(result).toEqual([]);
    });

    it('should handle array smaller than batch size', () => {
      const result = batch([1, 2], 5);
      expect(result).toEqual([[1, 2]]);
    });

    it('should handle array exactly matching batch size', () => {
      const result = batch([1, 2, 3], 3);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle batch size of 1', () => {
      const result = batch([1, 2, 3], 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should handle batch size larger than array', () => {
      const result = batch([1, 2, 3], 10);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should work with different data types', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const result = batch(array, 2);
      expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      batch(original, 2);
      expect(original).toEqual(copy);
    });
  });
});
