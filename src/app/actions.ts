'use server';

import { getDb } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';

export async function saveGame(payload: SaveGamePayload) {
  try {
    console.log('SaveGame: Starting save process');
    const db = await getDb();
    console.log('SaveGame: Database connection obtained');

    const validation = SaveGamePayloadSchema.safeParse(payload);
    if (!validation.success) {
      console.error('SaveGame: Validation failed:', validation.error);
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion, playerId, moveCount, duration, version, clientHeader } =
      validation.data;

    console.log('SaveGame: Environment:', process.env.NODE_ENV);
    console.log('SaveGame: Payload validated, winner:', winner, 'history length:', history.length);

    let game: { id: string } | undefined;

    if (process.env.NODE_ENV === 'production') {
      console.log('SaveGame: Using production D1 database');
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        game = await (db as any).transaction((tx: any) => {
          return (async () => {
            console.log('SaveGame: Transaction started');
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

            console.log('SaveGame: Game inserted, ID:', newGame.id);

            if (history.length > 0) {
              console.log('SaveGame: Inserting', history.length, 'moves');
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
              console.log('SaveGame: Moves inserted successfully');
            }

            return newGame;
          })();
        });
        console.log('SaveGame: Transaction completed successfully');
      } catch (txError) {
        console.error('SaveGame: Transaction failed:', txError);
        return { error: 'Failed to save game', details: (txError as Error).message };
      }
    } else {
      console.log('SaveGame: Using local SQLite database');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (db as any)
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
      console.log('SaveGame: Game inserted locally, ID:', game?.id);

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
        console.log('SaveGame: Moves inserted locally');
      }
    }

    console.log('SaveGame: Save completed successfully, game ID:', game?.id);
    return { success: true, gameId: game?.id || 'unknown' };
  } catch (error) {
    console.error('SaveGame: Unexpected error:', error);
    return { error: 'Failed to save game', details: (error as Error).message };
  }
}
