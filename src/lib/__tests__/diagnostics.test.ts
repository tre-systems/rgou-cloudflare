import { describe, it, expect } from 'vitest';
import { calculatePiecePositions, calculateGamePhase, calculateBoardControl } from '../diagnostics';
import { GameState } from '../schemas';

describe('diagnostics', () => {
  describe('calculatePiecePositions', () => {
    it('should calculate piece positions correctly for initial state', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
        ],
        player2Pieces: [
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 0,
        canMove: false,
        validMoves: [],
        history: [],
      };

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 0,
        player1Finished: 0,
        player2OnBoard: 0,
        player2Finished: 0,
      });
    });

    it('should calculate piece positions with pieces on board', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 0, player: 'player1' },
          { square: 5, player: 'player1' },
          { square: 10, player: 'player1' },
          { square: 15, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
        ],
        player2Pieces: [
          { square: 2, player: 'player2' },
          { square: 7, player: 'player2' },
          { square: 12, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 3,
        canMove: true,
        validMoves: [0, 1, 2],
        history: [],
      };

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 4,
        player1Finished: 1,
        player2OnBoard: 3,
        player2Finished: 2,
      });
    });

    it('should handle edge cases with boundary squares', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 0, player: 'player1' },
          { square: 19, player: 'player1' },
          { square: 20, player: 'player1' },
        ],
        player2Pieces: [
          { square: 0, player: 'player2' },
          { square: 19, player: 'player2' },
          { square: 20, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const positions = calculatePiecePositions(gameState);

      expect(positions).toEqual({
        player1OnBoard: 2,
        player1Finished: 1,
        player2OnBoard: 2,
        player2Finished: 1,
      });
    });

    it('should handle all pieces finished', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
        ],
        player2Pieces: [
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
          { square: 20, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'finished',
        winner: 'player1',
        diceRoll: 0,
        canMove: false,
        validMoves: [],
        history: [],
      };

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
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 5, player: 'player1' },
          { square: 10, player: 'player1' },
        ],
        player2Pieces: [
          { square: 5, player: 'player2' },
          { square: 10, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 2,
        canMove: true,
        validMoves: [0, 1],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(0);
    });

    it('should calculate board control with player1 advantage', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 5, player: 'player1' },
          { square: 10, player: 'player1' },
          { square: 15, player: 'player1' },
        ],
        player2Pieces: [{ square: 5, player: 'player2' }],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(3);
    });

    it('should calculate board control with player2 advantage', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [{ square: 5, player: 'player1' }],
        player2Pieces: [
          { square: 5, player: 'player2' },
          { square: 10, player: 'player2' },
          { square: 15, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 3,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(-2);
    });

    it('should give bonus for pieces past halfway mark', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 6, player: 'player1' },
          { square: 8, player: 'player1' },
          { square: 12, player: 'player1' },
        ],
        player2Pieces: [
          { square: 2, player: 'player2' },
          { square: 4, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 2,
        canMove: true,
        validMoves: [0, 1],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(3);
    });

    it('should handle pieces on rosette squares', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 4, player: 'player1' },
          { square: 8, player: 'player1' },
          { square: 14, player: 'player1' },
        ],
        player2Pieces: [
          { square: 4, player: 'player2' },
          { square: 8, player: 'player2' },
        ],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(1);
    });

    it('should handle empty board', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [],
        player2Pieces: [],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 0,
        canMove: false,
        validMoves: [],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(0);
    });

    it('should handle pieces outside board range', () => {
      const gameState: GameState = {
        board: Array(21).fill(null),
        player1Pieces: [
          { square: 25, player: 'player1' },
          { square: 30, player: 'player1' },
        ],
        player2Pieces: [{ square: 25, player: 'player2' }],
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const control = calculateBoardControl(gameState);
      expect(control).toBe(0);
    });
  });
});
