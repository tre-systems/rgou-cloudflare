import { z } from 'zod';
import { ServerAIResponseSchema, type ServerAIResponse } from './schemas';

export const MLWeightsSchema = z.object({
  value_weights: z.array(z.number().finite()).min(1),
  policy_weights: z.array(z.number().finite()).min(1),
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

export function parseServerAIResponseJson(value: string): ServerAIResponse {
  return ServerAIResponseSchema.parse(JSON.parse(value) as unknown);
}

export function parseMLAIResponseJson(value: string): MLAIResponse {
  return MLAIResponseSchema.parse(JSON.parse(value) as unknown);
}
