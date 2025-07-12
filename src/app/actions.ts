'use server';

import { db } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';

export async function saveGame(payload: SaveGamePayload) {
  try {
    console.log('saveGame called with payload:', payload);

    const validation = SaveGamePayloadSchema.safeParse(payload);

    if (!validation.success) {
      console.error('❌ Invalid game data:', validation.error.format());
      return { error: 'Invalid game data' };
    }

    const { winner, history, clientVersion, playerId, moveCount, duration, version, clientHeader } =
      validation.data;
    console.log('✅ Payload validation successful:', {
      winner,
      historyLength: history.length,
      clientVersion,
      playerId,
      moveCount,
      duration,
      version,
      clientHeader,
    });

    if (!db) {
      console.error('❌ Database connection is not available');
      return { error: 'Database connection is not available' };
    }

    console.log('✅ Database connection available, proceeding with save');

    let game: { id: string } | undefined;

    // Check if we're in a Cloudflare Worker environment
    const isCloudflareWorker = typeof globalThis !== 'undefined' && 'DB' in globalThis;

    if (isCloudflareWorker || process.env.DB) {
      console.log('Using D1 database (production)');
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

        console.log('✅ Game record created with ID:', newGame.id);

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
          console.log('✅ Inserted', history.length, 'moves for game', newGame.id);
        }

        return newGame;
      });
    } else {
      console.log('Using local SQLite database (development)');
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
      console.log('✅ Game record created with ID:', game?.id);

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
        console.log('✅ Inserted', history.length, 'moves for game', game.id);
      }
    }

    console.log('✅ Game save completed successfully');
    return { success: true, gameId: game?.id || 'unknown' };
  } catch (error) {
    console.error('❌ Error saving game:', error);
    return { error: 'Failed to save game' };
  }
}
