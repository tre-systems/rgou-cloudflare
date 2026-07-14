import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, getPlayerId, getAIName, getAISubtitle, isDevelopment } from '../utils';

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

  describe('getPlayerId', () => {
    it('should return existing player ID from localStorage', () => {
      const existingId = 'player_1234567890_abc123';
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(existingId),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      vi.stubGlobal('window', { localStorage: localStorageMock });
      const result = getPlayerId();
      expect(result).toBe(existingId);
    });

    it('should generate new player ID when none exists', () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      vi.stubGlobal('window', { localStorage: localStorageMock });
      const result = getPlayerId();
      expect(result).toMatch(/^player_[0-9a-f-]{36}$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rgou-player-id', result);
    });

    it('should replace an invalid stored player ID', () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('invalid player id'),
        setItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      vi.stubGlobal('window', { localStorage: localStorageMock });

      const result = getPlayerId();

      expect(result).toMatch(/^player_[0-9a-f-]{36}$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rgou-player-id', result);
    });

    it('should return "unknown" when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const result = getPlayerId();
      expect(result).toBe('unknown');
    });
  });

  describe('getAIName and getAISubtitle', () => {
    it('should return correct AI names and subtitles', () => {
      expect(getAIName('client')).toBe('Classic');
      expect(getAISubtitle('client')).toBe('Expectiminimax algorithm');

      expect(getAIName('ml')).toBe('ML AI');
      expect(getAISubtitle('ml')).toBe('Neural network model');

      expect(getAIName('server')).toBe('Server AI');
      expect(getAISubtitle('server')).toBe('');

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
