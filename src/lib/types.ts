export type Player = 'player1' | 'player2';

export type PiecePosition = {
  square: number; // -1 for not on board, 20 for finished
  player: Player;
};

export type MoveType = 'move' | 'capture' | 'rosette' | 'finish' | null;

export type MoveRecord = {
  player: Player;
  diceRoll: number;
  pieceIndex: number;
  fromSquare: number;
  toSquare: number;
  moveType: MoveType;
};

export type GameState = {
  board: (PiecePosition | null)[];
  player1Pieces: PiecePosition[];
  player2Pieces: PiecePosition[];
  currentPlayer: Player;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  diceRoll: number | null;
  canMove: boolean;
  validMoves: number[];
  history: MoveRecord[];
};

export const ROSETTE_SQUARES = [0, 7, 13, 15, 16];
export const TRACK_LENGTH = 20;
export const PIECES_PER_PLAYER = 7;

export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'MAKE_MOVE'; move: Move }
  | { type: 'RESET_GAME' }
  | { type: 'AI_MOVE'; move: Move };

export type GameStats = {
  wins: number;
  losses: number;
  gamesPlayed: number;
};

export type Move = {
  pieceIndex: number;
  diceRoll: number;
  player: Player;
  newSquare: number;
  moveType: MoveType;
};

export const PLAYER1_TRACK = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const PLAYER2_TRACK = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15];
