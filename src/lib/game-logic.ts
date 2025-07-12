import { GameState, Player, PiecePosition, MoveType, GameConstants } from './schemas';

const { ROSETTE_SQUARES, TRACK_LENGTH, PIECES_PER_PLAYER, PLAYER1_TRACK, PLAYER2_TRACK } =
  GameConstants;

export function initializeGame(): GameState {
  const player1Pieces: PiecePosition[] = Array(PIECES_PER_PLAYER)
    .fill(null)
    .map(() => ({
      square: -1,
      player: 'player1' as Player,
    }));

  const player2Pieces: PiecePosition[] = Array(PIECES_PER_PLAYER)
    .fill(null)
    .map(() => ({
      square: -1,
      player: 'player2' as Player,
    }));

  return {
    board: Array(TRACK_LENGTH).fill(null),
    player1Pieces,
    player2Pieces,
    currentPlayer: 'player1',
    gameStatus: 'playing',
    winner: null,
    diceRoll: null,
    canMove: false,
    validMoves: [],
    history: [],
  };
}

export function rollDice(): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.5) count++;
  }
  return count;
}

function getPlayerTrack(player: Player): readonly number[] {
  return player === 'player1' ? PLAYER1_TRACK : PLAYER2_TRACK;
}

function getActualPosition(player: Player, trackPosition: number): number {
  const track = getPlayerTrack(player);
  return trackPosition >= 0 && trackPosition < track.length ? track[trackPosition] : -1;
}

function isRosette(square: number): boolean {
  return (ROSETTE_SQUARES as readonly number[]).includes(square);
}

export function getValidMoves(gameState: GameState): number[] {
  if (!gameState.diceRoll || gameState.diceRoll === 0) return [];

  const currentPieces =
    gameState.currentPlayer === 'player1' ? gameState.player1Pieces : gameState.player2Pieces;

  const validMoves: number[] = [];

  currentPieces.forEach((piece, index) => {
    if (piece.square === 20) {
      return;
    }
    const currentTrackPos =
      piece.square === -1 ? -1 : getPlayerTrack(gameState.currentPlayer).indexOf(piece.square);
    const newTrackPos = currentTrackPos + gameState.diceRoll!;

    if (newTrackPos >= getPlayerTrack(gameState.currentPlayer).length) {
      if (newTrackPos === getPlayerTrack(gameState.currentPlayer).length) {
        validMoves.push(index);
      }
    } else {
      const newActualPos = getActualPosition(gameState.currentPlayer, newTrackPos);
      const occupant = gameState.board[newActualPos];

      if (!occupant || (occupant.player !== gameState.currentPlayer && !isRosette(newActualPos))) {
        validMoves.push(index);
      }
    }
  });

  return validMoves;
}

export function makeMove(
  gameState: GameState,
  pieceIndex: number
): [GameState, MoveType | null, Player] {
  if (!gameState.validMoves.includes(pieceIndex) || !gameState.diceRoll) {
    return [gameState, null, gameState.currentPlayer];
  }

  const newState: GameState = {
    ...gameState,
    board: [...gameState.board],
    player1Pieces: [...gameState.player1Pieces],
    player2Pieces: [...gameState.player2Pieces],
    history: [...gameState.history],
  };

  const movePlayer = gameState.currentPlayer;
  let moveType: MoveType = 'move';
  const isPlayer1 = gameState.currentPlayer === 'player1';
  const currentPieces = isPlayer1 ? newState.player1Pieces : newState.player2Pieces;
  const piece = { ...currentPieces[pieceIndex] };
  const fromSquare = piece.square;
  let toSquare: number;

  const currentTrackPos =
    piece.square === -1 ? -1 : getPlayerTrack(gameState.currentPlayer).indexOf(piece.square);
  const newTrackPos = currentTrackPos + gameState.diceRoll;

  if (piece.square >= 0) {
    newState.board[piece.square] = null;
  }

  if (newTrackPos >= getPlayerTrack(gameState.currentPlayer).length) {
    currentPieces[pieceIndex] = { ...piece, square: 20 };
    moveType = 'finish';
    toSquare = 20;
  } else {
    const newActualPos = getActualPosition(gameState.currentPlayer, newTrackPos);
    const occupant = newState.board[newActualPos];
    toSquare = newActualPos;

    if (occupant && occupant.player !== gameState.currentPlayer) {
      moveType = 'capture';
      const opponentPieces = isPlayer1 ? [...newState.player2Pieces] : [...newState.player1Pieces];
      const opponentPieceIndex = opponentPieces.findIndex(p => p.square === newActualPos);
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

    currentPieces[pieceIndex] = { ...piece, square: newActualPos };
    newState.board[newActualPos] = currentPieces[pieceIndex];
    if (isRosette(newActualPos) && moveType !== 'capture') {
      moveType = 'rosette';
    }
  }

  if (isPlayer1) {
    newState.player1Pieces = currentPieces;
  } else {
    newState.player2Pieces = currentPieces;
  }

  newState.history.push({
    player: movePlayer,
    diceRoll: gameState.diceRoll,
    pieceIndex,
    fromSquare,
    toSquare,
    moveType,
  });

  const finishedPieces = currentPieces.filter(p => p.square === 20).length;
  if (finishedPieces === PIECES_PER_PLAYER) {
    newState.gameStatus = 'finished';
    newState.winner = gameState.currentPlayer;
  }

  const landedOnRosette =
    newTrackPos < getPlayerTrack(gameState.currentPlayer).length &&
    isRosette(getActualPosition(gameState.currentPlayer, newTrackPos));

  if (!landedOnRosette && newState.gameStatus !== 'finished') {
    newState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
  }

  newState.diceRoll = null;
  newState.canMove = false;
  newState.validMoves = [];

  return [newState, moveType, movePlayer];
}

export function processDiceRoll(gameState: GameState, providedRoll?: number): GameState {
  const diceRoll = providedRoll !== undefined ? providedRoll : rollDice();
  const newState = {
    ...gameState,
    diceRoll,
    canMove: diceRoll > 0,
    validMoves: diceRoll > 0 ? getValidMoves({ ...gameState, diceRoll }) : [],
  };

  if (diceRoll === 0) {
    return {
      ...newState,
      currentPlayer: gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
      diceRoll: null,
      canMove: false,
      validMoves: [],
    };
  }

  if (diceRoll > 0 && newState.validMoves.length === 0) {
    return {
      ...newState,
      currentPlayer: gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
      diceRoll: null,
      canMove: false,
      validMoves: [],
    };
  }

  return newState;
}
