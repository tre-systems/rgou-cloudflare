'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';

const moveRecordSchema = z.object({
  player: z.enum(['player1', 'player2']),
  diceRoll: z.number(),
  pieceIndex: z.number(),
  fromSquare: z.number(),
  toSquare: z.number(),
  moveType: z.string().nullable(),
});

const postGameSchema = z.object({
  winner: z.enum(['player1', 'player2']),
  history: z.array(moveRecordSchema),
  clientVersion: z.string().optional().default('unknown'),
  turnstileToken: z.string().optional(),
});

type SaveGamePayload = z.infer<typeof postGameSchema>;

export async function saveGame(payload: SaveGamePayload) {
  try {
    const validation = postGameSchema.safeParse(payload);

    if (!validation.success) {
      console.error('Invalid game data:', validation.error.format());
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion } = validation.data;

    if (!db) {
      console.error('Database connection is not available');
      return { error: 'Database connection is not available' };
    }

    let game: { id: string } | undefined;

    if (process.env.DB) {
      // D1 database - use async transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      game = await (db as any).transaction(async (tx: any) => {
        const [newGame] = await tx
          .insert(games)
          .values({
            winner,
            status: 'completed',
            completedAt: new Date(),
            clientVersion,
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
      // better-sqlite3 database - use direct operations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (db as any)
        .insert(games)
        .values({
          winner,
          status: 'completed',
          completedAt: new Date(),
          clientVersion,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).insert(gameMoves).values(movesToInsert).run();
      }
    }

    return { success: true, gameId: game?.id || 'unknown' };
  } catch (error) {
    console.error('Error saving game:', error);
    return { error: 'Failed to save game' };
  }
}
