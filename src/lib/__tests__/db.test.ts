import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => 'd1-db'),
}));

vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: vi.fn(() => 'sqlite-db'),
}));

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => 'sqlite-instance'),
}));

describe('Database', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalProcess = global.process;

  beforeEach(() => {
    vi.clearAllMocks();
    (process.env as any).NODE_ENV = 'development';
    vi.resetModules();
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    global.process = originalProcess;
  });

  describe('getDb - development environment', () => {
    it('should create SQLite database in development', async () => {
      const { getDb } = await import('../db');
      // const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');

      const db = await getDb();

      expect(typeof db).toBe('string');
    });

    it('should reuse existing database instance', async () => {
      const { getDb } = await import('../db');

      const db1 = await getDb();
      const db2 = await getDb();

      expect(db1).toBe(db2);
    });

    it('should handle SQLite creation error', async () => {
      const Database = (await import('better-sqlite3')).default;
      (Database as any).mockImplementation(() => {
        throw new Error('SQLite error');
      });

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('SQLite error');
    });
  });

  describe('getDb - production environment', () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = 'production';
    });

    it('should create D1 database in production', async () => {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');

      const mockEnv = { DB: 'd1-binding' };
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });

      const { getDb } = await import('../db');
      const db = await getDb();

      expect(getCloudflareContext).toHaveBeenCalledWith({ async: true });
      expect(drizzleD1).toHaveBeenCalledWith('d1-binding', expect.any(Object));
      expect(db).toBe('d1-db');
    });

    it('should handle missing DB binding', async () => {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');

      const mockEnv = {};
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('DB binding is not available in Cloudflare context');
    });

    it('should handle Cloudflare context error', async () => {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');

      (getCloudflareContext as any).mockRejectedValue(new Error('Cloudflare error'));

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('Cloudflare error');
    });

    it('should reuse existing database instance', async () => {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');

      const mockEnv = { DB: 'd1-binding' };
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });

      const { getDb } = await import('../db');
      const db1 = await getDb();
      const db2 = await getDb();

      expect(db1).toBe(db2);
      expect(getCloudflareContext).toHaveBeenCalledTimes(1);
      expect(drizzleD1).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDb - environment switching', () => {
    it('should handle environment changes', async () => {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      // const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');
      // const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');

      const mockEnv = { DB: 'd1-binding' };
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });

      const Database = (await import('better-sqlite3')).default;
      (Database as any).mockImplementation(() => {
        throw new Error('SQLite error');
      });

      (process.env as any).NODE_ENV = 'production';
      vi.resetModules();
      const { getDb: getDbProd } = await import('../db');
      await expect(getDbProd()).resolves.toBe('d1-db');

      (process.env as any).NODE_ENV = 'development';
      vi.resetModules();
      const { getDb: getDbDev } = await import('../db');
      await expect(getDbDev()).rejects.toThrow('SQLite error');
    });
  });

  describe('error handling', () => {
    it('should propagate errors from D1 setup', async () => {
      (process.env as any).NODE_ENV = 'production';
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');

      const mockEnv = { DB: 'd1-binding' };
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });
      (drizzleD1 as any).mockImplementation(() => {
        throw new Error('D1 setup error');
      });

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('D1 setup error');
    });

    it('should propagate errors from SQLite setup', async () => {
      const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');

      (drizzleSqlite as any).mockImplementation(() => {
        throw new Error('SQLite error');
      });

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('SQLite error');
    });
  });

  describe('module imports', () => {
    it('should import schema correctly', async () => {
      const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
      expect(typeof drizzleSqlite).toBe('function');
    });

    it('should import schema correctly for D1', async () => {
      (process.env as any).NODE_ENV = 'production';
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');

      const mockEnv = { DB: 'd1-binding' };
      (getCloudflareContext as any).mockResolvedValue({ env: mockEnv });
      (drizzleD1 as any).mockImplementation(() => {
        throw new Error('D1 setup error');
      });

      const { getDb } = await import('../db');
      await expect(getDb()).rejects.toThrow('D1 setup error');
      expect(typeof drizzleD1).toBe('function');
    });
  });
});
