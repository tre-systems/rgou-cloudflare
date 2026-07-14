import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveGame } from '../actions';
import { SaveGamePayload, MoveRecord, SaveGamePayloadSchema } from '../schemas';
import { getDb } from '../db';
import { ZodError } from 'zod';

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

vi.mock('@/lib/schemas', () => ({
  SaveGamePayloadSchema: {
    safeParse: vi.fn(),
  },
}));

describe('actions', () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  const mockSqliteDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGame', () => {
    const validMoveRecord: MoveRecord = {
      player: 'player1',
      diceRoll: 3,
      pieceIndex: 0,
      fromSquare: 13,
      toSquare: 20,
      moveType: 'finish',
    };

    const validPayload: SaveGamePayload = {
      gameId: 'test-game-id',
      winner: 'player1',
      history: [validMoveRecord],
      playerId: 'test-player',
      moveCount: 1,
      duration: 5000,
      clientHeader: 'test-header',
      gameType: 'classic',
    };

    it('should successfully save a game in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      mockDb.run.mockResolvedValue({ success: true });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ success: true, gameId: 'test-game-id' });
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        id: 'test-game-id',
        winner: 'player1',
        playerId: 'test-player',
        completedAt: expect.any(Date),
        moveCount: 1,
        duration: 5000,
        clientHeader: 'test-header',
        history: validPayload.history,
        gameType: 'classic',
      });
      const callArgs = mockDb.values.mock.calls[0][0];
      expect(callArgs.duration).not.toBeUndefined();
      expect(callArgs.clientHeader).not.toBeUndefined();
      expect(callArgs.playerId).not.toBeUndefined();
    });

    it('should successfully save a game in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.mocked(getDb).mockResolvedValue(mockSqliteDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      mockSqliteDb.run.mockReturnValue({ changes: 1 });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ success: true, gameId: 'test-game-id' });
      expect(mockSqliteDb.insert).toHaveBeenCalled();
      expect(mockSqliteDb.values).toHaveBeenCalledWith({
        id: 'test-game-id',
        winner: 'player1',
        playerId: 'test-player',
        completedAt: expect.any(Date),
        moveCount: 1,
        duration: 5000,
        clientHeader: 'test-header',
        history: validPayload.history,
        gameType: 'classic',
      });
      const callArgs = mockSqliteDb.values.mock.calls[0][0];
      expect(callArgs.duration).not.toBeUndefined();
      expect(callArgs.clientHeader).not.toBeUndefined();
      expect(callArgs.playerId).not.toBeUndefined();
    });

    it('should return error for invalid payload', async () => {
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: false,
        error: new ZodError([]),
      });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ error: 'Invalid game data' });
      expect(getDb).not.toHaveBeenCalled();
    });

    it('should handle database errors in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      const dbError = new Error('Database connection failed');
      mockDb.run.mockRejectedValue(dbError);

      const result = await saveGame(validPayload);

      expect(result).toEqual({ error: 'Failed to save game' });
    });

    it('should handle general errors', async () => {
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      vi.mocked(getDb).mockRejectedValue(new Error('General error'));

      const result = await saveGame(validPayload);

      expect(result).toEqual({ error: 'Failed to save game' });
    });

    it.each(['classic', 'ml', 'watch'] as const)(
      'should save correct gameType for %s mode',
      async gameType => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.mocked(getDb).mockResolvedValue(mockDb as any);
        vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
          success: true,
          data: { ...validPayload, gameType },
        });
        mockDb.run.mockResolvedValue({ success: true });

        const result = await saveGame({
          ...validPayload,
          gameType,
        });
        expect(result).toEqual({ success: true, gameId: 'test-game-id' });
        expect(mockDb.values).toHaveBeenCalledWith(
          expect.objectContaining({
            gameType,
          })
        );
      }
    );
  });
});
