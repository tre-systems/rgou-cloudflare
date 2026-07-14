import { describe, it, expect } from 'vitest';
import { GameStateSchema, MoveRecordSchema, SaveGamePayloadSchema } from '../schemas';

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

    it('should reject internally inconsistent game state', () => {
      const gameState = {
        board: Array(21).fill(null),
        player1Pieces: Array(7).fill({ square: -1, player: 'player1' as const }),
        player2Pieces: Array(7).fill({ square: -1, player: 'player2' as const }),
        currentPlayer: 'player1' as const,
        gameStatus: 'playing' as const,
        winner: 'player1' as const,
        diceRoll: 2,
        canMove: false,
        validMoves: [0],
        history: [],
      };

      expect(() => GameStateSchema.parse(gameState)).toThrow();
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

  describe('SaveGamePayloadSchema', () => {
    const validMove = {
      player: 'player1' as const,
      diceRoll: 1,
      pieceIndex: 0,
      fromSquare: 13,
      toSquare: 20,
      moveType: 'finish' as const,
    };

    const validPayload = {
      gameId: 'game_test',
      winner: 'player1' as const,
      history: [validMove],
      playerId: 'test-player',
      moveCount: 1,
      duration: 5000,
      clientHeader: 'test-agent',
      gameType: 'classic' as const,
    };

    it('should validate a save game payload', () => {
      expect(() => SaveGamePayloadSchema.parse(validPayload)).not.toThrow();
    });

    it('should reject oversized save game payloads', () => {
      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          history: Array(513).fill(validMove),
          moveCount: 513,
        })
      ).toThrow();
    });

    it('should reject unbounded client metadata', () => {
      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          playerId: '',
        })
      ).toThrow();

      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          clientHeader: 'a'.repeat(513),
        })
      ).toThrow();
    });

    it('should reject impossible move values', () => {
      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          history: [
            {
              ...validMove,
              diceRoll: 5,
            },
          ],
        })
      ).toThrow();
    });

    it('should reject inconsistent completion data', () => {
      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          moveCount: 2,
        })
      ).toThrow();

      expect(() =>
        SaveGamePayloadSchema.parse({
          ...validPayload,
          winner: 'player2',
        })
      ).toThrow();
    });
  });
});
