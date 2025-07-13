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
  const mockDb: any = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  };

  const mockSqliteDb: any = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  describe('saveGame', () => {
    const validMoveRecord: MoveRecord = {
      player: 'player1',
      diceRoll: 3,
      pieceIndex: 0,
      fromSquare: 0,
      toSquare: 4,
      moveType: 'move',
    };

    const validPayload: SaveGamePayload = {
      winner: 'player1',
      history: [validMoveRecord],
      clientVersion: '1.0.0',
      playerId: 'test-player',
      moveCount: 10,
      duration: 5000,
      version: '1.0.0',
      clientHeader: 'test-header',
    };

    it('should successfully save a game in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });

      mockDb.returning.mockResolvedValue([{ id: 'test-game-id' }]);

      const result = await saveGame(validPayload);

      expect(result).toEqual({ success: true, gameId: 'test-game-id' });
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        winner: 'player1',
        playerId: 'test-player',
        status: 'completed',
        completedAt: expect.any(Date),
        clientVersion: '1.0.0',
        moveCount: 10,
        duration: 5000,
        version: '1.0.0',
        clientHeader: 'test-header',
        history: validPayload.history,
      });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should successfully save a game in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });

      vi.mocked(getDb).mockResolvedValue(mockSqliteDb);
      mockSqliteDb.get.mockReturnValue({ id: 'test-game-id' });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ success: true, gameId: 'test-game-id' });
      expect(mockSqliteDb.insert).toHaveBeenCalled();
      expect(mockSqliteDb.values).toHaveBeenCalledWith({
        winner: 'player1',
        playerId: 'test-player',
        status: 'completed',
        completedAt: expect.any(Date),
        clientVersion: '1.0.0',
        moveCount: 10,
        duration: 5000,
        version: '1.0.0',
        clientHeader: 'test-header',
        history: validPayload.history,
      });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return error for invalid payload', async () => {
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: false,
        error: new ZodError([]),
      });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ error: 'Invalid game data' });
    });

    it('should handle database errors in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });

      const dbError = new Error('Database connection failed');
      mockDb.returning.mockRejectedValue(dbError);

      const result = await saveGame(validPayload);

      expect(result).toEqual({
        error: 'Failed to save game',
        details: 'Database connection failed',
      });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should handle general errors', async () => {
      vi.mocked(getDb).mockRejectedValue(new Error('General error'));

      const result = await saveGame(validPayload);

      expect(result).toEqual({
        error: 'Failed to save game',
        details: 'General error',
      });
    });
  });
});
