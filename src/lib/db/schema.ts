import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const games = sqliteTable('games', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  playerId: text('playerId').notNull(),
  clientVersion: text('clientVersion').notNull().default('unknown'),
  winner: text('winner', { enum: ['player1', 'player2'] }),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['in_progress', 'completed', 'abandoned'] })
    .notNull()
    .default('in_progress'),
  moveCount: integer('moveCount'),
  duration: integer('duration'),
  version: text('version').notNull().default('1.0.0'),
  clientHeader: text('clientHeader'),
  history: text('history', { mode: 'json' }),
});

export const dbTables = { games };
