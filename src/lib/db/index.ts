import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema> | null = null;

export const getDb = async () => {
  if (!db) {
    console.log('getDb: Initializing database connection');
    console.log('getDb: NODE_ENV:', process.env.NODE_ENV);
    console.log('getDb: typeof window:', typeof window);
    console.log('getDb: typeof process:', typeof process);

    if (process.env.NODE_ENV === 'production') {
      console.log('getDb: Setting up D1 database for production');
      try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        console.log('getDb: Cloudflare context module imported');

        const { env } = await getCloudflareContext({ async: true });
        console.log('getDb: Cloudflare context retrieved');
        console.log('getDb: Available env keys:', Object.keys(env));

        if (!env.DB) {
          console.error('getDb: DB binding is not available in Cloudflare context');
          throw new Error('DB binding is not available in Cloudflare context');
        }

        console.log('getDb: DB binding found, creating D1 database instance');
        db = drizzleD1(env.DB, { schema });
        console.log('getDb: D1 database instance created successfully');
      } catch (error) {
        console.error('getDb: Error setting up D1 database:', error);
        throw error;
      }
    } else {
      console.log('getDb: Setting up SQLite database for development');
      try {
        const sqlite = new Database('local.db');
        db = drizzleSqlite(sqlite, { schema });
        console.log('getDb: SQLite database instance created successfully');
      } catch (error) {
        console.error('getDb: Error setting up SQLite database:', error);
        throw error;
      }
    }
  }

  console.log('getDb: Returning database instance');
  return db;
};
