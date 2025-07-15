import { describe, it, expect } from 'vitest';
import { initializeGame, rollDice, getValidMoves, makeMove, processDiceRoll } from '../game-logic';
import { GameState } from '../schemas';

describe('game-logic', () => {
  describe('initializeGame', () => {
    it('should initialize game with correct default state', () => {
      const gameState = initializeGame();

      expect(gameState.board).toHaveLength(21);
      expect(gameState.board.every(square => square === null)).toBe(true);
      expect(gameState.player1Pieces).toHaveLength(7);
      expect(gameState.player2Pieces).toHaveLength(7);
      expect(
        gameState.player1Pieces.every(piece => piece.square === -1 && piece.player === 'player1')
      ).toBe(true);
      expect(
        gameState.player2Pieces.every(piece => piece.square === -1 && piece.player === 'player2')
      ).toBe(true);
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.gameStatus).toBe('playing');
      expect(gameState.winner).toBeNull();
      expect(gameState.diceRoll).toBeNull();
      expect(gameState.canMove).toBe(false);
      expect(gameState.validMoves).toEqual([]);
      expect(gameState.history).toEqual([]);
    });

    it('should create independent game state instances', () => {
      const gameState1 = initializeGame();
      const gameState2 = initializeGame();

      expect(gameState1).not.toBe(gameState2);
      expect(gameState1.board).not.toBe(gameState2.board);
      expect(gameState1.player1Pieces).not.toBe(gameState2.player1Pieces);
      expect(gameState1.player2Pieces).not.toBe(gameState2.player2Pieces);
    });
  });

  describe('rollDice', () => {
    it('should return a number between 0 and 4', () => {
      const results = new Set<number>();

      for (let i = 0; i < 1000; i++) {
        const roll = rollDice();
        expect(roll).toBeGreaterThanOrEqual(0);
        expect(roll).toBeLessThanOrEqual(4);
        results.add(roll);
      }

      expect(results.size).toBeGreaterThan(1);
    });

    it('should have reasonable distribution', () => {
      const rolls = Array.from({ length: 10000 }, () => rollDice());
      const counts = rolls.reduce(
        (acc, roll) => {
          acc[roll] = (acc[roll] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      // Each value should appear at least once
      for (let i = 0; i <= 4; i++) {
        expect(counts[i]).toBeGreaterThan(0);
      }
    });
  });

  describe('getValidMoves', () => {
    it('should return empty array when diceRoll is null', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: null,
      };

      const validMoves = getValidMoves(gameState);
      expect(validMoves).toEqual([]);
    });

    it('should return empty array when diceRoll is 0', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 0,
      };

      const validMoves = getValidMoves(gameState);
      expect(validMoves).toEqual([]);
    });

    it('should return valid moves for pieces starting from home', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        currentPlayer: 'player1',
      };

      const validMoves = getValidMoves(gameState);
      expect(validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should not return moves for finished pieces', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        currentPlayer: 'player1',
        player1Pieces: [
          { square: 20, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
        ],
      };

      const validMoves = getValidMoves(gameState);
      expect(validMoves).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle player2 moves correctly', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        currentPlayer: 'player2',
      };

      const validMoves = getValidMoves(gameState);
      expect(validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('makeMove', () => {
    it('should return unchanged state for invalid move', () => {
      const gameState = initializeGame();
      const [newState, moveType, movePlayer] = makeMove(gameState, 0);

      expect(newState).toEqual(gameState);
      expect(moveType).toBeNull();
      expect(movePlayer).toBe('player1');
    });

    it('should return unchanged state when diceRoll is null', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: null,
        canMove: true,
        validMoves: [0],
      };

      const [newState, moveType, movePlayer] = makeMove(gameState, 0);

      expect(newState).toEqual(gameState);
      expect(moveType).toBeNull();
      expect(movePlayer).toBe('player1');
    });

    it('should make a basic move from home', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
      };

      const [newState, moveType, movePlayer] = makeMove(gameState, 0);

      expect(newState.player1Pieces[0].square).toBe(0);
      expect(newState.board[0]).toEqual(newState.player1Pieces[0]);
      expect(moveType).toBe('rosette');
      expect(movePlayer).toBe('player1');
      expect(newState.currentPlayer).toBe('player1');
      expect(newState.diceRoll).toBeNull();
      expect(newState.canMove).toBe(false);
      expect(newState.validMoves).toEqual([]);
    });

    it('should handle capture move', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
        player2Pieces: [
          { square: 0, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
          { square: -1, player: 'player2' },
        ],
        board: [
          { square: 0, player: 'player2' },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      };

      const [newState, moveType, movePlayer] = makeMove(gameState, 0);

      expect(newState.player1Pieces[0].square).toBe(0);
      expect(newState.player2Pieces[0].square).toBe(-1);
      expect(newState.board[0]).toEqual(newState.player1Pieces[0]);
      expect(moveType).toBe('capture');
      expect(movePlayer).toBe('player1');
    });

    it('should handle finish move', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        player1Pieces: [
          { square: 13, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
        ],
      };

      const [newState, moveType, movePlayer] = makeMove(gameState, 0);

      expect(newState.player1Pieces[0].square).toBe(20);
      expect(moveType).toBe('finish');
      expect(movePlayer).toBe('player1');
    });

    it('should handle game finish when all pieces are finished', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 1,
        canMove: true,
        validMoves: [0],
        player1Pieces: [
          { square: 13, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
        ],
      };

      const [newState] = makeMove(gameState, 0);

      expect(newState.gameStatus).toBe('finished');
      expect(newState.winner).toBe('player1');
    });

    it('should switch players when not landing on rosette', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
        player1Pieces: [
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
          { square: -1, player: 'player1' },
        ],
      };

      const [newState] = makeMove(gameState, 0);

      expect(newState.currentPlayer).toBe('player1');
    });

    it('should handle player2 moves', () => {
      const gameState: GameState = {
        ...initializeGame(),
        currentPlayer: 'player2',
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
      };

      const [newState, , movePlayer] = makeMove(gameState, 0);

      expect(movePlayer).toBe('player2');
      expect(newState.player2Pieces[0].square).toBeGreaterThan(-1);
    });

    it('should add move to history', () => {
      const gameState: GameState = {
        ...initializeGame(),
        diceRoll: 4,
        canMove: true,
        validMoves: [0],
        history: [],
      };

      const [newState] = makeMove(gameState, 0);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual({
        player: 'player1',
        diceRoll: 4,
        pieceIndex: 0,
        fromSquare: -1,
        toSquare: 0,
        moveType: 'rosette',
      });
    });
  });

  describe('processDiceRoll', () => {
    it('should use provided roll when given', () => {
      const gameState = initializeGame();
      const newState = processDiceRoll(gameState, 3);

      expect(newState.diceRoll).toBe(3);
      expect(newState.canMove).toBe(true);
    });

    it('should generate random roll when not provided', () => {
      const gameState = initializeGame();
      const newState = processDiceRoll(gameState);

      expect(newState.diceRoll).toBeGreaterThanOrEqual(0);
      expect(newState.diceRoll).toBeLessThanOrEqual(4);
    });

    it('should handle roll of 0', () => {
      const gameState = initializeGame();
      const newState = processDiceRoll(gameState, 0);

      expect(newState.diceRoll).toBe(0);
      expect(newState.canMove).toBe(false);
      expect(newState.validMoves).toEqual([]);
    });

    it('should handle roll with no valid moves', () => {
      const gameState: GameState = {
        ...initializeGame(),
        player1Pieces: [
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
          { square: 20, player: 'player1' },
        ],
      };

      const newState = processDiceRoll(gameState, 4);

      expect(newState.diceRoll).toBe(4);
      expect(newState.canMove).toBe(false);
      expect(newState.validMoves).toEqual([]);
      expect(newState.currentPlayer).toBe('player1');
    });

    it('should calculate valid moves for roll greater than 0', () => {
      const gameState = initializeGame();
      const newState = processDiceRoll(gameState, 4);

      expect(newState.diceRoll).toBe(4);
      expect(newState.canMove).toBe(true);
      expect(newState.validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should preserve other game state properties', () => {
      const gameState: GameState = {
        ...initializeGame(),
        currentPlayer: 'player2',
        gameStatus: 'playing',
        winner: null,
      };

      const newState = processDiceRoll(gameState, 3);

      expect(newState.currentPlayer).toBe('player2');
      expect(newState.gameStatus).toBe('playing');
      expect(newState.winner).toBeNull();
    });
  });
});
