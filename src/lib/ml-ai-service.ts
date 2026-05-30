import type { GameState } from './schemas';
import pako from 'pako';

interface MLWeights {
  value_weights: number[];
  policy_weights: number[];
  value_network_config?: {
    input_size: number;
    hidden_sizes: number[];
    output_size: number;
  };
  policy_network_config?: {
    input_size: number;
    hidden_sizes: number[];
    output_size: number;
  };
}

interface MLResponse {
  move: number | null;
  evaluation: number;
  thinking: string;
  diagnostics: {
    valid_moves: number[];
    move_evaluations: Array<{
      piece_index: number;
      score: number;
      move_type: string;
      from_square: number;
      to_square?: number;
    }>;
    value_network_output: number;
    policy_network_outputs: number[];
  };
  timings: {
    aiMoveCalculation: number;
    totalHandlerTime: number;
  };
}

type PendingRequestType =
  | { type: 'loadWeights'; resolve: (value: void) => void; reject: (reason?: unknown) => void }
  | { type: 'getAIMove'; resolve: (value: MLResponse) => void; reject: (reason?: unknown) => void };

export class MLAIService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<number, PendingRequestType>();
  private weightsLoaded = false;

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          return resolve();
        }

        this.worker = new Worker(new URL('./ml-ai.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            resolve();
          } else if (event.data.type === 'success' || event.data.type === 'error') {
            const promise = this.pendingRequests.get(event.data.id);
            if (promise) {
              if (event.data.type === 'success') {
                (promise.resolve as (value: unknown) => void)(event.data.response);
              } else {
                console.error('ML AI Service: request failed:', event.data.id, event.data.error);
                promise.reject(new Error(event.data.error));
              }
              this.pendingRequests.delete(event.data.id);
            }
          }
        };

        this.worker.onerror = (error: ErrorEvent) => {
          console.error('ML AI Service: worker error:', error);
          reject(new Error(`ML AI Worker failed to initialize: ${error.message}`));
        };
      });
    }
    return this.initPromise;
  }

  private async ensureWorkerReady(): Promise<void> {
    if (!this.initPromise) {
      this.init();
      await this.loadDefaultWeights();
    }
    await this.initPromise;
    if (!this.worker) {
      throw new Error('ML AI Worker not initialized.');
    }
  }

  async loadWeights(weights: MLWeights): Promise<void> {
    await this.ensureWorkerReady();
    const messageId = this.messageCounter++;
    const promise = new Promise<void>((resolve, reject) => {
      this.pendingRequests.set(messageId, { type: 'loadWeights', resolve, reject });
    });

    this.worker!.postMessage({ id: messageId, type: 'loadWeights', weights });

    await promise;
    this.weightsLoaded = true;
  }

  async getAIMove(gameState: GameState): Promise<MLResponse> {
    try {
      await this.ensureWorkerReady();

      if (!this.weightsLoaded) {
        console.warn('ML AI Service: weights not loaded, using untrained networks');
      }

      const messageId = this.messageCounter++;
      const promise = new Promise<MLResponse>((resolve, reject) => {
        this.pendingRequests.set(messageId, { type: 'getAIMove', resolve, reject });
      });

      this.worker!.postMessage({ id: messageId, type: 'getAIMove', gameState });

      return await promise;
    } catch (error) {
      console.error('ML AI Service: error getting AI move:', error);

      if (gameState.validMoves.length > 0) {
        const fallbackMove =
          gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
        console.warn('ML AI Service: using fallback random move:', fallbackMove);
        return {
          move: fallbackMove,
          evaluation: 0,
          thinking: 'Fallback: Random move due to ML AI error',
          diagnostics: {
            valid_moves: gameState.validMoves,
            move_evaluations: [],
            value_network_output: 0,
            policy_network_outputs: [],
          },
          timings: {
            aiMoveCalculation: 0,
            totalHandlerTime: 0,
          },
        };
      }

      throw new Error(`Failed to get ML AI move: ${error}`);
    }
  }

  private async loadDefaultWeights(): Promise<void> {
    try {
      let response = await fetch('/ml-weights.json.gz');
      if (response.ok) {
        const compressedData = await response.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
        const weights = JSON.parse(decompressedData) as MLWeights;
        await this.loadWeights(weights);
        return;
      }

      response = await fetch('/ml-weights.json');
      if (response.ok) {
        const weights = (await response.json()) as MLWeights;
        await this.loadWeights(weights);
      } else {
        console.warn('ML AI Service: no default weights found, using untrained networks');
      }
    } catch (error) {
      console.error('ML AI Service: failed to load default weights:', error);
    }
  }
}
