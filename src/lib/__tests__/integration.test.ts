import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeGame, rollDice, getValidMoves, makeMove, processDiceRoll } from '../game-logic';
import { useGameStore } from '../game-store';
import { createTestGameState } from './test-utils';

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Game Flow Integration', () => {
    it('should handle complete game flow from start to finish', () => {
      const gameStore = useGameStore.getState();

      // Start new game
      gameStore.actions.reset();
      expect(gameStore.gameState.gameStatus).toBe('playing');

      // Roll dice
      const diceRoll = rollDice();
      expect(diceRoll).toBeGreaterThanOrEqual(0);
      expect(diceRoll).toBeLessThanOrEqual(4);

      // Process dice roll
      const newState = processDiceRoll(gameStore.gameState, diceRoll);
      expect(newState.diceRoll).toBe(diceRoll);
      expect(newState.canMove).toBe(diceRoll > 0);

      // Get valid moves
      const validMoves = getValidMoves(newState);
      if (diceRoll > 0) {
        expect(validMoves.length).toBeGreaterThan(0);
      } else {
        expect(validMoves.length).toBe(0);
      }

      // Make a move if possible
      if (validMoves.length > 0) {
        const [finalState, moveType, movePlayer] = makeMove(newState, validMoves[0]);
        expect(moveType).toBeDefined();
        expect(movePlayer).toBeDefined();
        expect(finalState.diceRoll).toBeNull();
        expect(finalState.canMove).toBe(false);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid game states gracefully', () => {
      // Test with invalid state - should not crash
      const invalidState = {
        ...createTestGameState({}),
        board: Array(20).fill(null), // Wrong size
      };

      // Should not throw when processing moves
      expect(() => {
        getValidMoves(invalidState as any);
      }).not.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const gameStore = useGameStore.getState();

      // Mock network failure
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      try {
        await gameStore.actions.postGameToServer();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid state changes efficiently', () => {
      const startTime = performance.now();

      // Perform multiple rapid state changes
      for (let i = 0; i < 100; i++) {
        const gameState = createTestGameState({
          diceRoll: i % 5,
          canMove: i % 5 > 0,
        });
        // Test game logic functions directly
        getValidMoves(gameState);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle large game histories efficiently', () => {
      // Create a game with many moves
      const gameState = createTestGameState({
        history: Array(100)
          .fill(null)
          .map((_, i) => ({
            player: i % 2 === 0 ? 'player1' : 'player2',
            diceRoll: (i % 4) + 1,
            pieceIndex: i % 7,
            fromSquare: i,
            toSquare: i + 1,
            moveType: 'move' as const,
          })),
      });

      const startTime = performance.now();
      // Test that we can process the state
      getValidMoves(gameState);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (50ms)
      expect(duration).toBeLessThan(50);
      expect(gameState.history).toHaveLength(100);
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across game operations', () => {
      const gameStore = useGameStore.getState();

      // Start with clean state
      const initialState = initializeGame();
      gameStore.gameState = initialState;

      // Verify board consistency
      expect(gameStore.gameState.board).toHaveLength(21);
      expect(gameStore.gameState.player1Pieces).toHaveLength(7);
      expect(gameStore.gameState.player2Pieces).toHaveLength(7);

      // Make a move and verify board state
      const gameState = createTestGameState({
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
      });

      const [newState] = makeMove(gameState, 0);

      // Verify piece position matches board position
      expect(newState.player1Pieces[0].square).toBe(0);
      expect(newState.board[0]).toEqual(newState.player1Pieces[0]);

      // Verify no duplicate pieces on board
      const boardPieces = newState.board.filter(piece => piece !== null);
      const allPieces = [...newState.player1Pieces, ...newState.player2Pieces];
      const piecesOnBoard = allPieces.filter(piece => piece.square >= 0 && piece.square < 20);

      expect(boardPieces.length).toBe(piecesOnBoard.length);
    });
  });
});
