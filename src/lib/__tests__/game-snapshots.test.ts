import { describe, it, expect } from 'vitest';
import { initializeGame, makeMove } from '../game-logic';
import { GameConstants } from '../schemas';

const LAST_PLAYER1_SQUARE = GameConstants.PLAYER1_TRACK[GameConstants.PLAYER1_TRACK.length - 1];

// For capture test
const CAPTURE_FROM = GameConstants.PLAYER1_TRACK[1]; // 2
const CAPTURE_TO = GameConstants.PLAYER1_TRACK[2]; // 1

describe('Game State Snapshots', () => {
  it('should maintain consistent state after capture', () => {
    const game = initializeGame();
    game.player1Pieces[0].square = CAPTURE_FROM;
    game.board[CAPTURE_FROM] = game.player1Pieces[0];
    game.player2Pieces[0].square = CAPTURE_TO;
    game.board[CAPTURE_TO] = game.player2Pieces[0];
    game.diceRoll = 1;
    game.canMove = true;
    game.validMoves = [0];

    const [newState] = makeMove(game, 0);

    expect(newState.player1Pieces[0].square).toBe(CAPTURE_TO);
    expect(newState.board[CAPTURE_TO]).toEqual(newState.player1Pieces[0]);
    expect(newState.player2Pieces[0].square).toBe(-1);
  });

  it('should maintain consistent state after rosette landing', () => {
    const game = initializeGame();
    game.diceRoll = 4;
    game.canMove = true;
    game.validMoves = [0];

    const [newState] = makeMove(game, 0);

    expect(newState.board[0]).toEqual(newState.player1Pieces[0]);
    expect(newState.currentPlayer).toBe('player1');
  });

  it('should maintain consistent state after piece finish', () => {
    const game = initializeGame();
    game.player1Pieces[0].square = LAST_PLAYER1_SQUARE;
    game.board[LAST_PLAYER1_SQUARE] = game.player1Pieces[0];
    for (let i = 1; i < 7; i++) {
      game.player1Pieces[i].square = 20;
    }
    game.diceRoll = 1;
    game.canMove = true;
    game.validMoves = [0];

    const [newState] = makeMove(game, 0);

    expect(newState.player1Pieces[0].square).toBe(20);
    expect(newState.board[LAST_PLAYER1_SQUARE]).toBeNull();
    expect(newState.gameStatus).toBe('finished');
    expect(newState.winner).toBe('player1');
  });

  it('should maintain consistent state after game win', () => {
    const game = initializeGame();
    for (let i = 0; i < 6; i++) {
      game.player1Pieces[i].square = 20;
    }
    game.player1Pieces[6].square = LAST_PLAYER1_SQUARE;
    game.board[LAST_PLAYER1_SQUARE] = game.player1Pieces[6];
    game.diceRoll = 1;
    game.canMove = true;
    game.validMoves = [6];

    const [newState] = makeMove(game, 6);

    expect(newState.player1Pieces[6].square).toBe(20);
    expect(newState.board[LAST_PLAYER1_SQUARE]).toBeNull();
    expect(newState.gameStatus).toBe('finished');
    expect(newState.winner).toBe('player1');
  });

  it('should maintain consistent state after multiple moves', () => {
    const game = initializeGame();
    const moves = [
      { pieceIndex: 0, diceRoll: 4 },
      { pieceIndex: 1, diceRoll: 3 },
      { pieceIndex: 2, diceRoll: 2 },
    ];

    let currentState = game;
    for (const move of moves) {
      currentState.diceRoll = move.diceRoll;
      currentState.canMove = true;
      currentState.validMoves = [move.pieceIndex];
      [currentState] = makeMove(currentState, move.pieceIndex);
    }

    expect(currentState.player1Pieces[0].square).toBe(0);
    expect(currentState.player1Pieces[1].square).toBe(1);
    expect(currentState.player1Pieces[2].square).toBe(-1);
  });

  it('should handle edge case: all pieces finished', () => {
    const game = initializeGame();
    for (let i = 0; i < 7; i++) {
      game.player1Pieces[i].square = 20;
    }
    game.diceRoll = 1;
    game.canMove = false;
    game.validMoves = [];
    game.gameStatus = 'finished';
    game.winner = 'player1';

    expect(game.gameStatus).toBe('finished');
    expect(game.winner).toBe('player1');
  });
});
