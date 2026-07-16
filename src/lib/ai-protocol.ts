import { z } from 'zod';
import {
  PlayerSchema,
  MoveTypeSchema,
  EngineAIResponseSchema,
  type GameState,
  type EngineAIResponse,
} from './schemas';

const PieceSquareSchema = z.number().int().min(-1).max(20);

export const AIEngineSchema = z.enum(['classic', 'heuristic', 'ml', 'oracle']);
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
const HiddenSizesSchema = z.tuple([z.literal(256), z.literal(128), z.literal(64), z.literal(32)]);
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
  weight_layout: z.literal('input-output-row-major-v1'),
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

export function parseMLWeights(value: unknown): MLWeights {
  const parsed = MLWeightsSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error('ML model artifact does not match the runtime architecture');
  }
  return parsed.data;
}

const SHA256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const OracleHiddenSizesSchema = z.tuple([z.literal(128), z.literal(128), z.literal(64)]);
const OracleMetricsSchema = z.object({
  mae: z.number().finite().nonnegative(),
  rmse: z.number().finite().nonnegative(),
  p95_absolute_error: z.number().finite().nonnegative(),
  max_absolute_error: z.number().finite().nonnegative(),
});

const OracleCandidateSchema = z.object({
  hidden_sizes: OracleHiddenSizesSchema,
  loss: z.enum(['huber', 'mse']),
  seed: z.number().int(),
  completed_epochs: z.number().int().positive(),
  training_time_seconds: z.number().finite().positive(),
  validation: OracleMetricsSchema,
  test: OracleMetricsSchema,
});

const ORACLE_WEIGHT_COUNT = 29_057;

export const OracleWeightsSchema = z.object({
  weights: z.array(z.number().finite()).length(ORACLE_WEIGHT_COUNT),
  metadata: z
    .object({
      version: z.literal('oracle_v1'),
      training_date: z.string().datetime({ offset: true }),
      source_revision: z.string().regex(/^[a-f0-9]{40}$/),
      training_config_sha256: SHA256Schema,
      training_script_sha256: SHA256Schema,
      encoding_script_sha256: SHA256Schema,
      tablebase_sha256: SHA256Schema,
      tablebase_entries: z.literal(137_892_016),
      feature_schema: z.literal('canonical-finkel-v1'),
      training_samples: z.number().int().positive(),
      validation_samples: z.number().int().positive(),
      test_samples: z.number().int().positive(),
      sample_seed: z.number().int(),
      sample_keys_sha256: SHA256Schema,
      selected_candidate: OracleCandidateSchema,
    })
    .passthrough(),
  network_config: z.object({
    input_size: z.literal(32),
    hidden_sizes: OracleHiddenSizesSchema,
    output_size: z.literal(1),
  }),
});

export type OracleWeights = z.infer<typeof OracleWeightsSchema>;

export function parseOracleWeights(value: unknown): OracleWeights {
  const parsed = OracleWeightsSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error('Oracle model artifact does not match the runtime architecture');
  }
  return parsed.data;
}

const MLMoveEvaluationSchema = z.object({
  piece_index: z.number().int().min(0).max(6),
  score: z.number().finite(),
  move_type: MoveTypeSchema,
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
export const OracleAIResponseSchema = MLAIResponseSchema;
export type OracleAIResponse = MLAIResponse;

export function parseEngineAIResponseJson(value: string): EngineAIResponse {
  return EngineAIResponseSchema.parse(JSON.parse(value) as unknown);
}

export function parseMLAIResponseJson(value: string): MLAIResponse {
  return MLAIResponseSchema.parse(JSON.parse(value) as unknown);
}

export function parseOracleAIResponseJson(value: string): OracleAIResponse {
  return OracleAIResponseSchema.parse(JSON.parse(value) as unknown);
}
