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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('getAIName', () => {
    it('should return correct AI names', () => {
      expect(getAIName('client')).toBe('Classic');
      expect(getAIName('ml')).toBe('ML AI');
      expect(getAIName('server')).toBe('Server AI');
      expect(getAIName('fallback')).toBe('Fallback');
      expect(getAIName(null)).toBe('Unknown');
    });
  });

  describe('getAISubtitle', () => {
    it('should return correct AI subtitles', () => {
      expect(getAISubtitle('client')).toBe('Expectiminimax algorithm');
      expect(getAISubtitle('ml')).toBe('Neural network model');
      expect(getAISubtitle('server')).toBe('');
      expect(getAISubtitle('fallback')).toBe('');
      expect(getAISubtitle(null)).toBe('');
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
      vi.stubEnv('NODE_ENV', 'development');
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

describe('getAIVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window as undefined to simulate Node.js environment
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
  });

  describe('getClassicAIVersion', () => {
    it('should return version with hash when files exist', async () => {
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abcdef1234567890'),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      mockReadFileSync
        .mockReturnValueOnce('version = "1.2.3"' as any)
        .mockReturnValueOnce('content1' as any)
        .mockReturnValueOnce('content2' as any)
        .mockReturnValueOnce('content3' as any)
        .mockReturnValueOnce('content4' as any);

      const result = await getClassicAIVersion();

      expect(result).toBe('1.2.3-abcdef12');
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledTimes(4);
    });

    it('should handle missing files gracefully', async () => {
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abcdef1234567890'),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      mockReadFileSync.mockReturnValueOnce('version = "1.2.3"' as any).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await getClassicAIVersion();

      expect(result).toBe('1.2.3-abcdef12');
    });

    it('should handle missing version in Cargo.toml', async () => {
      const mockHash = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abcdef1234567890'),
      };
      mockCreateHash.mockReturnValue(mockHash as any);

      mockReadFileSync.mockReturnValue('invalid content' as any);

      const result = await getClassicAIVersion();

      expect(result).toBe('0.1.0-abcdef12');
    });

    it('should return unknown in browser environment', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      const result = await getClassicAIVersion();

      expect(result).toBe('unknown');
    });

    it('should handle errors gracefully', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await getClassicAIVersion();

      expect(result).toBe('unknown');
    });
  });

  describe('getMLAIVersion', () => {
    it('should call getFileHash with correct path', async () => {
      const originalGetFileHash = await import('../utils/getFileHash');
      const mockGetFileHash = vi
        .spyOn(originalGetFileHash, 'getFileHash')
        .mockResolvedValue('hash123');

      const result = await getMLAIVersion();

      expect(result).toBe('hash123');
      expect(mockGetFileHash).toHaveBeenCalledWith('public/ml-weights.json.gz');

      mockGetFileHash.mockRestore();
    });
  });
});

describe('getFileHash', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
  });

  it('should return hash of file content', async () => {
    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('abcdef1234567890'),
    };
    mockCreateHash.mockReturnValue(mockHash as any);
    mockReadFileSync.mockReturnValue(Buffer.from('test content'));

    const result = await getFileHash('test.txt');

    expect(result).toBe('abcdef1234567890');
    expect(mockCreateHash).toHaveBeenCalledWith('sha256');
    expect(mockReadFileSync).toHaveBeenCalledWith('test.txt');
    expect(mockHash.update).toHaveBeenCalledWith(Buffer.from('test content'));
  });

  it('should return unknown in browser environment', async () => {
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    const result = await getFileHash('test.txt');

    expect(result).toBe('unknown');
    expect(mockCreateHash).not.toHaveBeenCalled();
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it('should handle file read errors', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const result = await getFileHash('nonexistent.txt');

    expect(result).toBe('unknown');
    expect(mockReadFileSync).toHaveBeenCalledWith('nonexistent.txt');
  });

  it('should handle hash creation errors', async () => {
    mockCreateHash.mockImplementation(() => {
      throw new Error('Hash creation failed');
    });

    const result = await getFileHash('test.txt');

    expect(result).toBe('unknown');
  });
});

describe('getGitCommitHash', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    // Clear environment variables
    delete process.env.GITHUB_SHA;
  });

  it('should return GITHUB_SHA when available', async () => {
    process.env.GITHUB_SHA = 'abc123def456';

    const result = await getGitCommitHash();

    expect(result).toBe('abc123def456');
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('should fallback to git command when GITHUB_SHA not available', async () => {
    mockExecSync.mockReturnValue(Buffer.from('def456ghi789\n'));

    const result = await getGitCommitHash();

    expect(result).toBe('def456ghi789');
    expect(mockExecSync).toHaveBeenCalledWith('git rev-parse HEAD');
  });

  it('should return unknown in browser environment', async () => {
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    const result = await getGitCommitHash();

    expect(result).toBe('unknown');
  });

  it('should handle git command errors', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('Git command failed');
    });

    const result = await getGitCommitHash();

    expect(result).toBe('unknown');
  });

  it('should handle empty git output', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));

    const result = await getGitCommitHash();

    expect(result).toBe('');
  });
});
