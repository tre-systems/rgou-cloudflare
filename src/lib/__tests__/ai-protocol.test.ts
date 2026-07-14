import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MLWeightsSchema, parseMLAIResponseJson, parseServerAIResponseJson } from '../ai-protocol';

describe('AI protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle responses without timings gracefully', () => {
    const responseWithoutTimings = {
      move: 0,
      evaluation: 0.5,
      thinking: 'Test move',
      diagnostics: {
        valid_moves: [0, 1],
        move_evaluations: [],
        value_network_output: 0.5,
        policy_network_outputs: [0.5, 0.5],
      },
    };

    const response = parseMLAIResponseJson(JSON.stringify(responseWithoutTimings));

    expect(response.timings).toEqual({ aiMoveCalculation: 0, totalHandlerTime: 0 });
  });

  it('should handle responses with timings correctly', () => {
    const responseWithTimings = {
      move: 0,
      evaluation: 0.5,
      thinking: 'Test move',
      diagnostics: {
        valid_moves: [0, 1],
        move_evaluations: [],
        value_network_output: 0.5,
        policy_network_outputs: [0.5, 0.5],
      },
      timings: {
        aiMoveCalculation: 100,
        totalHandlerTime: 150,
      },
    };

    const response = parseMLAIResponseJson(JSON.stringify(responseWithTimings));

    expect(response.timings).toBeDefined();
    expect(response.timings.aiMoveCalculation).toBe(100);
    expect(response.timings.totalHandlerTime).toBe(150);
  });

  it('rejects malformed WASM responses at the adapter boundary', () => {
    expect(() =>
      parseMLAIResponseJson(
        JSON.stringify({
          move: 99,
          evaluation: 0,
          thinking: 'invalid',
          diagnostics: {
            valid_moves: [],
            move_evaluations: [],
            value_network_output: 0,
            policy_network_outputs: [],
          },
        })
      )
    ).toThrow();
  });

  it('validates Classic AI responses from Rust', () => {
    const response = parseServerAIResponseJson(
      JSON.stringify({
        move: 1,
        evaluation: 12,
        thinking: 'searched',
        timings: { aiMoveCalculation: 4, totalHandlerTime: 5 },
        diagnostics: {
          searchDepth: 4,
          validMoves: [1],
          moveEvaluations: [],
          transpositionHits: 2,
          nodesEvaluated: 10,
        },
      })
    );

    expect(response.move).toBe(1);
    expect(response.diagnostics.searchDepth).toBe(4);
  });

  it('validates downloaded model weights before loading WASM', () => {
    expect(MLWeightsSchema.safeParse({ value_weights: [0.1], policy_weights: [0.2] }).success).toBe(
      true
    );
    expect(MLWeightsSchema.safeParse({ value_weights: [], policy_weights: [] }).success).toBe(
      false
    );
  });
});
