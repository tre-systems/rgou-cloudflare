import { GameState } from '../schemas';

export const createTestGameState = (
  overrides: Partial<GameState> & {
    player1PieceSquares?: number[];
    player2PieceSquares?: number[];
  }
): GameState => {
  const defaultState: GameState = {
    board: Array(21).fill(null),
    player1Pieces: Array(7)
      .fill(null)
      .map(() => ({ square: -1, player: 'player1' })),
    player2Pieces: Array(7)
      .fill(null)
      .map(() => ({ square: -1, player: 'player2' })),
    currentPlayer: 'player1',
    gameStatus: 'playing',
    winner: null,
    diceRoll: 0,
    canMove: false,
    validMoves: [],
    history: [],
  };

  const state = { ...defaultState, ...overrides };

  if (overrides.player1PieceSquares) {
    state.player1Pieces = Array(7)
      .fill(null)
      .map((_, i) => ({
        square: overrides.player1PieceSquares![i] ?? -1,
        player: 'player1',
      }));
  }

  if (overrides.player2PieceSquares) {
    state.player2Pieces = Array(7)
      .fill(null)
      .map((_, i) => ({
        square: overrides.player2PieceSquares![i] ?? -1,
        player: 'player2',
      }));
  }

  state.board = Array(21).fill(null);
  for (const piece of [...state.player1Pieces, ...state.player2Pieces]) {
    if (piece.square >= 0 && piece.square < 20) {
      state.board[piece.square] = piece;
    }
  }

  return state;
};
