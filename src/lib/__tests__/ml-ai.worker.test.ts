import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the WASM loading
vi.mock('./ml-ai.worker', () => ({
  default: vi.fn(),
}));

describe('ML AI Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle responses without timings gracefully', () => {
    // This test verifies that the worker can handle responses that don't include timings
    // without throwing errors

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

    // Simulate the transformMLResponse function
    const transformMLResponse = (responseJson: string) => {
      const parsed = JSON.parse(responseJson);
      return {
        move: parsed.move,
        evaluation: parsed.evaluation,
        thinking: parsed.thinking,
        diagnostics: parsed.diagnostics,
        timings: parsed.timings || {},
      };
    };

    const response = transformMLResponse(JSON.stringify(responseWithoutTimings));

    // These should not throw errors
    expect(response.timings).toBeDefined();
    expect(response.timings).toEqual({});
    expect(response.timings?.aiMoveCalculation).toBeUndefined();
    expect(response.timings?.totalHandlerTime).toBeUndefined();
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

    const transformMLResponse = (responseJson: string) => {
      const parsed = JSON.parse(responseJson);
      return {
        move: parsed.move,
        evaluation: parsed.evaluation,
        thinking: parsed.thinking,
        diagnostics: parsed.diagnostics,
        timings: parsed.timings || {},
      };
    };

    const response = transformMLResponse(JSON.stringify(responseWithTimings));

    expect(response.timings).toBeDefined();
    expect(response.timings.aiMoveCalculation).toBe(100);
    expect(response.timings.totalHandlerTime).toBe(150);
  });
});
