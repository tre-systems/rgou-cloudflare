import { aiWorkerClient } from './ai-worker-client';
import { EngineAIResponseSchema, type EngineAIResponse, type GameState } from './schemas';

export class WasmAiService {
  private async request(
    gameState: GameState,
    type: 'classic' | 'heuristic'
  ): Promise<EngineAIResponse> {
    return EngineAIResponseSchema.parse(await aiWorkerClient.request(type, gameState));
  }

  getAIMove(gameState: GameState): Promise<EngineAIResponse> {
    return this.request(gameState, 'classic');
  }

  getHeuristicAIMove(gameState: GameState): Promise<EngineAIResponse> {
    return this.request(gameState, 'heuristic');
  }
}
