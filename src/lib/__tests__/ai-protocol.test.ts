import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AIPositionSchema,
  AIWorkerRequestSchema,
  MLWeightsSchema,
  OracleWeightsSchema,
  parseMLWeights,
  parseMLAIResponseJson,
  parseOracleWeights,
  parseEngineAIResponseJson,
  toAIPosition,
} from '../ai-protocol';
import { initializeGame, processDiceRoll } from '../game-logic';

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

  it('rejects unknown engine move categories', () => {
    expect(() =>
      parseEngineAIResponseJson(
        JSON.stringify({
          move: 0,
          evaluation: 0,
          thinking: 'invalid category',
          timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
          diagnostics: {
            searchDepth: 1,
            validMoves: [0],
            moveEvaluations: [
              {
                pieceIndex: 0,
                score: 0,
                moveType: 'teleport',
                fromSquare: -1,
                toSquare: 3,
              },
            ],
            transpositionHits: 0,
            nodesEvaluated: 1,
          },
        })
      )
    ).toThrow();
  });

  it('validates Classic AI responses from Rust', () => {
    const response = parseEngineAIResponseJson(
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

  it('rejects model artifacts that do not match the runtime architecture', () => {
    expect(MLWeightsSchema.safeParse({ value_weights: [0.1], policy_weights: [0.2] }).success).toBe(
      false
    );
    expect(
      MLWeightsSchema.safeParse({
        value_weights: [],
        policy_weights: [],
        metadata: {
          version: 'test',
          training_date: '2026-01-01',
          num_games: 1,
          num_training_samples: 1,
          seed: 42,
          best_validation_loss: 1,
        },
        network_config: {
          input_size: 149,
          hidden_sizes: [256, 128, 64, 32],
          value_output_size: 1,
          policy_output_size: 7,
        },
      }).success
    ).toBe(false);
  });

  it('accepts the exact production model artifact', () => {
    const artifact = JSON.parse(readFileSync(resolve('public/ml-weights.json'), 'utf8')) as unknown;

    expect(parseMLWeights(artifact).metadata.version).toBeTruthy();
  });

  it('accepts only Oracle artifacts matching the deployed architecture', () => {
    const artifact = JSON.parse(
      readFileSync(resolve('ml/data/weights/oracle_ai_weights_v1.json'), 'utf8')
    ) as unknown;

    expect(parseOracleWeights(artifact).weights).toHaveLength(29_057);
    expect(
      OracleWeightsSchema.safeParse({
        ...(artifact as Record<string, unknown>),
        network_config: { input_size: 31, hidden_sizes: [128, 128, 64], output_size: 1 },
      }).success
    ).toBe(false);
  });

  it('reports an incompatible Oracle model without exposing its validation payload', () => {
    expect(() => parseOracleWeights({ weights: [0] })).toThrow(
      'Oracle model artifact does not match the runtime architecture'
    );
  });

  it('reports an incompatible model without leaking the full validation payload', () => {
    expect(() => parseMLWeights({ network_config: { input_size: 100 } })).toThrow(
      'ML model artifact does not match the runtime architecture'
    );
  });

  it('creates the narrow position contract without board or history data', () => {
    const gameState = processDiceRoll(
      initializeGame(() => 0.1),
      2
    );
    gameState.history.push({
      player: 'player1',
      diceRoll: 1,
      pieceIndex: 0,
      fromSquare: -1,
      toSquare: 3,
      moveType: 'move',
    });

    const position = toAIPosition(gameState);

    expect(AIPositionSchema.parse(position)).toEqual(position);
    expect(position).not.toHaveProperty('board');
    expect(position).not.toHaveProperty('history');
    expect(position.player1Squares).toHaveLength(7);
  });

  it('rejects loose or unknown worker messages', () => {
    expect(
      AIWorkerRequestSchema.safeParse({
        id: 1,
        type: 'getMove',
        engine: 'server',
        position: {},
      }).success
    ).toBe(false);
  });

  it('accepts Oracle as a local worker engine', () => {
    const gameState = processDiceRoll(
      initializeGame(() => 0.1),
      2
    );

    expect(
      AIWorkerRequestSchema.safeParse({
        id: 1,
        type: 'getMove',
        engine: 'oracle',
        position: toAIPosition(gameState),
      }).success
    ).toBe(true);
  });
});
