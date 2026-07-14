import { z } from 'zod';
import {
  PlayerSchema,
  EngineAIResponseSchema,
  type GameState,
  type EngineAIResponse,
} from './schemas';

const PieceSquareSchema = z.number().int().min(-1).max(20);

export const AIEngineSchema = z.enum(['classic', 'heuristic', 'ml']);
export type AIEngine = z.infer<typeof AIEngineSchema>;

export const AIPositionSchema = z.object({
  player1Squares: z.array(PieceSquareSchema).length(7),
  player2Squares: z.array(PieceSquareSchema).length(7),
  currentPlayer: PlayerSchema,
  diceRoll: z.number().int().min(0).max(4),
});
export type AIPosition = z.infer<typeof AIPositionSchema>;

export const AIWorkerRequestSchema = z.object({
  id: z.number().int().nonnegative(),
  type: z.literal('getMove'),
  engine: AIEngineSchema,
  position: AIPositionSchema,
});
export type AIWorkerRequest = z.infer<typeof AIWorkerRequestSchema>;

export const AIWorkerResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('success'),
    id: z.number().int().nonnegative(),
    engine: AIEngineSchema,
    response: z.unknown(),
  }),
  z.object({
    type: z.literal('error'),
    id: z.number().int().nonnegative(),
    error: z.string(),
  }),
]);
export type AIWorkerResponse = z.infer<typeof AIWorkerResponseSchema>;

export function toAIPosition(gameState: GameState): AIPosition {
  if (gameState.diceRoll === null) {
    throw new Error('An AI position requires a dice roll');
  }

  return AIPositionSchema.parse({
    player1Squares: gameState.player1Pieces.map(piece => piece.square),
    player2Squares: gameState.player2Pieces.map(piece => piece.square),
    currentPlayer: gameState.currentPlayer,
    diceRoll: gameState.diceRoll,
  });
}

export function toWasmGameState(position: AIPosition) {
  return {
    player1Pieces: position.player1Squares.map(square => ({ square })),
    player2Pieces: position.player2Squares.map(square => ({ square })),
    currentPlayer: position.currentPlayer === 'player1' ? 'Player1' : 'Player2',
    diceRoll: position.diceRoll,
  };
}

const VALUE_WEIGHT_COUNT = 81_921;
const POLICY_WEIGHT_COUNT = 82_119;
const HiddenSizesSchema = z.tuple([
  z.literal(256),
  z.literal(128),
  z.literal(64),
  z.literal(32),
]);
const FlatNetworkConfigSchema = z.object({
  input_size: z.literal(150),
  hidden_sizes: HiddenSizesSchema,
  value_output_size: z.literal(1),
  policy_output_size: z.literal(7),
});
const DualNetworkConfigSchema = z.object({
  value_network: z.object({
    input_size: z.literal(150),
    hidden_sizes: HiddenSizesSchema,
    output_size: z.literal(1),
  }),
  policy_network: z.object({
    input_size: z.literal(150),
    hidden_sizes: HiddenSizesSchema,
    output_size: z.literal(7),
  }),
});

export const MLWeightsSchema = z.object({
  value_weights: z.array(z.number().finite()).length(VALUE_WEIGHT_COUNT),
  policy_weights: z.array(z.number().finite()).length(POLICY_WEIGHT_COUNT),
  metadata: z.object({
    version: z.string().min(1),
    training_date: z.string().min(1),
    num_games: z.number().int().positive(),
    num_training_samples: z.number().int().positive(),
    seed: z.number().int(),
    best_validation_loss: z.number().finite().nonnegative(),
  }),
  network_config: z.union([FlatNetworkConfigSchema, DualNetworkConfigSchema]),
});

export type MLWeights = z.infer<typeof MLWeightsSchema>;

const MLMoveEvaluationSchema = z.object({
  piece_index: z.number().int().min(0).max(6),
  score: z.number().finite(),
  move_type: z.string(),
  from_square: z.number().int().min(-1).max(20),
  to_square: z.number().int().min(0).max(20).optional(),
});

export const MLAIResponseSchema = z.object({
  move: z.number().int().min(0).max(6).nullable(),
  evaluation: z.number().finite(),
  thinking: z.string(),
  diagnostics: z.object({
    valid_moves: z.array(z.number().int().min(0).max(6)).max(7),
    move_evaluations: z.array(MLMoveEvaluationSchema).max(7),
    value_network_output: z.number().finite(),
    policy_network_outputs: z.array(z.number().finite()),
  }),
  timings: z
    .object({
      aiMoveCalculation: z.number().finite().nonnegative().default(0),
      totalHandlerTime: z.number().finite().nonnegative().default(0),
    })
    .default({ aiMoveCalculation: 0, totalHandlerTime: 0 }),
});

export type MLAIResponse = z.infer<typeof MLAIResponseSchema>;

export function parseEngineAIResponseJson(value: string): EngineAIResponse {
  return EngineAIResponseSchema.parse(JSON.parse(value) as unknown);
}

export function parseMLAIResponseJson(value: string): MLAIResponse {
  return MLAIResponseSchema.parse(JSON.parse(value) as unknown);
}
