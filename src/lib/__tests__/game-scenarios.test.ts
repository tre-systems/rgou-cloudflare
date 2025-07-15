import { describe, it, expect } from 'vitest';
import { makeMove } from '../game-logic';
import { GameConstants } from '../schemas';
import { createTestGameState } from './test-utils';

const { PLAYER1_TRACK } = GameConstants;
const LAST_PLAYER1_SQUARE = PLAYER1_TRACK[PLAYER1_TRACK.length - 1]; // Last square for finish move

describe('Game Scenarios', () => {
  it('should maintain consistent state after capture', () => {
    const CAPTURE_TO = PLAYER1_TRACK[2];
    const gameState = createTestGameState({
      player1PieceSquares: [PLAYER1_TRACK[1]],
      player2PieceSquares: [CAPTURE_TO],
      diceRoll: 1,
      canMove: true,
      validMoves: [0],
    });

    const [newState] = makeMove(gameState, 0);

    expect(newState.player1Pieces[0].square).toBe(CAPTURE_TO);
    expect(newState.board[CAPTURE_TO]).toEqual(newState.player1Pieces[0]);
    expect(newState.player2Pieces[0].square).toBe(-1);
  });

  it('should maintain consistent state after rosette landing', () => {
    const gameState = createTestGameState({
      diceRoll: 4,
      canMove: true,
      validMoves: [0],
    });

    const [newState] = makeMove(gameState, 0);

    expect(newState.board[PLAYER1_TRACK[3]]).toEqual(newState.player1Pieces[0]);
    expect(newState.currentPlayer).toBe('player1');
  });

  it('should maintain consistent state after piece finish', () => {
    const p1Squares = [-1, -1, -1, -1, -1, -1, -1];
    p1Squares[0] = LAST_PLAYER1_SQUARE;
    for (let i = 1; i < 7; i++) {
      p1Squares[i] = 20;
    }

    const gameState = createTestGameState({
      player1PieceSquares: p1Squares,
      diceRoll: 1,
      canMove: true,
      validMoves: [0],
    });

    const [newState] = makeMove(gameState, 0);

    expect(newState.player1Pieces[0].square).toBe(20);
    expect(newState.board[LAST_PLAYER1_SQUARE]).toBeNull();
    expect(newState.gameStatus).toBe('finished');
    expect(newState.winner).toBe('player1');
  });

  it('should maintain consistent state after game win', () => {
    const p1Squares = Array(7).fill(20);
    p1Squares[6] = LAST_PLAYER1_SQUARE;

    const gameState = createTestGameState({
      player1PieceSquares: p1Squares,
      diceRoll: 1,
      canMove: true,
      validMoves: [6],
    });

    const [newState] = makeMove(gameState, 6);

    expect(newState.player1Pieces[6].square).toBe(20);
    expect(newState.board[LAST_PLAYER1_SQUARE]).toBeNull();
    expect(newState.gameStatus).toBe('finished');
    expect(newState.winner).toBe('player1');
  });

  it('should handle multiple moves correctly', () => {
    let currentState = createTestGameState({});

    // 1. P1 moves piece 0 with a roll of 4
    currentState = makeMove({ ...currentState, diceRoll: 4, canMove: true, validMoves: [0] }, 0)[0];
    expect(currentState.player1Pieces[0].square).toBe(PLAYER1_TRACK[3]); // lands on rosette

    // 2. P1 moves piece 1 with a roll of 3 (P1 plays again due to rosette)
    currentState = makeMove({ ...currentState, diceRoll: 3, canMove: true, validMoves: [1] }, 1)[0];
    expect(currentState.player1Pieces[1].square).toBe(PLAYER1_TRACK[2]);

    // 3. P2's turn. moves piece 0 with a roll of 2
    currentState = makeMove(
      { ...currentState, currentPlayer: 'player2', diceRoll: 2, canMove: true, validMoves: [0] },
      0
    )[0];
    expect(currentState.player2Pieces[0].square).toBe(GameConstants.PLAYER2_TRACK[1]);
  });
});
