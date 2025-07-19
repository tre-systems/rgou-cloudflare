/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameState, ServerAIResponse } from './schemas';

export class WasmAiService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageCounter = 0;
  private readonly pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  constructor() {
    this.init();
  }

  private init(): Promise<void> {
    if (!this.initPromise) {
      console.log('WasmAiService: init() called.');
      this.initPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          console.log('Not in a browser environment, skipping worker initialization.');
          return resolve();
        }

        console.log('WasmAiService: Creating AI Worker.');
        this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
          type: 'module',
        });

        const handleMessage = (event: MessageEvent) => {
          console.log('WasmAiService: Received message from worker:', event.data);
          if (event.data.type === 'ready') {
            console.log('AI Worker is ready.');
            resolve();
          } else if (event.data.type === 'success' || event.data.type === 'error') {
            const promise = this.pendingRequests.get(event.data.id);
            if (promise) {
              if (event.data.type === 'success') {
                promise.resolve(event.data.response);
              } else {
                promise.reject(new Error(event.data.error));
              }
              this.pendingRequests.delete(event.data.id);
            }
          }
        };

        const handleError = (error: ErrorEvent) => {
          console.error('AI Worker error event:', error);
          console.error('AI Worker error message:', error.message);
          console.error('AI Worker error filename:', error.filename);
          console.error('AI Worker error lineno:', error.lineno);
          console.error('AI Worker error colno:', error.colno);
          console.error('AI Worker error object:', error.error);
          reject(new Error(`AI Worker failed to initialize: ${error.message}`));
        };

        this.worker.onmessage = handleMessage;
        this.worker.onerror = handleError;
      });
    }
    return this.initPromise;
  }

  private async ensureWorkerReady(): Promise<void> {
    console.log('WasmAiService: ensureWorkerReady() called.');
    if (!this.initPromise) {
      this.init();
    }
    await this.initPromise;
    if (!this.worker) {
      throw new Error('AI Worker not initialized.');
    }
  }

  async getAIMove(gameState: GameState): Promise<ServerAIResponse> {
    console.log('WasmAiService: getAIMove() called.');

    try {
      await this.ensureWorkerReady();

      const messageId = this.messageCounter++;
      const promise = new Promise<ServerAIResponse>((resolve, reject) => {
        this.pendingRequests.set(messageId, { resolve, reject });
      });

      console.log(`WasmAiService: Posting message to worker (id: ${messageId}):`, {
        id: messageId,
        gameState,
      });
      this.worker!.postMessage({ id: messageId, gameState });

      const response = await promise;
      console.log('WasmAiService: AI move response received:', response);
      return response;
    } catch (error) {
      console.error('WasmAiService: Error getting AI move:', error);

      if (gameState.validMoves.length > 0) {
        const fallbackMove =
          gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
        console.warn('WasmAiService: Using fallback random move:', fallbackMove);
        return {
          move: fallbackMove,
          evaluation: 0,
          thinking: 'Fallback: Random move due to worker error',
          diagnostics: {
            validMoves: gameState.validMoves,
            moveEvaluations: [],
            searchDepth: 3,
            transpositionHits: 0,
            nodesEvaluated: 0,
          },
          timings: {
            aiMoveCalculation: 0,
            totalHandlerTime: 0,
          },
        };
      }

      throw new Error(`Failed to get AI move: ${error}`);
    }
  }

  async getHeuristicAIMove(gameState: GameState): Promise<ServerAIResponse> {
    console.log('WasmAiService: getHeuristicAIMove() called.');

    try {
      await this.ensureWorkerReady();

      const messageId = this.messageCounter++;
      const promise = new Promise<ServerAIResponse>((resolve, reject) => {
        this.pendingRequests.set(messageId, { resolve, reject });
      });

      console.log(`WasmAiService: Posting heuristic AI message to worker (id: ${messageId}):`, {
        id: messageId,
        gameState,
        type: 'heuristic',
      });
      this.worker!.postMessage({ id: messageId, gameState, type: 'heuristic' });

      const response = await promise;
      console.log('WasmAiService: Heuristic AI move response received:', response);
      return response;
    } catch (error) {
      console.error('WasmAiService: Error getting Heuristic AI move:', error);

      if (gameState.validMoves.length > 0) {
        const fallbackMove =
          gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
        console.warn('WasmAiService: Using fallback random move:', fallbackMove);
        return {
          move: fallbackMove,
          evaluation: 0,
          thinking: 'Fallback: Random move due to worker error',
          diagnostics: {
            validMoves: gameState.validMoves,
            moveEvaluations: [],
            searchDepth: 0,
            transpositionHits: 0,
            nodesEvaluated: 0,
          },
          timings: {
            aiMoveCalculation: 0,
            totalHandlerTime: 0,
          },
        };
      }

      throw new Error(`Failed to get Heuristic AI move: ${error}`);
    }
  }

  async rollDice(): Promise<number> {
    console.log('WasmAiService: rollDice() called.');
    await this.ensureWorkerReady();

    const messageId = this.messageCounter++;
    const promise = new Promise<number>((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });
    });

    console.log(`WasmAiService: Posting rollDice message to worker (id: ${messageId})`);
    this.worker!.postMessage({ id: messageId, type: 'rollDice' });

    const response = await promise;
    console.log('WasmAiService: Dice roll result:', response);
    return response;
  }
}
