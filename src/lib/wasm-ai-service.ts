import { ServerAIResponseSchema, type GameState, type ServerAIResponse } from './schemas';

type PendingRequest = {
  resolve: (value: ServerAIResponse) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const AI_REQUEST_TIMEOUT_MS = 30_000;

export class WasmAiService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<number, PendingRequest>();

  constructor() {
    this.init();
  }

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          return resolve();
        }

        this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            resolve();
          } else if (event.data.type === 'success' || event.data.type === 'error') {
            const promise = this.pendingRequests.get(event.data.id);
            if (promise) {
              clearTimeout(promise.timeout);
              try {
                if (event.data.type === 'success') {
                  promise.resolve(ServerAIResponseSchema.parse(event.data.response));
                } else {
                  promise.reject(new Error(event.data.error));
                }
              } catch (error) {
                promise.reject(error);
              } finally {
                this.pendingRequests.delete(event.data.id);
              }
            } else if (event.data.type === 'error' && event.data.id === -1) {
              reject(new Error(event.data.error));
            }
          }
        };

        this.worker.onerror = (error: ErrorEvent) => {
          console.error('AI Worker failed to initialize:', error.message, error);
          const workerError = new Error(`AI Worker failed to initialize: ${error.message}`);
          for (const pending of this.pendingRequests.values()) {
            clearTimeout(pending.timeout);
            pending.reject(workerError);
          }
          this.pendingRequests.clear();
          reject(workerError);
        };
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
      throw new Error('AI Worker not initialized.');
    }
  }

  private async request(
    gameState: GameState,
    type: 'classic' | 'heuristic',
    fallbackSearchDepth: number
  ): Promise<ServerAIResponse> {
    try {
      await this.ensureWorkerReady();

      const messageId = this.messageCounter++;
      const promise = new Promise<ServerAIResponse>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(messageId);
          reject(new Error(`${type} AI request timed out`));
        }, AI_REQUEST_TIMEOUT_MS);
        this.pendingRequests.set(messageId, { resolve, reject, timeout });
      });

      this.worker!.postMessage(
        type === 'heuristic'
          ? { id: messageId, gameState, type: 'heuristic' }
          : { id: messageId, gameState }
      );

      return await promise;
    } catch (error) {
      console.error(`WasmAiService: error getting ${type} AI move:`, error);

      if (gameState.validMoves.length > 0) {
        const fallbackMove =
          gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
        console.warn('WasmAiService: using fallback random move:', fallbackMove);
        return {
          move: fallbackMove,
          evaluation: 0,
          thinking: 'Fallback: Random move due to worker error',
          diagnostics: {
            validMoves: gameState.validMoves,
            moveEvaluations: [],
            searchDepth: fallbackSearchDepth,
            transpositionHits: 0,
            nodesEvaluated: 0,
          },
          timings: {
            aiMoveCalculation: 0,
            totalHandlerTime: 0,
          },
        };
      }

      throw new Error(`Failed to get ${type} AI move: ${error}`);
    }
  }

  getAIMove(gameState: GameState): Promise<ServerAIResponse> {
    return this.request(gameState, 'classic', 4);
  }

  getHeuristicAIMove(gameState: GameState): Promise<ServerAIResponse> {
    return this.request(gameState, 'heuristic', 0);
  }
}
