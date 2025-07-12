'use server';

import { getDb } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

type DBType = DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema>;

function isD1(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('isD1: NODE_ENV:', process.env.NODE_ENV);
  console.log('isD1: isProduction:', isProduction);
  return isProduction;
}

export async function saveGame(payload: SaveGamePayload) {
  try {
    console.log('saveGame: Starting save operation');
    console.log('saveGame: Environment:', process.env.NODE_ENV);
    console.log('saveGame: isD1():', isD1());

    const db = (await getDb()) as DBType;
    console.log('saveGame: Database connection established');

    const validation = SaveGamePayloadSchema.safeParse(payload);
    if (!validation.success) {
      console.error('saveGame: Validation failed:', validation.error);
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion, playerId, moveCount, duration, version, clientHeader } =
      validation.data;

    console.log('saveGame: Validated payload:', {
      winner,
      historyLength: history.length,
      playerId,
      moveCount,
      version,
    });

    let game: { id: string } | undefined;

    if (isD1()) {
      console.log('saveGame: Using D1 database');
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
        console.log('saveGame: D1 game inserted:', game);

        if (!game || !game.id) {
          console.error('saveGame: Missing game ID from D1 insert');
          return { error: 'Failed to save game: missing game ID' };
        }

        const gameId = game.id;

        if (history.length > 0) {
          console.log('saveGame: Inserting', history.length, 'moves to D1');
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
          console.log('saveGame: Moves inserted successfully to D1');
        }
      } catch (txError) {
        console.error('saveGame: D1 transaction error:', txError);
        return { error: 'Failed to save game', details: (txError as Error).message };
      }
    } else {
      console.log('saveGame: Using SQLite database');
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
      console.log('saveGame: SQLite game inserted:', game);

      if (!game || !game.id) {
        console.error('saveGame: Missing game ID from SQLite insert');
        return { error: 'Failed to save game: missing game ID' };
      }

      const gameId = game.id;

      if (history.length > 0) {
        console.log('saveGame: Inserting', history.length, 'moves to SQLite');
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
        console.log('saveGame: Moves inserted successfully to SQLite');
      }
    }

    console.log('saveGame: Save operation completed successfully');
    return { success: true, gameId: game.id };
  } catch (error) {
    console.error('saveGame: Unexpected error:', error);
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
