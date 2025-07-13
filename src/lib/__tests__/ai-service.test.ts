import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../ai-service';
import { GameState } from '../schemas';

const mockGameState: GameState = {
  board: Array(21).fill(null),
  player1Pieces: [
    { square: 0, player: 'player1' },
    { square: 1, player: 'player1' },
    { square: 2, player: 'player1' },
    { square: 3, player: 'player1' },
    { square: 4, player: 'player1' },
    { square: 5, player: 'player1' },
    { square: 6, player: 'player1' },
  ],
  player2Pieces: [
    { square: 0, player: 'player2' },
    { square: 1, player: 'player2' },
    { square: 2, player: 'player2' },
    { square: 3, player: 'player2' },
    { square: 4, player: 'player2' },
    { square: 5, player: 'player2' },
    { square: 6, player: 'player2' },
  ],
  currentPlayer: 'player1',
  gameStatus: 'playing',
  winner: null,
  diceRoll: 3,
  canMove: true,
  validMoves: [0, 1, 2],
  history: [],
};

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAIMove', () => {
    it('should make a POST request to /ai-move with correct data', async () => {
      const mockResponse = {
        move: 1,
        evaluation: 0.5,
        status: 'success',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await AIService.getAIMove(mockGameState);

      expect(global.fetch).toHaveBeenCalledWith('https://rgou-minmax.tre.systems/ai-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Pieces: mockGameState.player1Pieces.map(p => ({ square: p.square })),
          player2Pieces: mockGameState.player2Pieces.map(p => ({ square: p.square })),
          currentPlayer: 'Player1',
          diceRoll: 3,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle player2 correctly', async () => {
      const gameStateWithPlayer2: GameState = {
        ...mockGameState,
        currentPlayer: 'player2' as const,
      };
      const mockResponse = { move: 2, evaluation: 0.3, status: 'success' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await AIService.getAIMove(gameStateWithPlayer2);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://rgou-minmax.tre.systems/ai-move',
        expect.objectContaining({
          body: expect.stringContaining('"currentPlayer":"Player2"'),
        })
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(AIService.getAIMove(mockGameState)).rejects.toThrow(
        'Failed to communicate with AI service: Error: HTTP error! status: 500'
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(AIService.getAIMove(mockGameState)).rejects.toThrow(
        'Failed to communicate with AI service: Error: Network error'
      );
    });
  });

  describe('evaluatePosition', () => {
    it('should make a POST request to /evaluate with correct data', async () => {
      const mockResponse = {
        evaluation: 0.7,
        status: 'success',
        currentPlayer: 'Player1',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await AIService.evaluatePosition(mockGameState);

      expect(global.fetch).toHaveBeenCalledWith('https://rgou-minmax.tre.systems/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Pieces: mockGameState.player1Pieces.map(p => ({ square: p.square })),
          player2Pieces: mockGameState.player2Pieces.map(p => ({ square: p.square })),
          currentPlayer: 'Player1',
          diceRoll: 3,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle player2 correctly', async () => {
      const gameStateWithPlayer2: GameState = {
        ...mockGameState,
        currentPlayer: 'player2' as const,
      };
      const mockResponse = { evaluation: 0.4, status: 'success', currentPlayer: 'Player2' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await AIService.evaluatePosition(gameStateWithPlayer2);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://rgou-minmax.tre.systems/evaluate',
        expect.objectContaining({
          body: expect.stringContaining('"currentPlayer":"Player2"'),
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should make a GET request to /health', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await AIService.healthCheck();

      expect(global.fetch).toHaveBeenCalledWith('https://rgou-minmax.tre.systems/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFallbackAIMove', () => {
    it('should return 0 when no valid moves', () => {
      const gameStateNoMoves = { ...mockGameState, canMove: false, validMoves: [] };
      const result = AIService.getFallbackAIMove(gameStateNoMoves);
      expect(result).toBe(0);
    });

    it('should return 0 when validMoves is empty', () => {
      const gameStateEmptyMoves = { ...mockGameState, validMoves: [] };
      const result = AIService.getFallbackAIMove(gameStateEmptyMoves);
      expect(result).toBe(0);
    });

    it('should return a random valid move', () => {
      const gameStateWithMoves = { ...mockGameState, validMoves: [1, 2, 3] };
      const result = AIService.getFallbackAIMove(gameStateWithMoves);
      expect([1, 2, 3]).toContain(result);
    });

    it('should return a valid move when only one move available', () => {
      const gameStateWithOneMove = { ...mockGameState, validMoves: [5] };
      const result = AIService.getFallbackAIMove(gameStateWithOneMove);
      expect(result).toBe(5);
    });
  });
});
