'use server';

import { getDb } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

export async function saveGame(payload: SaveGamePayload) {
  try {
    const db = await getDb();

    const validation = SaveGamePayloadSchema.safeParse(payload);
    if (!validation.success) {
      return { error: 'Invalid game data' };
    }

    const { winner, history, playerId, moveCount, duration, clientHeader, gameType } =
      validation.data;

    let gameId: string | undefined;

    if (process.env.NODE_ENV === 'production') {
      try {
        const [newGame] = await db
          .insert(games)
          .values({
            winner,
            playerId,
            completedAt: new Date(),
            moveCount,
            duration,
            clientHeader,
            history: history,
            gameType,
          })
          .returning();
        gameId = newGame?.id;
      } catch (txError) {
        return { error: 'Failed to save game', details: (txError as Error).message };
      }
    } else {
      const sqliteDb = db as BetterSQLite3Database<typeof schema>;
      const newGame = sqliteDb
        .insert(games)
        .values({
          winner,
          playerId,
          completedAt: new Date(),
          moveCount,
          duration,
          clientHeader,
          history: history,
          gameType,
        })
        .returning({ id: games.id })
        .get();
      gameId = newGame?.id;
    }

    return { success: true, gameId };
  } catch (error) {
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
