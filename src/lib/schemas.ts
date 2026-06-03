import { z } from 'zod';

const MAX_SAVE_GAME_HISTORY = 512;
const MAX_PLAYER_ID_LENGTH = 128;
const MAX_CLIENT_HEADER_LENGTH = 512;
const MAX_GAME_DURATION_MS = 24 * 60 * 60 * 1000;

export const PlayerSchema = z.enum(['player1', 'player2']);
export type Player = z.infer<typeof PlayerSchema>;

export const MoveTypeSchema = z.enum(['move', 'capture', 'rosette', 'finish']);
export type MoveType = z.infer<typeof MoveTypeSchema>;

export const GameStatusSchema = z.enum(['waiting', 'playing', 'finished']);
export type GameStatus = z.infer<typeof GameStatusSchema>;

export const PiecePositionSchema = z
  .object({
    square: z.number().int(),
    player: PlayerSchema,
  })
  .refine(val => val.square === -1 || (val.square >= 0 && val.square <= 20), {
    message: 'square must be -1 (start) or 0-20',
    path: ['square'],
  });
export type PiecePosition = z.infer<typeof PiecePositionSchema>;

export const MoveRecordSchema = z.object({
  player: PlayerSchema,
  diceRoll: z.number().int().min(0).max(4),
  pieceIndex: z.number().int().min(0).max(6),
  fromSquare: z.number().int().min(-1).max(20),
  toSquare: z.number().int().min(0).max(20),
  moveType: MoveTypeSchema.nullable(),
});
export type MoveRecord = z.infer<typeof MoveRecordSchema>;

export const GameStateSchema = z.object({
  board: z.array(PiecePositionSchema.nullable()).length(21),
  player1Pieces: z.array(PiecePositionSchema),
  player2Pieces: z.array(PiecePositionSchema),
  currentPlayer: PlayerSchema,
  gameStatus: GameStatusSchema,
  winner: PlayerSchema.nullable(),
  diceRoll: z.number().nullable(),
  canMove: z.boolean(),
  validMoves: z.array(z.number()),
  history: z.array(MoveRecordSchema),
  startTime: z.number().optional(),
});
export type GameState = z.infer<typeof GameStateSchema>;

export const GameStatsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  gamesPlayed: z.number(),
});
export type GameStats = z.infer<typeof GameStatsSchema>;

export const GameModeSchema = z.enum(['play', 'watch']);
export type GameMode = z.infer<typeof GameModeSchema>;

export const MoveEvaluationSchema = z.object({
  pieceIndex: z.number(),
  score: z.number(),
  moveType: z.string(),
  fromSquare: z.number(),
  toSquare: z.number().nullable(),
});
export type MoveEvaluation = z.infer<typeof MoveEvaluationSchema>;

export const DiagnosticsSchema = z.object({
  searchDepth: z.number(),
  validMoves: z.array(z.number()),
  moveEvaluations: z.array(MoveEvaluationSchema),
  transpositionHits: z.number(),
  nodesEvaluated: z.number(),
});
export type Diagnostics = z.infer<typeof DiagnosticsSchema>;

export const TimingsSchema = z.object({
  aiMoveCalculation: z.number(),
  totalHandlerTime: z.number(),
});
export type Timings = z.infer<typeof TimingsSchema>;

export const AIResponseSchema = z.object({
  move: z.number().nullable(),
  evaluation: z.number(),
  thinking: z.string(),
  timings: TimingsSchema,
  diagnostics: DiagnosticsSchema,
  aiType: z.enum(['client', 'server', 'fallback', 'ml', 'heuristic']),
});
export type AIResponse = z.infer<typeof AIResponseSchema>;

export const ServerAIResponseSchema = AIResponseSchema.omit({ aiType: true });
export type ServerAIResponse = z.infer<typeof ServerAIResponseSchema>;

export const SaveGamePayloadSchema = z.object({
  winner: PlayerSchema,
  history: z.array(MoveRecordSchema).max(MAX_SAVE_GAME_HISTORY),
  playerId: z.string().min(1).max(MAX_PLAYER_ID_LENGTH),
  moveCount: z.number().int().min(0).max(MAX_SAVE_GAME_HISTORY).optional(),
  duration: z.number().int().min(0).max(MAX_GAME_DURATION_MS).optional(),
  clientHeader: z.string().max(MAX_CLIENT_HEADER_LENGTH).optional(),
  gameType: z.enum(['classic', 'ml', 'watch', 'heuristic']).default('classic'),
});
export type SaveGamePayload = z.infer<typeof SaveGamePayloadSchema>;

export const GameConstants = {
  ROSETTE_SQUARES: [0, 7, 13, 15, 16] as const,
  TRACK_LENGTH: 20,
  BOARD_ARRAY_SIZE: 21,
  PIECES_PER_PLAYER: 7,
  PLAYER1_TRACK: [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const,
  PLAYER2_TRACK: [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15] as const,
} as const;
