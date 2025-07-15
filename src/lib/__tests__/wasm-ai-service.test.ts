import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WasmAiService } from '../wasm-ai-service';
import { createTestGameState } from './test-utils';

describe('WasmAiService', () => {
  let originalWorker: typeof global.Worker;

  beforeEach(() => {
    originalWorker = global.Worker;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.Worker = originalWorker;
    vi.restoreAllMocks();
  });

  it('should use fallback random move if worker fails', async () => {
    global.Worker = vi.fn().mockImplementation(() => {
      return {
        postMessage: () => {
          throw new Error('Worker error');
        },
        onmessage: null,
        onerror: null,
      };
    });

    const wasmAiService = new WasmAiService();

    const gameState = createTestGameState({
      canMove: true,
      validMoves: [1, 2, 3],
    });

    // Simulate error in getAIMove
    const result = await wasmAiService.getAIMove(gameState);
    expect([1, 2, 3]).toContain(result.move);
    expect(result.thinking).toContain('Fallback');
  });

  it('should throw if no valid moves and worker fails', async () => {
    global.Worker = vi.fn().mockImplementation(() => {
      return {
        postMessage: () => {
          throw new Error('Worker error');
        },
        onmessage: null,
        onerror: null,
      };
    });

    const wasmAiService = new WasmAiService();

    const gameState = createTestGameState({
      canMove: false,
      validMoves: [],
    });

    await expect(wasmAiService.getAIMove(gameState)).rejects.toThrow('Failed to get AI move');
  });
});
