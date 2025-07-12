import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { relations } from 'drizzle-orm';

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
});

export const gameMoves = sqliteTable('game_moves', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  gameId: text('gameId')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  moveIndex: integer('moveIndex').notNull(),
  player: text('player', { enum: ['player1', 'player2'] }).notNull(),
  diceRoll: integer('diceRoll').notNull(),
  pieceIndex: integer('pieceIndex').notNull(),
  fromSquare: integer('fromSquare').notNull(),
  toSquare: integer('toSquare').notNull(),
  moveType: text('moveType').notNull(),
});

export const dbTables = { games, gameMoves };

export const gamesRelations = relations(games, ({ many }) => ({
  moves: many(gameMoves),
}));

export const gameMovesRelations = relations(gameMoves, ({ one }) => ({
  game: one(games, {
    fields: [gameMoves.gameId],
    references: [games.id],
  }),
}));
