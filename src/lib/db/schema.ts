import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const games = sqliteTable('games', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  playerId: text('playerId').notNull(),
  winner: text('winner', { enum: ['player1', 'player2'] }),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['in_progress', 'completed', 'abandoned'] })
    .notNull()
    .default('in_progress'),
  moveCount: integer('moveCount'),
  duration: integer('duration'),
  clientHeader: text('clientHeader'),
  history: text('history', { mode: 'json' }),
  gameType: text('gameType', { enum: ['classic', 'ml', 'watch'] })
    .notNull()
    .default('classic'),
  ai1Version: text('ai1Version'),
  ai2Version: text('ai2Version'),
  gameVersion: text('gameVersion'),
});

export const dbTables = { games };
