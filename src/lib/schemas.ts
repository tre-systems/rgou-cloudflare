import { z } from 'zod';

export const PlayerSchema = z.enum(['player1', 'player2']);
export type Player = z.infer<typeof PlayerSchema>;

export const MoveTypeSchema = z.enum(['move', 'capture', 'rosette', 'finish']);
export type MoveType = z.infer<typeof MoveTypeSchema>;

export const GameStatusSchema = z.enum(['waiting', 'playing', 'finished']);
export type GameStatus = z.infer<typeof GameStatusSchema>;

export const PiecePositionSchema = z
  .object({
    square: z.number(),
    player: PlayerSchema,
  })
  .refine(val => val.square === -1 || val.square === 20 || (val.square >= 0 && val.square < 21), {
    message: 'square must be -1 (start), 0-20 (board), or 20 (finished)',
    path: ['square'],
  });
export type PiecePosition = z.infer<typeof PiecePositionSchema>;

export const MoveRecordSchema = z.object({
  player: PlayerSchema,
  diceRoll: z.number(),
  pieceIndex: z.number(),
  fromSquare: z.number(),
  toSquare: z.number(),
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

export const MoveSchema = z.object({
  pieceIndex: z.number(),
  diceRoll: z.number(),
  player: PlayerSchema,
  newSquare: z.number(),
  moveType: MoveTypeSchema.nullable(),
});
export type Move = z.infer<typeof MoveSchema>;

export const GameStatsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  gamesPlayed: z.number(),
});
export type GameStats = z.infer<typeof GameStatsSchema>;

export const GameModeSchema = z.enum(['play', 'watch']);
export type GameMode = z.infer<typeof GameModeSchema>;

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ROLL_DICE') }),
  z.object({ type: z.literal('MAKE_MOVE'), move: MoveSchema }),
  z.object({ type: z.literal('RESET_GAME') }),
  z.object({ type: z.literal('AI_MOVE'), move: MoveSchema }),
]);
export type GameAction = z.infer<typeof GameActionSchema>;

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
  aiType: z.enum(['client', 'server', 'fallback', 'ml']),
});
export type AIResponse = z.infer<typeof AIResponseSchema>;

export const ServerAIResponseSchema = AIResponseSchema.omit({ aiType: true });
export type ServerAIResponse = z.infer<typeof ServerAIResponseSchema>;

export const SaveGamePayloadSchema = z.object({
  winner: PlayerSchema,
  history: z.array(MoveRecordSchema),
  playerId: z.string(),
  moveCount: z.number().optional(),
  duration: z.number().optional(),
  clientHeader: z.string().optional(),
  gameType: z.string().default('standard'),
  ai1Version: z.string().optional(),
  ai2Version: z.string().optional(),
  gameVersion: z.string().optional(),
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
