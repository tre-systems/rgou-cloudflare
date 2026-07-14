import { z } from 'zod';

const MAX_SAVE_GAME_HISTORY = 512;
const MAX_GAME_ID_LENGTH = 128;
const MAX_PLAYER_ID_LENGTH = 128;
const MAX_CLIENT_HEADER_LENGTH = 512;
const MAX_GAME_DURATION_MS = 24 * 60 * 60 * 1000;
const PLAYER1_TRACK = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const PLAYER2_TRACK = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15] as const;

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

export const GameStateSchema = z
  .object({
    board: z.array(PiecePositionSchema.nullable()).length(21),
    player1Pieces: z.array(PiecePositionSchema).length(7),
    player2Pieces: z.array(PiecePositionSchema).length(7),
    currentPlayer: PlayerSchema,
    gameStatus: GameStatusSchema,
    winner: PlayerSchema.nullable(),
    diceRoll: z.number().int().min(0).max(4).nullable(),
    canMove: z.boolean(),
    validMoves: z.array(z.number().int().min(0).max(6)).max(7),
    history: z.array(MoveRecordSchema).max(MAX_SAVE_GAME_HISTORY),
    startTime: z.number().int().nonnegative().optional(),
  })
  .superRefine((state, context) => {
    if ((state.gameStatus === 'finished') !== (state.winner !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'winner must be set only for a finished game',
        path: ['winner'],
      });
    }

    if (
      state.canMove !==
      (state.diceRoll !== null && state.diceRoll > 0 && state.validMoves.length > 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'canMove must match the dice roll and valid moves',
        path: ['canMove'],
      });
    }

    if (new Set(state.validMoves).size !== state.validMoves.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validMoves must not contain duplicates',
        path: ['validMoves'],
      });
    }

    const occupiedSquares = new Set<number>();
    const pieces = [
      ...state.player1Pieces.map((piece, index) => ({ piece, index, player: 'player1' as const })),
      ...state.player2Pieces.map((piece, index) => ({ piece, index, player: 'player2' as const })),
    ];

    for (const { piece, index, player } of pieces) {
      const path = [player === 'player1' ? 'player1Pieces' : 'player2Pieces', index] as const;
      if (piece.player !== player) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${player} pieces must have the matching owner`,
          path: [...path, 'player'],
        });
      }

      const track = player === 'player1' ? PLAYER1_TRACK : PLAYER2_TRACK;
      if (
        piece.square !== -1 &&
        piece.square !== 20 &&
        !(track as readonly number[]).includes(piece.square)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${player} piece is outside its track`,
          path: [...path, 'square'],
        });
      }

      if (piece.square >= 0 && piece.square < 20) {
        const occupant = state.board[piece.square];
        if (occupiedSquares.has(piece.square) || occupant?.player !== player) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'piece positions must match unique board occupants',
            path: [...path, 'square'],
          });
        }
        occupiedSquares.add(piece.square);
      }
    }

    state.board.forEach((occupant, square) => {
      if (
        occupant &&
        (square === 20 || occupant.square !== square || !occupiedSquares.has(square))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'board occupants must match their square',
          path: ['board', square],
        });
      }
    });
  });
export type GameState = z.infer<typeof GameStateSchema>;

export const GameStatsSchema = z
  .object({
    wins: z.number().int().nonnegative(),
    losses: z.number().int().nonnegative(),
    gamesPlayed: z.number().int().nonnegative(),
  })
  .refine(stats => stats.gamesPlayed === stats.wins + stats.losses, {
    message: 'gamesPlayed must equal wins plus losses',
    path: ['gamesPlayed'],
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

export const SaveGamePayloadSchema = z
  .object({
    gameId: z
      .string()
      .trim()
      .min(1)
      .max(MAX_GAME_ID_LENGTH)
      .regex(/^[A-Za-z0-9_-]+$/),
    winner: PlayerSchema,
    history: z.array(MoveRecordSchema).min(1).max(MAX_SAVE_GAME_HISTORY),
    playerId: z
      .string()
      .trim()
      .min(1)
      .max(MAX_PLAYER_ID_LENGTH)
      .regex(/^[A-Za-z0-9_-]+$/),
    moveCount: z.number().int().min(1).max(MAX_SAVE_GAME_HISTORY),
    duration: z.number().int().min(0).max(MAX_GAME_DURATION_MS).optional(),
    clientHeader: z.string().max(MAX_CLIENT_HEADER_LENGTH).optional(),
    gameType: z.enum(['classic', 'ml', 'watch', 'heuristic']).default('classic'),
  })
  .superRefine(({ history, moveCount, winner }, context) => {
    if (moveCount !== history.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'moveCount must match history length',
        path: ['moveCount'],
      });
    }

    const finalMove = history.at(-1);
    if (finalMove?.player !== winner || finalMove.moveType !== 'finish') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'history must end with the winning finish move',
        path: ['history'],
      });
    }
  });
export type SaveGamePayload = z.infer<typeof SaveGamePayloadSchema>;

export const GameConstants = {
  ROSETTE_SQUARES: [0, 7, 13, 15, 16] as const,
  TRACK_LENGTH: 20,
  BOARD_ARRAY_SIZE: 21,
  PIECES_PER_PLAYER: 7,
  PLAYER1_TRACK,
  PLAYER2_TRACK,
} as const;
