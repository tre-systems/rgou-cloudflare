export type {
  Player,
  MoveType,
  GameStatus,
  PiecePosition,
  MoveRecord,
  GameState,
  GameStats,
  GameMode,
  OpponentMode,
  AISource,
  MoveEvaluation,
  Diagnostics,
  Timings,
  AIResponse,
  ServerAIResponse,
} from './schemas';

export {
  PlayerSchema,
  MoveTypeSchema,
  GameStatusSchema,
  PiecePositionSchema,
  MoveRecordSchema,
  GameStateSchema,
  GameStatsSchema,
  GameModeSchema,
  OpponentModeSchema,
  AISourceSchema,
  MoveEvaluationSchema,
  DiagnosticsSchema,
  TimingsSchema,
  AIResponseSchema,
  ServerAIResponseSchema,
  GameConstants,
} from './schemas';

import { GameConstants } from './schemas';

export const ROSETTE_SQUARES = GameConstants.ROSETTE_SQUARES;
export const TRACK_LENGTH = GameConstants.TRACK_LENGTH;
export const PIECES_PER_PLAYER = GameConstants.PIECES_PER_PLAYER;
export const PLAYER1_TRACK = GameConstants.PLAYER1_TRACK;
export const PLAYER2_TRACK = GameConstants.PLAYER2_TRACK;
