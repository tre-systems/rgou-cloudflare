import { describe, it, expect } from 'vitest';
import { GameStateSchema, MoveRecordSchema, GameActionSchema } from '../schemas';

describe('Schemas', () => {
  describe('GameStateSchema', () => {
    it('should validate complete game state', () => {
      const validGameState = {
        board: Array(21).fill(null),
        player1Pieces: Array(7).fill({ square: -1, player: 'player1' as const }),
        player2Pieces: Array(7).fill({ square: -1, player: 'player2' as const }),
        currentPlayer: 'player1' as const,
        gameStatus: 'playing' as const,
        winner: null,
        diceRoll: null,
        canMove: false,
        validMoves: [],
        history: [],
      };

      expect(() => GameStateSchema.parse(validGameState)).not.toThrow();
    });

    it('should reject invalid board size', () => {
      const invalidGameState = {
        board: Array(20).fill(null), // Wrong size
        player1Pieces: Array(7).fill({ square: -1, player: 'player1' }),
        player2Pieces: Array(7).fill({ square: -1, player: 'player2' }),
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        diceRoll: null,
        canMove: false,
        validMoves: [],
        history: [],
      };

      expect(() => GameStateSchema.parse(invalidGameState)).toThrow();
    });

    it('should validate finished game state', () => {
      const finishedGameState = {
        board: Array(21).fill(null),
        player1Pieces: Array(7).fill({ square: 20, player: 'player1' as const }),
        player2Pieces: Array(7).fill({ square: -1, player: 'player2' as const }),
        currentPlayer: 'player1' as const,
        gameStatus: 'finished' as const,
        winner: 'player1' as const,
        diceRoll: null,
        canMove: false,
        validMoves: [],
        history: [],
      };

      expect(() => GameStateSchema.parse(finishedGameState)).not.toThrow();
    });
  });

  describe('MoveRecordSchema', () => {
    it('should validate complete move record', () => {
      const validMove = {
        player: 'player1' as const,
        diceRoll: 4,
        pieceIndex: 0,
        fromSquare: -1,
        toSquare: 0,
        moveType: 'rosette' as const,
      };

      expect(() => MoveRecordSchema.parse(validMove)).not.toThrow();
    });

    it('should validate capture move', () => {
      const captureMove = {
        player: 'player1' as const,
        diceRoll: 4,
        pieceIndex: 0,
        fromSquare: -1,
        toSquare: 0,
        moveType: 'capture' as const,
      };

      expect(() => MoveRecordSchema.parse(captureMove)).not.toThrow();
    });
  });

  describe('GameActionSchema', () => {
    it('should validate roll dice action', () => {
      const rollAction = {
        type: 'ROLL_DICE' as const,
      };

      expect(() => GameActionSchema.parse(rollAction)).not.toThrow();
    });

    it('should validate make move action', () => {
      const moveAction = {
        type: 'MAKE_MOVE' as const,
        move: {
          pieceIndex: 0,
          diceRoll: 4,
          player: 'player1' as const,
          newSquare: 0,
          moveType: 'rosette' as const,
        },
      };

      expect(() => GameActionSchema.parse(moveAction)).not.toThrow();
    });
  });
});
