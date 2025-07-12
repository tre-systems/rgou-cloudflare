import { DrizzleD1Database, drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';
import { D1Database } from '@cloudflare/workers-types';
import { BetterSQLite3Database, drizzle as drizzleBetterSqlite3 } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

export let db: DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema> | null;

// Check if we're in a Cloudflare Worker environment
const isCloudflareWorker = typeof globalThis !== 'undefined' && 'DB' in globalThis;

if (isCloudflareWorker) {
  // In Cloudflare Workers, the DB binding is available on globalThis
  const globalDb = (globalThis as { DB?: D1Database }).DB;
  if (globalDb) {
    db = drizzleD1(globalDb, { schema });
  } else {
    console.error('DB binding not found on globalThis');
    db = null;
  }
} else if (process.env.DB) {
  // Fallback for other environments where DB might be in process.env
  db = drizzleD1(process.env.DB as unknown as D1Database, { schema });
} else if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  console.warn('D1 database binding not found. Using local SQLite database for development.');
  const sqlite = new Database('local.db');
  db = drizzleBetterSqlite3(sqlite, { schema });
} else {
  console.error('Database connection could not be established.');
  db = null;
}
