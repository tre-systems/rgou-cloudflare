'use server';

import { getDb } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

type DBType = DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema>;

function isD1(): boolean {
  return process.env.NODE_ENV === 'production';
}

export async function saveGame(payload: SaveGamePayload) {
  try {
    const db = (await getDb()) as DBType;

    const validation = SaveGamePayloadSchema.safeParse(payload);
    if (!validation.success) {
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion, playerId, moveCount, duration, version, clientHeader } =
      validation.data;

    let game: { id: string } | undefined;

    if (isD1()) {
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

          await db.insert(gameMoves).values(movesToInsert);
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

        sqliteDb.insert(gameMoves).values(movesToInsert).run();
      }
    }

    return { success: true, gameId: game.id };
  } catch (error) {
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
