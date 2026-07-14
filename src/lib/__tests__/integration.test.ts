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

      gameStore.actions.reset();
      expect(gameStore.gameState.gameStatus).toBe('playing');

      const diceRoll = rollDice();
      expect(diceRoll).toBeGreaterThanOrEqual(0);
      expect(diceRoll).toBeLessThanOrEqual(4);

      const newState = processDiceRoll(gameStore.gameState, diceRoll);
      expect(newState.diceRoll).toBe(diceRoll);
      expect(newState.canMove).toBe(diceRoll > 0);

      const validMoves = getValidMoves(newState);
      if (diceRoll > 0) {
        expect(validMoves.length).toBeGreaterThan(0);
      } else {
        expect(validMoves.length).toBe(0);
      }

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

  });

  describe('Performance Integration', () => {
    it('should handle rapid state changes efficiently', () => {
      for (let i = 0; i < 100; i++) {
        const gameState = createTestGameState({
          diceRoll: i % 5,
          canMove: i % 5 > 0,
        });
        expect(() => getValidMoves(gameState)).not.toThrow();
      }
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

      expect(() => getValidMoves(gameState)).not.toThrow();
      expect(gameState.history).toHaveLength(100);
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across game operations', () => {
      const initialState = initializeGame();
      useGameStore.setState({ gameState: initialState });

      const gameStore = useGameStore.getState();
      expect(gameStore.gameState.board).toHaveLength(21);
      expect(gameStore.gameState.player1Pieces).toHaveLength(7);
      expect(gameStore.gameState.player2Pieces).toHaveLength(7);

      const gameState = createTestGameState({
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
      });

      const [newState] = makeMove(gameState, 0);

      expect(newState.player1Pieces[0].square).toBe(0);
      expect(newState.board[0]).toEqual(newState.player1Pieces[0]);

      const boardPieces = newState.board.filter(piece => piece !== null);
      const allPieces = [...newState.player1Pieces, ...newState.player2Pieces];
      const piecesOnBoard = allPieces.filter(piece => piece.square >= 0 && piece.square < 20);

      expect(boardPieces.length).toBe(piecesOnBoard.length);
    });
  });
});
