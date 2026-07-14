import {
  GameState,
  Player,
  PiecePosition,
  MoveType,
  GameConstants,
  PersistedGameState,
} from './schemas';

const { ROSETTE_SQUARES, BOARD_ARRAY_SIZE, PIECES_PER_PLAYER, PLAYER1_TRACK, PLAYER2_TRACK } =
  GameConstants;

export type RandomSource = () => number;

function sample(random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random source must return a number from 0 (inclusive) to 1 (exclusive)');
  }
  return value;
}

export function initializeGame(random: RandomSource = Math.random): GameState {
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

  const startingPlayer: Player = sample(random) < 0.5 ? 'player1' : 'player2';

  return {
    board: Array(BOARD_ARRAY_SIZE).fill(null),
    player1Pieces,
    player2Pieces,
    currentPlayer: startingPlayer,
    gameStatus: 'playing',
    winner: null,
    diceRoll: null,
    canMove: false,
    validMoves: [],
    history: [],
  };
}

export function rollDice(random: RandomSource = Math.random): number {
  const probabilities = [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];
  const value = sample(random);

  let cumulativeProb = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProb += probabilities[i];
    if (value < cumulativeProb) {
      return i;
    }
  }

  return 2;
}

export function buildBoard(
  player1Pieces: readonly PiecePosition[],
  player2Pieces: readonly PiecePosition[]
): Array<PiecePosition | null> {
  const board: Array<PiecePosition | null> = Array(BOARD_ARRAY_SIZE).fill(null);
  for (const piece of [...player1Pieces, ...player2Pieces]) {
    if (piece.square >= 0 && piece.square < GameConstants.TRACK_LENGTH) {
      board[piece.square] = piece;
    }
  }
  return board;
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
  if (
    gameState.gameStatus !== 'playing' ||
    !Number.isInteger(gameState.diceRoll) ||
    !gameState.diceRoll ||
    gameState.diceRoll > 4
  ) {
    return [];
  }

  const currentPieces =
    gameState.currentPlayer === 'player1' ? gameState.player1Pieces : gameState.player2Pieces;
  const board = buildBoard(gameState.player1Pieces, gameState.player2Pieces);

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
      const occupant = board[newActualPos];

      if (!occupant || (occupant.player !== gameState.currentPlayer && !isRosette(newActualPos))) {
        validMoves.push(index);
      }
    }
  });

  return validMoves;
}

export function materializeGameState(state: PersistedGameState): GameState {
  const player1Finished = state.player1Pieces.every(piece => piece.square === 20);
  const player2Finished = state.player2Pieces.every(piece => piece.square === 20);
  if (player1Finished && player2Finished) {
    throw new Error('Both players cannot finish the same game');
  }

  const winner: Player | null = player1Finished ? 'player1' : player2Finished ? 'player2' : null;
  const base: GameState = {
    ...state,
    board: buildBoard(state.player1Pieces, state.player2Pieces),
    gameStatus: winner ? 'finished' : 'playing',
    winner,
    canMove: false,
    validMoves: [],
  };
  const validMoves = getValidMoves(base);

  return {
    ...base,
    validMoves,
    canMove: base.diceRoll !== null && base.diceRoll > 0 && validMoves.length > 0,
  };
}

export function toPersistedGameState(gameState: GameState): PersistedGameState {
  return {
    player1Pieces: gameState.player1Pieces,
    player2Pieces: gameState.player2Pieces,
    currentPlayer: gameState.currentPlayer,
    diceRoll: gameState.diceRoll,
    history: gameState.history,
    ...(gameState.startTime === undefined ? {} : { startTime: gameState.startTime }),
  };
}

export function makeMove(
  gameState: GameState,
  pieceIndex: number
): [GameState, MoveType | null, Player] {
  const validMoves = getValidMoves(gameState);
  if (!Number.isInteger(pieceIndex) || !validMoves.includes(pieceIndex) || !gameState.diceRoll) {
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

export function processDiceRoll(
  gameState: GameState,
  providedRoll?: number,
  random: RandomSource = Math.random
): GameState {
  if (gameState.gameStatus !== 'playing' || gameState.diceRoll !== null) {
    return gameState;
  }

  if (
    providedRoll !== undefined &&
    (!Number.isInteger(providedRoll) || providedRoll < 0 || providedRoll > 4)
  ) {
    throw new RangeError('Dice roll must be an integer between 0 and 4');
  }

  const diceRoll = providedRoll !== undefined ? providedRoll : rollDice(random);
  const validMoves = getValidMoves({ ...gameState, diceRoll });

  return {
    ...gameState,
    diceRoll,
    validMoves,
    canMove: diceRoll > 0 && validMoves.length > 0,
  };
}

export function endTurn(gameState: GameState): GameState {
  if (gameState.gameStatus !== 'playing' || gameState.diceRoll === null || gameState.canMove) {
    return gameState;
  }

  return {
    ...gameState,
    currentPlayer: gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
    diceRoll: null,
    canMove: false,
    validMoves: [],
  };
}
