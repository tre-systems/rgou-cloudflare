'use server';

import { getDb } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';

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
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      game = await (db as any).transaction(async (tx: any) => {
        const [newGame] = await tx
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
        if (history.length > 0) {
          const movesToInsert = history.map((move, index) => ({
            gameId: newGame.id,
            moveIndex: index,
            player: move.player,
            diceRoll: move.diceRoll,
            pieceIndex: move.pieceIndex,
            fromSquare: move.fromSquare,
            toSquare: move.toSquare,
            moveType: move.moveType || 'unknown',
          }));
          await tx.insert(gameMoves).values(movesToInsert);
        }
        return newGame;
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sqliteDb = db as any;
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
      if (history.length > 0 && game?.id) {
        const movesToInsert = history.map((move, index) => ({
          gameId: game!.id,
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
    return { success: true, gameId: game?.id || 'unknown' };
  } catch (error) {
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
