import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClassicAIVersion, getMLAIVersion } from '../utils/getAIVersion';
import { getFileHash } from '../utils/getFileHash';
import { getGitCommitHash } from '../utils/getGitCommitHash';
import {
  cn,
  getPlayerId,
  getAIName,
  getAISubtitle,
  isProduction,
  isDevelopment,
  batch,
} from '../utils';

const mockReadFileSync = vi.fn();
const mockCreateHash = vi.fn();
const mockExecSync = vi.fn();

vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
}));

vi.mock('crypto', () => ({
  createHash: mockCreateHash,
}));

vi.mock('child_process', () => ({
  execSync: mockExecSync,
}));

describe('Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window as undefined for Node.js environment
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
      expect(result).toMatch(/^player_\d+_[a-z0-9]{9}$/);
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
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('should detect development environment', () => {
      vi.stubGlobal('window', { location: { hostname: 'localhost' } });
      vi.stubEnv('NODE_ENV', 'development');
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
    });
  });

  describe('batch', () => {
    it('should batch array items correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      expect(batch(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });
  });

  describe('getFileHash', () => {
    it('should generate hash from file content', async () => {
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abc123'),
      };
      mockCreateHash.mockReturnValue(mockHash);
      mockReadFileSync.mockReturnValue('test content');

      const result = await getFileHash('test.txt');
      expect(result).toBe('abc123');
      expect(mockReadFileSync).toHaveBeenCalledWith('test.txt');
    });
  });

  describe('getGitCommitHash', () => {
    it('should return git commit hash', async () => {
      mockExecSync.mockReturnValue(Buffer.from('abc123\n'));

      const result = await getGitCommitHash();
      expect(result).toBe('abc123');
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse HEAD');
    });

    it('should return fallback when git command fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('git not found');
      });

      const result = await getGitCommitHash();
      expect(result).toBe('unknown');
    });
  });

  describe('AI version functions', () => {
    it('should return AI versions', () => {
      expect(getClassicAIVersion()).toBeDefined();
      expect(getMLAIVersion()).toBeDefined();
    });
  });
});
