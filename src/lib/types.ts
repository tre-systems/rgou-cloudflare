export type {
  Player,
  MoveType,
  GameStatus,
  PiecePosition,
  MoveRecord,
  GameState,
  Move,
  GameStats,
  GameMode,
  GameAction,
  MoveEvaluation,
  Diagnostics,
  Timings,
  AIResponse,
  ServerAIResponse,
  SaveGamePayload,
} from './schemas';

export {
  PlayerSchema,
  MoveTypeSchema,
  GameStatusSchema,
  PiecePositionSchema,
  MoveRecordSchema,
  GameStateSchema,
  MoveSchema,
  GameStatsSchema,
  GameModeSchema,
  GameActionSchema,
  MoveEvaluationSchema,
  DiagnosticsSchema,
  TimingsSchema,
  AIResponseSchema,
  ServerAIResponseSchema,
  SaveGamePayloadSchema,
  GameConstants,
} from './schemas';

import { GameConstants } from './schemas';

export const ROSETTE_SQUARES = GameConstants.ROSETTE_SQUARES;
export const TRACK_LENGTH = GameConstants.TRACK_LENGTH;
export const PIECES_PER_PLAYER = GameConstants.PIECES_PER_PLAYER;
export const PLAYER1_TRACK = GameConstants.PLAYER1_TRACK;
export const PLAYER2_TRACK = GameConstants.PLAYER2_TRACK;
