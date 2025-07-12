import { DrizzleD1Database, drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';
import { D1Database } from '@cloudflare/workers-types';
import { BetterSQLite3Database, drizzle as drizzleBetterSqlite3 } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

export let db: DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema> | null;

// Enhanced environment detection
const detectEnvironment = () => {
  const isCloudflareWorker = typeof globalThis !== 'undefined' && 'DB' in globalThis;
  const hasProcessEnvDB = !!process.env.DB;
  const nodeEnv = process.env.NODE_ENV;

  console.log('🔍 Environment detection:', {
    isCloudflareWorker,
    hasProcessEnvDB,
    nodeEnv,
    globalThisKeys: typeof globalThis !== 'undefined' ? Object.keys(globalThis) : 'undefined',
  });

  return { isCloudflareWorker, hasProcessEnvDB, nodeEnv };
};

const { isCloudflareWorker, hasProcessEnvDB, nodeEnv } = detectEnvironment();

if (isCloudflareWorker) {
  // In Cloudflare Workers, the DB binding is available on globalThis
  const globalDb = (globalThis as { DB?: D1Database }).DB;
  if (globalDb) {
    console.log('✅ Found D1 database binding on globalThis');
    db = drizzleD1(globalDb, { schema });
  } else {
    console.error('❌ DB binding not found on globalThis');
    db = null;
  }
} else if (hasProcessEnvDB) {
  // Fallback for other environments where DB might be in process.env
  console.log('✅ Found D1 database binding in process.env.DB');
  db = drizzleD1(process.env.DB as unknown as D1Database, { schema });
} else if (!nodeEnv || nodeEnv === 'development') {
  console.warn('⚠️ D1 database binding not found. Using local SQLite database for development.');
  try {
    const sqlite = new Database('local.db');
    db = drizzleBetterSqlite3(sqlite, { schema });
    console.log('✅ Local SQLite database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize local SQLite database:', error);
    db = null;
  }
} else {
  console.error('❌ Database connection could not be established in production environment');
  db = null;
}

console.log('📊 Final database connection status:', {
  dbExists: !!db,
  dbType: db
    ? isCloudflareWorker
      ? 'D1 (Cloudflare)'
      : hasProcessEnvDB
        ? 'D1 (env)'
        : 'SQLite (local)'
    : 'none',
});
