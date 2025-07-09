import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { relations } from 'drizzle-orm';

export const games = sqliteTable('games', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['in_progress', 'completed'] })
    .notNull()
    .default('in_progress'),
});

export const gameParticipants = sqliteTable('game_participants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  gameId: text('gameId')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  playerName: text('playerName').notNull(),
  isWinner: integer('isWinner', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gamesRelations = relations(games, ({ many }) => ({
  participants: many(gameParticipants),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
}));
