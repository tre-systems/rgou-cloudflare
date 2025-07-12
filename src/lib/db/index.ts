import { DrizzleD1Database, drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { D1Database } from '@cloudflare/workers-types';

export let db: DrizzleD1Database<typeof schema>;

if (process.env.DB) {
  db = drizzle(process.env.DB as unknown as D1Database, { schema });
} else {
  console.warn('Warning: D1 database binding not found. Database features will not be available.');
  db = null as unknown as DrizzleD1Database<typeof schema>;
}
