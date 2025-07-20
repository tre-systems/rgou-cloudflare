import { GameState } from './types';

export interface PiecePositions {
  player1OnBoard: number;
  player1Finished: number;
  player2OnBoard: number;
  player2Finished: number;
}

export const calculatePiecePositions = (gameState: GameState): PiecePositions => {
  const player1OnBoard = gameState.player1Pieces.filter(p => p.square >= 0 && p.square < 20).length;
  const player1Finished = gameState.player1Pieces.filter(p => p.square === 20).length;
  const player2OnBoard = gameState.player2Pieces.filter(p => p.square >= 0 && p.square < 20).length;
  const player2Finished = gameState.player2Pieces.filter(p => p.square === 20).length;

  return {
    player1OnBoard,
    player1Finished,
    player2OnBoard,
    player2Finished,
  };
};

export type GamePhase = 'Opening' | 'Mid Game' | 'End Game';

export const calculateGamePhase = (piecePositions: PiecePositions): GamePhase => {
  const totalFinished = piecePositions.player1Finished + piecePositions.player2Finished;
  const totalOnBoard = piecePositions.player1OnBoard + piecePositions.player2OnBoard;

  if (totalFinished >= 5) {
    return 'End Game';
  }
  if (totalOnBoard >= 4) {
    return 'Mid Game';
  }
  return 'Opening';
};


export const calculateBoardControl = (gameState: GameState): number => {
  let control = 0;
  
  control +=
    gameState.player1Pieces.filter(p => p.square >= 0 && p.square < 20).length -
    gameState.player2Pieces.filter(p => p.square >= 0 && p.square < 20).length;

  
  control += gameState.player1Pieces.filter(p => p.square > 4 && p.square < 13).length * 0.5;
  control -= gameState.player2Pieces.filter(p => p.square > 4 && p.square < 13).length * 0.5;

  return Math.round(control);
};
