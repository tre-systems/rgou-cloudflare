export type Player = "player1" | "player2";

export type PiecePosition = {
  square: number; // 0-19 for the track, -1 for start, 20 for finish
  player: Player;
};

export type GameState = {
  board: (PiecePosition | null)[]; // 20 squares on the board
  player1Pieces: PiecePosition[];
  player2Pieces: PiecePosition[];
  currentPlayer: Player;
  gameStatus: "waiting" | "playing" | "finished";
  winner: Player | null;
  diceRoll: number | null;
  canMove: boolean;
  validMoves: number[];
};

export type Move = {
  pieceIndex: number;
  fromSquare: number;
  toSquare: number;
};

export type GameAction =
  | { type: "ROLL_DICE" }
  | { type: "MAKE_MOVE"; move: Move }
  | { type: "RESET_GAME" }
  | { type: "AI_MOVE"; move: Move };

// Royal Game of Ur board layout:
// The track goes: start -> 0-3 -> 4-11 (shared middle track) -> 12-15 -> finish
// Special squares: 4, 8, 14 are rosette squares (safe squares)
export const ROSETTE_SQUARES = [4, 8, 14];
export const TRACK_LENGTH = 20;
export const PIECES_PER_PLAYER = 7;

// Track mapping for each player
export const PLAYER1_TRACK = [
  3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 15, 14, 13, 12,
];
export const PLAYER2_TRACK = [
  19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 15, 14, 13, 12,
];
