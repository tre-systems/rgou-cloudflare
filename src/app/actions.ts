'use server';

import { db } from '@/lib/db';
import { games, gameMoves } from '@/lib/db/schema';
import { SaveGamePayload, SaveGamePayloadSchema } from '@/lib/schemas';

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Environment check:', {
      isCloudflareWorker: typeof globalThis !== 'undefined' && 'DB' in globalThis,
      hasProcessEnvDB: !!process.env.DB,
      nodeEnv: process.env.NODE_ENV,
      dbExists: !!db,
    });

    if (!db) {
      console.error('❌ Database connection is not available');
      return { error: 'Database connection is not available', details: 'db is null' };
    }

    console.log('✅ Database connection available, testing with simple query...');

    // Try a simple query to test the connection
    try {
      const result = await db.select().from(games).limit(1);
      console.log('✅ Database query successful, found', result.length, 'games');
      return {
        success: true,
        message: 'Database connection working',
        gameCount: result.length,
        environment:
          typeof globalThis !== 'undefined' && 'DB' in globalThis ? 'cloudflare' : 'local',
      };
    } catch (queryError) {
      console.error('❌ Database query failed:', queryError);
      return { error: 'Database query failed', details: queryError };
    }
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
    return { error: 'Failed to test database connection', details: error };
  }
}

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
