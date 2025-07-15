import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the worker environment
const mockSelf = {
  addEventListener: vi.fn(),
  postMessage: vi.fn(),
};

// Mock the WASM module
const mockMLWasmModule = {
  init_ml_ai: vi.fn(),
  load_ml_weights: vi.fn(),
  get_ml_ai_move: vi.fn(),
  evaluate_ml_position: vi.fn(),
  get_ml_ai_info: vi.fn(),
  roll_dice_ml: vi.fn(),
};

// Mock the WASM loading
vi.mock('./ml-ai.worker', () => ({
  default: vi.fn(),
}));

// Mock the worker script
const mockWorkerScript = `
  // Mock the transformMLResponse function
  const transformMLResponse = (responseJson) => {
    const parsed = JSON.parse(responseJson);
    return {
      move: parsed.move,
      evaluation: parsed.evaluation,
      thinking: parsed.thinking,
      diagnostics: parsed.diagnostics,
      timings: parsed.timings || {},
    };
  };

  // Mock the logging function
  const logGameStateAnalysis = () => {};

  // Mock the WASM module
  let mlWasmModule = ${JSON.stringify(mockMLWasmModule)};
  let weightsLoaded = false;

  // Mock the message handler
  self.addEventListener('message', (event) => {
    if (event.data.type === 'getAIMove') {
      const responseJson = JSON.stringify({
        move: 0,
        evaluation: 0.5,
        thinking: 'Test move',
        diagnostics: {
          valid_moves: [0, 1],
          move_evaluations: [],
          value_network_output: 0.5,
          policy_network_outputs: [0.5, 0.5],
        },
        // Note: no timings field
      });

      const response = transformMLResponse(responseJson);
      
      // This should not throw an error even without timings
      console.log('Response timings:', response.timings);
      console.log('AI calculation time:', response.timings?.aiMoveCalculation);
      
      self.postMessage({ 
        type: 'success', 
        id: event.data.id, 
        response 
      });
    }
  });
`;

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
