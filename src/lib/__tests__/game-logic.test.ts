import { describe, it, expect } from 'vitest';
import { initializeGame, getValidMoves, makeMove, processDiceRoll } from '../game-logic';

describe('Game Logic', () => {
  describe('initializeGame', () => {
    it('should create a valid initial game state', () => {
      const game = initializeGame();

      expect(game.board).toHaveLength(20);
      expect(game.board.every(square => square === null)).toBe(true);
      expect(game.player1Pieces).toHaveLength(7);
      expect(game.player2Pieces).toHaveLength(7);
      expect(game.player1Pieces.every(p => p.square === -1 && p.player === 'player1')).toBe(true);
      expect(game.player2Pieces.every(p => p.square === -1 && p.player === 'player2')).toBe(true);
      expect(game.currentPlayer).toBe('player1');
      expect(game.gameStatus).toBe('playing');
      expect(game.winner).toBeNull();
      expect(game.diceRoll).toBeNull();
      expect(game.canMove).toBe(false);
      expect(game.validMoves).toEqual([]);
      expect(game.history).toEqual([]);
    });
  });

  describe('getValidMoves', () => {
    it('should return empty array when dice roll is 0', () => {
      const game = initializeGame();
      game.diceRoll = 0;

      const moves = getValidMoves(game);
      expect(moves).toEqual([]);
    });

    it('should return all pieces when starting with dice roll 4', () => {
      const game = initializeGame();
      game.diceRoll = 4;

      const moves = getValidMoves(game);
      expect(moves).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should not allow moves beyond finish line', () => {
      const game = initializeGame();
      // Move piece 0 to position 13 (near finish)
      game.player1Pieces[0].square = 13;
      game.board[13] = game.player1Pieces[0];
      // Move all other pieces to finish so they can't move
      for (let i = 1; i < 7; i++) {
        game.player1Pieces[i].square = 20;
      }
      game.diceRoll = 10;

      const moves = getValidMoves(game);
      expect(moves).toEqual([]);
    });

    it('should allow exact finish move', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 13;
      game.board[13] = game.player1Pieces[0];
      game.diceRoll = 1;

      const moves = getValidMoves(game);
      expect(moves).toContain(0);
    });

    it('should allow capture of opponent piece', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 4;
      game.board[4] = game.player1Pieces[0];
      game.player2Pieces[0].square = 6;
      game.board[6] = game.player2Pieces[0];
      game.diceRoll = 2;

      const moves = getValidMoves(game);
      expect(moves).toContain(0);
    });

    it('should not allow capture on rosette squares', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 5;
      game.board[5] = game.player1Pieces[0];
      game.player2Pieces[0].square = 7;
      game.board[7] = game.player2Pieces[0];
      game.diceRoll = 2;

      const moves = getValidMoves(game);
      expect(moves).not.toContain(0);
    });

    it('should not allow moving to own piece', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 0;
      game.board[0] = game.player1Pieces[0];
      game.player1Pieces[1].square = 5;
      game.board[5] = game.player1Pieces[1];
      game.diceRoll = 2;

      const moves = getValidMoves(game);
      expect(moves).not.toContain(0);
    });
  });

  describe('makeMove', () => {
    it('should move piece from start to board', () => {
      const game = initializeGame();
      game.diceRoll = 4;
      game.canMove = true;
      game.validMoves = [0];

      const [newState] = makeMove(game, 0);

      expect(newState.player1Pieces[0].square).toBe(0);
      expect(newState.board[0]).toEqual(newState.player1Pieces[0]);
      expect(newState.currentPlayer).toBe('player1');
    });

    it('should capture opponent piece', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 4;
      game.board[4] = game.player1Pieces[0];
      game.player2Pieces[0].square = 6;
      game.board[6] = game.player2Pieces[0];
      game.diceRoll = 2;
      game.canMove = true;
      game.validMoves = [0];

      const [newState, moveType] = makeMove(game, 0);

      expect(newState.player1Pieces[0].square).toBe(6);
      expect(newState.player2Pieces[0].square).toBe(-1);
      expect(newState.board[6]).toEqual(newState.player1Pieces[0]);
      expect(moveType).toBe('capture');
    });

    it('should finish piece when reaching exact end', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 13;
      game.board[13] = game.player1Pieces[0];
      game.diceRoll = 1;
      game.canMove = true;
      game.validMoves = [0];

      const [newState, moveType] = makeMove(game, 0);

      expect(newState.player1Pieces[0].square).toBe(20);
      expect(newState.board[13]).toBeNull();
      expect(moveType).toBe('finish');
    });

    it('should grant extra turn on rosette', () => {
      const game = initializeGame();
      game.player1Pieces[0].square = 5;
      game.board[5] = game.player1Pieces[0];
      game.diceRoll = 2;
      game.canMove = true;
      game.validMoves = [0];

      const [newState, moveType] = makeMove(game, 0);

      expect(newState.player1Pieces[0].square).toBe(7);
      expect(newState.currentPlayer).toBe('player1');
      expect(moveType).toBe('rosette');
    });

    it('should end game when all pieces finished', () => {
      const game = initializeGame();
      for (let i = 0; i < 6; i++) {
        game.player1Pieces[i].square = 20;
      }
      game.player1Pieces[6].square = 13;
      game.board[13] = game.player1Pieces[6];
      game.diceRoll = 1;
      game.canMove = true;
      game.validMoves = [6];

      const [newState] = makeMove(game, 6);

      expect(newState.gameStatus).toBe('finished');
      expect(newState.winner).toBe('player1');
    });
  });

  describe('processDiceRoll', () => {
    it('should handle roll of 0', () => {
      const game = initializeGame();

      const newState = processDiceRoll(game, 0);

      expect(newState.diceRoll).toBeNull();
      expect(newState.canMove).toBe(false);
      expect(newState.validMoves).toEqual([]);
      expect(newState.currentPlayer).toBe('player2');
    });

    it('should handle valid roll with moves available', () => {
      const game = initializeGame();

      const newState = processDiceRoll(game, 4);

      expect(newState.diceRoll).toBe(4);
      expect(newState.canMove).toBe(true);
      expect(newState.validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(newState.currentPlayer).toBe('player1');
    });

    it('should handle roll with no valid moves', () => {
      const game = initializeGame();
      for (let i = 0; i < 7; i++) {
        game.player1Pieces[i].square = 20;
      }

      const newState = processDiceRoll(game, 4);

      expect(newState.diceRoll).toBeNull();
      expect(newState.canMove).toBe(false);
      expect(newState.validMoves).toEqual([]);
      expect(newState.currentPlayer).toBe('player2');
    });
  });
});
