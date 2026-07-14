'use server';

import { getDb } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

export async function saveGame(payload: SaveGamePayload) {
  const validation = SaveGamePayloadSchema.safeParse(payload);
  if (!validation.success) {
    return { error: 'Invalid game data' };
  }

  try {
    const db = await getDb();
    const { gameId, winner, history, playerId, moveCount, duration, clientHeader, gameType } =
      validation.data;
    const values = {
      id: gameId,
      winner,
      playerId,
      completedAt: new Date(),
      moveCount,
      duration,
      clientHeader,
      history,
      gameType,
    };

    if (process.env.NODE_ENV === 'production') {
      await db.insert(games).values(values).onConflictDoNothing().run();
    } else {
      const sqliteDb = db as BetterSQLite3Database<typeof schema>;
      sqliteDb.insert(games).values(values).onConflictDoNothing().run();
    }

    return { success: true, gameId };
  } catch (error) {
    console.error('Failed to save game:', error);
    return { error: 'Failed to save game' };
  }
}
