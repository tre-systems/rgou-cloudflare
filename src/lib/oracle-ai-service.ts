import { aiWorkerClient } from './ai-worker-client';
import { OracleAIResponseSchema, type OracleAIResponse } from './ai-protocol';
import type { GameState } from './schemas';

export class OracleAIService {
  async getAIMove(gameState: GameState): Promise<OracleAIResponse> {
    return OracleAIResponseSchema.parse(await aiWorkerClient.request('oracle', gameState));
  }
}
