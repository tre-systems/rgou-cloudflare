import { describe, it, expect } from 'vitest';
import { calculatePiecePositions, calculateGamePhase, calculateBoardControl } from '../diagnostics';
import { createTestGameState } from './test-utils';

describe('diagnostics', () => {
  describe('calculatePiecePositions', () => {
    it('should calculate piece positions correctly for initial state', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [-1, -1, -1, -1, -1, -1, -1],
        player2PieceSquares: [-1, -1, -1, -1, -1, -1, -1],
      });

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 0,
        player1Finished: 0,
        player2OnBoard: 0,
        player2Finished: 0,
      });
    });

    it('should calculate piece positions with pieces on board', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [0, 5, 10, 15, 20, -1, -1],
        player2PieceSquares: [2, 7, 12, 20, 20, -1, -1],
      });

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 4,
        player1Finished: 1,
        player2OnBoard: 3,
        player2Finished: 2,
      });
    });

    it('should handle edge cases with boundary squares', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [0, 19, 20],
        player2PieceSquares: [0, 19, 20],
      });

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 2,
        player1Finished: 1,
        player2OnBoard: 2,
        player2Finished: 1,
      });
    });

    it('should handle all pieces finished', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [20, 20, 20, 20, 20, 20, 20],
        player2PieceSquares: [20, 20, 20, 20, 20, 20, 20],
      });

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 0,
        player1Finished: 7,
        player2OnBoard: 0,
        player2Finished: 7,
      });
    });
  });

  describe('calculateGamePhase', () => {
    it('should return Opening when few pieces are finished', () => {
      const positions = {
        player1OnBoard: 2,
        player1Finished: 1,
        player2OnBoard: 1,
        player2Finished: 0,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('Opening');
    });

    it('should return Mid Game when many pieces are on board', () => {
      const positions = {
        player1OnBoard: 3,
        player1Finished: 1,
        player2OnBoard: 2,
        player2Finished: 1,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('Mid Game');
    });

    it('should return End Game when many pieces are finished', () => {
      const positions = {
        player1OnBoard: 1,
        player1Finished: 3,
        player2OnBoard: 0,
        player2Finished: 2,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('End Game');
    });

    it('should return End Game when exactly 5 pieces are finished', () => {
      const positions = {
        player1OnBoard: 1,
        player1Finished: 3,
        player2OnBoard: 1,
        player2Finished: 2,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('End Game');
    });

    it('should return Mid Game when exactly 4 pieces are on board', () => {
      const positions = {
        player1OnBoard: 2,
        player1Finished: 1,
        player2OnBoard: 2,
        player2Finished: 0,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('Mid Game');
    });

    it('should handle edge case with no pieces', () => {
      const positions = {
        player1OnBoard: 0,
        player1Finished: 0,
        player2OnBoard: 0,
        player2Finished: 0,
      };

      const phase = calculateGamePhase(positions);
      expect(phase).toBe('Opening');
    });
  });

  describe('calculateBoardControl', () => {
    it('should calculate board control for balanced position', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [5, 10],
        player2PieceSquares: [5, 10],
      });

      const control = calculateBoardControl(gameState);
      expect(control).toBe(0);
    });

    it('should give player 1 advantage when they have more pieces on board', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [5, 10, 12],
        player2PieceSquares: [5, 10],
      });

      const control = calculateBoardControl(gameState);
      expect(control).toBe(2);
    });

    it('should give player 2 advantage when they have more pieces on board', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [5, 10],
        player2PieceSquares: [5, 10, 12],
      });
      const control = calculateBoardControl(gameState);
      expect(control).toBe(-1);
    });

    it('should handle pieces past the halfway mark', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [6],
        player2PieceSquares: [],
      });
      const control = calculateBoardControl(gameState);
      expect(control).toBe(2);
    });

    it('should handle empty board', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [],
        player2PieceSquares: [],
      });
      const control = calculateBoardControl(gameState);
      expect(control).toBe(0);
    });

    it('should handle complex scenarios', () => {
      const gameState = createTestGameState({
        player1PieceSquares: [1, 2, 6, 8, 14], // 5 on board, 2 past half
        player2PieceSquares: [3, 4, 7, 10], // 4 on board, 2 past half
      });

      const control = calculateBoardControl(gameState);
      expect(control).toBe(1);

      const gameState2 = createTestGameState({
        player1PieceSquares: [1, 2, 6, 8, 14],
        player2PieceSquares: [3, 4, 7],
      });
      const control2 = calculateBoardControl(gameState2);
      expect(control2).toBe(3);
    });
  });
});
