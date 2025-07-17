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

vi.mock('@/lib/versions', () => ({
  getVersionsForDB: vi.fn().mockReturnValue({
    gameVersion: '1.0.0',
    ai1Version: '1.0.0',
    ai2Version: '1.0.0',
  }),
}));

describe('actions', () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  };

  const mockSqliteDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
      playerId: 'test-player',
      moveCount: 10,
      duration: 5000,
      clientHeader: 'test-header',
      gameType: 'classic',
      ai1Version: 'ai1-version-test',
      ai2Version: 'ai2-version-test',
      gameVersion: 'game-version-test',
    };

    it('should successfully save a game in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
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
        moveCount: 10,
        duration: 5000,
        clientHeader: 'test-header',
        history: validPayload.history,
        gameType: 'classic',
        ai1Version: 'ai1-version-test',
        ai2Version: 'ai2-version-test',
        gameVersion: '1.0.0',
      });
      // Ensure all required fields are present and not undefined/null
      const callArgs = mockDb.values.mock.calls[0][0];
      expect(callArgs.duration).not.toBeUndefined();
      expect(callArgs.ai1Version).not.toBeUndefined();
      expect(callArgs.ai2Version).not.toBeUndefined();
      expect(callArgs.clientHeader).not.toBeUndefined();
      expect(callArgs.gameVersion).not.toBeUndefined();
      expect(callArgs.playerId).not.toBeUndefined();
    });

    it('should successfully save a game in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.mocked(getDb).mockResolvedValue(mockSqliteDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      mockSqliteDb.get.mockReturnValue({ id: 'test-game-id' });

      const result = await saveGame(validPayload);

      expect(result).toEqual({ success: true, gameId: 'test-game-id' });
      expect(mockSqliteDb.insert).toHaveBeenCalled();
      expect(mockSqliteDb.values).toHaveBeenCalledWith({
        winner: 'player1',
        playerId: 'test-player',
        status: 'completed',
        completedAt: expect.any(Date),
        moveCount: 10,
        duration: 5000,
        clientHeader: 'test-header',
        history: validPayload.history,
        gameType: 'classic',
        ai1Version: 'ai1-version-test',
        ai2Version: 'ai2-version-test',
        gameVersion: '1.0.0',
      });
      // Ensure all required fields are present and not undefined/null
      const callArgs = mockSqliteDb.values.mock.calls[0][0];
      expect(callArgs.duration).not.toBeUndefined();
      expect(callArgs.ai1Version).not.toBeUndefined();
      expect(callArgs.ai2Version).not.toBeUndefined();
      expect(callArgs.clientHeader).not.toBeUndefined();
      expect(callArgs.gameVersion).not.toBeUndefined();
      expect(callArgs.playerId).not.toBeUndefined();
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
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
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
    });

    it('should handle general errors', async () => {
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: validPayload,
      });
      vi.mocked(getDb).mockRejectedValue(new Error('General error'));

      const result = await saveGame(validPayload);

      expect(result).toEqual({
        error: 'Failed to save game',
        details: 'General error',
      });
    });

    it('should save correct gameType and AI versions for classic mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'classic', ai1Version: '1.0.0', ai2Version: '' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'classic-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'classic',
        ai1Version: '1.0.0',
        ai2Version: '',
      });
      expect(result).toEqual({ success: true, gameId: 'classic-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'classic',
          ai1Version: '1.0.0',
          ai2Version: '',
        })
      );
    });

    it('should save correct gameType and AI versions for ml mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'ml', ai1Version: '1.0.0', ai2Version: '1.0.0' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'ml-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'ml',
        ai1Version: '1.0.0',
        ai2Version: '1.0.0',
      });
      expect(result).toEqual({ success: true, gameId: 'ml-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'ml',
          ai1Version: '1.0.0',
          ai2Version: '1.0.0',
        })
      );
    });

    it('should save correct gameType and AI versions for watch mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'watch', ai1Version: '1.0.0', ai2Version: '1.0.0' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'watch-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'watch',
        ai1Version: '1.0.0',
        ai2Version: '1.0.0',
      });
      expect(result).toEqual({ success: true, gameId: 'watch-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'watch',
          ai1Version: '1.0.0',
          ai2Version: '1.0.0',
        })
      );
    });

    it('should save correct gameType and AI versions for watch mode with only ai2Version set', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'watch', ai1Version: '', ai2Version: '1.0.0' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'watch-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'watch',
        ai1Version: '',
        ai2Version: '1.0.0',
      });
      expect(result).toEqual({ success: true, gameId: 'watch-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'watch',
          ai1Version: '',
          ai2Version: '1.0.0',
        })
      );
    });

    it('should save correct gameType and AI versions for watch mode with only ai1Version set', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'watch', ai1Version: '1.0.0', ai2Version: '' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'watch-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'watch',
        ai1Version: '1.0.0',
        ai2Version: '',
      });
      expect(result).toEqual({ success: true, gameId: 'watch-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'watch',
          ai1Version: '1.0.0',
          ai2Version: '',
        })
      );
    });

    it('should save correct gameType and AI versions for watch mode with both versions missing', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(SaveGamePayloadSchema.safeParse).mockReturnValue({
        success: true,
        data: { ...validPayload, gameType: 'watch', ai1Version: '', ai2Version: '' },
      });
      mockDb.returning.mockResolvedValue([{ id: 'watch-id' }]);

      const result = await saveGame({
        ...validPayload,
        gameType: 'watch',
        ai1Version: '',
        ai2Version: '',
      });
      expect(result).toEqual({ success: true, gameId: 'watch-id' });
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'watch',
          ai1Version: '',
          ai2Version: '',
        })
      );
    });
  });
});
