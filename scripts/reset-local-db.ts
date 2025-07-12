import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { defineConfig } from 'drizzle-kit';
import * as path from 'path';

console.log('Resetting local database...');

const dbFile = path.join(process.cwd(), 'local.db');
const dbWalFile = path.join(process.cwd(), 'local.db-wal');
const dbShmFile = path.join(process.cwd(), 'local.db-shm');
const config_file = 'drizzle.config.local.ts';

try {
  rmSync(dbFile, { force: true });
  rmSync(dbWalFile, { force: true });
  rmSync(dbShmFile, { force: true });
  console.log('Deleted existing local.db file.');
} catch (error) {
  console.error('Error deleting database file:', error);
}

try {
  defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    dbCredentials: {
      url: './local.db',
    },
    verbose: true,
    strict: true,
  });

  execSync(`npx drizzle-kit push --config=${config_file}`, { stdio: 'inherit' });
  console.log('Database reset and schema pushed successfully.');
} catch (error) {
  console.error('Failed to reset database:', error);
  process.exit(1);
}
