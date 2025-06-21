import {
  GameState,
  Player,
  Move,
  PiecePosition,
  ROSETTE_SQUARES,
  TRACK_LENGTH,
  PIECES_PER_PLAYER,
  PLAYER1_TRACK,
  PLAYER2_TRACK,
} from "./types";

// Initialize a new game state
export function initializeGame(): GameState {
  const player1Pieces: PiecePosition[] = Array(PIECES_PER_PLAYER)
    .fill(null)
    .map(() => ({
      square: -1, // Starting position
      player: "player1" as Player,
    }));

  const player2Pieces: PiecePosition[] = Array(PIECES_PER_PLAYER)
    .fill(null)
    .map(() => ({
      square: -1, // Starting position
      player: "player2" as Player,
    }));

  return {
    board: Array(TRACK_LENGTH).fill(null),
    player1Pieces,
    player2Pieces,
    currentPlayer: "player1",
    gameStatus: "playing",
    winner: null,
    diceRoll: null,
    canMove: false,
    validMoves: [],
  };
}

// Roll the ancient dice (4 binary dice, count the number of marked corners)
export function rollDice(): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.5) count++;
  }
  return count;
}

// Get the track path for a specific player
function getPlayerTrack(player: Player): number[] {
  return player === "player1" ? PLAYER1_TRACK : PLAYER2_TRACK;
}

// Get the actual board position for a player's track position
function getActualPosition(player: Player, trackPosition: number): number {
  const track = getPlayerTrack(player);
  return trackPosition >= 0 && trackPosition < track.length
    ? track[trackPosition]
    : -1;
}

// Check if a square is a rosette (safe square)
function isRosette(square: number): boolean {
  return ROSETTE_SQUARES.includes(square);
}

// Get valid moves for the current player
export function getValidMoves(gameState: GameState): number[] {
  if (!gameState.diceRoll || gameState.diceRoll === 0) return [];

  const currentPieces =
    gameState.currentPlayer === "player1"
      ? gameState.player1Pieces
      : gameState.player2Pieces;

  const validMoves: number[] = [];

  currentPieces.forEach((piece, index) => {
    const currentTrackPos =
      piece.square === -1
        ? -1
        : getPlayerTrack(gameState.currentPlayer).indexOf(piece.square);
    const newTrackPos = currentTrackPos + gameState.diceRoll!;

    // Check if move is valid
    if (newTrackPos >= getPlayerTrack(gameState.currentPlayer).length) {
      // Moving off the board (finishing) - only valid if exact
      if (newTrackPos === getPlayerTrack(gameState.currentPlayer).length) {
        validMoves.push(index);
      }
    } else {
      const newActualPos = getActualPosition(
        gameState.currentPlayer,
        newTrackPos
      );
      const occupant = gameState.board[newActualPos];

      // Can move if square is empty, or occupied by opponent (and not on rosette)
      if (
        !occupant ||
        (occupant.player !== gameState.currentPlayer &&
          !isRosette(newActualPos))
      ) {
        validMoves.push(index);
      }
    }
  });

  return validMoves;
}

// Make a move
export function makeMove(gameState: GameState, pieceIndex: number): GameState {
  if (!gameState.validMoves.includes(pieceIndex) || !gameState.diceRoll) {
    return gameState; // Invalid move
  }

  const newState = { ...gameState };
  const isPlayer1 = gameState.currentPlayer === "player1";
  const currentPieces = isPlayer1
    ? [...gameState.player1Pieces]
    : [...gameState.player2Pieces];
  const piece = currentPieces[pieceIndex];

  // Calculate new position
  const currentTrackPos =
    piece.square === -1
      ? -1
      : getPlayerTrack(gameState.currentPlayer).indexOf(piece.square);
  const newTrackPos = currentTrackPos + gameState.diceRoll;

  // Remove piece from old position
  if (piece.square >= 0) {
    newState.board[piece.square] = null;
  }

  // Check if finishing
  if (newTrackPos >= getPlayerTrack(gameState.currentPlayer).length) {
    currentPieces[pieceIndex] = { ...piece, square: 20 }; // Finished
  } else {
    const newActualPos = getActualPosition(
      gameState.currentPlayer,
      newTrackPos
    );
    const occupant = gameState.board[newActualPos];

    // If there's an opponent piece, send it back to start
    if (occupant && occupant.player !== gameState.currentPlayer) {
      const opponentPieces = isPlayer1
        ? [...gameState.player2Pieces]
        : [...gameState.player1Pieces];
      const opponentPieceIndex = opponentPieces.findIndex(
        (p) => p.square === newActualPos
      );
      if (opponentPieceIndex >= 0) {
        opponentPieces[opponentPieceIndex] = {
          ...opponentPieces[opponentPieceIndex],
          square: -1,
        };
        if (isPlayer1) {
          newState.player2Pieces = opponentPieces;
        } else {
          newState.player1Pieces = opponentPieces;
        }
      }
    }

    // Place piece in new position
    currentPieces[pieceIndex] = { ...piece, square: newActualPos };
    newState.board[newActualPos] = currentPieces[pieceIndex];
  }

  // Update pieces
  if (isPlayer1) {
    newState.player1Pieces = currentPieces;
  } else {
    newState.player2Pieces = currentPieces;
  }

  // Check for win condition
  const finishedPieces = currentPieces.filter((p) => p.square === 20).length;
  if (finishedPieces === PIECES_PER_PLAYER) {
    newState.gameStatus = "finished";
    newState.winner = gameState.currentPlayer;
  }

  // Determine next player (stay if landed on rosette or if game finished)
  const landedOnRosette =
    newTrackPos < getPlayerTrack(gameState.currentPlayer).length &&
    isRosette(getActualPosition(gameState.currentPlayer, newTrackPos));

  if (!landedOnRosette && newState.gameStatus !== "finished") {
    newState.currentPlayer =
      gameState.currentPlayer === "player1" ? "player2" : "player1";
  }

  // Reset move state
  newState.diceRoll = null;
  newState.canMove = false;
  newState.validMoves = [];

  return newState;
}

// Process dice roll
export function processDiceRoll(gameState: GameState): GameState {
  const diceRoll = rollDice();
  const newState = {
    ...gameState,
    diceRoll,
    canMove: diceRoll > 0,
    validMoves: diceRoll > 0 ? getValidMoves({ ...gameState, diceRoll }) : [],
  };

  // If no valid moves and dice roll > 0, skip turn
  if (diceRoll > 0 && newState.validMoves.length === 0) {
    return {
      ...newState,
      currentPlayer:
        gameState.currentPlayer === "player1" ? "player2" : "player1",
      diceRoll: null,
      canMove: false,
      validMoves: [],
    };
  }

  return newState;
}
