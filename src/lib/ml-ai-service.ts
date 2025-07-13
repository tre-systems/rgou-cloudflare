import type { GameState } from './schemas';

interface MLWeights {
  value_weights: number[];
  policy_weights: number[];
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
    ai_move_calculation: number;
    total_handler_time: number;
  };
}

type PendingRequestType =
  | { type: 'loadWeights'; resolve: (value: void) => void; reject: (reason?: unknown) => void }
  | { type: 'getAIMove'; resolve: (value: MLResponse) => void; reject: (reason?: unknown) => void }
  | {
      type: 'evaluatePosition';
      resolve: (value: { evaluation: number; status: string; currentPlayer: string }) => void;
      reject: (reason?: unknown) => void;
    }
  | { type: 'getInfo'; resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  | { type: 'rollDice'; resolve: (value: number) => void; reject: (reason?: unknown) => void };

class MLAIService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<number, PendingRequestType>();

  constructor() {
    this.init();
  }

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          return resolve();
        }
        this.worker = new Worker(new URL('./ml-ai.worker.ts', import.meta.url), {
          type: 'module',
        });
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            resolve();
          } else if (event.data.type === 'success' || event.data.type === 'error') {
            const promise = this.pendingRequests.get(event.data.id);
            if (promise) {
              if (event.data.type === 'success') {
                // Type-safe resolve
                (promise.resolve as (value: unknown) => void)(event.data.response);
              } else {
                promise.reject(new Error(event.data.error));
              }
              this.pendingRequests.delete(event.data.id);
            }
          }
        };
        const handleError = (error: ErrorEvent) => {
          reject(new Error(`ML AI Worker failed to initialize: ${error.message}`));
        };
        this.worker.onmessage = handleMessage;
        this.worker.onerror = handleError;
      });
    }
    return this.initPromise;
  }

  private async ensureWorkerReady(): Promise<void> {
    if (!this.initPromise) {
      this.init();
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
    return promise;
  }

  async getAIMove(gameState: GameState): Promise<MLResponse> {
    await this.ensureWorkerReady();
    const messageId = this.messageCounter++;
    const promise = new Promise<MLResponse>((resolve, reject) => {
      this.pendingRequests.set(messageId, { type: 'getAIMove', resolve, reject });
    });
    this.worker!.postMessage({ id: messageId, type: 'getAIMove', gameState });
    return promise;
  }

  async evaluatePosition(
    gameState: GameState
  ): Promise<{ evaluation: number; status: string; currentPlayer: string }> {
    await this.ensureWorkerReady();
    const messageId = this.messageCounter++;
    const promise = new Promise<{ evaluation: number; status: string; currentPlayer: string }>(
      (resolve, reject) => {
        this.pendingRequests.set(messageId, { type: 'evaluatePosition', resolve, reject });
      }
    );
    this.worker!.postMessage({ id: messageId, type: 'evaluatePosition', gameState });
    return promise;
  }

  async getInfo(): Promise<unknown> {
    await this.ensureWorkerReady();
    const messageId = this.messageCounter++;
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pendingRequests.set(messageId, { type: 'getInfo', resolve, reject });
    });
    this.worker!.postMessage({ id: messageId, type: 'getInfo' });
    return promise;
  }

  async rollDice(): Promise<number> {
    await this.ensureWorkerReady();
    const messageId = this.messageCounter++;
    const promise = new Promise<number>((resolve, reject) => {
      this.pendingRequests.set(messageId, { type: 'rollDice', resolve, reject });
    });
    this.worker!.postMessage({ id: messageId, type: 'rollDice' });
    return promise;
  }
}

export const mlAiService = new MLAIService();
