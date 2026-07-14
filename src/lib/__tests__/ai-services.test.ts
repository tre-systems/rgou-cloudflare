import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeGame, processDiceRoll } from '../game-logic';
import { MLAIService } from '../ml-ai-service';
import { WasmAiService } from '../wasm-ai-service';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('../ai-worker-client', () => ({
  aiWorkerClient: { request: requestMock },
}));

const gameState = processDiceRoll(
  initializeGame(() => 0.1),
  2
);
const engineResponse = {
  move: 0,
  evaluation: 10,
  thinking: 'tested',
  timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
  diagnostics: {
    searchDepth: 4,
    validMoves: [0],
    moveEvaluations: [],
    transpositionHits: 0,
    nodesEvaluated: 1,
  },
};

describe('AI service adapters', () => {
  beforeEach(() => requestMock.mockReset());

  it('routes Classic and heuristic requests through the shared client', async () => {
    requestMock.mockResolvedValue(engineResponse);
    const service = new WasmAiService();

    await expect(service.getAIMove(gameState)).resolves.toEqual(engineResponse);
    expect(requestMock).toHaveBeenLastCalledWith('classic', gameState);

    await expect(service.getHeuristicAIMove(gameState)).resolves.toEqual(engineResponse);
    expect(requestMock).toHaveBeenLastCalledWith('heuristic', gameState);
  });

  it('validates ML responses returned by the shared client', async () => {
    const response = {
      move: 0,
      evaluation: 0.5,
      thinking: 'tested',
      diagnostics: {
        valid_moves: [0],
        move_evaluations: [],
        value_network_output: 0.5,
        policy_network_outputs: [1],
      },
      timings: { aiMoveCalculation: 1, totalHandlerTime: 1 },
    };
    requestMock.mockResolvedValue(response);

    await expect(new MLAIService().getAIMove(gameState)).resolves.toEqual(response);
    expect(requestMock).toHaveBeenCalledWith('ml', gameState);
  });

  it('rejects malformed engine responses at the adapter boundary', async () => {
    requestMock.mockResolvedValue({ move: 99 });

    await expect(new WasmAiService().getAIMove(gameState)).rejects.toThrow();
    await expect(new MLAIService().getAIMove(gameState)).rejects.toThrow();
  });
});
