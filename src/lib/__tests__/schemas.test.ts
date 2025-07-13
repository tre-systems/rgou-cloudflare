import { describe, it, expect } from 'vitest';
import {
  GameStateSchema,
  PlayerSchema,
  PiecePositionSchema,
  MoveRecordSchema,
  GameActionSchema,
} from '../schemas';

describe('Schemas', () => {
  describe('PlayerSchema', () => {
    it('should validate valid players', () => {
      expect(() => PlayerSchema.parse('player1')).not.toThrow();
      expect(() => PlayerSchema.parse('player2')).not.toThrow();
    });

    it('should reject invalid players', () => {
      expect(() => PlayerSchema.parse('player3')).toThrow();
      expect(() => PlayerSchema.parse('')).toThrow();
      expect(() => PlayerSchema.parse(null)).toThrow();
    });
  });

  describe('PiecePositionSchema', () => {
    it('should validate valid piece positions', () => {
      const validPiece = { square: 5, player: 'player1' as const };
      expect(() => PiecePositionSchema.parse(validPiece)).not.toThrow();

      const startPiece = { square: -1, player: 'player2' as const };
      expect(() => PiecePositionSchema.parse(startPiece)).not.toThrow();

      const finishedPiece = { square: 20, player: 'player1' as const };
      expect(() => PiecePositionSchema.parse(finishedPiece)).not.toThrow();
    });

    it('should reject invalid piece positions', () => {
      expect(() => PiecePositionSchema.parse({ square: 21, player: 'player1' })).toThrow();
      expect(() => PiecePositionSchema.parse({ square: -2, player: 'player1' })).toThrow();
      expect(() => PiecePositionSchema.parse({ square: 5, player: 'player3' })).toThrow();
    });
  });

  describe('GameStateSchema', () => {
    it('should validate valid game state', () => {
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

    it('should reject invalid game state', () => {
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
  });

  describe('MoveRecordSchema', () => {
    it('should validate valid move records', () => {
      const validMove = {
        player: 'player1' as const,
        diceRoll: 4,
        pieceIndex: 0,
        fromSquare: -1,
        toSquare: 0,
        moveType: 'move' as const,
      };

      expect(() => MoveRecordSchema.parse(validMove)).not.toThrow();
    });

    it('should validate capture move', () => {
      const captureMove = {
        player: 'player2' as const,
        diceRoll: 2,
        pieceIndex: 1,
        fromSquare: 4,
        toSquare: 6,
        moveType: 'capture' as const,
      };

      expect(() => MoveRecordSchema.parse(captureMove)).not.toThrow();
    });
  });

  describe('GameActionSchema', () => {
    it('should validate roll dice action', () => {
      const rollAction = { type: 'ROLL_DICE' as const };
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
          moveType: 'move' as const,
        },
      };

      expect(() => GameActionSchema.parse(moveAction)).not.toThrow();
    });

    it('should validate reset game action', () => {
      const resetAction = { type: 'RESET_GAME' as const };
      expect(() => GameActionSchema.parse(resetAction)).not.toThrow();
    });

    it('should validate AI move action', () => {
      const aiAction = {
        type: 'AI_MOVE' as const,
        move: {
          pieceIndex: 0,
          diceRoll: 4,
          player: 'player2' as const,
          newSquare: 0,
          moveType: 'move' as const,
        },
      };

      expect(() => GameActionSchema.parse(aiAction)).not.toThrow();
    });
  });
});
