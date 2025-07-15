import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MLAIService } from '../ml-ai-service';
import { createTestGameState } from './test-utils';

// Helper to create a new instance for each test
function createMLAIServiceInstance() {
  return new MLAIService();
}

describe('MLAIService', () => {
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

    const mlAiService = createMLAIServiceInstance();

    const gameState = createTestGameState({
      canMove: true,
      validMoves: [4, 5, 6],
    });

    const result = await mlAiService.getAIMove(gameState);
    expect([4, 5, 6]).toContain(result.move);
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

    const mlAiService = createMLAIServiceInstance();

    const gameState = createTestGameState({
      canMove: false,
      validMoves: [],
    });

    await expect(mlAiService.getAIMove(gameState)).rejects.toThrow('Failed to get ML AI move');
  });
});
