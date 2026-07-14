import type { GameState, Player } from '../schemas';

function createPieces(squares: readonly number[] | undefined, player: Player) {
  return Array.from({ length: 7 }, (_, index) => ({
    square: squares?.[index] ?? -1,
    player,
  }));
}

export const createTestGameState = (
  overrides: Partial<GameState> & {
    player1PieceSquares?: number[];
    player2PieceSquares?: number[];
  }
): GameState => {
  const { player1PieceSquares, player2PieceSquares, ...stateOverrides } = overrides;
  const state: GameState = {
    board: Array(21).fill(null),
    player1Pieces: createPieces(player1PieceSquares, 'player1'),
    player2Pieces: createPieces(player2PieceSquares, 'player2'),
    currentPlayer: 'player1',
    gameStatus: 'playing',
    winner: null,
    diceRoll: 0,
    canMove: false,
    validMoves: [],
    history: [],
    ...stateOverrides,
  };

  state.board = Array(21).fill(null);
  for (const piece of [...state.player1Pieces, ...state.player2Pieces]) {
    if (piece.square >= 0 && piece.square < 20) {
      state.board[piece.square] = piece;
    }
  }

  return state;
};
