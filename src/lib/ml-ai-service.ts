import { aiWorkerClient } from './ai-worker-client';
import { MLAIResponseSchema, type MLAIResponse } from './ai-protocol';
import type { GameState } from './schemas';

export class MLAIService {
  async getAIMove(gameState: GameState): Promise<MLAIResponse> {
    return MLAIResponseSchema.parse(await aiWorkerClient.request('ml', gameState));
  }
}
