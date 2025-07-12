'use server';

import { getDb } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';
import { batch } from '@/lib/utils';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

export async function saveGame(payload: SaveGamePayload) {
  try {
    const db = await getDb();

    const validation = SaveGamePayloadSchema.safeParse(payload);
    if (!validation.success) {
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion, playerId, moveCount, duration, version, clientHeader } =
      validation.data;

    let game: { id: string } | undefined;

    const BATCH_SIZE = 100;

    if (process.env.NODE_ENV === 'production') {
      try {
        const [newGame] = await db
          .insert(games)
          .values({
            winner,
            playerId,
            status: 'completed',
            completedAt: new Date(),
            clientVersion,
            moveCount,
            duration,
            version,
            clientHeader,
          })
          .returning();

        game = newGame;

        if (!game || !game.id) {
          return { error: 'Failed to save game: missing game ID' };
        }

        const gameId = game.id;

        if (history.length > 0) {
          const movesToInsert = history.map((move, index) => ({
            gameId,
            moveIndex: index,
            player: move.player,
            diceRoll: move.diceRoll,
            pieceIndex: move.pieceIndex,
            fromSquare: move.fromSquare,
            toSquare: move.toSquare,
            moveType: move.moveType || 'unknown',
          }));

          const moveBatches = batch(movesToInsert, BATCH_SIZE);

          for (const moveBatch of moveBatches) {
            await db.insert(gameMoves).values(moveBatch);
          }
        }
      } catch (txError) {
        return { error: 'Failed to save game', details: (txError as Error).message };
      }
    } else {
      const sqliteDb = db as BetterSQLite3Database<typeof schema>;
      const result = sqliteDb
        .insert(games)
        .values({
          winner,
          playerId,
          status: 'completed',
          completedAt: new Date(),
          clientVersion,
          moveCount,
          duration,
          version,
          clientHeader,
        })
        .returning()
        .get();

      game = result;

      if (!game || !game.id) {
        return { error: 'Failed to save game: missing game ID' };
      }

      const gameId = game.id;

      if (history.length > 0) {
        const movesToInsert = history.map((move, index) => ({
          gameId,
          moveIndex: index,
          player: move.player,
          diceRoll: move.diceRoll,
          pieceIndex: move.pieceIndex,
          fromSquare: move.fromSquare,
          toSquare: move.toSquare,
          moveType: move.moveType || 'unknown',
        }));

        const moveBatches = batch(movesToInsert, BATCH_SIZE);

        for (const moveBatch of moveBatches) {
          sqliteDb.insert(gameMoves).values(moveBatch).run();
        }
      }
    }

    return { success: true, gameId: game.id };
  } catch (error) {
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
